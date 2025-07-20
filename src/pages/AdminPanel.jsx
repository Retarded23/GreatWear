import { useState, useEffect } from "react";
import { useAuth } from "../context/UseAuth";
import { Check, X, Eye, Trash2, Users, Package, TrendingUp, Ban, Shield, RefreshCw, ArrowRightLeft, Award } from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import toast from "react-hot-toast";

const AdminPanel = () => {
  const { currentUser } = useAuth();
  const [pendingItems, setPendingItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    pendingItems: 0,
    approvedItems: 0,
    totalSwaps: 0,
    pendingSwaps: 0,
    completedSwaps: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [swapFilter, setSwapFilter] = useState("all"); // all, pending, accepted, rejected, completed

  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchAdminData();
    }
  }, [currentUser]);

  const fetchAdminData = async () => {
    try {
      // Fetch pending items
      const pendingQuery = query(
        collection(db, "items"),
        where("status", "==", "pending"),
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingData = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingItems(pendingData);

      // Fetch all items
      const allItemsQuery = query(
        collection(db, "items"),
      );
      const allItemsSnapshot = await getDocs(allItemsQuery);
      const allItemsData = allItemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllItems(allItemsData);

      // Fetch all users
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);

      // Fetch all swaps
      const swapsQuery = query(collection(db, "swaps"));
      const swapsSnapshot = await getDocs(swapsQuery);
      const swapsData = swapsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch item details for each swap
      const swapsWithItemDetails = await Promise.all(
        swapsData.map(async (swap) => {
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
      
      // Sort swaps by creation date (newest first)
      swapsWithItemDetails.sort((a, b) => {
        const aTime = a.createdAt?.toDate() || new Date(0);
        const bTime = b.createdAt?.toDate() || new Date(0);
        return bTime - aTime;
      });
      
      setSwaps(swapsWithItemDetails);

      // Calculate stats
      const pendingSwaps = swapsWithItemDetails.filter(swap => swap.status === "pending").length;
      const completedSwaps = swapsWithItemDetails.filter(swap => swap.status === "accepted" || swap.status === "completed").length;

      setStats({
        totalUsers: usersData.length,
        totalItems: allItemsData.length,
        pendingItems: pendingData.length,
        approvedItems: allItemsData.filter(item => item.status === "approved").length,
        totalSwaps: swapsData.length,
        pendingSwaps,
        completedSwaps
      });

    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveItem = async (itemId) => {
    try {
      await updateDoc(doc(db, "items", itemId), {
        status: "approved",
        available: true,
        approvedAt: new Date(),
        approvedBy: currentUser.uid
      });

      toast.success("Item approved successfully");
      fetchAdminData();
    } catch (error) {
      console.error("Error approving item:", error);
      toast.error("Failed to approve item");
    }
  };

  const handleRejectItem = async (itemId) => {
    try {
      await updateDoc(doc(db, "items", itemId), {
        status: "rejected",
        available: false,
        rejectedAt: new Date(),
        rejectedBy: currentUser.uid
      });

      toast.success("Item rejected");
      fetchAdminData();
    } catch (error) {
      console.error("Error rejecting item:", error);
      toast.error("Failed to reject item");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "items", itemId));
      toast.success("Item deleted successfully");
      fetchAdminData();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleToggleUserAdmin = async (userId, isCurrentlyAdmin) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isAdmin: !isCurrentlyAdmin
      });

      toast.success(`User ${isCurrentlyAdmin ? "removed from" : "granted"} admin privileges`);
      fetchAdminData();
    } catch (error) {
      console.error("Error updating user admin status:", error);
      toast.error("Failed to update user admin status");
    }
  };

  const handleToggleBanUser = async (userId, isBanned) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        banned: !isBanned,
        bannedAt: !isBanned ? new Date() : null,
        bannedBy: !isBanned ? currentUser.uid : null
      });

      toast.success(`User ${!isBanned ? 'banned' : 'unbanned'} successfully`);
      fetchAdminData();
    } catch (error) {
      console.error("Error toggling user ban:", error);
      toast.error("Failed to update user ban status");
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage items, users, and platform content</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-md p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-md p-3">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-md p-3">
                <Check className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-md p-3">
                <ArrowRightLeft className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Swaps</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSwaps}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "pending"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending Items ({stats.pendingItems})
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "items"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              All Items ({stats.totalItems})
            </button>
            <button
              onClick={() => setActiveTab("swaps")}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "swaps"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Swaps ({stats.totalSwaps})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "users"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Users ({stats.totalUsers})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "pending" && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Items Pending Review</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingItems.length > 0 ? (
                pendingItems.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.images?.[0] || "/placeholder-image.jpg"}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.category} • {item.size} • {item.condition}</p>
                        <p className="text-sm text-gray-500">by {item.uploaderName}</p>
                        <p className="text-sm text-gray-400">
                          Submitted: {item.createdAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">{item.points} pts</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/item/${item.id}`, "_blank")}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Item"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleApproveItem(item.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Approve"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleRejectItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Reject"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No pending items for review
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "items" && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Items</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {allItems.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.images?.[0] || "/placeholder-image.jpg"}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.category} • {item.size}</p>
                      <p className="text-sm text-gray-500">by {item.uploaderName}</p>
                    </div>
                    <div className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "approved" ? "bg-green-100 text-green-800" :
                        item.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">{item.points} pts</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(`/item/${item.id}`, "_blank")}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Item"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "swaps" && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Swap Monitoring</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSwapFilter("all")}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    swapFilter === "all"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All ({swaps.length})
                </button>
                <button
                  onClick={() => setSwapFilter("pending")}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    swapFilter === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Pending ({swaps.filter(s => s.status === "pending").length})
                </button>
                <button
                  onClick={() => setSwapFilter("accepted")}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    swapFilter === "accepted"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Accepted ({swaps.filter(s => s.status === "accepted").length})
                </button>
                <button
                  onClick={() => setSwapFilter("rejected")}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    swapFilter === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Rejected ({swaps.filter(s => s.status === "rejected").length})
                </button>
                <button
                  onClick={() => setSwapFilter("completed")}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    swapFilter === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Completed ({swaps.filter(s => s.status === "completed").length})
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {swaps
                .filter(swap => swapFilter === "all" || swap.status === swapFilter)
                .map((swap) => (
                  <div key={swap.id} className="p-4 sm:p-6">
                    <div className="flex flex-col space-y-4">
                      {/* Swap Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {swap.requesterName?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500">→</span>
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-semibold text-sm">
                                {swap.uploaderName?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {swap.requesterName} → {swap.uploaderName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {swap.createdAt?.toDate().toLocaleDateString()} • 
                              <span className={`ml-1 font-medium ${
                                swap.type === "redemption" ? "text-blue-600" : "text-green-600"
                              }`}>
                                {swap.type === "redemption" ? "Points Redemption" : "Item Swap"}
                              </span>
                              {swap.type === "redemption" && swap.pointsUsed && (
                                <span className="text-blue-600 ml-1">({swap.pointsUsed} pts)</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            swap.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            swap.status === "accepted" ? "bg-green-100 text-green-800" :
                            swap.status === "rejected" ? "bg-red-100 text-red-800" :
                            swap.status === "completed" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            swap.type === "redemption" 
                              ? "bg-blue-50 text-blue-700 border border-blue-200" 
                              : "bg-green-50 text-green-700 border border-green-200"
                          }`}>
                            {swap.type === "redemption" ? "Redemption" : "Swap"}
                          </span>
                        </div>
                      </div>

                      {/* Swap Details */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Requested Item */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Requested Item:</p>
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
                              <p className="text-xs text-gray-500">by {swap.uploaderName}</p>
                              {swap.requestedItem && (
                                <p className="text-xs text-gray-500">
                                  {swap.requestedItem.category} • {swap.requestedItem.size}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Offered Item or Points */}
                        {swap.type === "redemption" ? (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-700 mb-2">Payment Method:</p>
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Award className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm text-blue-900 font-medium">
                                  {swap.pointsUsed || 0} Points
                                </p>
                                <p className="text-xs text-blue-600">Points Transfer</p>
                              </div>
                            </div>
                          </div>
                        ) : (swap.proposedItem || swap.proposedItemTitle) ? (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-700 mb-2">Offered Item:</p>
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
                                <p className="text-xs text-blue-600">by {swap.requesterName}</p>
                                {swap.proposedItem && (
                                  <p className="text-xs text-blue-600">
                                    {swap.proposedItem.category} • {swap.proposedItem.size}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-yellow-700 mb-2">No Item Offered</p>
                            <p className="text-xs text-yellow-600">Request without specific item exchange</p>
                          </div>
                        )}
                      </div>

                      {/* Message */}
                      {swap.message && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Message:</p>
                          <p className="text-sm text-gray-600">{swap.message}</p>
                        </div>
                      )}

                      {/* Admin Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => window.open(`/item/${swap.itemId}`, "_blank")}
                          className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Requested Item
                        </button>
                        {swap.proposedItemId && (
                          <button
                            onClick={() => window.open(`/item/${swap.proposedItemId}`, "_blank")}
                            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Offered Item
                          </button>
                        )}
                        <button
                          onClick={fetchAdminData}
                          className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              {swaps.filter(swap => swapFilter === "all" || swap.status === swapFilter).length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p>No swaps found for the selected filter</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-semibold text-sm sm:text-base">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center sm:text-center space-x-4 sm:space-x-0">
                      <p className="font-medium text-green-600 text-sm sm:text-base">{user.points || 0} pts</p>
                      <div className="flex flex-wrap gap-1">
                        {user.isAdmin ? (
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            Admin
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                            User
                          </span>
                        )}
                        {user.banned && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                            Banned
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {user.id !== currentUser.uid && (
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleToggleUserAdmin(user.id, user.isAdmin)}
                          className={`px-3 py-2 rounded text-xs sm:text-sm font-medium text-center ${
                            user.isAdmin
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          }`}
                        >
                          {user.isAdmin ? "Remove Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => handleToggleBanUser(user.id, user.banned)}
                          className={`px-3 py-2 rounded text-xs sm:text-sm font-medium flex items-center justify-center ${
                            user.banned
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {user.banned ? (
                            <>
                              <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Unban
                            </>
                          ) : (
                            <>
                              <Ban className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              Ban
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "swaps" && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <h2 className="text-lg font-semibold text-gray-900">Swap Requests</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSwapFilter("all")}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    swapFilter === "all"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All ({swaps.length})
                </button>
                <button
                  onClick={() => setSwapFilter("pending")}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    swapFilter === "pending"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pending ({swaps.filter(s => s.status === "pending").length})
                </button>
                <button
                  onClick={() => setSwapFilter("accepted")}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    swapFilter === "accepted"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Accepted ({swaps.filter(s => s.status === "accepted").length})
                </button>
                <button
                  onClick={() => setSwapFilter("rejected")}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    swapFilter === "rejected"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Rejected ({swaps.filter(s => s.status === "rejected").length})
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {swaps
                .filter(swap => swapFilter === "all" || swap.status === swapFilter)
                .map((swap) => (
                <div key={swap.id} className="p-4 sm:p-6">
                  <div className="flex flex-col space-y-4">
                    {/* Swap Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 rounded-full p-2">
                          <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Swap Request #{swap.id.slice(-6)}</h3>
                          <p className="text-sm text-gray-500">
                            Created: {swap.createdAt?.toDate().toLocaleDateString()}
                            {swap.acceptedAt && ` • Accepted: ${swap.acceptedAt.toDate().toLocaleDateString()}`}
                            {swap.rejectedAt && ` • Rejected: ${swap.rejectedAt.toDate().toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          swap.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          swap.status === "accepted" ? "bg-green-100 text-green-800" :
                          swap.status === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Swap Participants */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Requester Side */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Requester</h4>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {swap.requesterName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{swap.requesterName}</p>
                            <p className="text-sm text-gray-500">{swap.requesterEmail}</p>
                          </div>
                        </div>
                        {swap.proposedItemId && (
                          <div className="border rounded-lg p-3 bg-white">
                            <p className="text-sm font-medium text-gray-700">Proposed Item:</p>
                            <p className="text-sm text-gray-600">{swap.proposedItemTitle}</p>
                            <button
                              onClick={() => window.open(`/item/${swap.proposedItemId}`, "_blank")}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-1"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Item
                            </button>
                          </div>
                        )}
                        {swap.message && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border">
                            <p className="text-sm font-medium text-blue-800">Message:</p>
                            <p className="text-sm text-blue-700 mt-1">{swap.message}</p>
                          </div>
                        )}
                      </div>

                      {/* Owner Side */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Item Owner</h4>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-sm">
                              {swap.uploaderName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{swap.uploaderName}</p>
                            <p className="text-sm text-gray-500">{swap.uploaderEmail}</p>
                          </div>
                        </div>
                        <div className="border rounded-lg p-3 bg-white">
                          <p className="text-sm font-medium text-gray-700">Requested Item:</p>
                          <p className="text-sm text-gray-600">{swap.itemTitle}</p>
                          <button
                            onClick={() => window.open(`/item/${swap.itemId}`, "_blank")}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Item
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Swap Type and Points */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 pt-2 border-t">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">Type: 
                          <span className="text-gray-900 ml-1">
                            {swap.type === "swap" ? "Item Swap" : "Points Exchange"}
                          </span>
                        </span>
                        {swap.pointsOffered && (
                          <span className="font-medium">Points Offered: 
                            <span className="text-green-600 ml-1">{swap.pointsOffered}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                        <button
                          onClick={() => fetchAdminData()}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded"
                          title="Refresh"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {swaps.filter(swap => swapFilter === "all" || swap.status === swapFilter).length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No {swapFilter === "all" ? "" : swapFilter} swap requests found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;