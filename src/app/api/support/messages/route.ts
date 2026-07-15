// src/app/api/support/messages/route.ts
import { NextRequest } from 'next/server';

// GET endpoint to retrieve support messages for admin interface
export async function GET(request: NextRequest) {
  try {
    // In a real application, this would fetch from a database like Firestore
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    
    // Mock data for demonstration - in real app this would come from DB
    const mockMessages = [
      { 
        id: 'msg_1', 
        sender: 'user', 
        content: 'Hello, I need help with my account.', 
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        customerId: 'user_123',
        status: 'open',
        userEmail: 'customer@example.com',
        businessId: 'business_456',
        category: 'account'
      },
      { 
        id: 'msg_2', 
        sender: 'admin', 
        content: 'Sure, I can help you with that. What seems to be the issue?', 
        timestamp: new Date(Date.now() - 3500000).toISOString(), // 58 mins ago
        customerId: 'user_123',
        status: 'open',
        userEmail: 'admin@busmo.com',
        businessId: 'business_456',
        category: 'account'
      },
      { 
        id: 'msg_3', 
        sender: 'user', 
        content: 'I cannot seem to add new products to my inventory.', 
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
        customerId: 'user_123',
        status: 'open',
        userEmail: 'customer@example.com',
        businessId: 'business_456',
        category: 'product'
      }
    ];
    
    // Filter messages by customer ID if provided
    let filteredMessages = mockMessages;
    if (customerId) {
      filteredMessages = filteredMessages.filter(msg => msg.customerId === customerId);
    }
    
    if (status) {
      filteredMessages = filteredMessages.filter(msg => msg.status === status);
    }

    return Response.json(filteredMessages);
  } catch (error) {
    console.error('Error fetching support messages:', error);
    return Response.json({ 
      error: 'Failed to fetch messages'
    }, { status: 500 });
  }
}

// POST endpoint to send a new support message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      customerId, 
      sender = 'user', 
      userEmail, 
      businessId, 
      category = 'general',
      status = 'open'
    } = body;
    
    // Validate required fields
    if (!message || !customerId) {
      return Response.json(
        { error: 'Message and customerId are required' }, 
        { status: 400 }
      );
    }
    
    // In a real application, this would save to a database like Firestore
    console.log('Saving support message:', {
      message,
      customerId,
      sender,
      userEmail,
      businessId,
      category,
      status,
      timestamp: new Date().toISOString()
    });
    
    // Mock response - in real app this would return the saved message
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender,
      content: message,
      timestamp: new Date().toISOString(),
      customerId,
      status,
      userEmail,
      businessId,
      category
    };
    
    // In a real app, we would broadcast this new message to all connected clients
    // This could be done using WebSockets, Server-Sent Events, or Firestore listeners
    
    return Response.json(newMessage);
  } catch (error) {
    console.error('Error saving support message:', error);
    return Response.json({ 
      error: 'Failed to save message'
    }, { status: 500 });
  }
}