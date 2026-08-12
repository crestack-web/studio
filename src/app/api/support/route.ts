import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getMistralClient } from '@/ai/mistral';

/**
 * Handles incoming support messages from the chat widget
 * Processes user messages, determines if human agent is requested, and provides appropriate responses
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { 
      message, 
      userEmail, 
      userId, 
      businessId, 
      businessName, 
      category = 'general', 
      conversationHistory = [], 
      requestHumanAgent = false 
    } = body;

    // Validate required fields
    if (!message || !userEmail) {
      return NextResponse.json({ error: 'Message and email are required' }, { status: 400 });
    }

    // Initialize Firebase
    const { firestore } = initializeFirebase();
    if (!firestore) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    // Get additional user data if userId is provided
    const userData = await getUserData(firestore, userId, businessId, businessName);

    // Save user message to Firestore
    const userMessageDoc = await saveUserMessage(
      firestore, 
      userId || userEmail, 
      userEmail, 
      userData.businessId, 
      userData.businessName, 
      message, 
      category
    );

    // Handle human agent request
    if (requestHumanAgent) {
      return handleHumanAgentRequest(firestore, userMessageDoc);
    }

    // Generate and save AI response
    const aiResponse = generateAIResponse(category);
    await saveAIResponse(firestore, userMessageDoc, aiResponse);

    return NextResponse.json({
      id: userMessageDoc.id,
      reply: aiResponse,
      status: 'bot_responded',
      isBotResponse: true,
    });
  } catch (error) {
    console.error('Error processing support message:', error);
    return NextResponse.json({ 
      error: 'Failed to process support message',
      reply: "Thanks for your message! Our support team has been notified and will get back to you shortly."
    }, { status: 500 });
  }
}

/**
 * Fetches additional user data from Firestore if available
 */
async function getUserData(firestore: any, userId: string, businessId: string, businessName: string) {
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
  
  return userData;
}

/**
 * Saves the user's message to Firestore
 */
async function saveUserMessage(
  firestore: any, 
  userId: string, 
  userEmail: string, 
  businessId: string | null, 
  businessName: string | null, 
  message: string, 
  category: string
) {
  return await addDoc(collection(firestore, 'supportMessages'), {
    userId,
    userEmail,
    businessId,
    businessName,
    message,
    status: 'unread',
    category,
    createdAt: serverTimestamp(),
    replies: [],
  });
}

/**
 * Generates an AI response based on the message category
 */
function generateAIResponse(category: string): string {
  const aiResponses: Record<string, string> = {
    'general': "Thanks for your message! MO AI here. I've recorded your inquiry and will provide assistance. If you need more specific help, just let me know!",
    'sales': "I understand you have a question about sales recording. MO AI can help you with that. Try saying 'record a sale of X items' to get started!",
    'inventory': "Regarding inventory management, MO AI suggests checking your stock levels regularly. You can ask me to show your low-stock items anytime!",
    'account': "For account-related queries, I recommend checking your dashboard first. If you need further assistance, feel free to ask specific questions!",
    'technical': "It sounds like you're experiencing a technical issue. I'll help you troubleshoot. Can you please describe the issue in more detail?",
    'billing': "Concerning billing matters, I recommend checking your subscription plan and payment history first. I can help you understand your current plan and available options."
  };
  
  return aiResponses[category] || aiResponses.general;
}

/**
 * Saves the AI's response to Firestore
 */
async function saveAIResponse(firestore: any, messageDoc: any, aiResponse: string) {
  const botMessageRef = doc(firestore, 'supportMessages', messageDoc.id);
  await updateDoc(botMessageRef, {
    status: 'bot_responded',
    'replies': arrayUnion({
      message: aiResponse,
      sender: 'mo',
      createdAt: new Date().toISOString(),
      type: 'ai_response',
    }),
  });
}

/**
 * Handles the case when a human agent is requested
 */
async function handleHumanAgentRequest(firestore: any, messageDoc: any) {
  const escalationMessage = "I've requested a human agent. They'll be with you shortly. In the meantime, I can still help with general questions about Busmo.";
  
  const botMessageRef = doc(firestore, 'supportMessages', messageDoc.id);
  await updateDoc(botMessageRef, {
    status: 'needs_human',
    'replies': arrayUnion({
      message: escalationMessage,
      sender: 'mo',
      createdAt: new Date().toISOString(),
      type: 'escalation_notice',
    }),
  });

  return NextResponse.json({
    id: messageDoc.id,
    reply: escalationMessage,
    status: 'needs_human',
    isBotResponse: true,
  });
}

// Support-specific AI - separate from business intelligence AI
async function askSupportAI(message: string, conversationHistory: any[]) {
  try {
    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (!mistralApiKey || mistralApiKey === 'your-mistral-api-key') {
      console.error('Mistral API key is missing for support AI');
      // Return a more helpful fallback message
      return "I'm currently experiencing some technical difficulties. I've saved your message and our support team will get back to you shortly. In the meantime, you can click the 'Human' button to speak with a live agent.";
    }

    const mistral = getMistralClient();
    const systemInstruction = `You are MO Support, a helpful customer support assistant for Busmo - a comprehensive business management platform designed for African entrepreneurs.

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
- Check the help center documentation`;

    const historyToSend = conversationHistory
      .slice(-10)
      .map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text || msg.content || ''
      }));

    const messages: any[] = [
      { role: 'system', content: systemInstruction },
      ...historyToSend,
      { role: 'user', content: message },
    ];

    const result = await mistral.chat.complete({
      model: 'mistral-large-latest',
      messages,
    });

    const content = result.choices?.[0]?.message?.content;
    const text = typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content.map((part: any) => part?.type === 'text' ? part.text : '').join('')
        : '';

    return text || "I'm here to help! Could you tell me more about what you need?";
  } catch (error) {
    console.error('Error calling support AI:', error);
    return "I'm here to help! Could you tell me more about what you need?";
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
