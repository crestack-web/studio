'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer, getAggregateFromServer, sum } from 'firebase/firestore';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardMetrics {
  totalUsers: number;
  totalBusinesses: number;
  activeBusinesses7Days: number;
  activeBusinesses30Days: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newBusinessesThisMonth: number;
  totalSales: number;
  totalInventory: number;
  totalAskMOConversations: number;
  paidSubscribers: number;
  trialUsers: number;
  totalRevenue: number;
  avgUserEngagement: number;
  totalExpenses: number;
  totalSuppliers: number;
  totalStaff: number;
  avgMonthlyActiveUsers: number;
  retentionRate: number;
}

interface ChartData {
  date: string;
  users: number;
  businesses: number;
  activeUsers: number;
  sales: number;
  revenue: number;
}

export default function DashboardOverview() {
  const { firestore } = initializeFirebase();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalBusinesses: 0,
    activeBusinesses7Days: 0,
    activeBusinesses30Days: 0,
    newUsersToday: 0,
    newUsersThisWeek: 0,
    newBusinessesThisMonth: 0,
    totalSales: 0,
    totalInventory: 0,
    totalAskMOConversations: 0,
    paidSubscribers: 0,
    trialUsers: 0,
    totalRevenue: 0,
    avgUserEngagement: 0,
    totalExpenses: 0,
    totalSuppliers: 0,
    totalStaff: 0,
    avgMonthlyActiveUsers: 0,
    retentionRate: 0,
  });
  const [userGrowthData, setUserGrowthData] = useState<ChartData[]>([]);
  const [dailyActiveData, setDailyActiveData] = useState<ChartData[]>([]);
  const [businessCreationData, setBusinessCreationData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const safeGetCount = useCallback(async (colRef: any) => {
    try {
      const snapshot = await getCountFromServer(colRef);
      return snapshot.data().count;
    } catch (error) {
      console.warn('Failed to get count for collection:', error);
      return 0;
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get total users
      const totalUsers = await safeGetCount(collection(firestore, 'users'));

      // Get total businesses
      const totalBusinesses = await safeGetCount(collection(firestore, 'businesses'));
      
      // Get active businesses (7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const active7DaysQuery = query(
        collection(firestore, 'businesses'),
        where('lastActive', '>=', sevenDaysAgo)
      );
      const activeBusinesses7Days = await safeGetCount(active7DaysQuery);

      // Get active businesses (30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const active30DaysQuery = query(
        collection(firestore, 'businesses'),
        where('lastActive', '>=', thirtyDaysAgo)
      );
      const activeBusinesses30Days = await safeGetCount(active30DaysQuery);

      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersTodayQuery = query(
        collection(firestore, 'users'),
        where('createdAt', '>=', today)
      );
      const newUsersToday = await safeGetCount(newUsersTodayQuery);

      // Get new users this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newUsersWeekQuery = query(
        collection(firestore, 'users'),
        where('createdAt', '>=', weekAgo)
      );
      const newUsersThisWeek = await safeGetCount(newUsersWeekQuery);

      // Get new businesses this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const newBusinessesMonthQuery = query(
        collection(firestore, 'businesses'),
        where('createdAt', '>=', monthStart)
      );
      const newBusinessesThisMonth = await safeGetCount(newBusinessesMonthQuery);

      // Get total inventory items
      let totalInventory = 0;
      try {
        const businessesSnapshot = await getDocs(collection(firestore, 'businesses'));
        for (const businessDoc of businessesSnapshot.docs) {
          const productsCount = await safeGetCount(collection(firestore, 'businesses', businessDoc.id, 'products'));
          totalInventory += productsCount;
        }
      } catch (e) {
        console.warn('Failed to get total inventory count:', e);
      }

      // Get total suppliers
      let totalSuppliers = 0;
      try {
        const businessesSnapshot = await getDocs(collection(firestore, 'businesses'));
        for (const businessDoc of businessesSnapshot.docs) {
          const suppliersCount = await safeGetCount(collection(firestore, 'businesses', businessDoc.id, 'suppliers'));
          totalSuppliers += suppliersCount;
        }
      } catch (e) {
        console.warn('Failed to get total suppliers count:', e);
      }

      // Get total staff
      let totalStaff = 0;
      try {
        const businessesSnapshot = await getDocs(collection(firestore, 'businesses'));
        for (const businessDoc of businessesSnapshot.docs) {
          const staffCount = await safeGetCount(collection(firestore, 'businesses', businessDoc.id, 'staff'));
          totalStaff += staffCount;
        }
      } catch (e) {
        console.warn('Failed to get total staff count:', e);
      }

      // Get Ask MO conversations
      const totalAskMOConversations = await safeGetCount(collection(firestore, 'askMoConversations'));

      // Get subscription counts
      let paidSubscribers = 0;
      let trialUsers = 0;

      try {
        const paidQuery = query(collection(firestore, 'businesses'), where('plan', '==', 'paid'));
        paidSubscribers = await safeGetCount(paidQuery);
      } catch (e) {
        console.warn('Failed to get paid subscribers count:', e);
      }

      try {
        // Get active trial users (created within last 3 days and plan is 'trial')
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const trialQuery = query(
          collection(firestore, 'businesses'),
          where('plan', '==', 'trial'),
          where('createdAt', '>=', threeDaysAgo)
        );
        trialUsers = await safeGetCount(trialQuery);
      } catch (e) {
        console.warn('Failed to get trial users count:', e);
      }

      // Get total sales and revenue
      let totalSales = 0;
      let totalRevenue = 0;
      try {
        const businessesSnapshot = await getDocs(collection(firestore, 'businesses'));
        for (const businessDoc of businessesSnapshot.docs) {
          const salesQuery = query(collection(firestore, 'businesses', businessDoc.id, 'sales'));
          const salesSnapshot = await getDocs(salesQuery);
          totalSales += salesSnapshot.size;
          
          // Calculate revenue from sales
          salesSnapshot.forEach(saleDoc => {
            const saleData = saleDoc.data();
            if (saleData.amount) {
              totalRevenue += parseFloat(saleData.amount) || 0;
            }
          });
        }
      } catch (e) {
        console.warn('Failed to get sales/revenue data:', e);
      }

      // Get total expenses
      let totalExpenses = 0;
      try {
        const businessesSnapshot = await getDocs(collection(firestore, 'businesses'));
        for (const businessDoc of businessesSnapshot.docs) {
          const expensesQuery = query(collection(firestore, 'businesses', businessDoc.id, 'expenses'));
          const expensesSnapshot = await getDocs(expensesQuery);
          
          expensesSnapshot.forEach(expenseDoc => {
            const expenseData = expenseDoc.data();
            if (expenseData.amount) {
              totalExpenses += parseFloat(expenseData.amount) || 0;
            }
          });
        }
      } catch (e) {
        console.warn('Failed to get expenses data:', e);
      }

      // Calculate engagement metrics
      let avgUserEngagement = 0;
      let avgMonthlyActiveUsers = 0;
      let retentionRate = 0;
      try {
        // Calculate average user engagement (simplified calculation)
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        let totalEngagementScore = 0;
        usersSnapshot.forEach(userDoc => {
          const userData = userDoc.data();
          // Calculate engagement based on various factors
          const engagementScore = (userData.lastActive ? 1 : 0) + 
                                (userData.moTotalConversations || 0) * 0.1 +
                                (userData.totalSales || 0) * 0.05;
          totalEngagementScore += engagementScore;
        });
        avgUserEngagement = usersSnapshot.size > 0 ? totalEngagementScore / usersSnapshot.size : 0;

        // Calculate monthly active users
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthlyActiveQuery = query(
          collection(firestore, 'users'),
          where('lastActive', '>=', monthAgo)
        );
        const monthlyActiveCount = await safeGetCount(monthlyActiveQuery);
        avgMonthlyActiveUsers = monthlyActiveCount;

        // Calculate retention rate (simplified calculation)
        retentionRate = totalBusinesses > 0 ? (activeBusinesses30Days / totalBusinesses) * 100 : 0;
      } catch (e) {
        console.warn('Failed to calculate engagement metrics:', e);
      }

      setMetrics({
        totalUsers,
        totalBusinesses,
        activeBusinesses7Days,
        activeBusinesses30Days,
        newUsersToday,
        newUsersThisWeek,
        newBusinessesThisMonth,
        totalSales,
        totalInventory,
        totalAskMOConversations,
        paidSubscribers,
        trialUsers,
        totalRevenue,
        avgUserEngagement,
        totalExpenses,
        totalSuppliers,
        totalStaff,
        avgMonthlyActiveUsers,
        retentionRate,
      });

      // Load chart data
      await loadChartData();
    } catch (error) {
      console.error('Error loading metrics:', error);
      setError('Failed to load dashboard metrics. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [firestore, safeGetCount]);

  const loadChartData = async () => {
    try {
      // Load user growth data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const usersSnapshot = await getDocs(
        query(
          collection(firestore, 'users'),
          where('createdAt', '>=', thirtyDaysAgo),
          orderBy('createdAt', 'asc')
        )
      );

      const businessesSnapshot = await getDocs(
        query(
          collection(firestore, 'businesses'),
          where('createdAt', '>=', thirtyDaysAgo),
          orderBy('createdAt', 'asc')
        )
      );

      // Group data by date
      const dateMap = new Map<string, { users: number; businesses: number; activeUsers: number; sales: number; revenue: number }>();

      // Initialize last 30 days with 0
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        dateMap.set(dateStr, { users: 0, businesses: 0, activeUsers: 0, sales: 0, revenue: 0 });
      }

      // Count users per day
      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt) {
          const date = data.createdAt.toDate();
          const dateStr = date.toISOString().split('T')[0];
          if (dateMap.has(dateStr)) {
            const current = dateMap.get(dateStr)!;
            current.users += 1;
            dateMap.set(dateStr, current);
          }
        }
      });

      // Count businesses per day
      businessesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt) {
          const date = data.createdAt.toDate();
          const dateStr = date.toISOString().split('T')[0];
          if (dateMap.has(dateStr)) {
            const current = dateMap.get(dateStr)!;
            current.businesses += 1;
            dateMap.set(dateStr, current);
          }
        }
      });

      // Convert to array and calculate cumulative totals
      const cumulativeData: ChartData[] = [];
      let cumulativeUsers = 0;
      let cumulativeBusinesses = 0;

      dateMap.forEach((value, key) => {
        cumulativeUsers += value.users;
        cumulativeBusinesses += value.businesses;
        cumulativeData.push({
          date: key,
          users: cumulativeUsers,
          businesses: cumulativeBusinesses,
          activeUsers: value.activeUsers,
          sales: value.sales,
          revenue: value.revenue,
        });
      });

      setUserGrowthData(cumulativeData);
      setBusinessCreationData(cumulativeData);

      // Load daily active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const activeUsersSnapshot = await getDocs(
        query(
          collection(firestore, 'users'),
          where('lastActive', '>=', sevenDaysAgo)
        )
      );

      const dailyActiveMap = new Map<string, number>();

      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        dailyActiveMap.set(dateStr, 0);
      }

      // Count active users per day
      activeUsersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.lastActive) {
          const date = data.lastActive.toDate();
          const dateStr = date.toISOString().split('T')[0];
          if (dailyActiveMap.has(dateStr)) {
            dailyActiveMap.set(dateStr, (dailyActiveMap.get(dateStr) || 0) + 1);
          }
        }
      });

      const dailyActiveArray: ChartData[] = Array.from(dailyActiveMap.entries()).map(([date, count]) => ({
        date,
        users: 0,
        businesses: 0,
        activeUsers: count,
        sales: 0,
        revenue: 0,
      }));

      setDailyActiveData(dailyActiveArray);

      // Load revenue data
      const revenueMap = new Map<string, number>();
      
      // Initialize last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        revenueMap.set(dateStr, 0);
      }

      // Calculate revenue per day
      const businessesSnapshot2 = await getDocs(collection(firestore, 'businesses'));
      for (const businessDoc of businessesSnapshot2.docs) {
        const salesQuery = query(
          collection(firestore, 'businesses', businessDoc.id, 'sales'),
          where('createdAt', '>=', thirtyDaysAgo)
        );
        const salesSnapshot = await getDocs(salesQuery);
        
        salesSnapshot.forEach(saleDoc => {
          const saleData = saleDoc.data();
          if (saleData.createdAt && saleData.amount) {
            const date = saleData.createdAt.toDate();
            const dateStr = date.toISOString().split('T')[0];
            const amount = parseFloat(saleData.amount) || 0;
            if (revenueMap.has(dateStr)) {
              revenueMap.set(dateStr, revenueMap.get(dateStr)! + amount);
            }
          }
        });
      }

      const revenueArray: ChartData[] = Array.from(revenueMap.entries()).map(([date, revenue]) => ({
        date,
        users: 0,
        businesses: 0,
        activeUsers: 0,
        sales: 0,
        revenue,
      }));

      setRevenueData(revenueArray);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const metricCards = [
    { label: 'Total Users', value: metrics.totalUsers, icon: '👥', color: 'blue', change: '+5%' },
    { label: 'Total Businesses', value: metrics.totalBusinesses, icon: '🏢', color: 'purple', change: '+3%' },
    { label: 'Active (7 Days)', value: metrics.activeBusinesses7Days, icon: '✅', color: 'green', change: '+12%' },
    { label: 'Active (30 Days)', value: metrics.activeBusinesses30Days, icon: '📈', color: 'green', change: '+8%' },
    { label: 'New Users Today', value: metrics.newUsersToday, icon: '🆕', color: 'indigo', change: '+2%' },
    { label: 'New Users This Week', value: metrics.newUsersThisWeek, icon: '📅', color: 'indigo', change: '+4%' },
    { label: 'New Businesses This Month', value: metrics.newBusinessesThisMonth, icon: '🏗️', color: 'purple', change: '+6%' },
    { label: 'Total Inventory Items', value: metrics.totalInventory, icon: '📦', color: 'orange', change: '+15%' },
    { label: 'Ask MO Conversations', value: metrics.totalAskMOConversations, icon: '🤖', color: 'pink', change: '+20%' },
    { label: 'Paid Subscribers', value: metrics.paidSubscribers, icon: '💎', color: 'green', change: '+7%' },
    { label: 'Trial Users (Active)', value: metrics.trialUsers, icon: '⏳', color: 'yellow', change: '-2%' },
    { label: 'Total Revenue', value: `₦${metrics.totalRevenue.toLocaleString()}`, icon: '💰', color: 'emerald', change: '+10%' },
    { label: 'Total Expenses', value: `₦${metrics.totalExpenses.toLocaleString()}`, icon: '💸', color: 'rose', change: '+5%' },
    { label: 'Total Suppliers', value: metrics.totalSuppliers, icon: '🏭', color: 'amber', change: '+8%' },
    { label: 'Total Staff', value: metrics.totalStaff, icon: '👥', color: 'sky', change: '+3%' },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse"></div>
            </div>
          </div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">Loading dashboard metrics...</p>
        <p className="text-gray-500 text-sm">Fetching data from all systems</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button 
            onClick={loadMetrics}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className={`p-5 rounded-xl border-2 ${colorClasses[card.color as keyof typeof colorClasses]} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {card.change}
              </span>
            </div>
            <p className="text-2xl font-bold mb-1">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
            <p className="text-sm font-medium text-gray-600">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User & Business Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelFormatter={formatDate}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                fill="#93c5fd"
                strokeWidth={2}
                name="Total Users"
              />
              <Area
                type="monotone"
                dataKey="businesses"
                stroke="#8b5cf6"
                fill="#c4b5fd"
                strokeWidth={2}
                name="Total Businesses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Active Users Chart */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Active Users</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyActiveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelFormatter={formatDate}
              />
              <Legend />
              <Bar dataKey="activeUsers" fill="#10b981" radius={[8, 8, 0, 0]} name="Active Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Business Creation Trend */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Creation Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={businessCreationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                labelFormatter={formatDate}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="businesses"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
                name="Total Businesses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                formatter={(value) => [`₦${Number(value).toLocaleString()}`, 'Revenue']}
                labelFormatter={formatDate}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fill="#a7f3d0"
                strokeWidth={2}
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Engagement Score</span>
              <span className="font-semibold">{metrics.avgUserEngagement.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Active Users</span>
              <span className="font-semibold">{metrics.avgMonthlyActiveUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Retention Rate</span>
              <span className="font-semibold">{metrics.retentionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold">₦{metrics.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Expenses</span>
              <span className="font-semibold">₦{metrics.totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Net Profit</span>
              <span className="font-semibold text-green-600">
                ₦{(metrics.totalRevenue - metrics.totalExpenses).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Inventory</span>
              <span className="font-semibold">{metrics.totalInventory.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Suppliers</span>
              <span className="font-semibold">{metrics.totalSuppliers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Staff</span>
              <span className="font-semibold">{metrics.totalStaff.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
