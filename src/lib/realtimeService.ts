// src/lib/realtimeService.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/adminAuth';

// Types
export interface Message {
  id: string;
  sender: 'user' | 'admin';
  content: string;
  timestamp: string;
  customerId: string;  // Add customerId property
  readByAdmin?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: 'Online' | 'Offline';
  priority: 'high' | 'medium' | 'low';
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface SupportStats {
  openConversations: number;
  pendingMessages: number;
  averageResponseTime: number; // in minutes
}

// Hook to use the realtime service
export function useRealtimeService() {
  const router = useRouter();
  const { isAuthenticated, hasPermission } = useAdminAuth();
  
  // State for messages and customers
  const [messages, setMessages] = useState<Message[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomerCount, setNewCustomerCount] = useState(0);
  const [supportStats, setSupportStats] = useState<SupportStats>({
    openConversations: 0,
    pendingMessages: 0,
    averageResponseTime: 0
  });
  
  // Send a message
  const sendMessage = useCallback(async (content: string, customerId: string) => {
    if (!isAuthenticated || !hasPermission('send_message')) {
      router.push('/admin/login');
      return;
    }
    
    try {
      // Create a new message object
      const newMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: 'admin',
        content,
        timestamp: new Date().toISOString(),
        customerId,  // Add customerId
        readByAdmin: true
      };
      
      // Update messages in state
      setMessages(prev => [...prev, newMessage]);
      
      return { success: true, message: newMessage };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }, [isAuthenticated, hasPermission, router]);

  // Subscribe to messages for a specific customer
  const subscribeToMessages = useCallback((customerId: string, callback: (messages: Message[]) => void) => {
    if (!isAuthenticated || !hasPermission('read_messages')) {
      router.push('/admin/login');
      return () => {};
    }
    
    // Mock implementation - simulate receiving a new message every 30 seconds
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance of new message
        const newMessage: Message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sender: 'user',
          content: ['Hello!', 'Where are you?', 'Need help with order', 'When will it arrive?'][Math.floor(Math.random() * 4)],
          timestamp: new Date().toISOString(),
          customerId,  // Add customerId parameter
          readByAdmin: false
        };
        
        // Update messages in state
        setMessages(prev => [...prev, newMessage]);
        
        // Update new customer count
        setNewCustomerCount(prev => prev + 1);
      }
    }, 30000);
    
    // Initial messages
    const initialMessages: Message[] = [
      {
        id: 'msg_1',
        sender: 'user',
        content: 'Hello, I need help with my order',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        customerId,  // Add customerId parameter
        readByAdmin: true
      },
      {
        id: 'msg_2',
        sender: 'admin',
        content: 'Sure, I can help with that.',
        timestamp: new Date(Date.now() - 86400000 + 1000).toISOString(), // Yesterday + 1s
        customerId,  // Add customerId parameter
        readByAdmin: true
      }
    ];
    
    // Call the callback with initial messages
    callback(initialMessages);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, hasPermission, router]);

  // Subscribe to customer list updates
  const subscribeToCustomers = useCallback((callback: (customers: Customer[]) => void) => {
    if (!isAuthenticated || !hasPermission('read_customers')) {
      router.push('/admin/login');
      return () => {};
    }
    
    // Mock implementation - simulate customer list updates
    const interval = setInterval(() => {
      const updatedCustomers = [...customers];
      
      // Randomly update customer status or add/remove customers
      if (Math.random() < 0.2) { // 20% chance to add a new customer
        const newCustomer: Customer = {
          id: `guest_${Math.random().toString(36).substr(2, 9)}`,
          name: `Customer ${customers.length + 1}`,
          email: `customer${customers.length + 1}@example.com`,
          status: 'Online',
          priority: Math.random() < 0.1 ? 'high' : Math.random() < 0.3 ? 'medium' : 'low',
          lastMessage: ['Hello!', 'Need help', 'Where is my order?'][Math.floor(Math.random() * 3)],
          lastMessageTime: new Date().toISOString()
        };
        
        updatedCustomers.unshift(newCustomer);
        setNewCustomerCount(prev => prev + 1);
      } else if (updatedCustomers.length > 0 && Math.random() < 0.1) { // 10% chance to remove a customer
        updatedCustomers.pop();
      } else if (updatedCustomers.length > 0 && Math.random() < 0.3) { // 30% chance to update a customer
        const index = Math.floor(Math.random() * updatedCustomers.length);
        updatedCustomers[index] = {
          ...updatedCustomers[index],
          status: Math.random() < 0.5 ? 'Online' : 'Offline',
          lastMessage: ['Hello!', 'Need help', 'Where is my order?'][Math.floor(Math.random() * 3)],
          lastMessageTime: new Date().toISOString()
        };
      }
      
      setCustomers(updatedCustomers);
      callback(updatedCustomers);
    }, 15000);
    
    // Initial customers
    const initialCustomers: Customer[] = [
      {
        id: 'cust_1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        status: 'Online',
        priority: 'high',
        lastMessage: 'Where is my order?',
        lastMessageTime: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        id: 'cust_2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        status: 'Offline',
        priority: 'low',
        lastMessage: 'Hello!',
        lastMessageTime: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      }
    ];
    
    // Call the callback with initial customers
    callback(initialCustomers);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, hasPermission, router, customers]);

  // Subscribe to new customer notifications
  const subscribeToNewCustomers = useCallback((callback: (newCustomerCount: number) => void) => {
    if (!isAuthenticated || !hasPermission('read_new_customers')) {
      router.push('/admin/login');
      return () => {};
    }
    
    // Mock implementation - simulate new customers
    const interval = setInterval(() => {
      if (Math.random() < 0.2) { // 20% chance of new customer
        setNewCustomerCount(prev => prev + 1);
      }
    }, 20000);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, hasPermission, router]);

  // Mark new customers as seen
  const markNewCustomersAsSeen = useCallback(() => {
    if (!isAuthenticated || !hasPermission('read_new_customers')) {
      router.push('/admin/login');
      return;
    }
    
    setNewCustomerCount(0);
  }, [isAuthenticated, hasPermission, router]);

  // Get customer by ID
  const getCustomer = useCallback((customerId: string): Customer | undefined => {
    return customers.find(c => c.id === customerId);
  }, [customers]);

  // Mark messages as read by admin
  const markMessagesAsRead = useCallback((customerId: string) => {
    if (!isAuthenticated || !hasPermission('mark_messages_read')) {
      router.push('/admin/login');
      return;
    }
    
    setMessages(prev => 
      prev.map(message => 
        message.sender === 'user' && message.id.startsWith(customerId) && !message.readByAdmin
          ? { ...message, readByAdmin: true } 
          : message
      )
    );
  }, [isAuthenticated, hasPermission, router, customers]);

  // Update message status
  const updateMessageStatus = useCallback((customerId: string, status: string) => {
    if (!isAuthenticated || !hasPermission('update_message_status')) {
      router.push('/admin/login');
      return;
    }
    
    console.log(`Updating message status for customer ${customerId} to ${status}`);
  }, [isAuthenticated, hasPermission, router]);

  // Get unread message count for a customer
  const getUnreadMessageCount = useCallback((customerId: string): number => {
    if (!isAuthenticated || !hasPermission('read_unread_count')) {
      router.push('/admin/login');
      return 0;
    }
    
    return messages.filter(
      msg => msg.sender === 'user' && !msg.readByAdmin && msg.id.startsWith(customerId)
    ).length;
  }, [isAuthenticated, hasPermission, router, messages]);

  // Subscribe to support statistics updates
  const subscribeToSupportStats = useCallback((callback: (stats: SupportStats) => void) => {
    if (!isAuthenticated || !hasPermission('read_support_stats')) {
      router.push('/admin/login');
      return () => {};
    }
    
    // Mock implementation - simulate updates every 30 seconds
    const interval = setInterval(() => {
      const updatedStats: SupportStats = {
        openConversations: Math.floor(Math.random() * 20),
        pendingMessages: Math.floor(Math.random() * 50),
        averageResponseTime: Math.floor(Math.random() * 30) + 15 // in minutes
      };
      
      setSupportStats(updatedStats);
      callback(updatedStats);
    }, 30000);
    
    // Initial stats
    const initialStats: SupportStats = {
      openConversations: 15,
      pendingMessages: 32,
      averageResponseTime: 22 // in minutes
    };
    
    // Call the callback with initial stats
    callback(initialStats);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, hasPermission, router]);

  // Function to get daily active users
  const getDailyActiveUsers = useCallback((): number => {
    if (!isAuthenticated || !hasPermission('read_active_users')) {
      router.push('/admin/login');
      return 0;
    }
    
    // In a real application, this would fetch data from an API
    // For demo purposes, return a random number that changes daily
    return Math.floor(Math.random() * 100) + 50;
  }, [isAuthenticated, hasPermission, router]);

  // Function to get monthly active users
  const getMonthlyActiveUsers = useCallback((): number => {
    if (!isAuthenticated || !hasPermission('read_active_users')) {
      router.push('/admin/login');
      return 0;
    }
    
    // In a real application, this would fetch data from an API
    // For demo purposes, return a random number that changes monthly
    return Math.floor(Math.random() * 2000) + 1500;
  }, [isAuthenticated, hasPermission, router]);

  // Subscribe to daily active users updates
  const subscribeToDailyActiveUsers = useCallback((callback: (count: number) => void) => {
    if (!isAuthenticated || !hasPermission('read_active_users')) {
      router.push('/admin/login');
      return () => {};
    }
    
    // Mock implementation - simulate updates every 15 seconds
    const interval = setInterval(() => {
      const updatedCount = Math.floor(Math.random() * 100) + 50;
      callback(updatedCount);
    }, 15000);
    
    // Initial count
    const initialCount = 78;
    callback(initialCount);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, hasPermission, router]);

  // Subscribe to monthly active users updates
  const subscribeToMonthlyActiveUsers = useCallback((callback: (count: number) => void) => {
    if (!isAuthenticated || !hasPermission('read_active_users')) {
      router.push('/admin/login');
      return () => {};
    }
    
    // Mock implementation - simulate updates every minute
    const interval = setInterval(() => {
      const updatedCount = Math.floor(Math.random() * 2000) + 1500;
      callback(updatedCount);
    }, 60000);
    
    // Initial count
    const initialCount = 1892;
    callback(initialCount);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated, hasPermission, router]);

  // Reset new customer notification when the component unmounts
  useEffect(() => {
    return () => {
      setNewCustomerCount(0);
    };
  }, []);

  // Return the service interface
  return {
    messages,
    customers,
    newCustomerCount,
    supportStats,
    sendMessage,
    subscribeToMessages,
    subscribeToCustomers,
    subscribeToNewCustomers,
    subscribeToSupportStats,
    subscribeToDailyActiveUsers,
    subscribeToMonthlyActiveUsers,
    markNewCustomersAsSeen,
    getCustomer,
    markMessagesAsRead,
    updateMessageStatus,
    getUnreadMessageCount,
    getDailyActiveUsers,
    getMonthlyActiveUsers
  };
}