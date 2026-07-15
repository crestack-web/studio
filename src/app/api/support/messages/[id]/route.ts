// src/app/api/support/messages/[id]/route.ts
import { NextRequest } from 'next/server';

// GET endpoint to retrieve a specific support message
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    
    // In a real application, this would fetch from a database
    // Mock data for demonstration
    const mockMessage = {
      id: messageId,
      sender: 'user',
      content: 'Sample message content',
      timestamp: new Date().toISOString(),
      customerId: 'user_123',
      status: 'open',
      userEmail: 'customer@example.com',
      businessId: 'business_456',
      category: 'general'
    };

    return Response.json(mockMessage);
  } catch (error) {
    console.error('Error fetching support message:', error);
    return Response.json({ 
      error: 'Failed to fetch message'
    }, { status: 500 });
  }
}

// PUT endpoint to update a support message (e.g., change status, add admin response)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const body = await request.json();
    const { status, adminResponse, responseSender } = body;
    
    // In a real application, this would update the database record
    console.log(`Updating message ${messageId}:`, {
      status,
      adminResponse,
      responseSender
    });
    
    // Mock response - in real app this would return the updated message
    const updatedMessage = {
      id: messageId,
      status: status || 'open',
      adminResponse: adminResponse || null,
      responseSender: responseSender || 'admin',
      updatedAt: new Date().toISOString()
    };
    
    return Response.json(updatedMessage);
  } catch (error) {
    console.error('Error updating support message:', error);
    return Response.json({ 
      error: 'Failed to update message'
    }, { status: 500 });
  }
}

// DELETE endpoint to remove a support message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    
    // In a real application, this would delete from the database
    console.log(`Deleting message ${messageId}`);
    
    return Response.json({ 
      success: true, 
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting support message:', error);
    return Response.json({ 
      error: 'Failed to delete message'
    }, { status: 500 });
  }
}