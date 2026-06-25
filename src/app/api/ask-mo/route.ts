import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, image, businessId, userId, conversationHistory = [], language = 'en', languageName = 'English', businessCategory = 'retail' } = body;

    console.log('📡 [Ask MO API] Request received', {
      messageLength: message?.length,
      hasImage: !!image,
      businessId,
      language,
    });

    // Fetch business context
    let businessContext = {};
    if (businessId) {
      try {
        businessContext = await getBusinessContext(businessId);
        console.log('✅ [Ask MO API] Business context loaded');
      } catch (error) {
        console.error('❌ [Ask MO API] Error loading business context:', error);
      }
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(businessContext, language, languageName, conversationHistory, businessCategory);

    // Initialize Google AI
    const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!googleApiKey || googleApiKey === 'your-google-ai-api-key') {
      console.error('❌ [Ask MO API] Google Gen AI API key is missing or invalid');
      return NextResponse.json(
        { error: 'Google Gen AI API key is not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro-latest',
      systemInstruction: systemPrompt
    });

    // Generate response with retry mechanism
    const chat = model.startChat({
      history: conversationHistory.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    });

    // Retry logic with exponential backoff
    let result;
    let lastError;
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Google AI API timeout after 30 seconds')), 30000);
        });

        result = await Promise.race([
          chat.sendMessage(message),
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

    return NextResponse.json({
      answer: text,
      businessContext,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Ask MO API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide helpful error message for API key issues
    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      return NextResponse.json(
        { 
          error: 'Google AI model not found or API key issue',
          message: 'The Google AI API key may not have access to the requested model. Please check that your GOOGLE_GENAI_API_KEY is valid and has access to Gemini models. Visit https://console.cloud.google.com/apis/credentials to verify your API key.',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', message: errorMessage },
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
      // Additional comprehensive data
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

    // Fetch business profile
    const profileSnapshot = await db.collection('businesses').doc(businessId).collection('profile').limit(1).get();
    if (!profileSnapshot.empty) {
      const data = profileSnapshot.docs[0].data();
      context.businessName = data.businessName || 'Your Business';
      context.businessCategory = data.category || 'General Retail';
    }

    // Fetch sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesSnapshot = await db.collection('businesses').doc(businessId).collection('sales')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    salesSnapshot.forEach(doc => {
      const data = doc.data();
      const total = data.total || 0;
      const profit = data.profit || 0;
      const saleDate = data.createdAt?.toDate() || new Date();
      
      context.totalSales += total;
      context.totalProfit += profit;
      
      if (saleDate >= today) {
        context.todaySales += total;
        context.todayProfit += profit;
      }
    });

    // Fetch products
    const productsSnapshot = await db.collection('businesses').doc(businessId).collection('products')
      .where('active', '==', true)
      .limit(200)
      .get();

    context.totalProducts = productsSnapshot.size;

    let totalInventoryValue = 0;
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      const stock = data.stock || 0;
      const price = data.price || data.costPrice || 0;
      const threshold = data.lowStockThreshold || 10;

      totalInventoryValue += stock * price;

      if (stock === 0) context.outOfStockCount++;
      else if (stock <= threshold) context.lowStockCount++;
    });
    context.totalInventoryValue = totalInventoryValue;

    // Fetch expenses
    const expensesSnapshot = await db.collection('businesses').doc(businessId).collection('expenses')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    expensesSnapshot.forEach(doc => {
      const data = doc.data();
      context.totalExpenses += data.amount || 0;
    });

    // Fetch staff
    const staffSnapshot = await db.collection('businesses').doc(businessId).collection('staff')
      .where('active', '==', true)
      .limit(50)
      .get();

    context.staffCount = staffSnapshot.size;

    // Fetch pending collections (credit sales)
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

    // Fetch suppliers
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

    // Fetch stock receipts
    try {
      const receiptsSnapshot = await db.collection('businesses').doc(businessId).collection('stockReceipts')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .limit(100)
        .get();
      context.stockReceiptsCount = receiptsSnapshot.size;
    } catch (error) {
      console.error('Error fetching stock receipts:', error);
    }

    // Fetch stock transfers
    try {
      const transfersSnapshot = await db.collection('businesses').doc(businessId).collection('stockTransfers')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .limit(100)
        .get();
      context.stockTransfersCount = transfersSnapshot.size;
    } catch (error) {
      console.error('Error fetching stock transfers:', error);
    }

    // Fetch supplier credit
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

    // Fetch customer credit
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

    // Fetch pending credit payments
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

    // Fetch bank accounts
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

    // Fetch bank transactions
    try {
      const bankTransactionsSnapshot = await db.collection('businesses').doc(businessId).collection('bankTransactions')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .limit(100)
        .get();
      context.recentBankTransactions = bankTransactionsSnapshot.size;
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
    }

    // Fetch staff activity
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

    // Fetch cash flow
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
 * Build system prompt with business context
 */
function buildSystemPrompt(businessContext: any, language: string, languageName: string, conversationHistory: any[] = [], businessCategory: string = 'retail'): string {
  const conversationSummary = conversationHistory.slice(-6).map((msg: any) => {
    const role = msg.role === 'user' ? 'User' : 'MO';
    return `${role}: ${msg.content}`;
  }).join('\n');

  return `You are MO, an intelligent Business Intelligence Assistant for African entrepreneurs.

🌍 LANGUAGE: Respond in ${languageName} (${language}). Use the same language the user wrote in.

🎭 CHARACTER INTEGRITY (CRITICAL):
- NEVER break character. You are ALWAYS MO, the business intelligence assistant.
- NEVER reveal you are an AI, chatbot, or language model.
- Maintain a professional, business-focused tone at all times.

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

📦 INVENTORY STATUS:
• Total Products: ${businessContext.totalProducts || 0}
• Total Inventory Value: ₦${(businessContext.totalInventoryValue || 0).toLocaleString()}
• ⚠️ OUT OF STOCK: ${businessContext.outOfStockCount || 0} products
• 🔴 LOW STOCK: ${businessContext.lowStockCount || 0} products

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

🎯 RESPONSE FRAMEWORK:
Structure your responses using this 4-part framework:
1. OBSERVATION: What you noticed in the data
2. INSIGHT: What it means for their business
3. RECOMMENDATION: What they should do about it
4. FOLLOW-UP QUESTION: Engage them in the next step

🗣️ CONVERSATIONAL TONE:
Sound like a knowledgeable business advisor, NOT a system.
PREFER: "I noticed", "One thing that stands out", "You might want to consider"
AVOID: "According to the data", "The system indicates", "Based on records"

📋 GUIDELINES:
1. Be SPECIFIC — use actual numbers from the data above
2. Be ACTIONABLE — tell them exactly what to do
3. Be ENCOURAGING — celebrate wins, address concerns constructively
4. Be CONVERSATIONAL — write like a human advisor, not a report generator
5. PRIORITIZE — address urgent issues first (out of stock, negative cash flow)
6. Use NIGERIAN/AFRICAN BUSINESS CONTEXT — understand local market realities
7. Format numbers with commas (e.g., 1,000)
8. Keep responses under 250 words unless explaining complex analysis
9. MAINTAIN CHARACTER — never break your role as MO
10. BUSINESS ONLY — refuse to discuss non-business topics and redirect politely`;
}

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
