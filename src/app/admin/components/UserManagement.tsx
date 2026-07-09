'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, where, updateDoc } from 'firebase/firestore';
import { Eye, Edit, Ban, Check, X, MessageCircle, Building, Calendar, Activity, Package, Users, Zap } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  businessId?: string;
  plan: string;
  dateJoined: string;
  lastActive: string;
  totalSales: number;
  totalProducts: number;
  totalStaff: number;
  askMOUsage: number;
  suspended?: boolean;
}

interface UserDetail {
  user: User;
  businessData?: any;
  supportMessages?: any[];
}

export default function UserManagement() {
  const { firestore } = initializeFirebase();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState('dateJoined');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newPlan, setNewPlan] = useState('');

  useEffect(() => {
    loadUsers();
  }, [firestore]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let snapshot;
      
      try {
        const usersQuery = query(
          collection(firestore, 'users'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        snapshot = await getDocs(usersQuery);
      } catch (indexError) {
        console.warn('Index not available for users query, trying without orderBy:', indexError);
        snapshot = await getDocs(query(collection(firestore, 'users'), limit(100)));
      }
      
      const usersList: User[] = [];
      const processedUserIds = new Set<string>();
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        processedUserIds.add(docSnapshot.id);
        
        // Fetch additional business data if businessId exists
        let totalSales = data.totalSales || 0;
        let totalProducts = data.totalProducts || 0;
        let totalStaff = data.totalStaff || 0;
        let plan = data.plan || 'free';
        let businessName = data.businessName || '';
        
        if (data.businessId) {
          try {
            const businessDoc = await getDoc(doc(firestore, 'businesses', data.businessId));
            if (businessDoc.exists()) {
              const businessData = businessDoc.data();
              
              // Get plan from business document (primary source)
              plan = businessData.plan || 'free';
              businessName = businessData.businessName || businessName;
              
              // Count products
              const productsQuery = query(collection(firestore, 'businesses', data.businessId, 'products'));
              const productsSnapshot = await getDocs(productsQuery);
              totalProducts = productsSnapshot.size;
              
              // Count staff
              const staffQuery = query(collection(firestore, 'businesses', data.businessId, 'staff'));
              const staffSnapshot = await getDocs(staffQuery);
              totalStaff = staffSnapshot.size;
              
              // Count sales (last 30 days for more accurate data)
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              const salesQuery = query(
                collection(firestore, 'businesses', data.businessId, 'sales'),
                where('createdAt', '>=', thirtyDaysAgo)
              );
              const salesSnapshot = await getDocs(salesQuery);
              totalSales = salesSnapshot.size;
            }
          } catch (error) {
            console.error('Error fetching business data for user:', error);
          }
        }
        
        usersList.push({
          id: docSnapshot.id,
          name: data.name || data.displayName || 'Unknown',
          email: data.email || '',
          businessName: businessName,
          businessId: data.businessId,
          plan: plan,
          dateJoined: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
          lastActive: data.lastActive?.toDate().toLocaleDateString() || 'N/A',
          totalSales,
          totalProducts,
          totalStaff,
          askMOUsage: data.moCreditsConsumed || 0,
          suspended: data.suspended || false,
        });
      }
      
      // Also load businesses that don't have corresponding user documents
      // This handles cases where user documents might be missing
      try {
        const businessesSnapshot = await getDocs(query(collection(firestore, 'businesses'), limit(100)));
        
        for (const businessDoc of businessesSnapshot.docs) {
          const businessData = businessDoc.data();
          const businessId = businessDoc.id;
          
          // Skip if we already have this user
          if (processedUserIds.has(businessId)) {
            continue;
          }
          
          // Count products
          let totalProducts = 0;
          try {
            const productsQuery = query(collection(firestore, 'businesses', businessId, 'products'));
            const productsSnapshot = await getDocs(productsQuery);
            totalProducts = productsSnapshot.size;
          } catch (error) {
            console.error('Error fetching products for business:', error);
          }
          
          // Count staff
          let totalStaff = 0;
          try {
            const staffQuery = query(collection(firestore, 'businesses', businessId, 'staff'));
            const staffSnapshot = await getDocs(staffQuery);
            totalStaff = staffSnapshot.size;
          } catch (error) {
            console.error('Error fetching staff for business:', error);
          }
          
          // Count sales (last 30 days)
          let totalSales = 0;
          try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const salesQuery = query(
              collection(firestore, 'businesses', businessId, 'sales'),
              where('createdAt', '>=', thirtyDaysAgo)
            );
            const salesSnapshot = await getDocs(salesQuery);
            totalSales = salesSnapshot.size;
          } catch (error) {
            console.error('Error fetching sales for business:', error);
          }
          
          usersList.push({
            id: businessId,
            name: businessData.ownerId || 'Unknown',
            email: businessData.ownerId || 'N/A',
            businessName: businessData.businessName || 'Unknown',
            businessId: businessId,
            plan: businessData.plan || 'trial',
            dateJoined: businessData.createdAt?.toDate().toLocaleDateString() || 'N/A',
            lastActive: businessData.updatedAt?.toDate().toLocaleDateString() || 'N/A',
            totalSales,
            totalProducts,
            totalStaff,
            askMOUsage: 0,
            suspended: false,
          });
        }
      } catch (error) {
        console.error('Error loading businesses without user docs:', error);
      }
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.businessName && user.businessName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    
    return matchesSearch && matchesPlan;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'dateJoined') return new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime();
    if (sortBy === 'lastActive') return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    if (sortBy === 'totalSales') return b.totalSales - a.totalSales;
    if (sortBy === 'askMOUsage') return b.askMOUsage - a.askMOUsage;
    return 0;
  });

  const loadUserDetail = async (user: User) => {
    try {
      setLoadingDetail(true);
      const userDetail: UserDetail = { user };

      // Fetch business data
      if (user.businessId) {
        const businessDoc = await getDoc(doc(firestore, 'businesses', user.businessId));
        if (businessDoc.exists()) {
          userDetail.businessData = businessDoc.data();
        }
      }

      // Fetch support messages
      const supportQuery = query(
        collection(firestore, 'supportMessages'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const supportSnapshot = await getDocs(supportQuery);
      userDetail.supportMessages = supportSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSelectedUser(userDetail);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading user detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedUser || !newPlan) return;

    try {
      // Update plan in business document (primary source)
      if (selectedUser.user.businessId) {
        await updateDoc(doc(firestore, 'businesses', selectedUser.user.businessId), {
          plan: newPlan
        });
      }
      
      // Also update in user document for consistency
      await updateDoc(doc(firestore, 'users', selectedUser.user.id), {
        plan: newPlan
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.user.id 
          ? { ...u, plan: newPlan }
          : u
      ));
      
      setSelectedUser({
        ...selectedUser,
        user: { ...selectedUser.user, plan: newPlan }
      });
      
      setNewPlan('');
      alert('Plan updated successfully');
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan');
    }
  };

  const handleToggleSuspend = async () => {
    if (!selectedUser) return;

    try {
      const newSuspendedStatus = !selectedUser.user.suspended;
      await updateDoc(doc(firestore, 'users', selectedUser.user.id), {
        suspended: newSuspendedStatus
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.user.id 
          ? { ...u, suspended: newSuspendedStatus }
          : u
      ));
      
      setSelectedUser({
        ...selectedUser,
        user: { ...selectedUser.user, suspended: newSuspendedStatus }
      });
      
      alert(newSuspendedStatus ? 'User suspended successfully' : 'User unsuspended successfully');
    } catch (error) {
      console.error('Error toggling suspend:', error);
      alert('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
      
      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Plans</option>
            <option value="trial">Trial</option>
            <option value="paid">Paid</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="dateJoined">Date Joined</option>
            <option value="lastActive">Last Active</option>
            <option value="totalSales">Total Sales</option>
            <option value="askMOUsage">Ask MO Usage</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Business</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Plan</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date Joined</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Active</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Sales</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Products</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Staff</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Ask MO</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700">{user.businessName || 'N/A'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.plan === 'paid' ? 'bg-green-100 text-green-800' :
                    user.plan === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.plan}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700">{user.dateJoined}</td>
                <td className="py-3 px-4 text-gray-700">{user.lastActive}</td>
                <td className="py-3 px-4 text-right text-gray-700">{user.totalSales.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-gray-700">{user.totalProducts}</td>
                <td className="py-3 px-4 text-right text-gray-700">{user.totalStaff}</td>
                <td className="py-3 px-4 text-right text-gray-700">{user.askMOUsage}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => loadUserDetail(user)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No users found matching your criteria
        </div>
      )}

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">User Details</h3>
                <p className="text-gray-500">{selectedUser.user.email}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users size={20} className="text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">User Information</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium">{selectedUser.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email</span>
                      <span className="font-medium">{selectedUser.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Plan</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUser.user.plan === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedUser.user.plan === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.user.plan}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedUser.user.suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {selectedUser.user.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar size={20} className="text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Activity</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date Joined</span>
                      <span className="font-medium">{selectedUser.user.dateJoined}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Active</span>
                      <span className="font-medium">{selectedUser.user.lastActive}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ask MO Usage</span>
                      <span className="font-medium">{selectedUser.user.askMOUsage} queries</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              {selectedUser.businessData && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Building size={20} className="text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Business Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-500 text-sm">Business Name</p>
                      <p className="font-semibold">{selectedUser.businessData.name || selectedUser.user.businessName}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-500 text-sm">Products</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Package size={16} className="text-purple-600" />
                        {selectedUser.user.totalProducts}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-500 text-sm">Staff</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Users size={16} className="text-blue-600" />
                        {selectedUser.user.totalStaff}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-500 text-sm">Sales (30 days)</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Activity size={16} className="text-green-600" />
                        {selectedUser.user.totalSales}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-500 text-sm">Currency</p>
                      <p className="font-semibold">{selectedUser.businessData.currency || 'USD'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-500 text-sm">Business ID</p>
                      <p className="font-semibold text-xs">{selectedUser.user.businessId}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Support Messages */}
              {selectedUser.supportMessages && selectedUser.supportMessages.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <MessageCircle size={20} className="text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Recent Support Messages</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedUser.supportMessages.map((msg: any) => (
                      <div key={msg.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            msg.status === 'unread' ? 'bg-yellow-100 text-yellow-800' :
                            msg.status === 'open' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {msg.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {msg.createdAt?.toDate?.().toLocaleString() || 'N/A'}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{msg.message}</p>
                        {msg.replies && msg.replies.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {msg.replies.length} {msg.replies.length === 1 ? 'reply' : 'replies'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Edit size={20} className="text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Actions</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Update Plan */}
                  <div className="bg-white rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Plan</label>
                    <div className="flex gap-2">
                      <select
                        value={newPlan}
                        onChange={(e) => setNewPlan(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Select new plan</option>
                        <option value="trial">Trial</option>
                        <option value="paid">Paid</option>
                      </select>
                      <button
                        onClick={handleUpdatePlan}
                        disabled={!newPlan}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  {/* Suspend/Unsuspend */}
                  <div className="bg-white rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                    <button
                      onClick={handleToggleSuspend}
                      className={`w-full px-4 py-2 rounded-lg transition-colors ${
                        selectedUser.user.suspended
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {selectedUser.user.suspended ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check size={18} />
                          Unsuspend Account
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Ban size={18} />
                          Suspend Account
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
