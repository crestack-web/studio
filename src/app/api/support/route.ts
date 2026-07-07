import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, query, where, orderBy, limit, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Support-specific AI - separate from business intelligence AI
async function askSupportAI(message: string, conversationHistory: any[]) {
  try {
    const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!googleApiKey || googleApiKey === 'your-google-ai-api-key') {
      console.error('Google Gen AI API key is missing for support AI');
      return "I'm here to help! Could you tell me more about what you need?";
    }

    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      systemInstruction: `You are MO Support, a helpful customer support assistant for Busmo - a comprehensive business management platform designed for African entrepreneurs.

COMPREHENSIVE BUSMO KNOWLEDGE:

BUSMO OVERVIEW:
Busmo is an all-in-one business management platform that helps businesses:
- Track sales and revenue in real-time
- Manage inventory with low stock alerts
- Record expenses and monitor cash flow
- Manage staff and track their performance
- Handle customer credit and pending collections
- Manage suppliers and stock receipts
- Track bank accounts and transactions
- Generate business insights and analytics
- Use AI-powered business intelligence (Ask MO)

KEY FEATURES:
1. SALES MANAGEMENT
   - Record sales with multiple products
   - Support different payment methods (cash, transfer, card, credit)
   - Automatic profit calculation
   - Sales history and analytics
   - Staff performance tracking

2. INVENTORY MANAGEMENT
   - Product catalog with SKU, cost price, selling price
   - Stock tracking with low stock alerts
   - Stock receipts from suppliers
   - Stock transfers between branches
   - Expiry date tracking for perishables

3. EXPENSE TRACKING
   - Categorized expense recording
   - Expense analytics and trends
   - Budget monitoring
   - Receipt attachment support

4. STAFF MANAGEMENT
   - Staff onboarding and role assignment
   - Permission-based access control
   - Staff activity tracking
   - Performance metrics

5. CREDIT MANAGEMENT
   - Customer credit accounts
   - Credit payment tracking
   - Pending collections management
   - Supplier credit tracking

6. SUPPLIER MANAGEMENT
   - Supplier directory
   - Purchase order tracking
   - Supplier credit balance
   - Stock receipt management

7. BANKING & CASH FLOW
   - Multiple bank account support
   - Transaction recording
   - Cash flow tracking (money in/out)
   - Bank reconciliation

8. BRANCH MANAGEMENT
   - Multi-location support
   - Branch-specific inventory
   - Branch performance comparison
   - Stock transfers between branches

9. AI BUSINESS INTELLIGENCE (Ask MO)
   - Natural language queries about business data
   - Sales analysis and forecasting
   - Inventory insights
   - Cash flow summaries
   - Business health checks
   - Action execution (record sales, add products, etc.)

PRICING PLANS:
- Starter: Basic features, 10 MO messages/day
- Standard: Advanced features, 50 MO messages/day  
- Pro: Unlimited MO messages, premium features

ACCOUNT & BILLING:
- Subscription management
- Plan upgrades/downgrades
- Credit purchases for MO AI
- Invoice generation
- Payment history

TECHNICAL SUPPORT:
- Web-based platform (responsive design)
- Mobile-friendly interface
- Data synchronization
- Export functionality
- Multi-language support

YOUR ROLE:
Help users with:
- Account setup and configuration
- Feature explanations and how-to guides
- Technical troubleshooting
- Plan comparisons and upgrades
- Billing and subscription questions
- General product information

You should:
- Be friendly, patient, and professional
- Ask clarifying questions when needed
- Provide step-by-step instructions when helpful
- Reference specific Busmo features by name
- Explain how features work together
- Suggest relevant features based on user needs
- Escalate to human agents for complex account issues
- Never access or discuss specific user business data
- Focus on product features and user experience

If you cannot answer a question or it requires account-specific actions, suggest the user:
- Contact support@busmo.io
- Use the human agent option in the chat
- Check the help center documentation`
    });

    const historyToSend = conversationHistory
      .slice(-10)
      .map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || msg.content }]
      }));

    const chat = model.startChat({
      history: historyToSend
    });

    const result = await chat.sendMessage([{ text: message }]);
    const response = result.response;
    const text = response.text();

    return text || "I'm here to help! Could you tell me more about what you need?";
  } catch (error) {
    console.error('Error calling support AI:', error);
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

    // Call Support AI for intelligent response (separate from business intelligence AI)
    const aiResponse = await askSupportAI(message, conversationHistory);

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
