// src/components/SupportChatWidget.tsx
// Update SupportChatWidget to use the new API route for sending messages
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Message = {
  id: string;
  sender: 'user' | 'admin';
  content: string;
  timestamp: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  status: 'Online' | 'Offline';
};

export default function SupportChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Generate a unique guest ID for the customer
  useEffect(() => {
    // Check if we already have a guest ID in localStorage
    const guestId = localStorage.getItem('guestId') || `guest_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guestId', guestId);
    
    // Set up guest customer info
    setCustomer({
      id: guestId,
      name: 'Guest User',
      email: 'guest@example.com',
      status: 'Offline'
    });
    
    // Simulate connection to admin support
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      // In a real implementation, this would fetch recent messages from our API
      // For demo, using mock data
      setMessages([
        {
          id: 'msg_1',
          sender: 'admin',
          content: 'Welcome to Busmo Support! How can we assist you today?',
          timestamp: new Date().toISOString()
        }
      ]);
    }, 1500);
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Save message to our API
  const saveMessageToFirestore = async (text: string, sender: 'user' | 'support', parentMessageId?: string) => {
    try {
      // Using our new support-chat API route that connects to the admin support system
      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          customerId: userId || userEmail,
          sender,
          userEmail,
          businessId,
          category: 'general',
          status: 'open'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save message');
      }
      
      const savedMessage = await response.json();
      console.log('Message saved successfully:', savedMessage);
      
      if (sender === 'user') {
        setCurrentConversationId(savedMessage.id);
      }
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };
  
  // Handle new message submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !customer) return;
    
    // Add user message to chat
    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sender: 'user' as const,
      content: newMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    
    // In a real implementation, this would send the message to our API
    // and wait for a response from an admin
    // For demo, simulate admin response after 1 second
    setTimeout(() => {
      const responses = [
        'Thank you for your message. We will respond shortly.',
        'Our support team has received your message and will get back to you soon.',
        'We appreciate your inquiry. One of our support agents will assist you shortly.',
        'Your message has been sent to our support team. We will respond as soon as possible.',
        'We are currently connecting you to our support team...'
      ];
      
      const adminMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: 'admin' as const,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, adminMessage]);
      setUnreadCount(prev => prev + 1);
    }, 1000);
  };
  
  // Toggle chat window
  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      // In a real app, mark messages as read when chat is opened
    }
  };
  
  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-4 right-4 bg-primary-color text-white p-4 rounded-full shadow-lg hover:bg-primary-color-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary-color focus:ring-offset-2 z-50"
          aria-label="Open support chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
      
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col border border-gray-200 z-50">
        
        {/* Chat header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center">
            <div className="bg-primary-color p-2 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Support Chat</h3>
              <p className="text-xs text-gray-500">Connected to Busmo Support</p>
            </div>
          </div>
          <button 
            onClick={toggleChat}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l6 6 6 6" />
            </svg>
          </button>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`mb-4 ${message.sender === 'admin' ? 'text-left' : 'text-right'}`}
              >
                <div 
                  className={`inline-block p-3 rounded-lg ${
                    message.sender === 'admin' 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-primary-color text-white'
                  }`}
                >
                  {message.content}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            {isConnecting && (
              <div className="flex justify-center">
                <div className="bg-gray-100 p-2 rounded-full text-xs text-gray-600">
                  Connecting to support...
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Message input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-primary-color"
              placeholder="Type your message..."
              disabled={isConnecting}
            />
            <button
              type="submit"
              disabled={isConnecting || !newMessage.trim()}
              className={`bg-primary-color text-white px-4 py-2 rounded-r hover:bg-primary-color-dark transition-colors ${
                (isConnecting || !newMessage.trim()) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </form>
        </div>
      </div>
      )}
    </>
  );
}