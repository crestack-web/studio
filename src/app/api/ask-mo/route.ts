import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminDb } from '@/lib/firebase-admin';
import { detectIntent } from '@/lib/services/mo-intent-router';
import { executeAction } from '@/lib/services/mo-action-router';
import { renderResponse } from '@/lib/services/mo-response-renderer';

// Define the actual page names for navigation guidance
const PAGE_NAMES = {
  dashboard: "Dashboard",
  products: "Products",
  inventory: "Inventory",
  sales: "Record Sale",
  expenses: "Expenses",
  reports: "Reports",
  analytics: "Analytics",
  customers: "Customers",
  suppliers: "Suppliers",
  staff: "Staff",
  ask_mo: "Ask MO",
  settings: "Settings"
};

const BUSINESS_CONTEXT_PROMPT = `
You are MO, a business intelligence assistant for Busmo SaaS platform. You help business owners manage their operations.

TEXT COMMAND FORMATTING GUIDELINES:
- Use explicit action prefixes: "Record sale:", "Add expense:", "Add product:"
- Include currency symbols with amounts: "₦5000" instead of "5000"
- Specify units clearly: "5 bottles", "10 pieces", etc.
- Separate operations into individual commands rather than combining multiple operations
- Use clear, direct language avoiding ambiguous terms like "that thing" or "stuff"

BUSINESS DATA STRUCTURE:
- Sales data is stored in 'sales' collection under businesses/{businessId}/sales
- Product/inventory data is in businesses/{businessId}/products
- Expense data is in businesses/{businessId}/expenses
- Customer data is in businesses/{businessId}/customers
- Supplier data is in businesses/{businessId}/suppliers
- Staff data is in businesses/{businessId}/staff

PAGE NAVIGATION REFERENCE:
- Dashboard/Home page is accessed via "${PAGE_NAMES.dashboard}" in the sidebar
- Products/Inventory page is accessed via "${PAGE_NAMES.products}" or "${PAGE_NAMES.inventory}" in the sidebar
- Sales page is accessed via "${PAGE_NAMES.sales}" in the sidebar
- Expenses page is accessed via "${PAGE_NAMES.expenses}" in the sidebar
- Reports page is accessed via "${PAGE_NAMES.reports}" or "${PAGE_NAMES.analytics}" in the sidebar
- Customers page is accessed via "${PAGE_NAMES.customers}" in the sidebar
- Staff page is accessed via "${PAGE_NAMES.staff}" in the sidebar (for Pro users)
- MO Assistant page is accessed via "${PAGE_NAMES.ask_mo}" in the sidebar
- Suppliers page is accessed via "${PAGE_NAMES.suppliers}" in the sidebar
- Settings page is accessed via "${PAGE_NAMES.settings}" in the sidebar

USER ACCESS LEVELS:
- Owner/Admin: Full access to all pages
- Manager: Access to most operational pages but limited settings access
- Cashier/Sales Staff: Access to POS, inventory lookup, and basic reporting
- View-only Staff: Access to dashboard and limited reports only

BUSINESS TYPES SUPPORTED:
- Retail: General retail shops
- Restaurant: Food service establishments
- Wholesale: Bulk goods distribution
- Service: Service-based businesses
- Manufacturing: Production-based businesses
- E-commerce: Online businesses

When suggesting navigation, always use the exact sidebar button names as referenced above.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, image, businessId, userId, conversationHistory = [], language = 'en', languageName = 'English', businessCategory = 'retail', userRole } = body;

    console.log('📡 [Ask MO API] Request received', {
      messageLength: message?.length,
      hasImage: !!image,
      businessId,
      language,
      conversationHistoryLength: conversationHistory.length,
    });

    // Detect if this is a new conversation start (greeting, new topic, etc.)
    const isNewConversation = conversationHistory.length === 0 || 
      /^(hi|hello|hey|good morning|good afternoon|good evening|mo|hey mo|start new|new chat|fresh start)/i.test(message.trim());

    // If it's a new conversation, clear conversation history to prevent context bleeding
    const effectiveHistory = isNewConversation ? [] : conversationHistory;

    if (isNewConversation) {
      console.log('🆕 [Ask MO API] New conversation detected, clearing history');
    }

    // Step 1: Detect intent using pattern matching
    const intent = detectIntent(message);
    console.log('🎯 [Ask MO API] Intent detected:', intent.intent, 'confidence:', intent.confidence);

    // Step 2: If we have a structured intent with data, execute it
    let actionResult = null;
    let renderedResponse = null;

    if (intent.intent !== 'unknown' && intent.intent !== 'ask_question') {
      // Check permissions (inline implementation)
      const hasPermission = userRole === 'owner' || userRole === 'admin' || 
        (userRole === 'staff' && ['record_sale', 'add_product', 'update_product'].includes(intent.intent));
      
      if (!hasPermission) {
        return NextResponse.json({
          answer: `Sorry, you don't have permission to ${intent.intent.replace('_', ' ')}. Please contact your administrator.`,
          intent,
          permissionDenied: true,
          timestamp: new Date().toISOString()
        });
      }

      // Execute action
      try {
        const db = getAdminDb();
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        actionResult = await executeAction(intent, {
          businessId,
          userId,
          userEmail: userData?.email,
          userName: userData?.name,
          userRole: userRole || userData?.role,
          staffId: userData?.staffId,
        });

        // Render the result
        renderedResponse = renderResponse(actionResult.message || actionResult.data?.message || 'Action completed', actionResult, intent);
        console.log('✅ [Ask MO API] Action executed and rendered');
      } catch (error) {
        console.error('❌ [Ask MO API] Error executing action:', error);
      }
    }

    // Step 3: Generate AI response for conversational context
    const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!googleApiKey || googleApiKey === 'your-google-ai-api-key') {
      console.error('❌ [Ask MO API] Google Gen AI API key is missing or invalid');
      
      // Return structured response if action was executed
      if (renderedResponse) {
        return NextResponse.json({
          answer: renderedResponse.content,
          rendered: renderedResponse,
          actionResult,
          intent,
          timestamp: new Date().toISOString()
        });
      }
      
      return NextResponse.json(
        { error: 'Google Gen AI API key is not configured' },
        { status: 500 }
      );
    }

    // Build simple system prompt inline
    const systemPrompt = `${BUSINESS_CONTEXT_PROMPT}

🌍 LANGUAGE: Respond in ${languageName} (${language}). Use the same language the user wrote in.

🎭 CHARACTER INTEGRITY (CRITICAL):
- NEVER break character. You are ALWAYS MO, the business intelligence assistant.
- NEVER reveal you are an AI, chatbot, or language model.
- Maintain a professional, business-focused tone at all times.
- NEVER discuss permissions, access rights, or administrator approval. The system handles permissions automatically.
- NEVER tell users to contact their administrator for permissions. This is handled by the backend.
- NEVER say you don't have permission to perform an action. If an action fails, explain the actual business reason (e.g., product not found, insufficient stock).

🎯 OPERATIONAL BEHAVIOR (CRITICAL):
You are an OPERATIONAL AI ASSISTANT that EXECUTES business operations directly.
NEVER navigate users to pages unless they EXPLICITLY request navigation.
When users request operational tasks, you MUST:
1. Detect the intent (record sale, add product, record expense, etc.)
2. Extract all available parameters from their message
3. If information is missing, ask ONLY for the missing fields
4. When enough information exists, the system will automatically execute the backend operation
5. Wait for the backend response
6. Communicate the outcome naturally and conversationally

CRITICAL: Respond with natural text only. Do NOT use JSON, XML, or action blocks in your response.`;

    const genAI = new GoogleGenerativeAI(googleApiKey);
    const modelName = image ? 'gemini-pro-vision' : 'gemini-pro-latest';
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemPrompt
    });

    const chat = model.startChat({
      history: effectiveHistory
        .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
        .filter((history: any, index: number, arr: any[]) => {
          // Ensure first message is from user
          if (index === 0 && history.role !== 'user') return false;
          return true;
        })
    });

    let result;
    let lastError;
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Google AI API timeout after 30 seconds')), 30000);
        });

        let messageParts;
        if (image) {
          messageParts = [
            { text: message },
            { inlineData: { mimeType: image.mimeType || 'image/jpeg', data: image.data } }
          ];
        } else {
          messageParts = [{ text: message }];
        }

        result = await Promise.race([
          chat.sendMessage(messageParts),
          timeoutPromise
        ]) as any;

        break;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ [Ask MO API] Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`🔄 [Ask MO API] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!result) {
      throw lastError || new Error('Failed to generate response after retries');
    }

    const response = result.response;
    const text = response.text();

    console.log('✅ [Ask MO API] Response generated');

    // If action was executed, use the rendered response instead of raw AI text
    const finalAnswer = renderedResponse ? renderedResponse.content : text;

    return NextResponse.json({
      answer: finalAnswer,
      intent,
      actionResult,
      rendered: renderedResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Ask MO API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    console.error('❌ [Ask MO API] Error details:', {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
    });
    
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return NextResponse.json(
        { 
          error: 'Google AI model not found or API key issue',
          message: 'The Google AI API key may not have access to the requested model. Please check that your GOOGLE_GENAI_API_KEY is valid.',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('API key') || errorMessage.includes('GENAI_API_KEY')) {
      return NextResponse.json(
        { 
          error: 'Google AI API key configuration error',
          message: 'The Google AI API key is not configured or invalid. Please check your environment variables.',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return NextResponse.json(
        { 
          error: 'Request timeout',
          message: 'The request to Google AI timed out. Please try again.',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage, details: errorStack },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, businessId, userId } = body;

    if (!action || !businessId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, businessId, userId' },
        { status: 400 }
      );
    }

    console.log('🎯 [Ask MO API] Executing action:', action.action);

    const result = await executeAction(action, {
      businessId,
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [Ask MO API] Error executing action:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage, message: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
