'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from 'firebase/firestore';
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
}

interface ChartData {
  date: string;
  users: number;
  businesses: number;
  activeUsers: number;
  sales: number;
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
  });
  const [userGrowthData, setUserGrowthData] = useState<ChartData[]>([]);
  const [dailyActiveData, setDailyActiveData] = useState<ChartData[]>([]);
  const [businessCreationData, setBusinessCreationData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [firestore]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      // Helper function to safely get count with error handling
      const safeGetCount = async (colRef: any) => {
        try {
          const snapshot = await getCountFromServer(colRef);
          return snapshot.data().count;
        } catch (error) {
          console.warn('Failed to get count for collection:', error);
          return 0;
        }
      };

      // Get total users
      const totalUsers = await safeGetCount(collection(firestore, 'users'));

      // Get total businesses (use businesses count as primary since each business = 1 user)
      const totalBusinesses = await safeGetCount(collection(firestore, 'businesses'));
      
      // If businesses count is higher than users count, use businesses count for total users
      // This handles cases where user documents might be missing but business documents exist
      const adjustedTotalUsers = Math.max(totalUsers, totalBusinesses);

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

      // Get total inventory items (aggregate from all businesses)
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

      setMetrics({
        totalUsers: adjustedTotalUsers,
        totalBusinesses,
        activeBusinesses7Days,
        activeBusinesses30Days,
        newUsersToday,
        newUsersThisWeek,
        newBusinessesThisMonth,
        totalSales: 0,
        totalInventory,
        totalAskMOConversations,
        paidSubscribers,
        trialUsers,
      });

      // Load chart data
      await loadChartData();
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

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
      const dateMap = new Map<string, { users: number; businesses: number; activeUsers: number }>();

      // Initialize last 30 days with 0
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        dateMap.set(dateStr, { users: 0, businesses: 0, activeUsers: 0 });
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
          sales: 0,
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
      }));

      setDailyActiveData(dailyActiveArray);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const metricCards = [
    { label: 'Total Users', value: metrics.totalUsers, icon: '👥', color: 'blue' },
    { label: 'Total Businesses', value: metrics.totalBusinesses, icon: '🏢', color: 'purple' },
    { label: 'Active (7 Days)', value: metrics.activeBusinesses7Days, icon: '✅', color: 'green' },
    { label: 'Active (30 Days)', value: metrics.activeBusinesses30Days, icon: '📈', color: 'green' },
    { label: 'New Users Today', value: metrics.newUsersToday, icon: '🆕', color: 'indigo' },
    { label: 'New Users This Week', value: metrics.newUsersThisWeek, icon: '📅', color: 'indigo' },
    { label: 'New Businesses This Month', value: metrics.newBusinessesThisMonth, icon: '🏗️', color: 'purple' },
    { label: 'Total Inventory Items', value: metrics.totalInventory, icon: '📦', color: 'orange' },
    { label: 'Ask MO Conversations', value: metrics.totalAskMOConversations, icon: '🤖', color: 'pink' },
    { label: 'Paid Subscribers', value: metrics.paidSubscribers, icon: '💎', color: 'green' },
    { label: 'Trial Users (Active)', value: metrics.trialUsers, icon: '⏳', color: 'yellow' },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className={`p-6 rounded-xl border-2 ${colorClasses[card.color as keyof typeof colorClasses]}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-3xl font-bold">{card.value.toLocaleString()}</span>
            </div>
            <p className="text-sm font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
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

        {/* Ask MO Usage Trend */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask MO Usage</h3>
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
                stroke="#ec4899"
                fill="#f9a8d4"
                strokeWidth={2}
                name="User Activity"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
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
              dataKey="users"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 4 }}
              name="Growth Trend"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}