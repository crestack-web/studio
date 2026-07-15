// src/lib/realtimeService.ts
'use client';

import { useEffect, useState } from 'react';

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
  status: 'Online' | 'Offline';
}

interface RealtimeService {
  messages: Message[];
  customers: Customer[];
  newCustomerCount: number;
  sendMessage: (message: string, customerId: string) => Promise<void>;
  subscribeToMessages: (customerId: string, callback: (messages: Message[]) => void) => () => void;
  subscribeToCustomers: (callback: (customers: Customer[]) => void) => () => void;
  subscribeToNewCustomers: (callback: (count: number) => void) => () => void;
}

// In a real application, this would connect to a real-time database like Firebase
export function useRealtimeService(): RealtimeService {
  // For demo purposes, we'll use a simple polling mechanism
  const [messages, setMessages] = useState<Message[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newCustomerCount, setNewCustomerCount] = useState(0);
  
  const [subscribers, setSubscribers] = useState<Record<string, (messages: Message[]) => void>>({});
  const [customerSubscribers, setCustomerSubscribers] = useState<Array<(customers: Customer[]) => void>>([]);
  const [newCustomerSubscribers, setNewCustomerSubscribers] = useState<Array<(count: number) => void>>([]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(async () => {
      // In a real app, this would fetch only new messages
      const response = await fetch('/api/admin/support/messages');
      const data = await response.json();
      
      // Update messages
      setMessages(data);
      
      // Notify all message subscribers
      Object.values(subscribers).forEach(callback => callback(data));
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [subscribers]);

  // Simulate customer list updates
  useEffect(() => {
    // In a real app, this would fetch from a database
    const demoCustomers: Customer[] = [
      { 
        id: 'demo_1', 
        name: 'John Doe', 
        email: 'john@example.com',
        status: 'Online' 
      },
      { 
        id: 'demo_2', 
        name: 'Jane Smith', 
        email: 'jane@example.com',
        status: 'Offline' 
      },
      { 
        id: 'demo_3', 
        name: 'Bob Johnson', 
        email: 'bob@example.com',
        status: 'Online' 
      }
    ];
    
    // Check for new customers
    setCustomers(prevCustomers => {
      if (prevCustomers.length === 0) {
        // First load
        setNewCustomerCount(0);
        return demoCustomers;
      } else {
        // Find new customers
        const newCustomers = demoCustomers.filter(
          newCust => !prevCustomers.some(prevCust => prevCust.id === newCust.id)
        );
        
        if (newCustomers.length > 0) {
          setNewCustomerCount(prev => prev + newCustomers.length);
          
          // Notify new customer subscribers
          newCustomerSubscribers.forEach(callback => callback(newCustomers.length));
        }
        
        return demoCustomers;
      }
    });
  }, [customerSubscribers, newCustomerSubscribers]);

  const sendMessage = async (message: string, customerId: string) => {
    await fetch('/api/admin/support/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        customerId,
        sender: 'user'
      })
    });
  };

  const subscribeToMessages = (customerId: string, callback: (messages: Message[]) => void) => {
    setSubscribers(prev => ({
      ...prev,
      [customerId]: callback
    }));
    
    // Return unsubscribe function
    return () => {
      setSubscribers(prev => {
        const newSubscribers = { ...prev };
        delete newSubscribers[customerId];
        return newSubscribers;
      });
    };
  };

  const subscribeToCustomers = (callback: (customers: Customer[]) => void) => {
    setCustomerSubscribers(prev => [...prev, callback]);
    
    // Return unsubscribe function
    return () => {
      setCustomerSubscribers(prev => {
        const index = prev.indexOf(callback);
        if (index > -1) {
          const newSubscribers = [...prev];
          newSubscribers.splice(index, 1);
          return newSubscribers;
        }
        return prev;
      });
    };
  };

  const subscribeToNewCustomers = (callback: (count: number) => void) => {
    setNewCustomerSubscribers(prev => [...prev, callback]);
    
    // Return unsubscribe function
    return () => {
      setNewCustomerSubscribers(prev => {
        const index = prev.indexOf(callback);
        if (index > -1) {
          const newSubscribers = [...prev];
          newSubscribers.splice(index, 1);
          return newSubscribers;
        }
        return prev;
      });
    };
  };

  return {
    messages,
    customers,
    newCustomerCount,
    sendMessage,
    subscribeToMessages,
    subscribeToCustomers,
    subscribeToNewCustomers
  };
}