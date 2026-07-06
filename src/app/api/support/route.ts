import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, query, where, orderBy, limit, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';

// Import MO AI services
async function askMO(message: string, userId: string, businessId: string, conversationHistory: any[]) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    const url = `${backendUrl}/api/ask-mo`;

    const historyToSend = conversationHistory
      .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10)
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content,
      }));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userId,
        businessId,
        conversationHistory: historyToSend,
        language: 'en',
      }),
    });

    if (!response.ok) {
      throw new Error(`MO AI API returned ${response.status}`);
    }

    const data = await response.json();
    return data.answer || "I'm here to help! Could you tell me more about what you need?";
  } catch (error) {
    console.error('Error calling MO AI:', error);
    return "I'm here to help! Could you tell me more about what you need?";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userEmail, category, userId, businessId, businessName, conversationHistory = [], requestHumanAgent = false } = body;

    if (!message || !userEmail) {
      return NextResponse.json({ error: 'Message and email are required' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    if (!firestore) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // If userId is provided, fetch additional user data
    let userData = {
      businessId: businessId || null,
      businessName: businessName || null,
    };

    if (userId) {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          userData.businessId = data.businessId || null;
          userData.businessName = data.businessName || null;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }

    // Save user message to Firestore
    const userMessageDoc = await addDoc(collection(firestore, 'supportMessages'), {
      userId: userId || userEmail,
      userEmail,
      businessId: userData.businessId,
      businessName: userData.businessName,
      message,
      status: 'unread',
      category: category || 'general',
      createdAt: serverTimestamp(),
      replies: [],
    });

    // If user requests human agent, mark as needing human response
    if (requestHumanAgent) {
      await updateDoc(userMessageDoc, {
        status: 'needs_human',
        'replies': arrayUnion({
          message: "I've requested a human agent. They'll be with you shortly. In the meantime, I can still help with general questions about Busmo.",
          sender: 'mo',
          createdAt: new Date().toISOString(),
          type: 'escalation_notice',
        }),
      });

      return NextResponse.json({
        id: userMessageDoc.id,
        reply: "I've requested a human agent. They'll be with you shortly. In the meantime, I can still help with general questions about Busmo. Would you like me to send your previous messages to them?",
        status: 'needs_human',
        isBotResponse: true,
      });
    }

    // Call MO AI for intelligent response
    const aiResponse = await askMO(message, userId || userEmail, userData.businessId || '', conversationHistory);

    // Add MO AI's response as a reply
    const botMessageRef = doc(firestore, 'supportMessages', userMessageDoc.id);
    await updateDoc(botMessageRef, {
      status: 'bot_responded',
      'replies': arrayUnion({
        message: aiResponse,
        sender: 'mo',
        createdAt: new Date().toISOString(),
        type: 'ai_response',
      }),
    });

    return NextResponse.json({
      id: userMessageDoc.id,
      reply: aiResponse,
      status: 'bot_responded',
      isBotResponse: true,
    });
  } catch (error) {
    console.error('Support message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// New endpoint to fetch conversation history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    if (!firestore) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const docRef = doc(firestore, 'supportMessages', conversationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const data = docSnap.data();
    return NextResponse.json({
      id: docSnap.id,
      message: data.message,
      replies: data.replies || [],
      status: data.status,
      createdAt: data.createdAt,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}
