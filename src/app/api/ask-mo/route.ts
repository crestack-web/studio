import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { detectIntent } from '@/lib/services/mo-intent-router';
import { executeAction } from '@/lib/services/mo-action-router';
import { renderResponse } from '@/lib/services/mo-response-renderer';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Get category-specific advice for AI responses
 */
function getCategorySpecificAdvice(category: string): string {
  const adviceMap: Record<string, string> = {
    retail: 'Focus on inventory turnover, customer retention, and seasonal trends.',
    restaurant: 'Focus on food cost management, table turnover, and menu optimization.',
    grocery: 'Focus on expiry management, supplier relationships, and bulk purchasing.',
    fashion: 'Focus on seasonal inventory, trend analysis, and customer preferences.',
    electronics: 'Focus on warranty management, product lifecycle, and technical support.',
    manufacturing: 'Focus on production efficiency, raw material costs, and quality control.',
    services: 'Focus on appointment scheduling, customer satisfaction, and service delivery.',
    pharmacy: 'Focus on expiry tracking, regulatory compliance, and health trends.',
    supermarket: 'Focus on multi-category management, shelf space optimization, and supplier negotiations.',
    cafe: 'Focus on ingredient costs, peak hour management, and customer experience.',
    wholesale: 'Focus on bulk pricing, distributor relationships, and volume discounts.',
    distributor: 'Focus on supply chain efficiency, logistics, and retailer relationships.',
  };
  
  return adviceMap[category.toLowerCase()] || adviceMap.retail;
}

/**
 * Detect user's conversation style from history
 */
function detectConversationStyle(conversationHistory: any[]): { style: string; tone: string; length: string } {
  if (conversationHistory.length === 0) {
    return { style: 'balanced', tone: 'professional', length: 'medium' };
  }

  const userMessages = conversationHistory.filter((msg: any) => msg.role === 'user');
  if (userMessages.length === 0) {
    return { style: 'balanced', tone: 'professional', length: 'medium' };
  }

  const recentMessages = userMessages.slice(-5);
  let totalWords = 0;
  let formalCount = 0;
  let casualCount = 0;
  let shortCount = 0;
  let longCount = 0;

  recentMessages.forEach((msg: any) => {
    const content = msg.content || '';
    const words = content.split(/\s+/).length;
    totalWords += words;

    if (/\b(please|kindly|would|could|may|regarding|concerning|appreciate)\b/i.test(content)) {
      formalCount++;
    }
    if (/\b(hey|hi|yo|what's up|gonna|wanna|gotta|cool|awesome)\b/i.test(content)) {
      casualCount++;
    }

    if (words < 10) shortCount++;
    if (words > 30) longCount++;
  });

  const avgWords = totalWords / recentMessages.length;
  
  let style = 'balanced';
  let tone = 'professional';
  let length = 'medium';

  if (formalCount > casualCount) {
    tone = 'formal';
  } else if (casualCount > formalCount) {
    tone = 'casual';
  }

  if (avgWords < 15) {
    length = 'short';
    style = 'concise';
  } else if (avgWords > 25) {
    length = 'detailed';
    style = 'detailed';
  }

  if (shortCount > longCount) {
    length = 'short';
    style = 'concise';
  } else if (longCount > shortCount) {
    length = 'detailed';
    style = 'detailed';
  }

  return { style, tone, length };
}

/**
 * Check if user has permission for an action
 */
async function checkPermission(action: string, userRole?: string, userId?: string, businessId?: string): Promise<boolean> {
  // If userRole is provided, use it
  if (userRole) {
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }

    if (userRole === 'staff') {
      const staffAllowedActions = ['record_sale', 'add_product', 'update_product'];
      return staffAllowedActions.includes(action);
    }
  }

  // If no userRole provided, try to fetch from database
  if (userId && businessId) {
    try {
      const db = getAdminDb();
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const role = userData?.role || userData?.userRole;

      if (role === 'owner' || role === 'admin') {
        return true;
      }

      if (role === 'staff') {
        const staffAllowedActions = ['record_sale', 'add_product', 'update_product'];
        return staffAllowedActions.includes(action);
      }
    } catch (error) {
      console.error('Error fetching user role for permission check:', error);
    }
  }

  // Default to allowing the action if we can't determine role
  // This prevents blocking legitimate users due to role detection issues
  console.warn(`⚠️ Permission check failed for action ${action}, allowing by default`);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, image, businessId, userId, conversationHistory = [], language = 'en', languageName = 'English', businessCategory = 'retail', userRole } = body;

    console.log('📡 [Ask MO API] Request received', {
      messageLength: message?.length,
      hasImage: !!image,
      businessId,
      language,
    });

    // Step 1: Detect intent using pattern matching
    const intent = detectIntent(message);
    console.log('🎯 [Ask MO API] Intent detected:', intent.intent, 'confidence:', intent.confidence);

    // Step 2: If we have a structured intent with data, execute it
    let actionResult = null;
    let renderedResponse = null;

    if (intent.intent !== 'unknown' && intent.intent !== 'ask_question') {
      // Check permissions
      const hasPermission = await checkPermission(intent.intent, userRole, userId, businessId);
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
        renderedResponse = renderResponse(actionResult);
        console.log('✅ [Ask MO API] Action executed and rendered');
      } catch (error) {
        console.error('❌ [Ask MO API] Error executing action:', error);
      }
    }

    // Step 3: Generate AI response for conversational context
    let businessContext = {};
    if (businessId) {
      try {
        businessContext = await getBusinessContext(businessId);
      } catch (error) {
        console.error('❌ [Ask MO API] Error loading business context:', error);
      }
    }

    const conversationStyle = detectConversationStyle(conversationHistory);
    const systemPrompt = buildSystemPrompt(businessContext, language, languageName, conversationHistory, businessCategory, conversationStyle, renderedResponse, message);

    const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!googleApiKey || googleApiKey === 'your-google-ai-api-key') {
      console.error('❌ [Ask MO API] Google Gen AI API key is missing or invalid');
      
      // Return structured response if action was executed
      if (renderedResponse) {
        return NextResponse.json({
          answer: renderedResponse.text,
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

    const genAI = new GoogleGenerativeAI(googleApiKey);
    const modelName = image ? 'gemini-pro-vision' : 'gemini-pro-latest';
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemPrompt
    });

    const chat = model.startChat({
      history: conversationHistory
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
    const finalAnswer = renderedResponse ? renderedResponse.text : text;

    return NextResponse.json({
      answer: finalAnswer,
      intent,
      actionResult,
      rendered: renderedResponse,
      businessContext,
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

/**
 * Fetch business context from Firestore
 */
async function getBusinessContext(businessId: string) {
  try {
    const db = getAdminDb();
    const context: any = {
      businessName: '',
      businessCategory: '',
      totalSales: 0,
      todaySales: 0,
      totalProfit: 0,
      todayProfit: 0,
      totalProducts: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      totalExpenses: 0,
      staffCount: 0,
      totalInventoryValue: 0,
      pendingCollections: 0,
      suppliersCount: 0,
      totalSpentOnSuppliers: 0,
      stockReceiptsCount: 0,
      stockTransfersCount: 0,
      supplierCreditBalance: 0,
      customerCreditBalance: 0,
      pendingCreditPayments: 0,
      totalBankBalance: 0,
      bankAccountsCount: 0,
      recentBankTransactions: 0,
      totalStaffActions: 0,
      staffSalesCount: 0,
      staffRevenue: 0,
      totalMoneyIn: 0,
      totalMoneyOut: 0,
      netCashFlow: 0,
    };

    const profileSnapshot = await db.collection('businesses').doc(businessId).collection('profile').limit(1).get();
    if (!profileSnapshot.empty) {
      const data = profileSnapshot.docs[0].data();
      context.businessName = data.businessName || 'Your Business';
      context.businessCategory = data.category || 'General Retail';
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesSnapshot = await db.collection('businesses').doc(businessId).collection('sales')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    context.sales = [];
    const productSalesMap = new Map<string, { quantity: number; revenue: number; profit: number }>();

    salesSnapshot.forEach(doc => {
      const data = doc.data();
      const total = data.totalRevenue || data.total || 0;
      const profit = data.profit || 0;
      const saleDate = data.createdAt?.toDate() || new Date();
      
      context.totalSales += total;
      context.totalProfit += profit;
      
      if (saleDate >= today) {
        context.todaySales += total;
        context.todayProfit += profit;
      }

      context.sales.push({
        id: doc.id,
        totalRevenue: total,
        profit: profit,
        paymentMethod: data.paymentMethod || 'cash',
        products: data.products || [],
        createdAt: saleDate,
        recordedBy: data.recordedBy?.displayName || 'Unknown',
      });

      if (data.products && Array.isArray(data.products)) {
        data.products.forEach((product: any) => {
          const productName = product.name || 'Unknown';
          const quantity = product.quantity || 0;
          const productRevenue = product.price * quantity;
          const productCost = (product.costPrice || 0) * quantity;
          const productProfit = productRevenue - productCost;

          if (!productSalesMap.has(productName)) {
            productSalesMap.set(productName, { quantity: 0, revenue: 0, profit: 0 });
          }
          const stats = productSalesMap.get(productName)!;
          stats.quantity += quantity;
          stats.revenue += productRevenue;
          stats.profit += productProfit;
        });
      }
    });

    context.bestSellingProducts = Array.from(productSalesMap.entries())
      .map(([name, stats]) => ({
        name,
        quantitySold: stats.quantity,
        totalRevenue: stats.revenue,
        totalProfit: stats.profit,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    const productsSnapshot = await db.collection('businesses').doc(businessId).collection('products')
      .where('active', '==', true)
      .limit(200)
      .get();

    context.totalProducts = productsSnapshot.size;
    context.products = [];

    let totalInventoryValue = 0;
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      const stock = data.stock || 0;
      const costPrice = data.cost || data.costPrice || 0;
      const sellingPrice = data.price || 0;
      const threshold = data.lowStockThreshold || 10;

      totalInventoryValue += stock * costPrice;

      if (stock === 0) context.outOfStockCount++;
      else if (stock <= threshold) context.lowStockCount++;

      context.products.push({
        id: doc.id,
        name: data.name || 'Unknown',
        sku: data.attributes?.sku || data.sku || null,
        stock: stock,
        unit: data.unit || 'pcs',
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        stockValue: stock * costPrice,
        category: data.category || 'General',
        supplier: data.supplier || null,
        reorderLevel: data.reorderLevel || threshold,
        lowStockThreshold: threshold,
        isLowStock: stock > 0 && stock <= threshold,
        isOutOfStock: stock === 0,
      });
    });
    context.totalInventoryValue = totalInventoryValue;

    const expensesSnapshot = await db.collection('businesses').doc(businessId).collection('expenses')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    expensesSnapshot.forEach(doc => {
      const data = doc.data();
      context.totalExpenses += data.amount || 0;
    });

    const staffSnapshot = await db.collection('businesses').doc(businessId).collection('staff')
      .where('active', '==', true)
      .limit(50)
      .get();

    context.staffCount = staffSnapshot.size;

    try {
      const pendingSnapshot = await db.collection('businesses').doc(businessId).collection('pendingBillings')
        .where('status', '==', 'pending')
        .limit(100)
        .get();
      pendingSnapshot.forEach(doc => {
        const data = doc.data();
        context.pendingCollections += data.amount || data.total || 0;
      });
    } catch (error) {
      console.error('Error fetching pending collections:', error);
    }

    try {
      const suppliersSnapshot = await db.collection('businesses').doc(businessId).collection('suppliers')
        .where('active', '==', true)
        .limit(100)
        .get();
      context.suppliersCount = suppliersSnapshot.size;
      suppliersSnapshot.forEach(doc => {
        const data = doc.data();
        context.totalSpentOnSuppliers += data.totalAmountSpent || 0;
      });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
    
    try {
      const receiptsSnapshot = await db.collection('businesses').doc(businessId).collection('stockReceipts')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .limit(100)
        .get();
      context.stockReceiptsCount = receiptsSnapshot.size;
    } catch (error) {
      console.error('Error fetching stock receipts:', error);
    }
    
    try {
      const transfersSnapshot = await db.collection('businesses').doc(businessId).collection('stockTransfers')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .limit(100)
        .get();
      context.stockTransfersCount = transfersSnapshot.size;
    } catch (error) {
      console.error('Error fetching stock transfers:', error);
    }

    try {
      const supplierCreditSnapshot = await db.collection('businesses').doc(businessId).collection('supplier_credit')
        .where('status', '==', 'active')
        .limit(100)
        .get();
      supplierCreditSnapshot.forEach(doc => {
        const data = doc.data();
        context.supplierCreditBalance += data.outstandingBalance || 0;
      });
    } catch (error) {
      console.error('Error fetching supplier credit:', error);
    }
    
    try {
      const customerCreditSnapshot = await db.collection('businesses').doc(businessId).collection('credit_customers')
        .limit(100)
        .get();
      customerCreditSnapshot.forEach(doc => {
        const data = doc.data();
        context.customerCreditBalance += data.currentBalance || 0;
      });
    } catch (error) {
      console.error('Error fetching customer credit:', error);
    }
    
    try {
      const creditTransactionsSnapshot = await db.collection('businesses').doc(businessId).collection('credit_transactions')
        .where('status', '==', 'pending')
        .limit(100)
        .get();
      creditTransactionsSnapshot.forEach(doc => {
        const data = doc.data();
        context.pendingCreditPayments += data.remainingAmount || 0;
      });
    } catch (error) {
      console.error('Error fetching credit transactions:', error);
    }

    try {
      const bankAccountsSnapshot = await db.collection('businesses').doc(businessId).collection('bankAccounts')
        .where('isActive', '==', true)
        .limit(50)
        .get();
      context.bankAccountsCount = bankAccountsSnapshot.size;
      bankAccountsSnapshot.forEach(doc => {
        const data = doc.data();
        context.totalBankBalance += data.currentBalance || 0;
      });
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
    
    try {
      const bankTransactionsSnapshot = await db.collection('businesses').doc(businessId).collection('bankTransactions')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .limit(100)
        .get();
      context.recentBankTransactions = bankTransactionsSnapshot.size;
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
    }

    try {
      const staffActivitySnapshot = await db.collection('businesses').doc(businessId).collection('staffActivity')
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .limit(100)
        .get();
      context.totalStaffActions = staffActivitySnapshot.size;
      staffActivitySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.action === 'sale') {
          context.staffSalesCount++;
          context.staffRevenue += data.amount || 0;
        }
      });
    } catch (error) {
      console.error('Error fetching staff activity:', error);
    }

    try {
      const cashFlowSnapshot = await db.collection('businesses').doc(businessId).collection('cashFlow')
        .where('date', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .limit(100)
        .get();
      cashFlowSnapshot.forEach(doc => {
        const data = doc.data();
        context.totalMoneyIn += data.moneyIn || 0;
        context.totalMoneyOut += data.moneyOut || 0;
      });
      context.netCashFlow = context.totalMoneyIn - context.totalMoneyOut;
    } catch (error) {
      console.error('Error fetching cash flow:', error);
    }

    return context;
  } catch (error) {
    console.error('❌ [Ask MO API] Error fetching business context:', error);
    return {};
  }
}

/**
 * Detect if this is a new conversation (fresh start)
 */
function isNewConversation(conversationHistory: any[], currentMessage: string): boolean {
  // No history means it's a new conversation
  if (!conversationHistory || conversationHistory.length === 0) {
    return true;
  }

  // Check if the last message was more than 30 minutes ago
  const lastMessage = conversationHistory[conversationHistory.length - 1];
  if (lastMessage && lastMessage.timestamp) {
    const lastTime = new Date(lastMessage.timestamp).getTime();
    const currentTime = Date.now();
    const timeDiff = currentTime - lastTime;
    
    // If more than 30 minutes have passed, treat as new conversation
    if (timeDiff > 30 * 60 * 1000) {
      return true;
    }
  }

  // Check if the current message is a clear new topic indicator
  const newTopicIndicators = [
    /^hey (mo|assistant)/i,
    /^hello (mo|assistant)/i,
    /^hi (mo|assistant)/i,
    /^new (question|topic|conversation)/i,
    /^start (over|again|fresh)/i,
    /^(let's talk about|i want to discuss|i need help with)/i,
  ];

  for (const pattern of newTopicIndicators) {
    if (pattern.test(currentMessage.trim())) {
      return true;
    }
  }

  return false;
}

/**
 * Build system prompt with business context
 */
function buildSystemPrompt(
  businessContext: any, 
  language: string, 
  languageName: string, 
  conversationHistory: any[] = [], 
  businessCategory: string = 'retail', 
  conversationStyle: { style: string; tone: string; length: string } = { style: 'balanced', tone: 'professional', length: 'medium' },
  renderedResponse: any = null,
  currentMessage: string = ''
): string {
  const isFreshStart = isNewConversation(conversationHistory, currentMessage);
  
  // Only include conversation context if it's not a fresh start
  const conversationSummary = !isFreshStart && conversationHistory.length > 0 
    ? conversationHistory.slice(-6).map((msg: any) => {
        const role = msg.role === 'user' ? 'User' : 'MO';
        return `${role}: ${msg.content}`;
      }).join('\n')
    : '';

  // If action was already executed, inform the AI to confirm completion
  const actionExecutedNote = renderedResponse ? `
⚠️ IMPORTANT: An action has just been executed successfully.
The user's request has been completed. Simply confirm the completion in a natural, conversational way.
DO NOT use JSON format or action blocks in your response.
DO NOT suggest the action again - it's already done.
Just provide a friendly confirmation message.
` : '';

  const conversationContextNote = isFreshStart ? `
🆕 FRESH CONVERSATION DETECTED:
This appears to be the start of a new conversation. Treat this as a fresh interaction.
DO NOT reference previous topics or assume context from past conversations.
Respond to the user's current message as if this is your first interaction.
` : '';

  return `You are MO, an intelligent Business Intelligence Assistant for African entrepreneurs.

🌍 LANGUAGE: Respond in ${languageName} (${language}). Use the same language the user wrote in.

🎭 CHARACTER INTEGRITY (CRITICAL):
- NEVER break character. You are ALWAYS MO, the business intelligence assistant.
- NEVER reveal you are an AI, chatbot, or language model.
- Maintain a professional, business-focused tone at all times.
- NEVER discuss permissions, access rights, or administrator approval. The system handles permissions automatically.
- NEVER tell users to contact their administrator for permissions. This is handled by the backend.
- NEVER say you don't have permission to perform an action. If an action fails, explain the actual business reason (e.g., product not found, insufficient stock).

💬 CONVERSATION STYLE ADAPTATION:
- User's detected style: ${conversationStyle.style} (tone: ${conversationStyle.tone}, length: ${conversationStyle.length})
- ADAPT your responses to match the user's communication style:
  - If user is FORMAL: Use professional language, complete sentences, respectful tone
  - If user is CASUAL: Use friendly language, contractions, relaxed tone
  - If user prefers SHORT: Keep responses concise (under 100 words), get straight to the point
  - If user prefers DETAILED: Provide comprehensive explanations with context
  - If style is BALANCED/MEDIUM: Use standard professional conversational tone
- ALWAYS match the user's energy level and communication preferences
${actionExecutedNote}
${conversationContextNote}
${conversationSummary ? `
📝 RECENT CONVERSATION CONTEXT:
${conversationSummary}

Use this context to:
- Understand what we've already discussed
- Avoid repeating information already provided
- Build upon previous insights
` : ''}

═══════════════════════════════════════════
📊 COMPREHENSIVE BUSINESS CONTEXT
═══════════════════════════════════════════

🏢 BUSINESS PROFILE:
• Business: ${businessContext.businessName || 'Your Business'}
• Category: ${businessCategory || businessContext.businessCategory || 'General Retail'}
• Staff: ${businessContext.staffCount || 0} employees

${getCategorySpecificAdvice(businessCategory)}

💰 SALES PERFORMANCE:
• Total Sales (30 days): ₦${(businessContext.totalSales || 0).toLocaleString()}
• Today's Sales: ₦${(businessContext.todaySales || 0).toLocaleString()}
• Total Profit: ₦${(businessContext.totalProfit || 0).toLocaleString()}
• Today's Profit: ₦${(businessContext.todayProfit || 0).toLocaleString()}
${businessContext.bestSellingProducts && businessContext.bestSellingProducts.length > 0 ? `
• Best-Selling Products (Top 5):
${businessContext.bestSellingProducts.slice(0, 5).map((p: any, i: number) => `  ${i + 1}. ${p.name}: ${p.quantitySold} sold (₦${p.totalRevenue.toLocaleString()})`).join('\n')}` : ''}

📦 INVENTORY STATUS:
• Total Products: ${businessContext.totalProducts || 0}
• Total Inventory Value: ₦${(businessContext.totalInventoryValue || 0).toLocaleString()} (calculated using cost price)
• ⚠️ OUT OF STOCK: ${businessContext.outOfStockCount || 0} products
• 🔴 LOW STOCK: ${businessContext.lowStockCount || 0} products
${businessContext.products && businessContext.products.length > 0 ? `
• Low Stock Items:
${businessContext.products.filter((p: any) => p.isLowStock).slice(0, 10).map((p: any) => `  - ${p.name}: ${p.stock} ${p.unit} (threshold: ${p.lowStockThreshold})`).join('\n') || '  None'}
• Out of Stock Items:
${businessContext.products.filter((p: any) => p.isOutOfStock).slice(0, 10).map((p: any) => `  - ${p.name}`).join('\n') || '  None'}` : ''}

💵 EXPENSES:
• Total Expenses (30 days): ₦${(businessContext.totalExpenses || 0).toLocaleString()}

🏦 BANKING & CASH FLOW:
• Total Bank Balance: ₦${(businessContext.totalBankBalance || 0).toLocaleString()}
• Bank Accounts: ${businessContext.bankAccountsCount || 0}
• Recent Transactions (30 days): ${businessContext.recentBankTransactions || 0}
• Money In (30 days): ₦${(businessContext.totalMoneyIn || 0).toLocaleString()}
• Money Out (30 days): ₦${(businessContext.totalMoneyOut || 0).toLocaleString()}
• Net Cash Flow: ₦${(businessContext.netCashFlow || 0).toLocaleString()}

👥 STAFF PERFORMANCE:
• Staff Count: ${businessContext.staffCount || 0}
• Staff Sales (30 days): ${businessContext.staffSalesCount || 0}
• Staff Revenue: ₦${(businessContext.staffRevenue || 0).toLocaleString()}
• Total Staff Actions: ${businessContext.totalStaffActions || 0}

🤝 SUPPLIERS & CREDIT:
• Active Suppliers: ${businessContext.suppliersCount || 0}
• Total Spent on Suppliers: ₦${(businessContext.totalSpentOnSuppliers || 0).toLocaleString()}
• Stock Receipts (30 days): ${businessContext.stockReceiptsCount || 0}
• Stock Transfers (30 days): ${businessContext.stockTransfersCount || 0}
• Supplier Credit Balance: ₦${(businessContext.supplierCreditBalance || 0).toLocaleString()}
• Customer Credit Balance: ₦${(businessContext.customerCreditBalance || 0).toLocaleString()}
• Pending Credit Payments: ₦${(businessContext.pendingCreditPayments || 0).toLocaleString()}
• Pending Collections: ₦${(businessContext.pendingCollections || 0).toLocaleString()}

═══════════════════════════════════════════

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

DO NOT say:
- "You can record this on the Sales page"
- "Go to Products to add this item"
- "Navigate to Expenses to track this"
- "You don't have permission to do this"
- "Contact your administrator for access"
- "Sales Permission" or "Expense Permission"

DO say:
- "I'll record that sale for you right away."
- "Let me add that product to your inventory."
- "I'll track that expense for you."

The backend system will handle:
- Business ID, User ID, Branch ID, Warehouse ID
- Currency, Country, Business Category
- Financial Year context
- Inventory updates, profit calculations
- Dashboard metric refreshes

You NEVER need to ask users for these values - they are injected automatically.

Navigation is ONLY for explicit requests like:
- "Open Products page"
- "Take me to Dashboard"
- "Go to Inventory"

CRITICAL: Respond with natural text only. Do NOT use JSON, XML, or action blocks in your response.`;
}