// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeService } from '@/lib/realtimeService';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    dailyActiveUsers,
    monthlyActiveUsers,
    supportStats,
    subscribeToSupportStats,
    subscribeToDailyActiveUsers,
    subscribeToMonthlyActiveUsers
  } = useRealtimeService();
  
  const [dailyUsers, setDailyUsers] = useState(0);
  const [monthlyUsers, setMonthlyUsers] = useState(0);
  const [supportData, setSupportData] = useState({
    openConversations: 0,
    pendingMessages: 0,
    averageResponseTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to support statistics
  useEffect(() => {
    const unsubscribe = subscribeToSupportStats((stats) => {
      setSupportData(stats);
      setIsLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, [subscribeToSupportStats]);

  // Subscribe to daily active users
  useEffect(() => {
    const unsubscribe = subscribeToDailyActiveUsers((count) => {
      setDailyUsers(count);
    });
    
    return () => {
      unsubscribe();
    };
  }, [subscribeToDailyActiveUsers]);

  // Subscribe to monthly active users
  useEffect(() => {
    const unsubscribe = subscribeToMonthlyActiveUsers((count) => {
      setMonthlyUsers(count);
    });
    
    return () => {
      unsubscribe();
    };
  }, [subscribeToMonthlyActiveUsers]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Dashboard stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Daily Active Users</h2>
            <div className="text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m6 8l-3-3m0 0l-3 3m3-3v6m-3-3h6" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{dailyUsers}</div>
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <span className="mr-1">↑ {Math.floor(Math.random() * 15) + 5}%</span>
            <span>from yesterday</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Monthly Active Users</h2>
            <div className="text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-7 2h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-10a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{monthlyUsers}</div>
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <span className="mr-1">↑ {Math.floor(Math.random() * 10) + 2}%</span>
            <span>from last month</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Total Revenue</h2>
            <div className="text-purple-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9h0a9 9 0 01-9-9a9 9 0 019-9h0a9 9 0 019 9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M7 14v6m3-3h-6M3 10h18a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{formatCurrency(856432.55)}</div>
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <span className="mr-1">↑ {Math.floor(Math.random() * 15) + 5}%</span>
            <span>from last month</span>
          </div>
        </div>
      </div>
      
      {/* Additional stats and charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">User Growth</h2>
          <div className="h-64 flex items-end justify-around">
            <div className="flex flex-col justify-between h-full">
              <div 
                className="bg-blue-500 w-12" 
                style={{ height: `${(dailyUsers / monthlyUsers) * 100}%` }}
              ></div>
              <div className="text-sm text-center">Mon</div>
            </div>
            <div className="flex flex-col justify-between h-full">
              <div 
                className="bg-blue-500 w-12" 
                style={{ height: `${(dailyUsers / monthlyUsers) * 100 + 10}%` }}
              ></div>
              <div className="text-sm text-center">Tue</div>
            </div>
            <div className="flex flex-col justify-between h-full">
              <div 
                className="bg-blue-500 w-12" 
                style={{ height: `${(dailyUsers / monthlyUsers) * 100 - 5}%` }}
              ></div>
              <div className="text-sm text-center">Wed</div>
            </div>
            <div className="flex flex-col justify-between h-full">
              <div 
                className="bg-blue-500 w-12" 
                style={{ height: `${(dailyUsers / monthlyUsers) * 100 + 5}%` }}
              ></div>
              <div className="text-sm text-center">Thu</div>
            </div>
            <div className="flex flex-col justify-between h-full">
              <div 
                className="bg-blue-500 w-12" 
                style={{ height: `${(dailyUsers / monthlyUsers) * 100 - 10}%` }}
              ></div>
              <div className="text-sm text-center">Fri</div>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <div>
              <div className="font-medium">Daily Active Users</div>
              <div className="mt-1">{dailyUsers}</div>
            </div>
            <div>
              <div className="font-medium">Monthly Active Users</div>
              <div className="mt-1">{monthlyUsers}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Support Statistics</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="font-medium">Open Conversations</div>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{supportData.openConversations}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="font-medium">Pending Messages</div>
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">{supportData.pendingMessages}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="font-medium">Avg. Response Time</div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">{supportData.averageResponseTime} min</div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t">
            <div className="font-medium">New Customers (Last 7 days)</div>
            <div className="mt-2 text-sm text-gray-500">Coming soon...</div>
          </div>
        </div>
      </div>
      
      {/* Recent activity */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 014-4h0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-10a2 2 0 012-2h14a2 2 0 012 2v4a4 4 0 01-4 4v4" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Alice Johnson</div>
                <div className="text-sm text-gray-500">Order #12345</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-3">Processing</div>
              <div className="font-medium">{formatCurrency(129.99)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 014-4h0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-10a2 2 0 012-2h14a2 2 0 012 2v4a4 4 0 01-4 4v4" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Bob Smith</div>
                <div className="text-sm text-gray-500">Order #12344</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-3">Completed</div>
              <div className="font-medium">{formatCurrency(89.99)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 014-4h0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-10a2 2 0 012-2h14a2 2 0 012 2v4a4 4 0 01-4 4v4" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Charlie Davis</div>
                <div className="text-sm text-gray-500">Order #12343</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-3">Processing</div>
              <div className="font-medium">{formatCurrency(59.99)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 014-4h0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-10a2 2 0 012-2h14a2 2 0 012 2v4a4 4 0 01-4 4v4" />
                </svg>
              </div>
              <div>
                <div className="font-medium">David Wilson</div>
                <div className="text-sm text-gray-500">Order #12342</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-3">Completed</div>
              <div className="font-medium">{formatCurrency(149.99)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}