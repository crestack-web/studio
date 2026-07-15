// src/app/admin/support/page.tsx
// Update imports to use SupportChatWidget instead of ChatwootWidget
'use client';

import { useState, useEffect } from 'react';
import { SupportChatWidget } from '@/components/SupportChatWidget';

export default function AdminSupportPage() {
  const router = useRouter();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    customers,
    newCustomerCount,
    sendMessage,
    subscribeToMessages,
    subscribeToCustomers,
    subscribeToNewCustomers,
    markNewCustomersAsSeen,
    getCustomer,
    markMessagesAsRead,
    updateMessageStatus,
    getUnreadMessageCount
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

  // Subscribe to customers and new customer notifications when component mounts
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
    
    return () => {
      customerUnsubscribe();
      newCustomerUnsubscribe();
    };
  }, [subscribeToCustomers, subscribeToNewCustomers, selectedCustomerId]);

  // Subscribe to messages for the selected customer
  useEffect(() => {
    if (selectedCustomerId) {
      const messageUnsubscribe = subscribeToMessages(selectedCustomerId, (updatedMessages) => {
        // This will trigger a re-render with updated messages
        // In a real application, this would also mark messages as read by admin
        
        // Mark messages as read when customer is selected
        markMessagesAsRead(selectedCustomerId);
      });
      
      return () => {
        messageUnsubscribe();
      };
    }
  }, [selectedCustomerId, subscribeToMessages, markMessagesAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedCustomerId) return;
    
    setIsSending(true);
    
    try {
      await sendMessage(newMessage, selectedCustomerId);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // In a real app, show error to user
    } finally {
      setIsSending(false);
    }
  };

  // Handle clicking on a customer
  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    markMessagesAsRead(customerId);
  };

  // Mark all new customers as seen when notification is closed
  const handleNotificationClose = () => {
    setShowNotification(false);
    markNewCustomersAsSeen();
  };

  // Mock authentication check
  const checkAuthentication = () => {
    // In a real application, this would check the actual authentication status
    // For example, by checking a token or session
    return true; // For demo purposes
  };

  // Filter customers based on search query and selected tab
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchQuery === '' || 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTab === 'all') {
      return matchesSearch;
    } else if (selectedTab === 'online') {
      return matchesSearch && customer.status === 'Online';
    } else if (selectedTab === 'unread') {
      return matchesSearch && getUnreadMessageCount(customer.id) > 0;
    }
    
    return matchesSearch;
  });

  return (
    <main className="min-h-screen">
      {/* Sidebar with customers list */}
      <div className="w-1/4 bg-gray-100 p-4">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <span>Customers</span>
          {newCustomerCount > 0 && (
            <span className="ml-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {newCustomerCount}
            </span>
          )}
        </h2>
        
        {showNotification && (
          <div className="bg-blue-500 text-white p-2 rounded mb-4 flex justify-between items-center">
            <span>New customer(s) waiting for support!</span>
            <button 
              onClick={handleNotificationClose}
              className="text-white hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Customer search and filter */}
        <div className="mb-4">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 0010 10l3 3a1 1 0 00-1.414 1.414l-3-3A10 10 0 008 14a10 10 0 00-3.682 7.148 1 1 0 01-1.397 1.474 40.979 40.979 0 01-6.91-3.07 34.35 34.35 0 01-4.474-6.94 8.975 8.975 0 01-1.449-2.03H1v-3h2.356a31.03 31.03 0 004.015-2.096l1.473-1.473A10 10 0 0019 10a10 10 0 00-10-10zmM2 10a8 8 0 018-8v8h8a8 8 0 01-16 0z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md leading-5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search customers..."
            />
          </div>
          
          {/* Customer filters */}
          <div className="mt-2 flex justify-between text-sm">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-2 py-1 rounded ${selectedTab === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedTab('online')}
              className={`px-2 py-1 rounded ${selectedTab === 'online' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Online
            </button>
            <button
              onClick={() => setSelectedTab('unread')}
              className={`px-2 py-1 rounded ${selectedTab === 'unread' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Unread
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {filteredCustomers.map((customer) => {
            const unreadCount = getUnreadMessageCount(customer.id);
            const isActive = selectedCustomerId === customer.id;
            const lastMessage = messages
              .filter(m => m.id.startsWith(customer.id))
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            
            return (
              <div 
                key={customer.id}
                className={`p-2 bg-white rounded shadow cursor-pointer transition-all ${
                  isActive 
                    ? 'border-2 border-blue-500 transform scale-105' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleCustomerClick(customer.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium flex items-center">
                      {customer.name}
                      {customer.priority === 'high' && (
                        <span className="ml-2 bg-red-500 text-white rounded-full w-2 h-2"></span>
                      )}
                    </div>
                    <div className={`text-sm ${customer.status === 'Online' ? 'text-green-500' : 'text-gray-500'}`}>
                      {customer.status}
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {unreadCount}
                    </div>
                  )}
                </div>
                
                {/* Show last message preview for active customer */}
                {isActive && lastMessage && (
                  <div className="mt-1 pt-1 border-t border-gray-200 mt-2 pt-2">
                    <div className="text-xs text-gray-500 truncate">
                      {lastMessage.sender === 'admin' ? 'You: ' : ''}{lastMessage.content}
                    </div>
                  </div>
                )}
                
                {/* Show last message time for active customer */}
                {isActive && lastMessage && (
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        {selectedCustomerId ? (
          <>
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  Chat with {getCustomer(selectedCustomerId)?.name}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${getCustomer(selectedCustomerId)?.status === 'Online' ? 'text-green-500' : 'text-gray-500'}`}>
                    {getCustomer(selectedCustomerId)?.status}
                  </span>
                  <button 
                    onClick={() => updateMessageStatus(selectedCustomerId, 'closed')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Mark as closed
                  </button>
                  <button 
                    onClick={() => updateMessageStatus(selectedCustomerId, 'resolved')}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Mark as resolved
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {messages
                .filter(msg => msg.id.startsWith(selectedCustomerId))
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .map((msg, index) => {
                  // Group messages by date
                  const currentMessageDate = new Date(msg.timestamp).toLocaleDateString();
                  const prevMessageDate = index > 0 
                    ? new Date(messages[index - 1].timestamp).toLocaleDateString() 
                    : null;
                  
                  return (
                    <div key={msg.id}>
                      {/* Date separator */}
                      {currentMessageDate !== prevMessageDate && (
                        <div className="my-4 flex items-center justify-center">
                          <div className="bg-gray-200 px-4 py-1 rounded-full text-xs text-gray-500">
                            {currentMessageDate === new Date().toLocaleDateString() 
                              ? 'Today' 
                              : currentMessageDate === new Date(Date.now() - 86400000).toLocaleDateString() 
                                ? 'Yesterday' 
                                : currentMessageDate
                            }
                          </div>
                        </div>
                      )}
                      
                      {/* Message bubble */}
                      <div 
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
                        <div className={`text-xs text-gray-500 mt-1 ${msg.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {/* Show empty state if no messages */}
              {messages.filter(msg => msg.customerId === selectedCustomerId).length === 0 && (
                <div className="text-center text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              )}
              
              {/* Scroll to bottom when messages change */}
              <div ref={messagesEndRef} />
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
                  disabled={isSending}
                  className={`bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 transition-colors ${
                    isSending ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSending ? (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Send'
                  )}
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
      
      {/* Support chat widget - connects to our admin support section */}
      <SupportChatWidget />
    </main>
  );
}