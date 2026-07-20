// src/app/customer/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ChatSession {
  id: string;
  customerName: string;
  lastMessage: string;
  lastUpdated: string;
  unreadCount: number;
}

export default function CustomerDashboard() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock customer data - in a real app this would come from authentication
  const customer = {
    id: 'user_123',
    name: 'John Doe',
    email: 'john@example.com'
  };

  // Fetch chat history
  useEffect(() => {
    // In a real app, this would fetch from an API
    setTimeout(() => {
      setChatSessions([
        {
          id: 'session_1',
          customerName: 'John Doe',
          lastMessage: 'We can help you with that issue.',
          lastUpdated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          unreadCount: 1
        },
        {
          id: 'session_2',
          customerName: 'John Doe',
          lastMessage: 'Thank you for your feedback!',
          lastUpdated: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          unreadCount: 0
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Customer Support</h1>
        <div className="text-right">
          <p className="text-gray-600">Welcome, {customer.name}</p>
          <p className="text-sm text-gray-500">{customer.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chat sessions list */}
        <div className="md:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Chat History</h2>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
              {chatSessions.length} sessions
            </span>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">
                Loading chat history...
              </div>
            ) : chatSessions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No chat sessions found
              </div>
            ) : (
              <ul>
                {chatSessions.map((session) => (
                  <li key={session.id} className="border-b last:border-b-0">
                    <Link 
                      href={`/customer/chat/${session.id}`}
                      className="block p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-medium">Support Chat</div>
                        {session.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                            {session.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {session.lastMessage}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(session.lastUpdated)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="mt-4">
            <Link 
              href="/customer/chat/new"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
            >
              Start New Chat
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-medium mb-2">Contact Support</h3>
                <p className="text-sm text-gray-600 mb-4">Get help with your account or products</p>
                <Link 
                  href="/customer/chat/new"
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Start Chat →
                </Link>
              </div>
              
              <div className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-medium mb-2">View FAQ</h3>
                <p className="text-sm text-gray-600 mb-4">Find answers to common questions</p>
                <Link 
                  href="/faq"
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  View FAQ →
                </Link>
              </div>
              
              <div className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-medium mb-2">Account Settings</h3>
                <p className="text-sm text-gray-600 mb-4">Manage your account information</p>
                <Link 
                  href="/customer/account"
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Manage Account →
                </Link>
              </div>
              
              <div className="border rounded-lg p-4 hover:shadow-md transition">
                <h3 className="font-medium mb-2">Order Support</h3>
                <p className="text-sm text-gray-600 mb-4">Get help with your orders</p>
                <Link 
                  href="/customer/orders"
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  View Orders →
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    💬
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    <span className="font-medium text-gray-900">New chat message</span>
                    <span className="text-gray-600"> from support team</span>
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    ✓
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm">
                    <span className="font-medium text-gray-900">Ticket resolved</span>
                    <span className="text-gray-600"> #12345</span>
                  </p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
