// src/app/api/admin/support/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Define types for our message structure
type Message = {
  id: number;
  sender: 'user' | 'admin';
  content: string;
  timestamp: string;
  customerId: string;
  read?: boolean;
  attachments?: string[];
};

// In a real application, this would be a database connection
// For now, we'll use a simple in-memory store
const messageStore = {
  messages: [
    { 
      id: 1, 
      sender: 'user', 
      content: 'Hello, I need help with my account.', 
      timestamp: new Date().toISOString(),
      customerId: 'demo_1',
      read: false
    },
    { 
      id: 2, 
      sender: 'admin', 
      content: 'Sure, I can help you with that.', 
      timestamp: new Date().toISOString(),
      customerId: 'demo_1',
      read: true,
      attachments: ['file1.pdf']
    },
    { 
      id: 3, 
      sender: 'user', 
      content: 'Hi, I have a question about pricing.', 
      timestamp: new Date().toISOString(),
      customerId: 'demo_2',
      read: false
    }
  ],
  
  // Method to get messages
  getMessages(customerId?: string) {
    return customerId 
      ? this.messages.filter(msg => msg.customerId === customerId)
      : this.messages;
  },
  
  // Method to add a new message
  addMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    const newMessage = {
      ...message,
      id: Math.max(...this.messages.map(m => m.id), 0) + 1,
      timestamp: new Date().toISOString()
    };
    this.messages.push(newMessage);
    return newMessage;
  }
};

// GET endpoint to retrieve messages
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    
    const filteredMessages = messageStore.getMessages(customerId);
    
    return NextResponse.json(filteredMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch messages'
    }, { status: 500 });
  }
}

// POST endpoint to send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation
    const { sender, content, customerId } = body;
    
    if (!sender || !content || !customerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Add the new message
    const newMessage = messageStore.addMessage({
      sender,
      content,
      customerId,
      read: false
    });
    
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}