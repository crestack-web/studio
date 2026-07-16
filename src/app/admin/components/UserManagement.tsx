'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, where, updateDoc, getCountFromServer } from 'firebase/firestore';
import { Eye, Edit, Ban, Check, X, MessageCircle, Building, Calendar, Activity, Package, Users, Zap, Search, Filter, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
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
  totalExpenses: number;
  totalSuppliers: number;
  totalCustomers: number;
  totalRevenue: number;
  isActive: boolean;
  category?: string;
  businessAnalysis?: any;
  selectedCategory?: string;
  selectedFeatures?: string[];
}

interface UserDetail {
  user: User;
  userData?: any; // Full user document data
  businessData?: any;
  supportMessages?: any[];
}

export default function UserManagement() {
  const { firestore } = initializeFirebase();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('dateJoined');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newPlan, setNewPlan] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 50;

  // Fetch total user count
  const fetchTotalUsers = useCallback(async () => {
    try {
      const countSnapshot = await getCountFromServer(collection(firestore, 'users'));
      setTotalUsers(countSnapshot.data().count);
    } catch (error) {
      console.error('Error getting total users count:', error);
      // Fallback: try to get users count by fetching all users
      try {
        const snapshot = await getDocs(collection(firestore, 'users'));
        setTotalUsers(snapshot.size);
      } catch (fallbackError) {
        console.error('Error getting total users count with fallback:', fallbackError);
        setTotalUsers(0);
      }
    }
  }, [firestore]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      await fetchTotalUsers();
      
      let snapshot;
      
      try {
        const offsetValue = (currentPage - 1) * usersPerPage;
        const usersQuery = query(
          collection(firestore, 'users'),
          orderBy('createdAt', 'desc'),
          limit(usersPerPage)
        );
        snapshot = await getDocs(usersQuery);
      } catch (indexError) {
        console.warn('Index not available for users query, trying without orderBy:', indexError);
        const usersQuery = query(collection(firestore, 'users'), limit(usersPerPage));
        snapshot = await getDocs(usersQuery);
      }
      
      const usersList: User[] = [];
      const processedUserIds = new Set<string>();
      
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        processedUserIds.add(docSnapshot.id);
        
        // Safely extract user properties with fallback values
        const userId = docSnapshot.id;
        const email = data.email || 'N/A';
        const name = data.fullName || data.name || data.displayName || data.firstName + ' ' + data.lastName || 'Unknown User';
        const phone = data.phone || '';
        const country = data.country || '';
        const createdAt = data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString();
        const lastActive = data.lastActive ? data.lastActive.toDate().toISOString() : new Date().toISOString();
        
        // Format dates for display
        const dateJoined = data.createdAt ? data.createdAt.toDate().toLocaleDateString() : 'N/A';
        const lastActiveDisplay = data.lastActive ? data.lastActive.toDate().toLocaleDateString() : 'N/A';
        
        // Extract plan from user data (fallback to free if not available)
        let plan = data.plan || 'free';
        let businessName = data.businessName || 'Personal Account';
        let businessId = data.businessId || null;
        let category = data.category || data.selectedCategory || '';
        let businessAnalysis = data.businessAnalysis || null;
        let selectedFeatures = data.selectedFeatures || [];
        
        // Initialize metrics with default values
        let totalSales = data.totalSales || 0;
        let totalProducts = data.totalProducts || 0;
        let totalStaff = data.totalStaff || 0;
        let askMOUsage = data.moCreditsConsumed || 0;
        let totalExpenses = 0;
        let totalSuppliers = 0;
        let totalCustomers = 0;
        let totalRevenue = 0;
        let isActive = false;
        
        // If businessId exists, fetch additional business data
        if (data.businessId) {
          try {
            const businessDoc = await getDoc(doc(firestore, 'businesses', data.businessId));
            if (businessDoc.exists()) {
              const businessData = businessDoc.data();
              
              // Update plan from business document (primary source)
              plan = businessData.plan || plan;
              businessName = businessData.businessName || businessName;
              businessId = data.businessId;
              
              // Count products
              try {
                const productsQuery = query(collection(firestore, 'businesses', data.businessId, 'products'));
                const productsSnapshot = await getDocs(productsQuery);
                totalProducts = productsSnapshot.size;
              } catch (error) {
                console.error('Error fetching products for business:', data.businessId, error);
              }
              
              // Count staff
              try {
                const staffQuery = query(collection(firestore, 'businesses', data.businessId, 'staff'));
                const staffSnapshot = await getDocs(staffQuery);
                totalStaff = staffSnapshot.size;
              } catch (error) {
                console.error('Error fetching staff for business:', data.businessId, error);
              }
              
              // Count all sales and calculate total revenue
              try {
                const salesQuery = query(
                  collection(firestore, 'businesses', data.businessId, 'sales')
                );
                const salesSnapshot = await getDocs(salesQuery);
                totalSales = salesSnapshot.size;
                
                // Calculate total revenue from all sales
                salesSnapshot.forEach(saleDoc => {
                  const saleData = saleDoc.data();
                  if (saleData.amount) {
                    const amount = parseFloat(saleData.amount) || 0;
                    totalRevenue += amount;
                  }
                });
              } catch (error) {
                console.error('Error fetching sales for business:', data.businessId, error);
              }
              
              // Count expenses
              try {
                const expensesQuery = query(collection(firestore, 'businesses', data.businessId, 'expenses'));
                const expensesSnapshot = await getDocs(expensesQuery);
                totalExpenses = expensesSnapshot.size;
              } catch (error) {
                console.error('Error fetching expenses for business:', data.businessId, error);
              }
              
              // Count suppliers
              try {
                const suppliersQuery = query(collection(firestore, 'businesses', data.businessId, 'suppliers'));
                const suppliersSnapshot = await getDocs(suppliersQuery);
                totalSuppliers = suppliersSnapshot.size;
              } catch (error) {
                console.error('Error fetching suppliers for business:', data.businessId, error);
              }
              
              // Count customers
              try {
                const customersQuery = query(collection(firestore, 'businesses', data.businessId, 'customers'));
                const customersSnapshot = await getDocs(customersQuery);
                totalCustomers = customersSnapshot.size;
              } catch (error) {
                console.error('Error fetching customers for business:', data.businessId, error);
              }
              
              // Check if business is active
              if (businessData.lastActive) {
                const lastActiveDate = businessData.lastActive.toDate();
                const now = new Date();
                const diffInDays = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
                isActive = diffInDays <= 30; // Active if used in last 30 days
              } else if (data.lastActive) {
                const lastActiveDate = data.lastActive.toDate();
                const now = new Date();
                const diffInDays = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
                isActive = diffInDays <= 30;
              }
            }
          } catch (error) {
            console.error('Error fetching business data for user:', userId, error);
            // Even if business data fails, still add the user with basic info
          }
        }
        
        usersList.push({
          id: docSnapshot.id,
          name: data.fullName || data.name || data.displayName || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          country: data.country || '',
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
          totalExpenses,
          totalSuppliers,
          totalCustomers,
          totalRevenue,
          isActive,
          category: data.category || data.selectedCategory || '',
          businessAnalysis: data.businessAnalysis || undefined,
          selectedFeatures: data.selectedFeatures || [],
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
          
          // Count expenses
          let totalExpenses = 0;
          try {
            const expensesQuery = query(collection(firestore, 'businesses', businessId, 'expenses'));
            const expensesSnapshot = await getDocs(expensesQuery);
            totalExpenses = expensesSnapshot.size;
          } catch (error) {
            console.error('Error fetching expenses for business:', error);
          }
          
          // Count suppliers
          let totalSuppliers = 0;
          try {
            const suppliersQuery = query(collection(firestore, 'businesses', businessId, 'suppliers'));
            const suppliersSnapshot = await getDocs(suppliersQuery);
            totalSuppliers = suppliersSnapshot.size;
          } catch (error) {
            console.error('Error fetching suppliers for business:', error);
          }
          
          // Count customers
          let totalCustomers = 0;
          try {
            const customersQuery = query(collection(firestore, 'businesses', businessId, 'customers'));
            const customersSnapshot = await getDocs(customersQuery);
            totalCustomers = customersSnapshot.size;
          } catch (error) {
            console.error('Error fetching customers for business:', error);
          }
          
          // Calculate total revenue
          let totalRevenue = 0;
          try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const salesQuery = query(
              collection(firestore, 'businesses', businessId, 'sales'),
              where('createdAt', '>=', thirtyDaysAgo)
            );
            const salesSnapshot = await getDocs(salesQuery);
            salesSnapshot.forEach(saleDoc => {
              const saleData = saleDoc.data();
              if (saleData.amount) {
                totalRevenue += parseFloat(saleData.amount) || 0;
              }
            });
          } catch (error) {
            console.error('Error calculating revenue for business:', error);
          }
          
          // Check if business is active
          let isActive = false;
          if (businessData.lastActive) {
            const lastActiveDate = businessData.lastActive.toDate();
            const now = new Date();
            const diffInDays = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
            isActive = diffInDays <= 30; // Active if used in last 30 days
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
            totalExpenses,
            totalSuppliers,
            totalCustomers,
            totalRevenue,
            isActive,
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
  }, [firestore, currentPage, fetchTotalUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Refresh data when filters change
  useEffect(() => {
    loadUsers();
  }, [searchTerm, filterPlan, filterStatus, sortBy, sortOrder]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.businessName && user.businessName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && user.isActive) || 
                           (filterStatus === 'inactive' && !user.isActive) ||
                           (filterStatus === 'suspended' && user.suspended);
      
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [users, searchTerm, filterPlan, filterStatus]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'dateJoined':
          // Convert date strings to timestamps for comparison
          const dateA = a.dateJoined !== 'N/A' ? new Date(a.dateJoined).getTime() : 0;
          const dateB = b.dateJoined !== 'N/A' ? new Date(b.dateJoined).getTime() : 0;
          comparison = dateB - dateA; // Descending by default
          break;
        case 'lastActive':
          const lastActiveA = a.lastActive !== 'N/A' ? new Date(a.lastActive).getTime() : 0;
          const lastActiveB = b.lastActive !== 'N/A' ? new Date(b.lastActive).getTime() : 0;
          comparison = lastActiveB - lastActiveA; // Descending by default
          break;
        case 'totalSales':
          comparison = b.totalSales - a.totalSales;
          break;
        case 'askMOUsage':
          comparison = b.askMOUsage - a.askMOUsage;
          break;
        case 'totalRevenue':
          comparison = b.totalRevenue - a.totalRevenue;
          break;
        case 'totalProducts':
          comparison = b.totalProducts - a.totalProducts;
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'plan':
          comparison = a.plan.localeCompare(b.plan);
          break;
        default:
          comparison = 0;
      }
      
      // Reverse if ascending order is requested
      return sortOrder === 'asc' ? -comparison : comparison;
    });
    return sorted;
  }, [filteredUsers, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  // Apply pagination to sorted results
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return sortedUsers.slice(startIndex, startIndex + usersPerPage);
  }, [sortedUsers, currentPage, usersPerPage]);

  const loadUserDetail = async (user: User) => {
    try {
      setLoadingDetail(true);
      const userDetail: UserDetail = { user };

      // Fetch full user document data
      const userDoc = await getDoc(doc(firestore, 'users', user.id));
      if (userDoc.exists()) {
        userDetail.userData = userDoc.data();
      }

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
      <div className="flex flex-col items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse"></div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading users...</p>
        <p className="text-gray-500 text-sm">Fetching user data from all systems</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {totalUsers} total users
          </span>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center gap-2 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Plans</option>
              <option value="trial">Trial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="dateJoined">Date Joined</option>
              <option value="lastActive">Last Active</option>
              <option value="totalSales">Total Sales</option>
              <option value="askMOUsage">Ask MO Usage</option>
              <option value="totalRevenue">Total Revenue</option>
              <option value="totalProducts">Total Products</option>
              <option value="email">Email</option>
              <option value="name">Name</option>
              <option value="plan">Plan</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">User</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Business</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Plan</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Date Joined</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Last Active</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Sales</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Products</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Revenue</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Ask MO</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{user.email}</div>
                    {user.phone && <div className="text-sm text-gray-500">{user.phone}</div>}
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{user.businessName || 'N/A'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.plan === 'paid' ? 'bg-green-100 text-green-800' :
                    user.plan === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.plan}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {user.isActive ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={`text-xs ${
                      user.isActive ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700">{user.dateJoined}</td>
                <td className="py-3 px-4 text-gray-700">{user.lastActive}</td>
                <td className="py-3 px-4 text-right text-gray-700 font-medium">{user.totalSales.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-gray-700 font-medium">{user.totalProducts}</td>
                <td className="py-3 px-4 text-right text-gray-700 font-medium">₦{user.totalRevenue.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-gray-700 font-medium">{user.askMOUsage}</td>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * usersPerPage, sortedUsers.length)}</span> of{' '}
            <span className="font-medium">{sortedUsers.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {paginatedUsers.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
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
                    {selectedUser.user.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone</span>
                        <span className="font-medium">{selectedUser.user.phone}</span>
                      </div>
                    )}
                    {selectedUser.user.country && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Country</span>
                        <span className="font-medium">{selectedUser.user.country}</span>
                      </div>
                    )}
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
                    {selectedUser.user.category && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Business Type</span>
                        <span className="font-medium">{selectedUser.user.category}</span>
                      </div>
                    )}
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

              {/* Signup Information */}
              {selectedUser.userData && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Edit size={20} className="text-indigo-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Signup Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.userData.fullName && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 text-sm">Full Name</p>
                        <p className="font-semibold">{selectedUser.userData.fullName}</p>
                      </div>
                    )}
                    {selectedUser.userData.phone && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 text-sm">Phone</p>
                        <p className="font-semibold">{selectedUser.userData.phone}</p>
                      </div>
                    )}
                    {selectedUser.userData.country && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 text-sm">Country</p>
                        <p className="font-semibold">{selectedUser.userData.country}</p>
                      </div>
                    )}
                    {selectedUser.userData.category && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 text-sm">Business Category</p>
                        <p className="font-semibold">{selectedUser.userData.category}</p>
                      </div>
                    )}
                    {selectedUser.userData.selectedCategory && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 text-sm">Selected Category</p>
                        <p className="font-semibold">{selectedUser.userData.selectedCategory}</p>
                      </div>
                    )}
                    {selectedUser.userData.businessAnalysis?.businessType && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 text-sm">Business Type</p>
                        <p className="font-semibold">{selectedUser.userData.businessAnalysis.businessType}</p>
                      </div>
                    )}
                    {selectedUser.userData.businessAnalysis?.recommendedCategories && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-gray-500 text-sm">Recommended Categories</p>
                        <p className="font-semibold">{Array.isArray(selectedUser.userData.businessAnalysis.recommendedCategories) ? selectedUser.userData.businessAnalysis.recommendedCategories.join(', ') : selectedUser.userData.businessAnalysis.recommendedCategories}</p>
                      </div>
                    )}
                    {selectedUser.userData.selectedFeatures && Array.isArray(selectedUser.userData.selectedFeatures) && selectedUser.userData.selectedFeatures.length > 0 && (
                      <div className="bg-white rounded-lg p-3 md:col-span-2">
                        <p className="text-gray-500 text-sm">Selected Features</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedUser.userData.selectedFeatures.map((feature: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                      <p className="text-gray-500 text-sm">Sales (All Time)</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Activity size={16} className="text-green-600" />
                        {selectedUser.user.totalSales}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-500 text-sm">Revenue (All Time)</p>
                      <p className="font-semibold flex items-center gap-2">
                        <Zap size={16} className="text-amber-600" />
                        ₦{selectedUser.user.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-500 text-sm">Currency</p>
                      <p className="font-semibold">{selectedUser.businessData.currency || 'USD'}</p>
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
