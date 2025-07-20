import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/UseAuth";
import { Plus, Package, Users, Award, TrendingUp, Camera, User, Upload, X, MessageCircle, Send, Check, XCircle } from "lucide-react";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [userItems, setUserItems] = useState([]);
  const [userSwaps, setUserSwaps] = useState([]);
  const [incomingSwaps, setIncomingSwaps] = useState([]);
  const [outgoingSwaps, setOutgoingSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [activeAvatarTab, setActiveAvatarTab] = useState('preset'); // 'preset' or 'upload'
  const [uploadedAvatarFile, setUploadedAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();

  // Default avatar options
  const avatarOptions = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=2&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=1&backgroundColor=b6e3f4",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=2&backgroundColor=c0aede",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=3&backgroundColor=d1d4ed",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=4&backgroundColor=ffd5dc",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=5&backgroundColor=ffdfba",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=6&backgroundColor=c7ecee",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=7&backgroundColor=dcedc1",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=8&backgroundColor=fad2e1"
  ];

  const defaultAvatar = currentUser?.avatar || avatarOptions[0];

  const handleAvatarImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeUploadedAvatar = () => {
    setUploadedAvatarFile(null);
    setAvatarPreview(null);
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleCustomAvatarUpload = async () => {
    if (!uploadedAvatarFile) {
      toast.error("Please select an image first");
      return;
    }

    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadToCloudinary(uploadedAvatarFile);
      await handleAvatarUpdate(avatarUrl);
      
      // Reset upload state
      setUploadedAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUpdate = async (newAvatar) => {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        avatar: newAvatar
      });
      
      // Update the current user in context
      setCurrentUser({ ...currentUser, avatar: newAvatar });
      setSelectedAvatar(newAvatar);
      setShowAvatarModal(false);
      setActiveAvatarTab('preset'); // Reset tab
      toast.success("Avatar updated successfully!");
      
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Failed to update avatar. Please try again.");
    }
  };

  const handleWithdrawRequest = async (itemId) => {
    try {
      const itemRef = doc(db, "items", itemId);
      await updateDoc(itemRef, { status: "withdrawn" });
      setUserItems((prev) => prev.map(item => item.id === itemId ? { ...item, status: "withdrawn" } : item));
      toast.success("Request withdrawn successfully.");
    } catch (error) {
      toast.error("Failed to withdraw request. Please try again." + error.message);
    }
  };

  // Delete item handler
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "items", itemId));
      setUserItems((prev) => prev.filter(item => item.id !== itemId));
      toast.success("Item deleted successfully");
    } catch (error) {
      toast.error("Failed to delete item. Please try again." + error.message);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        console.log("No current user found");
        return;
      }

      console.log("Current user object:", currentUser);

      try {
        // Fetch user's items - Get ALL items regardless of status
        console.log("Current user UID:", currentUser.uid);
        const itemsQuery = query(
          collection(db, "items"),
          where("uploaderId", "==", currentUser.uid)
        );
        const itemsSnapshot = await getDocs(itemsQuery);
        const items = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort items by createdAt in JavaScript instead
        items.sort((a, b) => {
          const aTime = a.createdAt?.toDate() || new Date(0);
          const bTime = b.createdAt?.toDate() || new Date(0);
          return bTime - aTime;
        });
        setUserItems(items);

        // Debug: Try to fetch all items to see what's in the collection
        const allItemsQuery = query(collection(db, "items"));
        const allItemsSnapshot = await getDocs(allItemsQuery);
        const allItems = allItemsSnapshot.docs.map(doc => ({
          id: doc.id,
          uploaderId: doc.data().uploaderId,
          title: doc.data().title
        }));
        console.log("All items in collection:", allItems);

        // Fetch user's swaps
        const swapsQuery = query(
          collection(db, "swaps"),
          where("participants", "array-contains", currentUser.uid)
        );
        const swapsSnapshot = await getDocs(swapsQuery);
        const swaps = swapsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch item details for each swap
        const swapsWithItemDetails = await Promise.all(
          swaps.map(async (swap) => {
            try {
              // Fetch requested item details
              const requestedItemDoc = await getDoc(doc(db, "items", swap.itemId));
              
              let requestedItem = null;
              if (requestedItemDoc.exists()) {
                requestedItem = {
                  id: requestedItemDoc.id,
                  ...requestedItemDoc.data()
                };
              }

              // Fetch proposed item details if it exists
              let proposedItem = null;
              if (swap.proposedItemId) {
                const proposedItemDoc = await getDoc(doc(db, "items", swap.proposedItemId));
                
                if (proposedItemDoc.exists()) {
                  proposedItem = {
                    id: proposedItemDoc.id,
                    ...proposedItemDoc.data()
                  };
                }
              }

              return {
                ...swap,
                requestedItem,
                proposedItem
              };
            } catch (error) {
              console.error("Error fetching item details for swap:", swap.id, error);
              return swap; // Return original swap if item fetch fails
            }
          })
        );

        // Sort swaps by createdAt in JavaScript instead
        swapsWithItemDetails.sort((a, b) => {
          const aTime = a.createdAt?.toDate() || new Date(0);
          const bTime = b.createdAt?.toDate() || new Date(0);
          return bTime - aTime;
        });
        setUserSwaps(swapsWithItemDetails);

        // Separate incoming and outgoing swap requests (excluding completed redemptions from pending lists)
        const incomingRequests = swapsWithItemDetails.filter(swap => 
          swap.uploaderId === currentUser.uid && 
          swap.status === "pending" && 
          (swap.type === "swap" || swap.type === "redemption")
        );
        const outgoingRequests = swapsWithItemDetails.filter(swap => 
          swap.requesterId === currentUser.uid && 
          swap.status === "pending" && 
          swap.type === "swap" // Only item swaps can be outgoing, not redemptions
        );
        
        setIncomingSwaps(incomingRequests);
        setOutgoingSwaps(outgoingRequests);

      } catch (error) {
        console.error("Error fetching user data:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Swap management functions
  const handleAcceptSwap = async (swapId, swapData) => {
    try {
      // Update swap status to completed
      await updateDoc(doc(db, "swaps", swapId), {
        status: "completed",
        completedAt: serverTimestamp()
      });

      // Mark both items as unavailable
      await updateDoc(doc(db, "items", swapData.itemId), {
        available: false,
        swappedWith: swapData.requesterId,
        swappedAt: serverTimestamp()
      });

      if (swapData.proposedItemId) {
        await updateDoc(doc(db, "items", swapData.proposedItemId), {
          available: false,
          swappedWith: swapData.uploaderId,
          swappedAt: serverTimestamp()
        });
      }

      toast.success("Swap accepted! Items are now exchanged.");
      // Trigger data refetch by calling the useEffect dependency
      window.location.reload(); // Simple solution for now
    } catch (error) {
      console.error("Error accepting swap:", error);
      toast.error("Failed to accept swap");
    }
  };

  const handleRejectSwap = async (swapId) => {
    try {
      await updateDoc(doc(db, "swaps", swapId), {
        status: "rejected",
        rejectedAt: serverTimestamp()
      });

      toast.success("Swap request rejected");
      // Trigger data refetch by calling the useEffect dependency
      window.location.reload(); // Simple solution for now
    } catch (error) {
      console.error("Error rejecting swap:", error);
      toast.error("Failed to reject swap");
    }
  };

  const stats = [
    {
      name: "Total Points",
      value: currentUser?.points || 0,
      icon: Award,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      name: "Items Listed",
      value: userItems.length,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Active Swaps",
      value: userSwaps.filter(swap => swap.status === "pending").length,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Completed Swaps",
      value: userSwaps.filter(swap => swap.status === "completed" || swap.status === "accepted").length,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                Welcome back, {currentUser?.name}!
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Manage your items, track your swaps, and grow your sustainable wardrobe.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="relative">
                <img
                  src={defaultAvatar}
                  alt="Your avatar"
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                  onClick={() => setShowAvatarModal(true)}
                />
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full p-1 hover:bg-green-700 transition-colors"
                  title="Change avatar"
                >
                  <Camera className="h-2 w-2 sm:h-3 sm:w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.name} className="bg-white rounded-lg shadow p-3 sm:p-6">
                <div className="flex items-center">
                  <div className={`${stat.bgColor} rounded-md p-2 sm:p-3`}>
                    <IconComponent className={`h-4 w-4 sm:h-6 sm:w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* My Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">My Items</h2>
              <Link to="/add-item" className="text-green-600 hover:text-green-700 text-sm font-medium">
                Add Item
              </Link>
            </div>
            <div className="p-4 sm:p-6">
              {userItems.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-3 sm:space-y-4 pr-2">
                  {userItems.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <img
                          src={item.images?.[0] || "/placeholder-image.jpg"}
                          alt={item.title}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-500">{item.category}</p>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              item.status === "approved" ? "bg-green-100 text-green-800" :
                              item.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              item.status === "withdrawn" ? "bg-gray-100 text-gray-500" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {item.status || "pending"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.available ? "Available" : "Not Available"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
                        <p className="text-sm font-medium text-green-600">{item.points} pts</p>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {/* Edit button: only if not withdrawn or rejected */}
                          {item.status !== "withdrawn" && item.status !== "rejected" && (
                            <button
                              onClick={() => navigate(`/add-item?edit=${item.id}`)}
                              className="px-2 py-1 sm:px-3 sm:py-1 text-xs rounded bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-semibold transition"
                            >
                              Edit
                            </button>
                          )}
                          {/* Delete button: always show */}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-2 py-1 sm:px-3 sm:py-1 text-xs rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold transition"
                          >
                            Delete
                          </button>
                          {/* Withdraw button: only if pending */}
                          {item.status === "pending" && (
                            <button
                              onClick={() => handleWithdrawRequest(item.id)}
                              className="px-2 py-1 sm:px-3 sm:py-1 text-xs rounded bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 font-semibold transition"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Package className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">No items listed yet</p>
                  <Link
                    to="/add-item"
                    className="mt-2 text-green-600 hover:text-green-700 font-medium text-sm sm:text-base"
                  >
                    List your first item
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Swaps */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Swaps</h2>
            </div>
            <div className="p-4 sm:p-6">
              {userSwaps.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {userSwaps.slice(0, 3).map((swap) => (
                    <div key={swap.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-gray-200 rounded-lg space-y-2 sm:space-y-0">
                      <div>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">Swap Request</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Status: <span className={`capitalize ${
                            swap.status === "completed" ? "text-green-600" :
                            swap.status === "pending" ? "text-yellow-600" :
                            "text-red-600"
                          }`}>
                            {swap.status}
                          </span>
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(swap.createdAt?.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {userSwaps.length > 3 && (
                    <p className="text-xs sm:text-sm text-gray-500 text-center pt-2">
                      And {userSwaps.length - 3} more swaps...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-500">No swaps yet</p>
                  <Link
                    to="/browse"
                    className="mt-2 text-green-600 hover:text-green-700 font-medium text-sm sm:text-base"
                  >
                    Browse items to swap
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swap Requests Section */}
        {(incomingSwaps.length > 0 || outgoingSwaps.length > 0) && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Swap Requests</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Incoming Swap Requests */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Incoming Requests ({incomingSwaps.length})
                    </h3>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  {incomingSwaps.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {incomingSwaps.map((swap) => (
                        <div key={swap.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold text-sm">
                                    {swap.requesterName?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{swap.requesterName}</p>
                                  <p className="text-sm text-gray-500">
                                    {swap.type === "redemption" 
                                      ? `wants to redeem with ${swap.pointsUsed || 'points'}` 
                                      : 'wants to swap'
                                    }
                                  </p>
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">For your item:</p>
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={swap.requestedItem?.images?.[0] || "/placeholder-image.jpg"}
                                    alt={swap.requestedItem?.title || swap.itemTitle}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                  <div>
                                    <p className="text-sm text-gray-900 font-medium">
                                      {swap.requestedItem?.title || swap.itemTitle}
                                    </p>
                                    {swap.requestedItem && (
                                      <p className="text-xs text-gray-500">
                                        {swap.requestedItem.category} • {swap.requestedItem.size}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {(swap.proposedItem || swap.proposedItemTitle) && (
                                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                  <p className="text-sm font-medium text-blue-700 mb-2">Offering:</p>
                                  <div className="flex items-center space-x-3">
                                    <img
                                      src={swap.proposedItem?.images?.[0] || "/placeholder-image.jpg"}
                                      alt={swap.proposedItem?.title || swap.proposedItemTitle}
                                      className="w-12 h-12 object-cover rounded-lg"
                                    />
                                    <div>
                                      <p className="text-sm text-blue-900 font-medium">
                                        {swap.proposedItem?.title || swap.proposedItemTitle}
                                      </p>
                                      {swap.proposedItem && (
                                        <p className="text-xs text-blue-600">
                                          {swap.proposedItem.category} • {swap.proposedItem.size}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {swap.message && (
                                <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                                  <p className="text-sm font-medium text-yellow-700">Message:</p>
                                  <p className="text-sm text-yellow-600">{swap.message}</p>
                                </div>
                              )}

                              <p className="text-xs text-gray-500">
                                {swap.createdAt?.toDate().toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 mt-4">
                            <button
                              onClick={() => handleAcceptSwap(swap.id, swap)}
                              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center text-sm font-medium"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectSwap(swap.id)}
                              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center justify-center text-sm font-medium"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No incoming swap requests</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Outgoing Swap Requests */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Send className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Outgoing Requests ({outgoingSwaps.length})
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  {outgoingSwaps.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {outgoingSwaps.map((swap) => (
                        <div key={swap.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-green-600 font-semibold text-sm">
                                    {swap.uploaderName?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{swap.uploaderName}</p>
                                  <p className="text-sm text-gray-500">request sent to</p>
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Requesting:</p>
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={swap.requestedItem?.images?.[0] || "/placeholder-image.jpg"}
                                    alt={swap.requestedItem?.title || swap.itemTitle}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                  <div>
                                    <p className="text-sm text-gray-900 font-medium">
                                      {swap.requestedItem?.title || swap.itemTitle}
                                    </p>
                                    {swap.requestedItem && (
                                      <p className="text-xs text-gray-500">
                                        {swap.requestedItem.category} • {swap.requestedItem.size}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {(swap.proposedItem || swap.proposedItemTitle) && (
                                <div className="bg-green-50 rounded-lg p-3 mb-3">
                                  <p className="text-sm font-medium text-green-700 mb-2">You offered:</p>
                                  <div className="flex items-center space-x-3">
                                    <img
                                      src={swap.proposedItem?.images?.[0] || "/placeholder-image.jpg"}
                                      alt={swap.proposedItem?.title || swap.proposedItemTitle}
                                      className="w-12 h-12 object-cover rounded-lg"
                                    />
                                    <div>
                                      <p className="text-sm text-green-900 font-medium">
                                        {swap.proposedItem?.title || swap.proposedItemTitle}
                                      </p>
                                      {swap.proposedItem && (
                                        <p className="text-xs text-green-600">
                                          {swap.proposedItem.category} • {swap.proposedItem.size}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  swap.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                  swap.status === "accepted" ? "bg-green-100 text-green-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                                </span>
                                <p className="text-xs text-gray-500">
                                  {swap.createdAt?.toDate().toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No outgoing swap requests</p>
                      <Link
                        to="/browse"
                        className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Browse items to request swaps
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completed Swaps Section */}
        {userSwaps.filter(swap => swap.status === "completed" || swap.status === "accepted").length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Completed Swaps</h2>
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Swap History ({userSwaps.filter(swap => swap.status === "completed" || swap.status === "accepted").length})
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {userSwaps.filter(swap => swap.status === "completed" || swap.status === "accepted").map((swap) => (
                    <div key={swap.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-green-900">
                                {swap.type === "redemption" ? "Redemption Completed" : "Swap Completed"}
                              </p>
                              <p className="text-sm text-green-700">
                                {swap.type === "redemption" 
                                  ? (swap.requesterId === currentUser.uid 
                                      ? `You redeemed with ${swap.pointsUsed || 0} points` 
                                      : `User paid ${swap.pointsUsed || 0} points`)
                                  : (swap.requesterId === currentUser.uid ? 'You received' : 'You gave away')
                                }
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <p className="text-sm font-medium text-green-700 mb-2">
                                {swap.type === "redemption" 
                                  ? "Item" 
                                  : (swap.requesterId === currentUser.uid ? 'You got:' : 'You gave:')
                                }
                              </p>
                              <div className="flex items-center space-x-3">
                                <img
                                  src={swap.requestedItem?.images?.[0] || "/placeholder-image.jpg"}
                                  alt={swap.requestedItem?.title || swap.itemTitle}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                                <div>
                                  <p className="text-sm text-green-900 font-medium">
                                    {swap.requestedItem?.title || swap.itemTitle}
                                  </p>
                                  {swap.requestedItem && (
                                    <p className="text-xs text-green-600">
                                      {swap.requestedItem.category} • {swap.requestedItem.size}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {swap.type === "redemption" ? (
                              <div className="bg-white rounded-lg p-3 border border-green-200">
                                <p className="text-sm font-medium text-green-700 mb-2">
                                  {swap.requesterId === currentUser.uid ? 'You paid:' : 'You received:'}
                                </p>
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Award className="h-6 w-6 text-yellow-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-green-900 font-medium">
                                      {swap.pointsUsed || 0} Points
                                    </p>
                                    <p className="text-xs text-green-600">Points Transfer</p>
                                  </div>
                                </div>
                              </div>
                            ) : (swap.proposedItem || swap.proposedItemTitle) && (
                              <div className="bg-white rounded-lg p-3 border border-green-200">
                                <p className="text-sm font-medium text-green-700 mb-2">
                                  {swap.requesterId === currentUser.uid ? 'You gave:' : 'You got:'}
                                </p>
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={swap.proposedItem?.images?.[0] || "/placeholder-image.jpg"}
                                    alt={swap.proposedItem?.title || swap.proposedItemTitle}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                  <div>
                                    <p className="text-sm text-green-900 font-medium">
                                      {swap.proposedItem?.title || swap.proposedItemTitle}
                                    </p>
                                    {swap.proposedItem && (
                                      <p className="text-xs text-green-600">
                                        {swap.proposedItem.category} • {swap.proposedItem.size}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                Completed
                              </span>
                              <span className="text-sm text-green-600">
                                with {swap.requesterId === currentUser.uid ? swap.uploaderName : swap.requesterName}
                              </span>
                            </div>
                            <p className="text-xs text-green-500">
                              {swap.completedAt?.toDate().toLocaleDateString() || 
                               swap.acceptedAt?.toDate().toLocaleDateString() ||
                               swap.createdAt?.toDate().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Avatar Selection Modal */}
        {showAvatarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Choose Your Avatar</h3>
                <button
                  onClick={() => {
                    setShowAvatarModal(false);
                    setActiveAvatarTab('preset');
                    setSelectedAvatar(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-4 sm:mb-6">
                <button
                  onClick={() => setActiveAvatarTab('preset')}
                  className={`flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                    activeAvatarTab === 'preset'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Preset Avatars</span>
                  <span className="sm:hidden">Preset</span>
                </button>
                <button
                  onClick={() => setActiveAvatarTab('upload')}
                  className={`flex-1 py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                    activeAvatarTab === 'upload'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Upload Custom</span>
                  <span className="sm:hidden">Upload</span>
                </button>
              </div>
              
              {/* Tab Content */}
              {activeAvatarTab === 'preset' ? (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    {avatarOptions.map((avatar, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`relative rounded-full overflow-hidden border-2 transition-all ${
                          selectedAvatar === avatar || (selectedAvatar === null && avatar === defaultAvatar)
                            ? 'border-green-500 ring-2 ring-green-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={avatar}
                          alt={`Avatar option ${index + 1}`}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-2 sm:space-x-3">
                    <button
                      onClick={() => {
                        setShowAvatarModal(false);
                        setActiveAvatarTab('preset');
                        setSelectedAvatar(null);
                      }}
                      className="px-3 py-2 sm:px-4 sm:py-2 text-gray-600 hover:text-gray-800 font-medium text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAvatarUpdate(selectedAvatar || defaultAvatar)}
                      className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm sm:text-base"
                    >
                      Save Avatar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                      Upload your own avatar image. Recommended size: 200x200px or larger.
                    </p>
                    
                    {avatarPreview ? (
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-full border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeUploadedAvatar}
                          className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center hover:border-gray-400 cursor-pointer w-24 h-24 sm:w-32 sm:h-32 mx-auto flex flex-col items-center justify-center">
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-1 sm:mb-2" />
                        <span className="text-xs sm:text-sm text-gray-500">Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2 sm:space-x-3">
                    <button
                      onClick={() => {
                        setShowAvatarModal(false);
                        setActiveAvatarTab('preset');
                        setSelectedAvatar(null);
                        removeUploadedAvatar();
                      }}
                      className="px-3 py-2 sm:px-4 sm:py-2 text-gray-600 hover:text-gray-800 font-medium text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    {avatarPreview && (
                      <button
                        onClick={handleCustomAvatarUpload}
                        disabled={uploadingAvatar}
                        className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm sm:text-base"
                      >
                        {uploadingAvatar ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                            <span className="hidden sm:inline">Uploading...</span>
                            <span className="sm:hidden">Upload...</span>
                          </>
                        ) : (
                          'Save Avatar'
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;