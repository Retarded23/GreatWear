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
  const getStatColors = (color) => {
    switch (color) {
      case 'rose': return { bg: 'bg-rose-100', text: 'text-rose-600' };
      case 'orange': return { bg: 'bg-orange-100', text: 'text-orange-600' };
      case 'amber': return { bg: 'bg-amber-100', text: 'text-amber-600' };
      case 'lime': return { bg: 'bg-lime-100', text: 'text-lime-600' };
      case 'sky': return { bg: 'bg-sky-100', text: 'text-sky-600' };
      default: return { bg: 'bg-zinc-100', text: 'text-zinc-600' };
    }
  };

  const statCards = [
    { name: "Total Users", value: stats.totalUsers, icon: Users, color: "rose" },
    { name: "Total Items", value: stats.totalItems, icon: Package, color: "orange" },
    { name: "Pending Review", value: stats.pendingItems, icon: TrendingUp, color: "amber" },
    { name: "Approved Items", value: stats.approvedItems, icon: Check, color: "lime" },
    { name: "Total Swaps", value: stats.totalSwaps, icon: ArrowRightLeft, color: "sky" },
  ];
  
  const mainTabs = [
    { key: 'pending', label: 'Pending Items', count: stats.pendingItems },
    { key: 'items', label: 'All Items', count: stats.totalItems },
    { key: 'swaps', label: 'Swaps', count: stats.totalSwaps },
    { key: 'users', label: 'Users', count: stats.totalUsers },
  ];
  if (loading) {
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-rose-500"></div>
      <p className="text-lg font-semibold text-zinc-600">Loading Admin Data...</p>
    </div>
  );
}

if (!currentUser?.isAdmin) {
  return (
    <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-3xl font-bold text-rose-800">Access Denied</h2>
      <p className="text-zinc-600 mt-2">You do not have the necessary privileges to view this page.</p>
    </div>
  );
}

return (
  <div className="min-h-screen bg-orange-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-zinc-900 mb-2">Admin Panel</h1>
        <p className="text-lg text-zinc-600">Manage items, users, and platform content</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {statCards.map((stat) => {
          const colors = getStatColors(stat.color);
          return (
            <div key={stat.name} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center">
                <div className={`${colors.bg} rounded-xl p-3`}>
                  <stat.icon className={`h-6 w-6 ${colors.text}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-zinc-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-4 overflow-x-auto pb-2">
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-4 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-rose-500 text-white shadow-md"
                  : "bg-white text-zinc-600 hover:bg-rose-50 hover:text-rose-700"
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${activeTab === tab.key ? 'bg-white/20' : 'bg-zinc-200'}`}>{tab.count}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-xl">
        {/* Pending Items Tab */}
        {activeTab === "pending" && (
          <div>
            <div className="px-6 py-4 border-b border-rose-100">
              <h2 className="text-xl font-bold text-zinc-800">Items Pending Review</h2>
            </div>
            <div className="divide-y divide-rose-100">
              {pendingItems.length > 0 ? (
                pendingItems.map((item) => (
                  <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img src={item.imageUrls?.[0] || "/placeholder-image.jpg"} alt={item.title} className="w-24 h-24 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"/>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                      <p className="text-sm text-zinc-500">by {item.uploaderName}</p>
                      <p className="text-xs text-zinc-400">Submitted: {item.createdAt?.toDate().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right font-bold text-orange-600 text-lg">
                      {item.points} pts
                    </div>
                    <div className="flex space-x-1 sm:space-x-2">
                      <button onClick={() => window.open(`/item/${item.id}`, "_blank")} className="p-2 text-sky-600 hover:bg-sky-50 rounded-full transition-colors" title="View Item"><Eye className="h-5 w-5" /></button>
                      <button onClick={() => handleApproveItem(item.id)} className="p-2 text-lime-600 hover:bg-lime-50 rounded-full transition-colors" title="Approve"><Check className="h-5 w-5" /></button>
                      <button onClick={() => handleRejectItem(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Reject"><X className="h-5 w-5" /></button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-zinc-500">No pending items for review.</div>
              )}
            </div>
          </div>
        )}

        {/* All Items Tab */}
        {activeTab === 'items' && (
           <div>
              <div className="px-6 py-4 border-b border-rose-100">
                <h2 className="text-xl font-bold text-zinc-800">All Items</h2>
              </div>
              <div className="divide-y divide-rose-100">
                  {allItems.map(item => (
                      <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4">
                           <img src={item.imageUrls?.[0] || "/placeholder-image.jpg"} alt={item.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0"/>
                           <div className="flex-1">
                              <h3 className="font-semibold text-zinc-900">{item.title}</h3>
                              <p className="text-sm text-zinc-500">by {item.uploaderName}</p>
                           </div>
                           <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                               item.status === 'approved' ? 'bg-lime-100 text-lime-800' :
                               item.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                               'bg-red-100 text-red-800'
                           }`}>
                               {item.status}
                           </div>
                           <div className="text-right font-bold text-orange-600 text-lg">{item.points} pts</div>
                           <div className="flex space-x-1">
                              <button onClick={() => window.open(`/item/${item.id}`, "_blank")} className="p-2 text-sky-600 hover:bg-sky-50 rounded-full transition-colors" title="View Item"><Eye className="h-5 w-5" /></button>
                              <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete Item"><Trash2 className="h-5 w-5" /></button>
                           </div>
                      </div>
                  ))}
              </div>
           </div>
        )}
        
        {/* Swaps Tab */}
        {activeTab === 'swaps' && (
           <div>
              <div className="px-6 py-4 border-b border-rose-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-800">Swap Monitoring</h2>
                  {/* Filters for swaps can be added here if needed */}
              </div>
               <div className="divide-y divide-rose-100">
                  {swaps.map(swap => (
                      <div key={swap.id} className="p-4 sm:p-6 space-y-4">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="font-semibold text-zinc-800">
                                      <span className="text-rose-600">{swap.requesterName}</span> → <span className="text-lime-600">{swap.uploaderName}</span>
                                  </h3>
                                  <p className="text-xs text-zinc-400">ID: {swap.id.slice(-6)} | {swap.createdAt?.toDate().toLocaleString()}</p>
                              </div>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                   swap.status === "pending" ? "bg-amber-100 text-amber-800" :
                                   swap.status === "accepted" ? "bg-lime-100 text-lime-800" :
                                   swap.status === "rejected" ? "bg-red-100 text-red-800" :
                                   "bg-zinc-100 text-zinc-800"
                              }`}>{swap.status}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-orange-50 p-3 rounded-lg">
                                  <p className="text-sm font-semibold text-orange-800 mb-2">Requested Item</p>
                                  <div className="flex items-center gap-3">
                                      <img src={swap.requestedItem?.imageUrls?.[0]} className="w-12 h-12 rounded-md object-cover"/>
                                      <div>
                                          <p className="text-sm font-medium text-zinc-900">{swap.requestedItem?.title}</p>
                                          <p className="text-xs text-zinc-600">{swap.requestedItem?.points} pts</p>
                                      </div>
                                  </div>
                              </div>
                              <div className="bg-rose-50 p-3 rounded-lg">
                                  <p className="text-sm font-semibold text-rose-800 mb-2">Offered</p>
                                   {swap.proposedItem ? (
                                      <div className="flex items-center gap-3">
                                          <img src={swap.proposedItem?.imageUrls?.[0]} className="w-12 h-12 rounded-md object-cover"/>
                                          <div>
                                              <p className="text-sm font-medium text-zinc-900">{swap.proposedItem?.title}</p>
                                              <p className="text-xs text-zinc-600">{swap.proposedItem?.points} pts</p>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="flex items-center gap-3">
                                          <Award className="h-8 w-8 text-amber-500"/>
                                          <p className="text-sm font-medium text-zinc-900">Points Redemption</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  ))}
               </div>
           </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="px-6 py-4 border-b border-rose-100">
              <h2 className="text-xl font-bold text-zinc-800">User Management</h2>
            </div>
            <div className="divide-y divide-rose-100">
              {users.map((user) => (
                <div key={user.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-200" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900 truncate">{user.name}</h3>
                      <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-orange-600">{user.points || 0} pts</span>
                    {user.isAdmin && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">Admin</span>}
                    {user.banned && <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Banned</span>}
                  </div>
                  {user.id !== currentUser.uid && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => handleToggleUserAdmin(user.id, user.isAdmin)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${user.isAdmin ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}>{user.isAdmin ? "Remove Admin" : "Make Admin"}</button>
                      <button onClick={() => handleToggleBanUser(user.id, user.banned)} className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center transition-colors ${user.banned ? "bg-lime-100 text-lime-700 hover:bg-lime-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>{user.banned ? <><Shield className="h-4 w-4 mr-1" /> Unban</> : <><Ban className="h-4 w-4 mr-1" /> Ban</>}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

};

export default AdminPanel;