'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from 'firebase/firestore';

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
  freePlanUsers: number;
  trialUsers: number;
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
    freePlanUsers: 0,
    trialUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [firestore]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Get total users
      const usersSnapshot = await getCountFromServer(collection(firestore, 'users'));
      const totalUsers = usersSnapshot.data().count;

      // Get total businesses
      const businessesSnapshot = await getCountFromServer(collection(firestore, 'businesses'));
      const totalBusinesses = businessesSnapshot.data().count;

      // Get active businesses (7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const active7DaysQuery = query(
        collection(firestore, 'businesses'),
        where('lastActive', '>=', sevenDaysAgo)
      );
      const active7DaysSnapshot = await getCountFromServer(active7DaysQuery);

      // Get active businesses (30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const active30DaysQuery = query(
        collection(firestore, 'businesses'),
        where('lastActive', '>=', thirtyDaysAgo)
      );
      const active30DaysSnapshot = await getCountFromServer(active30DaysQuery);

      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersTodayQuery = query(
        collection(firestore, 'users'),
        where('createdAt', '>=', today)
      );
      const newUsersTodaySnapshot = await getCountFromServer(newUsersTodayQuery);

      // Get new users this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newUsersWeekQuery = query(
        collection(firestore, 'users'),
        where('createdAt', '>=', weekAgo)
      );
      const newUsersWeekSnapshot = await getCountFromServer(newUsersWeekQuery);

      // Get new businesses this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const newBusinessesMonthQuery = query(
        collection(firestore, 'businesses'),
        where('createdAt', '>=', monthStart)
      );
      const newBusinessesMonthSnapshot = await getCountFromServer(newBusinessesMonthQuery);

      // Get total inventory items
      const inventorySnapshot = await getCountFromServer(collection(firestore, 'products'));
      const totalInventory = inventorySnapshot.data().count;

      // Get Ask MO conversations (placeholder - adjust collection name as needed)
      const askMOSnapshot = await getCountFromServer(collection(firestore, 'askMoConversations'));
      const totalAskMOConversations = askMOSnapshot.data().count;

      // Get subscription counts (placeholder - adjust based on your subscription structure)
      const paidQuery = query(collection(firestore, 'businesses'), where('plan', '==', 'paid'));
      const paidSnapshot = await getCountFromServer(paidQuery);

      const freeQuery = query(collection(firestore, 'businesses'), where('plan', '==', 'free'));
      const freeSnapshot = await getCountFromServer(freeQuery);

      const trialQuery = query(collection(firestore, 'businesses'), where('plan', '==', 'trial'));
      const trialSnapshot = await getCountFromServer(trialQuery);

      setMetrics({
        totalUsers,
        totalBusinesses,
        activeBusinesses7Days: active7DaysSnapshot.data().count,
        activeBusinesses30Days: active30DaysSnapshot.data().count,
        newUsersToday: newUsersTodaySnapshot.data().count,
        newUsersThisWeek: newUsersWeekSnapshot.data().count,
        newBusinessesThisMonth: newBusinessesMonthSnapshot.data().count,
        totalSales: 0, // Will need to aggregate from sales records
        totalInventory,
        totalAskMOConversations,
        paidSubscribers: paidSnapshot.data().count,
        freePlanUsers: freeSnapshot.data().count,
        trialUsers: trialSnapshot.data().count,
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
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
    { label: 'Free Plan Users', value: metrics.freePlanUsers, icon: '🆓', color: 'gray' },
    { label: 'Trial Users', value: metrics.trialUsers, icon: '⏳', color: 'yellow' },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
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
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Chart placeholder - User growth over time</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Active Users</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Chart placeholder - Daily active users</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Creation Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Chart placeholder - Business creation over time</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ask MO Usage Trend</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Chart placeholder - Ask MO usage over time</p>
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>Chart placeholder - Revenue over time</p>
        </div>
      </div>
    </div>
  );
}
