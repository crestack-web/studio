// src/app/api/admin/dashboard/route.ts
import { NextRequest } from 'next/server';

// Mock database - in a real application this would be a database query
const mockDatabase = {
  dailyActiveUsers: 78,
  monthlyActiveUsers: 1892,
  totalRevenue: 856432.55,
  supportStats: {
    openConversations: 15,
    pendingMessages: 32,
    averageResponseTime: 22 // in minutes
  }
};

// Mock recent orders
const mockRecentOrders = Array(5).fill(0).map((_, i) => ({
  id: `order_${i + 1}`,
  customer: `Customer ${i + 1}`,
  amount: (Math.floor(Math.random() * 100) + 50).toFixed(2),
  status: i === 0 ? 'Processing' : 'Completed',
  date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0] // Today minus i days
}));

// Mock new customers
const mockNewCustomers = Array(5).fill(0).map((_, i) => ({
  id: `user_${i + 1}`,
  name: `Customer ${i + 1}`,
  email: `customer${i + 1}@example.com`,
  date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0] // Today minus i days
}));

export async function GET(request: NextRequest) {
  try {
    // In a real application, this would query the database for current metrics
    // For demonstration, we'll return mock data with slight variations
    
    // Calculate dynamic values
    const dailyActiveUsers = mockDatabase.dailyActiveUsers + Math.floor(Math.random() * 5);
    const monthlyActiveUsers = mockDatabase.monthlyActiveUsers + Math.floor(Math.random() * 20);
    const totalRevenue = parseFloat(mockDatabase.totalRevenue.toFixed(2));
    
    // Return dashboard data
    return Response.json({
      dailyActiveUsers,
      monthlyActiveUsers,
      totalRevenue,
      totalUsers: 28500 + Math.floor(Math.random() * 50),
      totalOrders: 2450 + Math.floor(Math.random() * 20),
      newCustomers: mockNewCustomers,
      recentOrders: mockRecentOrders,
      supportStats: {
        openConversations: mockDatabase.supportStats.openConversations + Math.floor(Math.random() * 3) - 1,
        pendingMessages: mockDatabase.supportStats.pendingMessages + Math.floor(Math.random() * 5) - 2,
        averageResponseTime: mockDatabase.supportStats.averageResponseTime + Math.floor(Math.random() * 3) - 1
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return Response.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}