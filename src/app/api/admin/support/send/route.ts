// src/app/api/admin/support/send/route.ts
import { NextRequest } from 'next/server';

// POST endpoint to send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, customerId, sender = 'user' } = body;
    
    // In a real application, this would save to a database
    console.log(`Message received for customer ${customerId} (${sender}): ${message}`);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}