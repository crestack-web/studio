nd // src/app/api/admin/support/send/route.ts
import { NextRequest } from 'next/server';

// POST endpoint to send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, customerId, sender = 'user' } = body;
    
    // In a real application, this would save to a database
    console.log(`Message received for customer ${customerId} (${sender}): ${message}`);
    
    // Return success response
    return Response.json({ 
      success: true, 
      message: 'Message received successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ 
      success: false, 
      message: 'Failed to send message'
    }, { status: 500 });
  }
}