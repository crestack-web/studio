// src/app/api/admin/support/new-customers/route.ts
import { NextRequest } from 'next/server';

// GET endpoint to retrieve new customer notifications
export async function GET(request: NextRequest) {
  try {
    // In a real application, this would check for new customers with pending support
    // requests or unread messages
    
    // Mock data for demonstration
    const mockNewCustomers = {
      count: Math.floor(Math.random() * 5), // Random count between 0 and 4
      customers: [],
      timestamp: new Date().toISOString()
    };
    
    // If there are new customers, include some sample data
    if (mockNewCustomers.count > 0) {
      mockNewCustomers.customers = Array.from({ length: mockNewCustomers.count }).map((_, index) => ({
        id: `user_${Date.now() - index}`,
        name: `Customer ${index + 1}`,
        email: `customer${index + 1}@example.com`,
        status: 'Online',
        lastActive: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        message: 'Hello, I need assistance with my account.',
        messageTimestamp: new Date(Date.now() - 90000).toISOString() // 1.5 minutes ago
      }));
    }
    
    return Response.json(mockNewCustomers);
  } catch (error) {
    console.error('Error fetching new customers:', error);
    return Response.json({ 
      error: 'Failed to fetch new customers'
    }, { status: 500 });
  }
}