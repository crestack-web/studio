// src/app/api/support-chat/route.ts
// New API route for SupportChatWidget to handle sending messages
'use client';

import { NextRequest } from 'next/server';

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