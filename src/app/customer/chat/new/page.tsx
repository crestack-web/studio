// src/app/customer/chat/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCustomerChatPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Mock customer data - in a real app this would come from authentication
  const customer = {
    id: 'user_123',
    name: 'John Doe',
    email: 'john@example.com'
  };

  const startChat = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // In a real application, this would create a new chat session
    setTimeout(() => {
      // Redirect to the new chat session
      router.push('/customer/chat/session_123'); // Replace with actual session ID
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Start New Chat</h1>
            <p className="text-gray-600 mt-1">Connect with our support team</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">Welcome, {customer.name}</p>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">How can we help you?</h2>
            <p className="text-gray-600">Describe your issue or question below and we'll connect you with the right support agent.</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject (Optional)
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Briefly describe your issue"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please describe your issue or question in detail..."
                required
              ></textarea>
            </div>
            
            <div className="pt-4">
              <button
                onClick={startChat}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                  isLoading 
                    ? 'bg-blue-300 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isLoading ? 'Starting Chat...' : 'Start Chat Now'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/customer"
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            ← Back to Chat History
          </Link>
        </div>
        
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium mb-3">Need immediate help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded border">
              <h4 className="font-medium mb-1">FAQ</h4>
              <p className="text-sm text-gray-600">Find answers to common questions</p>
              <Link href="/faq" className="text-blue-500 text-sm mt-2 inline-block">
                View FAQ →
              </Link>
            </div>
            <div className="p-4 bg-white rounded border">
              <h4 className="font-medium mb-1">Knowledge Base</h4>
              <p className="text-sm text-gray-600">Learn more about our services</p>
              <Link href="/knowledge-base" className="text-blue-500 text-sm mt-2 inline-block">
                Browse Articles →
              </Link>
            </div>
            <div className="p-4 bg-white rounded border">
              <h4 className="font-medium mb-1">Video Tutorials</h4>
              <p className="text-sm text-gray-600">Watch step-by-step guides</p>
              <Link href="/tutorials" className="text-blue-500 text-sm mt-2 inline-block">
                Watch Videos →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}