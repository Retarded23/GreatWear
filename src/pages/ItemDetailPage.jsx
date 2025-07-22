import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/UseAuth";
import { Heart, Share2, ArrowLeft, MessageCircle, Star, X, Package, Grid } from "lucide-react";
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, increment, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import toast from "react-hot-toast";

const ItemDetailPage = () => {
  const { id } = useParams();
  const { currentUser, userLoggedIn, updateUserPoints, checkSufficientPoints } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [uploader, setUploader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [swapLoading, setSwapLoading] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [userItems, setUserItems] = useState([]);
  const [selectedSwapItem, setSelectedSwapItem] = useState(null);
  const [swapMessage, setSwapMessage] = useState("");
  const [loadingUserItems, setLoadingUserItems] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loadingRelatedItems, setLoadingRelatedItems] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const itemDoc = await getDoc(doc(db, "items", id));
        if (itemDoc.exists()) {
          const itemData = { id: itemDoc.id, ...itemDoc.data() };
          setItem(itemData);

          // Fetch uploader details
          const uploaderDoc = await getDoc(doc(db, "users", itemData.uploaderId));
          if (uploaderDoc.exists()) {
            setUploader(uploaderDoc.data());
          }

          // Fetch related items
          fetchRelatedItems(itemData);
        } else {
          toast.error("Item not found");
          navigate("/browse");
        }
      } catch (error) {
        console.error("Error fetching item:", error);
        toast.error("Failed to load item details");
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id, navigate]);

  const fetchRelatedItems = async (currentItem) => {
    setLoadingRelatedItems(true);
    try {
      // Fetch items from the same category, excluding the current item
      const relatedQuery = query(
        collection(db, "items"),
        where("category", "==", currentItem.category),
        where("status", "==", "approved"),
        where("available", "==", true),
        limit(4)
      );
      
      const relatedSnapshot = await getDocs(relatedQuery);
      const items = relatedSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(item => item.id !== currentItem.id); // Exclude current item
      
      // If we don't have enough items from same category, fetch some recent items
      if (items.length < 4) {
        const recentQuery = query(
          collection(db, "items"),
          where("status", "==", "approved"),
          where("available", "==", true),
          limit(4)
        );
        
        const recentSnapshot = await getDocs(recentQuery);
        const recentItems = recentSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.id !== currentItem.id && !items.find(existing => existing.id === item.id));
        
        // Combine and limit to 4 items total
        const combinedItems = [...items, ...recentItems].slice(0, 4);
        setRelatedItems(combinedItems);
      } else {
        setRelatedItems(items);
      }
    } catch (error) {
      console.error("Error fetching related items:", error);
    } finally {
      setLoadingRelatedItems(false);
    }
  };

  const fetchUserItems = async () => {
    if (!userLoggedIn) return;
    
    setLoadingUserItems(true);
    try {
      const userItemsQuery = query(
        collection(db, "items"),
        where("uploaderId", "==", currentUser.uid),
        where("status", "==", "approved"),
        where("available", "==", true)
      );
      const userItemsSnapshot = await getDocs(userItemsQuery);
      const items = userItemsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(userItem => userItem.id !== id); // Don't include the current item
      setUserItems(items);
    } catch (error) {
      console.error("Error fetching user items:", error);
      toast.error("Failed to load your items");
    } finally {
      setLoadingUserItems(false);
    }
  };

  const openSwapModal = () => {
    if (!userLoggedIn) {
      toast.error("Please login to make a swap request");
      navigate("/login");
      return;
    }

    if (currentUser.uid === item.uploaderId) {
      toast.error("You cannot swap your own item");
      return;
    }

    setShowSwapModal(true);
    fetchUserItems();
  };

  const handleSwapRequest = async () => {
    setSwapLoading(true);

    try {
      const swapData = {
        requesterId: currentUser.uid,
        requesterName: currentUser.name,
        requesterEmail: currentUser.email,
        itemId: item.id,
        itemTitle: item.title,
        uploaderId: item.uploaderId,
        uploaderName: item.uploaderName,
        uploaderEmail: item.uploaderEmail,
        status: "pending",
        type: "swap",
        createdAt: serverTimestamp(),
        participants: [currentUser.uid, item.uploaderId]
      };

      // Add proposed item and message if provided
      if (selectedSwapItem) {
        swapData.proposedItemId = selectedSwapItem.id;
        swapData.proposedItemTitle = selectedSwapItem.title;
      }

      if (swapMessage.trim()) {
        swapData.message = swapMessage.trim();
      }

      await addDoc(collection(db, "swaps"), swapData);

      toast.success("Swap request sent! The item owner will be notified.");
      setShowSwapModal(false);
      setSelectedSwapItem(null);
      setSwapMessage("");
    } catch (error) {
      console.error("Error creating swap request:", error);
      toast.error("Failed to send swap request");
    } finally {
      setSwapLoading(false);
    }
  };

  const handlePointsRedemption = async () => {
    if (!userLoggedIn) {
      toast.error("Please login to redeem with points");
      navigate("/login");
      return;
    }

    if (currentUser.uid === item.uploaderId) {
      toast.error("You cannot redeem your own item");
      return;
    }

    if (!checkSufficientPoints(item.points)) {
      toast.error(`You need ${item.points - currentUser.points} more points to redeem this item`);
      return;
    }

    setRedeemLoading(true);

    try {
      // Use the new points management system
      const pointsDeducted = await updateUserPoints(-item.points, `Redeemed item: ${item.title}`);
      
      if (!pointsDeducted) {
        // Points deduction failed - this error message is already shown by updateUserPoints
        setRedeemLoading(false);
        return;
      }

      // Add points to item uploader (direct database update)
      await updateDoc(doc(db, "users", item.uploaderId), {
        points: increment(item.points)
      });

      // Mark item as redeemed
      await updateDoc(doc(db, "items", item.id), {
        available: false,
        redeemedBy: currentUser.uid,
        redeemedAt: serverTimestamp()
      });

      // Create redemption record
      await addDoc(collection(db, "swaps"), {
        requesterId: currentUser.uid,
        requesterName: currentUser.name,
        requesterEmail: currentUser.email,
        itemId: item.id,
        itemTitle: item.title,
        uploaderId: item.uploaderId,
        uploaderName: item.uploaderName,
        uploaderEmail: item.uploaderEmail,
        status: "completed",
        type: "redemption",
        pointsUsed: item.points,
        createdAt: serverTimestamp(),
        participants: [currentUser.uid, item.uploaderId]
      });

      toast.success("Item redeemed successfully with points!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error redeeming item:", error);
      
      // If points were deducted but redemption failed, try to refund points
      try {
        await updateUserPoints(item.points, `Refund for failed redemption: ${item.title}`);
        toast.error("Redemption failed. Points have been refunded.");
      } catch (refundError) {
        console.error("Error refunding points:", refundError);
        toast.error("Redemption failed. Please contact support about your points.");
      }
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: item.title,
        text: `Check out this ${item.category.toLowerCase()} on ReWear!`,
        url: window.location.href,
      });
    } catch {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-orange-50 text-orange-500">Loading...</div>;
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Item not found</h2>
          <button
            onClick={() => navigate("/browse")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
     <div className="min-h-screen bg-orange-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-800 transition-colors"
          >
              <ArrowLeft className="h-5 w-5" />
              Back to listings
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Display - Single Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
              <img
                src={item.images?.[0] || "/placeholder-image.jpg"}
                alt={item.title}
                className="w-full h-auto object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-4xl font-extrabold text-zinc-900">{item.title}</h1>
                <div className="flex space-x-2">
                  <button
                    onClick={handleShare}
                    className="p-2 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-3 mb-4">
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-lg font-semibold">
                  {item.points} points
                </span>
                <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-sm font-medium">
                  {item.category}
                </span>
                <span className="bg-lime-100 text-lime-800 px-3 py-1 rounded-full text-sm font-medium">
                  {item.condition}
                </span>
              </div>
            </div>

            {/* Item Specs */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-zinc-800 mb-4">Item Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Size:</span>
                  <span className="ml-2 font-medium text-zinc-800">{item.size}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Type:</span>
                  <span className="ml-2 font-medium text-zinc-800">{item.type || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Condition:</span>
                  <span className="ml-2 font-medium text-zinc-800">{item.condition}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Listed:</span>
                  <span className="ml-2 font-medium text-zinc-800">
                    {item.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-zinc-800 mb-4">Description</h3>
              <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed">{item.description}</p>

              {item.tags && item.tags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-zinc-500 mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="text-xl font-bold text-zinc-800 mb-4">Listed by</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-zinc-800 font-semibold">
                    {uploader?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-lg text-rose-800">{uploader?.name}</p>
                  <div className="flex items-center text-sm text-zinc-500">
                    <Star className="h-4 w-4 text-amber-500 mr-1" />
                    <span>Member since {new Date(uploader?.createdAt).getFullYear()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {userLoggedIn && currentUser.uid !== item.uploaderId && item.available && (
              <div className="space-y-4 pt-4 border-t border-rose-100">
                <button
                  onClick={openSwapModal}
                  className="w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white py-3 px-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center font-semibold text-lg"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Request to Swap
                </button>

                <button
                  onClick={handlePointsRedemption}
                  disabled={redeemLoading || currentUser.points < item.points}
                  className="w-full bg-lime-500 text-white py-3 px-4 rounded-full shadow-lg hover:shadow-xl hover:bg-lime-600 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-lg"
                >
                  {redeemLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Redeeming...
                    </>
                  ) : (
                    <>
                      Redeem with {item.points} Points
                      {currentUser.points < item.points && (
                        <span className="ml-2 text-sm opacity-90">
                          (Need {item.points - currentUser.points} more)
                        </span>
                      )}
                    </>
                  )}
                </button>
                
                <p className="text-sm text-zinc-500 text-center">
                  You have <span className="font-bold text-orange-600">{currentUser.points}</span> points available
                </p>
              </div>
            )}

              {!userLoggedIn && (
                <div className="bg-orange-100 rounded-xl p-4 text-center">
                  <p className="text-orange-800 mb-3 font-medium">
                    Please log in to swap or redeem this item
                  </p>
                  <button
                    onClick={() => navigate("/login")}
                    className="bg-rose-500 text-white px-8 py-2 rounded-full hover:bg-rose-600 transition-colors font-semibold"
                  >
                    Login
                  </button>
                </div>
              )}

            {userLoggedIn && currentUser.uid === item.uploaderId && (
              <div className="bg-lime-100 rounded-xl p-4 text-center">
                <p className="text-lime-800 font-medium">This is your item</p>
              </div>
            )}

            {!item.available && (
              <div className="bg-red-100 rounded-xl p-4 text-center">
                <p className="text-red-700 font-medium">This item is no longer available</p>
              </div>
            )}
          </div>
        </div>

        {/* More Products Section */}
        {relatedItems.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Grid className="h-6 w-6 mr-2 text-green-600" />
                More Products
              </h2>
              <Link
                to="/browse"
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                View All →
              </Link>
            </div>
            
            {loadingRelatedItems ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {relatedItems.map((relatedItem) => (
                  <Link
                    key={relatedItem.id}
                    to={`/item/${relatedItem.id}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group"
                  >
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={relatedItem.images?.[0] || "/placeholder-image.jpg"}
                        alt={relatedItem.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-green-600 transition-colors">
                        {relatedItem.title}
                      </h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">{relatedItem.category}</span>
                        <span className="text-xs text-gray-500">{relatedItem.size}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 font-semibold text-sm">
                          {relatedItem.points} pts
                        </span>
                        <span className="text-xs text-gray-400">
                          {relatedItem.condition}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-zinc-900">
                  Request Swap for "{item?.title}"
                </h3>
                <button
                  onClick={() => {
                    setShowSwapModal(false);
                    setSelectedSwapItem(null);
                    setSwapMessage("");
                  }}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Target Item Info */}
              <div className="bg-orange-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-zinc-800 mb-2">You're requesting:</h4>
                <div className="flex items-center space-x-4">
                  <img
                    src={item?.images?.[0] || "/placeholder-image.jpg"}
                    alt={item?.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div>
                    <p className="font-bold text-zinc-900">{item?.title}</p>
                    <p className="text-sm text-zinc-600">{item?.category} • {item?.size}</p>
                    <p className="text-sm text-orange-600 font-bold">{item?.points} points</p>
                  </div>
                </div>
              </div>

              {/* Select Item to Offer */}
              <div className="mb-6">
                <h4 className="font-semibold text-zinc-800 mb-3">
                  Select one of your items to offer (optional):
                </h4>
                
                {loadingUserItems ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : userItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                    {userItems.map((userItem) => (
                      <div
                        key={userItem.id}
                        onClick={() => setSelectedSwapItem(selectedSwapItem?.id === userItem.id ? null : userItem)}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all flex items-center space-x-3 ${
                          selectedSwapItem?.id === userItem.id
                            ? "border-rose-500 bg-rose-50"
                            : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={userItem.images?.[0] || "/placeholder-image.jpg"}
                            alt={userItem.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-zinc-900 truncate">{userItem.title}</p>
                            <p className="text-sm text-zinc-500">{userItem.category} • {userItem.size}</p>
                            <p className="text-sm text-orange-600 font-bold">{userItem.points} points</p>
                          </div>
                          {selectedSwapItem?.id === userItem.id && (
                            <div className="flex-shrink-0">
                              <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500 bg-zinc-50 rounded-lg">
                    <Package className="h-12 w-12 text-zinc-400 mx-auto mb-3" />
                    <p className="font-medium">You don't have any available items to offer</p>
                    <p className="text-sm">You can still send a swap request without an item.</p>
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Add a message (optional):
                </label>
                <textarea
                  value={swapMessage}
                  onChange={(e) => setSwapMessage(e.target.value)}
                  placeholder="Tell the owner why you'd like to swap this item..."
                  className="w-full p-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-rose-400 resize-none transition"
                  rows="3"
                  maxLength="500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {swapMessage.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSwapModal(false);
                    setSelectedSwapItem(null);
                    setSwapMessage("");
                  }}
                  className="flex-1 px-4 py-3 text-zinc-700 bg-zinc-100 rounded-full hover:bg-zinc-200 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSwapRequest}
                  disabled={swapLoading}
                  className="flex-1 px-4 py-3 text-zinc-700 bg-zinc-100 rounded-full hover:bg-zinc-200 font-semibold transition-colors"
                >
                  {swapLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    "Send Swap Request"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailPage;