// components/ChatwootWidget.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRealtimeService } from '@/lib/realtimeService';

interface Message {
  id: number;
  sender: 'user' | 'admin';
  content: string;
  timestamp: string;
  customerId: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

export function ChatwootWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [isIdentified, setIsIdentified] = useState(false);
  
  const { messages, sendMessage, subscribeToMessages } = useRealtimeService();

  // Initialize customer ID when component mounts
  useEffect(() => {
    // Check if customer is already identified (e.g., from localStorage)
    const identifiedCustomer = localStorage.getItem('chatCustomer');
    
    if (identifiedCustomer) {
      const customer = JSON.parse(identifiedCustomer);
      setCustomerId(customer.id);
      setCustomerName(customer.name);
      setCustomerEmail(customer.email);
      setIsIdentified(true);
    }
  }, []);

  // Subscribe to messages when chat is opened
  useEffect(() => {
    if (isOpen && customerId) {
      subscribeToMessages(customerId, (updatedMessages) => {
        // This will trigger a re-render with updated messages
      });
    }
  }, [isOpen, customerId, subscribeToMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    // If customer is not identified, identify them first
    if (!isIdentified && customerName.trim() && customerEmail.trim()) {
      // Generate customer ID
      const newCustomerId = `user_${Date.now()}`;
      setCustomerId(newCustomerId);
      setIsIdentified(true);
      
      // Save customer info to localStorage
      localStorage.setItem('chatCustomer', JSON.stringify({
        id: newCustomerId,
        name: customerName,
        email: customerEmail
      }));
      
      // Send welcome message
      await sendMessage(`Customer ${customerName} has started a chat. Email: ${customerEmail}`, newCustomerId);
    } 
    
    // Send message if we have a customer ID
    if (customerId && newMessage.trim()) {
      await sendMessage(newMessage, customerId);
      setNewMessage('');
    }
  };

  if (!customerId) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold">Support Chat</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`mb-2 ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block p-2 rounded-lg max-w-xs ${
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

          <div className="p-2 border-t">
            {!isIdentified ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none"
                  placeholder="Your name"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none"
                  placeholder="Your email"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                  disabled={!customerName.trim() || !customerEmail.trim()}
                >
                  Start Chat
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600"
        >
          💬
        </button>
      )}
    </div>
  );
}