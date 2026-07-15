// src/app/api/admin/support/messages/route.ts
// Update messages route to properly handle SupportChatWidget functionality
import { NextRequest } from 'next/server';
import { SupportChatWidget } from '@/components/SupportChatWidget';

export async function POST(request: NextRequest) {
  // Extract data from request
  const { message, customerId, sender, userEmail, businessId, category } = await request.json();
  
  // In a real implementation, this would save the message to our database
  // and return an appropriate response
  return new Response(JSON.stringify({ 
    status: 'success',
    message: 'Message received by support',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

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

export async function PUT(request: NextRequest) {
  return new Response('Support chat widget messages route updated');
}
