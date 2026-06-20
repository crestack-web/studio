'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface User {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  plan: string;
  dateJoined: string;
  lastActive: string;
  totalSales: number;
  totalProducts: number;
  totalStaff: number;
  askMOUsage: number;
}

export default function UserManagement() {
  const { firestore } = initializeFirebase();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState('dateJoined');

  useEffect(() => {
    loadUsers();
  }, [firestore]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(
        collection(firestore, 'users'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(usersQuery);
      
      const usersList: User[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          name: data.name || data.displayName || 'Unknown',
          email: data.email || '',
          businessName: data.businessName || '',
          plan: data.plan || 'free',
          dateJoined: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
          lastActive: data.lastActive?.toDate().toLocaleDateString() || 'N/A',
          totalSales: data.totalSales || 0,
          totalProducts: data.totalProducts || 0,
          totalStaff: data.totalStaff || 0,
          askMOUsage: data.askMOUsage || 0,
        });
      });
      
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
            <option value="free">Free</option>
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
    </div>
  );
}
