// src/app/customer/chat/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'admin';
  content: string;
  timestamp: string;
  readByAdmin: boolean;
}

const initialMessages: Message[] = [
  {
    id: 'msg_1',
    sender: 'user',
    // Fixed the string with apostrophe by using double quotes inside single quotes
    content: "Hello, I need help with my order",
    timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    readByAdmin: true
  },
  {
    id: 'msg_2',
    sender: 'admin',
    // Fixed the string with apostrophe by using double quotes inside single quotes
    content: "Sure, I can help you with that. Could you please provide more details about the issue you're facing?",
    timestamp: new Date(Date.now() - 86400000 + 1000).toISOString(), // Yesterday + 1s
    readByAdmin: true
  }
];

export default function CustomerChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
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
      setIsLoading(false);
    }, 1000);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    
    // In a real application, this would send to an API
    setTimeout(() => {
      // Add the new message to the chat
      const message: Message = {
        id: `msg_${messages.length + 1}`,
        sender: 'user',
        content: newMessage,
        timestamp: new Date().toISOString(),
        readByAdmin: false
      };
      
      setMessages([...messages, message]);
      setNewMessage('');
      setIsSending(false);
      
      // Simulate admin response
      setTimeout(() => {
        const adminMessage: Message = {
          id: `msg_${messages.length + 2}`,
          sender: 'admin',
          content: 'Thank you for your message. We will get back to you shortly.',
          timestamp: new Date().toISOString(),
          readByAdmin: true
        };
        
        setMessages(prev => [...prev, adminMessage]);
      }, 1500);
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Support Chat</h1>
          <p className="text-gray-600 mt-1">Chat #{params.id}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-600">Welcome, {customer.name}</p>
          <p className="text-sm text-gray-500">{customer.email}</p>
        </div>
      </div>

      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow overflow-hidden">
        {/* Chat header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              💼
            </div>
            <div className="ml-3">
              <h2 className="font-medium">Support Team</h2>
              <p className="text-sm text-gray-500">Connected</p>
            </div>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-500">Loading chat history...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start ${msg.sender === 'admin' ? '' : 'flex-row-reverse'}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.sender === 'admin' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  >
                    {msg.sender === 'admin' ? '👩‍💼' : '👤'}
                  </div>
                  <div 
                    className={`mx-2 p-3 rounded-lg max-w-[70%] ${
                      msg.sender === 'admin' 
                        ? 'bg-blue-50 text-blue-800 ml-2' 
                        : 'bg-gray-100 text-gray-800 mr-2'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {formatDate(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Empty state */}
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat input */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={isSending || !newMessage.trim()}
              className={`px-4 py-3 rounded-lg font-medium text-white ${
                isSending || !newMessage.trim()
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-right">
            Messages are encrypted and securely stored
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link 
          href="/customer"
          className="text-blue-500 hover:text-blue-600 text-sm"
        >
          ← Back to Chat History
        </Link>
      </div>
    </div>
  );
}