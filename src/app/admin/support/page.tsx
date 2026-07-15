// src/app/admin/support/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChatwootWidget } from '@/components/ChatwootWidget';
import { useRealtimeService } from '@/lib/realtimeService';

export default function AdminSupportPage() {
  const router = useRouter();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const { 
    messages, 
    customers, 
    newCustomerCount,
    sendMessage, 
    subscribeToMessages,
    subscribeToCustomers,
    subscribeToNewCustomers
  } = useRealtimeService();

  // Check authentication when component mounts
  useEffect(() => {
    // In a real application, this would check the actual authentication status
    const isAuthenticated = checkAuthentication();
    
    if (!isAuthenticated) {
      // Redirect to login page
      router.push('/admin/login');
    }
  }, [router]);

  // Subscribe to messages and customers when component mounts
  useEffect(() => {
    // Subscribe to customer list updates
    const customerUnsubscribe = subscribeToCustomers((updatedCustomers) => {
      if (updatedCustomers.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(updatedCustomers[0].id);
      }
    });
    
    // Subscribe to new customer notifications
    const newCustomerUnsubscribe = subscribeToNewCustomers((newCount) => {
      if (newCount > 0) {
        setShowNotification(true);
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
    });
    
    // Subscribe to messages for the selected customer
    let messageUnsubscribe = () => {};
    
    if (selectedCustomerId) {
      messageUnsubscribe = subscribeToMessages(selectedCustomerId, (updatedMessages) => {
        // This will trigger a re-render with updated messages
      });
    }
    
    return () => {
      customerUnsubscribe();
      messageUnsubscribe();
      newCustomerUnsubscribe();
    };
  }, [selectedCustomerId, subscribeToMessages, subscribeToCustomers, subscribeToNewCustomers]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedCustomerId) return;
    
    await sendMessage(newMessage, selectedCustomerId);
    setNewMessage('');
  };

  // Mock authentication check
  const checkAuthentication = () => {
    // In a real application, this would check the actual authentication status
    // For example, by checking a token or session
    return true; // For demo purposes
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar with customers list */}
      <div className="w-1/4 bg-gray-100 p-4">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          Customers
          {newCustomerCount > 0 && (
            <span className="ml-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {newCustomerCount}
            </span>
          )}
        </h2>
        
        {showNotification && (
          <div className="bg-blue-500 text-white p-2 rounded mb-4">
            New customer(s) waiting for support!
          </div>
        )}
        
        <div className="space-y-2">
          {customers.map((customer) => (
            <div 
              key={customer.id}
              className={`p-2 bg-white rounded shadow cursor-pointer ${
                selectedCustomerId === customer.id ? 'border-2 border-blue-500' : ''
              }`}
              onClick={() => setSelectedCustomerId(customer.id)}
            >
              <div className="font-medium">{customer.name}</div>
              <div className={`text-sm ${customer.status === 'Online' ? 'text-green-500' : 'text-gray-500'}`}>
                {customer.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        {selectedCustomerId ? (
          <>
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Chat with {customers.find(c => c.id === selectedCustomerId)?.name}</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {messages
                .filter(msg => msg.customerId === selectedCustomerId)
                .map((msg, index) => (
                  <div 
                    key={index} 
                    className={`mb-4 ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}
                  >
                    <div 
                      className={`inline-block p-2 rounded-lg ${
                        msg.sender === 'admin' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
            </div>

            <div className="p-4 border-t">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-2 border rounded-l focus:outline-none"
                  placeholder="Type your message..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Select a customer to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}