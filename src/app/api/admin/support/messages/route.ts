// src/app/api/admin/support/messages/route.ts
import { NextRequest } from 'next/server';

// POST endpoint for admin to send a message to a customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, customerId } = body;
    
    // Validate required fields
    if (!message || !customerId) {
      return Response.json(
        { error: 'Message and customerId are required' }, 
        { status: 400 }
      );
    }
    
    // In a real application, this would save to the database
    // and notify the customer via email or push notification
    console.log('Admin sending message:', {
      message,
      customerId
    });
    
    // Mock response - in real app this would return the saved message
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: 'admin',
      content: message,
      timestamp: new Date().toISOString(),
      customerId,
      readByCustomer: false
    };
    
    // In a real implementation, we would:
    // 1. Save the message to the database
    // 2. Update the customer's last message timestamp
    // 3. Notify the customer about the new message
    // 4. Update the conversation status to 'open' if it was 'closed'
    
    return Response.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ 
      error: 'Failed to send message'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve all messages for a specific customer
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    
    // In a real application, this would fetch from a database
    // Mock data for demonstration
    const mockMessages = [
      { 
        id: 'msg_1', 
        sender: 'user', 
        content: 'Hello, I need help with my account.', 
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        customerId: 'user_123',
        readByAdmin: false,
        readByCustomer: true
      },
      { 
        id: 'msg_2', 
        sender: 'admin', 
        content: 'Sure, I can help you with that. What seems to be the issue?', 
        timestamp: new Date(Date.now() - 3500000).toISOString(), // 58 mins ago
        customerId: 'user_123',
        readByAdmin: true,
        readByCustomer: false
      },
      { 
        id: 'msg_3', 
        sender: 'user', 
        content: 'I cannot seem to add new products to my inventory.', 
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
        customerId: 'user_123',
        readByAdmin: false,
        readByCustomer: true
      }
    ];
    
    // Filter messages by customer ID if provided
    let filteredMessages = mockMessages;
    if (customerId) {
      filteredMessages = filteredMessages.filter(msg => msg.customerId === customerId);
    }
    
    return Response.json(filteredMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return Response.json({ 
      error: 'Failed to fetch messages'
    }, { status: 500 });
  }
}