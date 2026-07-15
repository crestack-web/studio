// src/components/AdminDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Types
interface DashboardData {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  totalRevenue: number;
  totalUsers: number;
  totalOrders: number;
  newCustomers: Array<{
    id: string;
    name: string;
    email: string;
    date: string;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    amount: string;
    status: string;
    date: string;
  }>;
  supportStats: {
    openConversations: number;
    pendingMessages: number;
    averageResponseTime: number;
  };
}

interface SupportStatsProps {
  stats: {
    openConversations: number;
    pendingMessages: number;
    averageResponseTime: number;
  };
}

interface UserGrowthChartProps {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
}

interface RevenueChartProps {
  totalRevenue: number;
}

interface RecentActivityProps {
  orders: Array<{
    id: string;
    customer: string;
    amount: string;
    status: string;
    date: string;
  }>;
}

interface NewCustomersProps {
  customers: Array<{
    id: string;
    name: string;
    email: string;
    date: string;
  }>;
}

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Support statistics component
const SupportStats = ({ stats }: SupportStatsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="font-medium">Open Conversations</div>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{stats.openConversations}</div>
      </div>
      <div className="flex justify-between items-center">
        <div className="font-medium">Pending Messages</div>
        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">{stats.pendingMessages}</div>
      </div>
      <div className="flex justify-between items-center">
        <div className="font-medium">Avg. Response Time</div>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">{stats.averageResponseTime} min</div>
      </div>
    </div>
  );
};

// User growth chart component
const UserGrowthChart = ({ dailyActiveUsers, monthlyActiveUsers }: UserGrowthChartProps) => {
  // Generate random data for the week
  const weeklyData = Array(7).fill(0).map(() => Math.floor(Math.random() * (monthlyActiveUsers / 20)) + dailyActiveUsers);
  
  // Get day names for the chart
  const dayNames: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dayNames.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">User Growth</h2>
      <div className="h-64 flex items-end justify-around">
        {weeklyData.map((data, index) => (
          <div key={index} className="flex flex-col justify-between h-full">
            <div 
              className="bg-blue-500 w-12"
              style={{ height: `${(data / monthlyActiveUsers) * 100}%` }}
            ></div>
            <div className="text-sm text-center">{dayNames[index]}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between text-sm text-gray-500">
        <div>
          <div className="font-medium">Daily Active Users</div>
          <div className="mt-1">{dailyActiveUsers}</div>
        </div>
        <div>
          <div className="font-medium">Monthly Active Users</div>
          <div className="mt-1">{monthlyActiveUsers}</div>
        </div>
      </div>
    </div>
  );
};

// Revenue chart component
const RevenueChart = ({ totalRevenue }: RevenueChartProps) => {
  // Calculate revenue distribution
  const distribution = {
    sales: totalRevenue * 0.65,
    subscriptions: totalRevenue * 0.25,
    services: totalRevenue * 0.10
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
      <div className="h-64 flex items-end justify-around">
        <div className="flex flex-col justify-between h-full">
          <div 
            className="bg-blue-500 w-12"
            style={{ height: '65%' }}
          ></div>
          <div className="text-sm text-center">Sales</div>
          <div className="text-sm text-center font-medium">{formatCurrency(distribution.sales)}</div>
        </div>
        <div className="flex flex-col justify-between h-full">
          <div 
            className="bg-green-500 w-12"
            style={{ height: '25%' }}
          ></div>
          <div className="text-sm text-center">Subscriptions</div>
          <div className="text-sm text-center font-medium">{formatCurrency(distribution.subscriptions)}</div>
        </div>
        <div className="flex flex-col justify-between h-full">
          <div 
            className="bg-purple-500 w-12"
            style={{ height: '10%' }}
          ></div>
          <div className="text-sm text-center">Services</div>
          <div className="text-sm text-center font-medium">{formatCurrency(distribution.services)}</div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between font-medium">
          <div>Total Revenue</div>
          <div>{formatCurrency(totalRevenue)}</div>
        </div>
      </div>
    </div>
  );
};

// Recent activity component
const RecentActivity = ({ orders }: RecentActivityProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">{order.customer}</div>
                <div className="text-sm text-gray-500">{order.id}</div>
              </div>
            </div>
            <div className="flex items-center">
              <div className={`px-3 py-1 rounded-full text-sm mr-3 ${order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {order.status}
              </div>
              <div className="font-medium">{formatCurrency(parseFloat(order.amount))}</div>
            </div>
          </div>
        ))}
        
        {/* Empty state for no recent orders */}
        {orders.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
};

// New customers component
const NewCustomers = ({ customers }: NewCustomersProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">New Customers (Last 7 days)</h2>
      <div className="space-y-4">
        {customers.map(customer => (
          <div key={customer.id} className="flex justify-between items-center py-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 017.9 1.646v10.9c0 .828-.672 1.5-1.5 1.5H5.5a1.5 1.5 0 01-1.5-1.5v-10.9a4 4 0 017.9-1.646z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-gray-500">{customer.email}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">{customer.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Dashboard stats component
const DashboardStats = ({
  dailyActiveUsers,
  monthlyActiveUsers,
  totalRevenue
}: {
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  totalRevenue: number;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Daily Active Users</h2>
          <div className="text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4m6 8l-3-3m0 0l-3 3m3-3v6" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-800">{dailyActiveUsers}</div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-7 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-800">{monthlyActiveUsers}</div>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M7 14v6m3-3h6M3 10h18M5 6h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-800">{formatCurrency(totalRevenue)}</div>
        <div className="mt-2 text-sm text-gray-500 flex items-center">
          <span className="mr-1">↑ {Math.floor(Math.random() * 15) + 5}%</span>
          <span>from last month</span>
        </div>
      </div>
    </div>
  );
};

// Dashboard main component
export const AdminDashboard = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch dashboard data when component mounts
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real application, this would make an API call to /api/admin/dashboard
        // For demonstration, we'll use mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const mockData: DashboardData = {
          dailyActiveUsers: 78 + Math.floor(Math.random() * 5),
          monthlyActiveUsers: 1892 + Math.floor(Math.random() * 20),
          totalRevenue: 856432.55,
          totalUsers: 28500 + Math.floor(Math.random() * 50),
          totalOrders: 2450 + Math.floor(Math.random() * 20),
          newCustomers: Array(5).fill(0).map((_, i) => ({
            id: `user_${i + 1}`,
            name: `Customer ${i + 1}`,
            email: `customer${i + 1}@example.com`,
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0] // Today minus i days
          })),
          recentOrders: Array(5).fill(0).map((_, i) => ({
            id: `order_${i + 1}`,
            customer: `Customer ${i + 1}`,
            amount: (Math.floor(Math.random() * 100) + 50).toFixed(2),
            status: i === 0 ? 'Processing' : 'Completed',
            date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0] // Today minus i days
          })),
          supportStats: {
            openConversations: 15 + Math.floor(Math.random() * 3) - 1,
            pendingMessages: 32 + Math.floor(Math.random() * 5) - 2,
            averageResponseTime: 22 + Math.floor(Math.random() * 3) - 1
          }
        };
        
        setDashboardData(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
        // In a real app, show error to user
      }
    };
    
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!dashboardData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center py-8 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2">Failed to load dashboard data</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Dashboard stats */}
      <DashboardStats 
        dailyActiveUsers={dashboardData.dailyActiveUsers}
        monthlyActiveUsers={dashboardData.monthlyActiveUsers}
        totalRevenue={dashboardData.totalRevenue}
      />
      
      {/* Additional stats and charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <UserGrowthChart 
          dailyActiveUsers={dashboardData.dailyActiveUsers}
          monthlyActiveUsers={dashboardData.monthlyActiveUsers}
        />
        <RevenueChart totalRevenue={dashboardData.totalRevenue} />
      </div>
      
      {/* New customers and support stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <NewCustomers customers={dashboardData.newCustomers} />
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Support Statistics</h2>
          <SupportStats stats={dashboardData.supportStats} />
        </div>
      </div>
      
      {/* Recent activity */}
      <RecentActivity orders={dashboardData.recentOrders} />
    </div>
  );
};