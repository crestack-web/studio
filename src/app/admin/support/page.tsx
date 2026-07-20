// src/app/admin/support/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs, doc, updateDoc, arrayUnion, addDoc, setDoc } from 'firebase/firestore';
import { Message, Customer } from '@/lib/realtimeService';
import { useAdminAuth } from '@/lib/adminAuth';

export default function AdminSupportPage() {
  const { user, hasPermission } = useAdminAuth();
  const router = useRouter();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [isAgentOnline, setIsAgentOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Real data from Firestore
  const [messages, setMessages] = useState<Message[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomerCount, setNewCustomerCount] = useState(0);

  // Check authentication when component mounts
  useEffect(() => {
    const isAuthenticated = checkAuthentication();
    
    if (!isAuthenticated) {
      router.push('/admin/login');
    }
    
    // Check if user has support permissions
    if (user && !hasPermission('support_view') && !hasPermission('all')) {
      router.push('/admin');
    }
  }, [router, user, hasPermission]);

  // Load customers from Firestore
  useEffect(() => {
    const { firestore } = initializeFirebase();
    if (!firestore) return;

    const customersQuery = query(
      collection(firestore, 'supportMessages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(customersQuery, (snapshot) => {
      const customerMap = new Map<string, Customer>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const customerId = data.userId || data.userEmail;
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: data.userEmail?.split('@')[0] || 'Guest',
            email: data.userEmail || 'guest@example.com',
            status: 'Online',
            priority: data.priority === 'high' ? 'high' : 'medium',
            lastMessage: data.message,
            lastMessageTime: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        }
      });

      const customerList = Array.from(customerMap.values());
      setCustomers(customerList);
      
      if (customerList.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(customerList[0].id);
      }
    });

    return () => unsubscribe();
  }, [selectedCustomerId]);

  // Subscribe to messages for selected customer
  useEffect(() => {
    if (!selectedCustomerId) return;

    const { firestore } = initializeFirebase();
    if (!firestore) return;

    const messagesQuery = query(
      collection(firestore, 'supportMessages'),
      where('userId', '==', selectedCustomerId),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList: any[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        messageList.push({
          id: doc.id,
          sender: data.sender === 'admin' ? 'admin' : 'user',
          content: data.message,
          timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          customerId: selectedCustomerId,
        });
      });

      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [selectedCustomerId]);

  // Subscribe to new customer notifications
  useEffect(() => {
    const { firestore } = initializeFirebase();
    if (!firestore) return;

    const newMessagesQuery = query(
      collection(firestore, 'supportMessages'),
      where('status', '==', 'unread'),
      limit(10)
    );

    const unsubscribe = onSnapshot(newMessagesQuery, (snapshot) => {
      setNewCustomerCount(snapshot.size);
      
      if (snapshot.size > 0) {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
    });

    return () => unsubscribe();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedCustomerId) return;
    
    setIsSending(true);
    
    try {
      const { firestore } = initializeFirebase();
      if (!firestore) throw new Error('Firestore not available');

      // Save admin message to Firestore
      await addDoc(collection(firestore, 'supportMessages'), {
        userId: selectedCustomerId,
        userEmail: selectedCustomerId.includes('@') ? selectedCustomerId : `${selectedCustomerId}@example.com`,
        message: newMessage,
        sender: 'admin',
        status: 'replied',
        category: 'general',
        priority: 'medium',
        createdAt: new Date(),
        replies: [],
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle clicking on a customer
  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  // Mark all new customers as seen when notification is closed
  const handleNotificationClose = () => {
    setShowNotification(false);
    setNewCustomerCount(0);
  };

  // Mock authentication check
  const checkAuthentication = () => {
    return true; // For demo purposes
  };

  // Handle agent online/offline toggle
  const handleAgentStatusToggle = async () => {
    const newStatus = !isAgentOnline;
    setIsAgentOnline(newStatus);
    
    try {
      const { firestore } = initializeFirebase();
      if (!firestore) return;

      // Save agent status to Firestore
      const agentStatusRef = doc(firestore, 'agentStatus', 'admin');
      await setDoc(agentStatusRef, {
        isOnline: newStatus,
        lastUpdated: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating agent status:', error);
    }
  };

  // Load agent status from Firestore on mount
  useEffect(() => {
    const { firestore } = initializeFirebase();
    if (!firestore) return;

    const agentStatusRef = doc(firestore, 'agentStatus', 'admin');
    const unsubscribe = onSnapshot(agentStatusRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsAgentOnline(data.isOnline !== false);
      }
    });

    return () => unsubscribe();
  }, []);

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
      return matchesSearch && messages.some(m => m.customerId === customer.id && m.sender === 'user');
    }
    
    return matchesSearch;
  });

  return (
    <div className="flex h-screen">
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
            const unreadCount = messages.filter(m => m.customerId === customer.id && m.sender === 'user').length;
            const isActive = selectedCustomerId === customer.id;
            const lastMessage = messages
              .filter(m => m.customerId === customer.id)
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
                  Chat with {customers.find(c => c.id === selectedCustomerId)?.name || selectedCustomerId}
                </h2>
                <div className="flex items-center gap-4">
                  {/* Agent Status Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Agent Status:</span>
                    <button
                      onClick={handleAgentStatusToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isAgentOnline ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isAgentOnline ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium ${isAgentOnline ? 'text-green-600' : 'text-gray-500'}`}>
                      {isAgentOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <span className={`text-sm ${customers.find(c => c.id === selectedCustomerId)?.status === 'Online' ? 'text-green-500' : 'text-gray-500'}`}>
                    {customers.find(c => c.id === selectedCustomerId)?.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {messages
                .filter(msg => msg.customerId === selectedCustomerId)
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
    </div>
  );
}