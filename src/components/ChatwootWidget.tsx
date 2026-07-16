// src/components/ChatwootWidget.tsx
'use client';

import { useEffect, useState, useRef } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'admin';
  content: string;
  timestamp: string;
}

interface ChatwootWidgetProps {
  user?: {
    id: string;
    name: string;
    email: string;
    businessName?: string;
    businessId?: string;
    subscriptionPlan?: string;
    workspaceId?: string;
  };
}

export default function ChatwootWidget({ user }: ChatwootWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState({
    id: '',
    customerId: '',
    status: 'open'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [widgetPosition, setWidgetPosition] = useState({
    right: 20,
    bottom: 20
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Generate a unique customer ID for the conversation
  const generateCustomerId = () => {
    return `guest_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // Initialize conversation when component mounts
  useEffect(() => {
    // Check if there's an existing conversation in localStorage
    const existingConversation = localStorage.getItem('chatwoot_conversation');
    
    if (existingConversation) {
      try {
        const parsedConversation = JSON.parse(existingConversation);
        setConversation(parsedConversation);
        
        // Fetch existing messages from API
        fetch(`/api/support/messages?customerId=${parsedConversation.customerId}`)
          .then(response => response.json())
          .then(data => {
            setMessages(data);
            setIsLoading(false);
          });
      } catch (error) {
        console.error('Error parsing conversation:', error);
        startNewConversation();
      }
    } else {
      startNewConversation();
    }
    
    // Set up event listener for message updates
    const messageUpdateInterval = setInterval(fetchMessages, 5000);
    
    return () => {
      clearInterval(messageUpdateInterval);
    };
  }, []);

  // Start a new conversation
  const startNewConversation = async () => {
    try {
      // Create a new conversation via API
      const response = await fetch('/api/support/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Customer opened chat widget',
          userEmail: 'guest@example.com',
          businessId: 'busmo',
          category: 'general',
          requestHumanAgent: false
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }
      
      const data = await response.json();
      
      // Create new conversation object
      const newConversation = {
        id: data.id,
        customerId: data.customerId || generateCustomerId(),
        status: data.status || 'open'
      };
      
      // Save conversation to state and localStorage
      setConversation(newConversation);
      localStorage.setItem('chatwoot_conversation', JSON.stringify(newConversation));
      
      // Set initial message from AI
      if (data.reply) {
        setMessages([{
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sender: 'admin',
          content: data.reply,
          timestamp: new Date().toISOString()
        }]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsLoading(false);
      
      // Fallback to simple message display
      setMessages([{
        id: 'msg_initial',
        sender: 'admin',
        content: 'Thanks for reaching out! How can we help you today?',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  // Fetch messages for the current conversation
  const fetchMessages = async () => {
    if (!conversation.customerId) return;
    
    try {
      const response = await fetch(`/api/support/messages?customerId=${conversation.customerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      
      // Update messages if there are new ones
      if (data.length > messages.length) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation.customerId) return;
    
    setIsSending(true);
    setNewMessage('');
    
    try {
      // Send message through the API endpoint
      const response = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage.trim(),
          customerId: conversation.customerId,
          sender: 'user',
          userEmail: 'guest@example.com',
          businessId: 'busmo',
          category: 'general'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const result = await response.json();
      
      // Add the message to local state
      const newMessageObj: Message = {
        id: result.id,
        sender: 'user',
        content: newMessage.trim(),
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessageObj]);
    } catch (error) {
      console.error('Error sending message:', error);
      // In a real app, show error to user and add message to queue
      const offlineMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: 'user',
        content: newMessage.trim(),
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, offlineMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Toggle chat window
  const toggleChat = () => {
    setIsOpen(!isOpen);
    
    // Mark messages as read when chat is opened
    if (!isOpen) {
      markMessagesAsRead();
    }
  };

  // Mark messages as read
  const markMessagesAsRead = () => {
    // In a real application, this would update the database
    console.log(`Marking messages as read for customer ${conversation.customerId}`);
    
    // Update local state
    setMessages(prev => 
      prev.map(message => 
        ({ ...message, readByAdmin: true })
      )
    );
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ right: `${widgetPosition.right}px`, bottom: `${widgetPosition.bottom}px` }} className="fixed z-50">
      {!isOpen ? (
        <button 
          onClick={toggleChat}
          className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          aria-label="Open chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-xl w-80 h-96 flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold">Busmo Support</h3>
            <button 
              onClick={toggleChat}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 15.707a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  // Group messages by date
                  const currentMessageDate = new Date(message.timestamp).toLocaleDateString();
                  const prevMessageDate = index > 0 
                    ? new Date(messages[index - 1].timestamp).toLocaleDateString() 
                    : null;
                  
                  return (
                    <div key={message.id}>
                      {/* Date separator */}
                      {currentMessageDate !== prevMessageDate && (
                        <div className="my-4 flex justify-center">
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
                      
                      <div 
                        className={`mb-4 ${message.sender === 'admin' ? 'text-right' : 'text-left'}`}
                      >
                        <div 
                          className={`inline-block p-2 rounded-lg ${
                            message.sender === 'admin' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className={`text-xs text-gray-500 mt-1 ${message.sender === 'admin' ? 'text-right' : 'text-left'}`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Show empty state if no messages */}
                {messages.length === 0 && (
                  <div className="text-center text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                )}
                
                {/* Scroll to bottom when messages change */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <div className="p-4 border-t">
            <div className="flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 p-2 border rounded-l focus:outline-none"
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={isSending}
                className={`bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 transition-colors ${
                  isSending ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSending ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 01-8-8 8 8 0 018-8V0l10 10-10 10z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
