// src/app/api/admin/support/messages/[id]/route.ts
import { NextRequest } from 'next/server';

// PUT endpoint for admin to respond to a support message or update its status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id;
    const body = await request.json();
    const { response, status, adminId } = body;
    
    // In a real application, this would update the database record
    // and potentially notify the customer via email or push notification
    console.log(`Admin responding to message ${messageId}:`, {
      response,
      status,
      adminId
    });
    
    // Mock response - in real app this would return the updated conversation thread
    const updatedMessage = {
      id: messageId,
      response: response || null,
      status: status || 'open',
      adminId: adminId || 'admin_default',
      respondedAt: new Date().toISOString()
    };
    
    // In a real implementation, we would:
    // 1. Add the admin response as a new message in the conversation
    // 2. Update the conversation status
    // 3. Notify the customer about the response
    // 4. Mark the conversation as read by admin
    
    return Response.json(updatedMessage);
  } catch (error) {
    console.error('Error responding to support message:', error);
    return Response.json({ 
      error: 'Failed to respond to message'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve a specific conversation with full history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    // In a real application, this would fetch from a database
    // Mock data for demonstration
    const mockConversation = {
      id: conversationId,
      customerId: 'user_123',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      status: 'open',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_1',
          sender: 'user',
          content: 'Hello, I need help with my account.',
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          readByAdmin: false
        },
        {
          id: 'msg_2',
          sender: 'admin',
          content: 'Sure, I can help you with that. What seems to be the issue?',
          timestamp: new Date(Date.now() - 7100000).toISOString(), // 1 hr 58 mins ago
          readByAdmin: true
        },
        {
          id: 'msg_3',
          sender: 'user',
          content: 'I cannot seem to add new products to my inventory.',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          readByAdmin: false
        }
      ]
    };

    return Response.json(mockConversation);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return Response.json({ 
      error: 'Failed to fetch conversation'
    }, { status: 500 });
  }
}