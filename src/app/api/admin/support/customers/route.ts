// src/app/api/admin/support/customers/route.ts
// Update imports to use SupportChatWidget instead of ChatwootWidget
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

export const GET = async () => {
  return Response.json([
  {
    id: 'cust_1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    status: 'Online',
    priority: 'high',
    lastMessage: 'Where is my order?',
    lastMessageTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'cust_2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    status: 'Offline',
    priority: 'low',
    // Fixed the string with apostrophe by using double quotes inside single quotes
    lastMessage: "I'm having trouble with the inventory tracking.",
    lastMessageTime: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
  }
]);
};
