import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { defineSecret } from 'firebase-functions/params';

// Define secrets
const googleAiKeySecret = defineSecret('GOOGLE_GENAI_API_KEY');
const paystackSecretKeySecret = defineSecret('PAYSTACK_SECRET_KEY');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

/**
 * Ask MO API - Firebase Function
 * Handles AI-powered business intelligence queries
 */
export const askMo = functions.https.onRequest(
  { secrets: [googleAiKeySecret], region: 'us-central1', invoker: 'public' },
  async (req, res) => {
    // Set CORS headers for all responses
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      console.log('🚀 [Ask MO Function] Request received');
      
      const { message, image, businessId, language = 'en', languageName = 'English', userId, conversationHistory = [] } = req.body;

      console.log('🤖 [Ask MO Function] Request details:', {
        message: message?.substring(0, 100),
        hasImage: !!image,
        businessId: businessId || 'not provided',
        language: language || 'en',
        userId: userId || 'not provided',
      });

      // Get Google AI API key from secret
      const googleApiKey = googleAiKeySecret.value();

      // Validate Google AI API key
      if (!googleApiKey) {
        console.error('❌ [Ask MO Function] Google Gen AI API key is missing');
        res.status(500).json({
          error: 'Google Gen AI API key is missing',
          code: 'ENV_GOOGLE_AI_KEY_MISSING',
          source: 'ENVIRONMENT',
          details: {},
          timestamp: new Date().toISOString()
        });
        return;
      }

    // Fetch business context
    let businessContext = {};
    if (businessId) {
      try {
        businessContext = await getBusinessContext(businessId);
        console.log('✅ [Ask MO Function] Business context loaded');
      } catch (error) {
        console.error('❌ [Ask MO Function] Error loading business context:', error);
      }
    }

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build system prompt
    buildSystemPrompt(businessContext, language, languageName, conversationHistory);

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
    const baseDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout for the API call
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Google AI API timeout after 30 seconds')), 30000);
        });

        result = await Promise.race([
          chat.sendMessage(message),
          timeoutPromise
        ]) as any;

        // If successful, break out of retry loop
        break;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ [Ask MO Function] Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`🔄 [Ask MO Function] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!result) {
      throw lastError || new Error('Failed to generate response after retries');
    }

    const response = result.response;
    const text = response.text();

    console.log('✅ [Ask MO Function] Response generated');

    res.json({
      response: text,
      businessContext,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Ask MO Function] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Fetch business context from Firestore
 */
async function getBusinessContext(businessId: string) {
  try {
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
    };

    // Fetch business profile
    const profileDoc = await db.collection('businesses').doc(businessId).collection('profile').limit(1).get();
    if (!profileDoc.empty) {
      const data = profileDoc.docs[0].data();
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
    
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      const stock = data.stock || 0;
      const threshold = data.lowStockThreshold || 10;
      
      if (stock === 0) context.outOfStockCount++;
      else if (stock <= threshold) context.lowStockCount++;
    });

    // Fetch expenses
    const expensesSnapshot = await db.collection('businesses').doc(businessId).collection('expenses')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
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

    return context;
  } catch (error) {
    console.error('❌ [Ask MO Function] Error fetching business context:', error);
    return {};
  }
}

/**
 * Build system prompt with business context
 */
function buildSystemPrompt(businessContext: any, language: string, languageName: string, conversationHistory: any[] = []): string {
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
• Category: ${businessContext.businessCategory || 'General Retail'}
• Staff: ${businessContext.staffCount || 0} employees

💰 SALES PERFORMANCE:
• Total Sales (30 days): ₦${(businessContext.totalSales || 0).toLocaleString()}
• Today's Sales: ₦${(businessContext.todaySales || 0).toLocaleString()}
• Total Profit: ₦${(businessContext.totalProfit || 0).toLocaleString()}
• Today's Profit: ₦${(businessContext.todayProfit || 0).toLocaleString()}

📦 INVENTORY STATUS:
• Total Products: ${businessContext.totalProducts || 0}
• ⚠️ OUT OF STOCK: ${businessContext.outOfStockCount || 0} products
• 🔴 LOW STOCK: ${businessContext.lowStockCount || 0} products

💵 EXPENSES:
• Total Expenses (30 days): ₦${(businessContext.totalExpenses || 0).toLocaleString()}

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
 * Initialize Payment - Firebase Function
 * Initializes Paystack payment transaction
 */
export const initializePayment = functions.https.onRequest(
  { secrets: [paystackSecretKeySecret] },
  async (req, res) => {
    // Set CORS headers for all responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      console.log('💳 [Initialize Payment] Request received');
      const { email, amount, plan, userId, billing, metadata } = req.body;

      if (!email || !amount) {
        res.status(400).json({ error: 'Missing required fields: email, amount' });
        return;
      }

      const paystackSecretKey = paystackSecretKeySecret.value();

      if (!paystackSecretKey) {
        console.error('❌ [Initialize Payment] Paystack secret key not configured');
        res.status(500).json({ error: 'Paystack secret key not configured' });
        return;
      }

    const paystackAmount = Math.round(amount * 100);
    const paystackCurrency = 'NGN';

    // Determine callback URL based on payment type
    const paymentType = metadata?.payment_type || (billing === 'yearly' ? 'yearly_subscription' : 'monthly_subscription');
    const callbackUrl = paymentType === 'credit_purchase'
      ? `${process.env.PUBLIC_APP_URL || 'https://busmo.io'}/dashboard`
      : `${process.env.PUBLIC_APP_URL || 'https://busmo.io'}/subscribe/success`;

    console.log('💳 [Initialize Payment] Paystack request:', { email, amount: paystackAmount, currency: paystackCurrency, paymentType, callbackUrl });

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: paystackAmount,
        currency: paystackCurrency,
        metadata: {
          plan,
          userId: userId || 'guest',
          payment_type: paymentType,
          billing: billing || 'monthly',
          originalAmount: amount,
          currency: paystackCurrency,
          ...metadata,
        },
        callback_url: callbackUrl,
        channels: ['card', 'bank_transfer', 'ussd', 'qr'],
      }),
    });

    const data: any = await response.json();
    console.log('💳 [Initialize Payment] Paystack response:', data);

    if (!data.status) {
      res.status(400).json({ error: data.message || 'Payment initialization failed' });
      return;
    }

    // Save payment reference to Firestore
    if (userId) {
      try {
        await db.collection('payments').doc(data.data.reference).set({
          reference: data.data.reference,
          access_code: data.data.access_code,
          authorization_url: data.data.authorization_url,
          plan,
          userId,
          email,
          amount,
          currency: paystackCurrency,
          billing: billing || 'monthly',
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('💳 [Initialize Payment] Payment saved to Firestore');
      } catch (firestoreError) {
        console.error('❌ [Initialize Payment] Firestore save failed:', firestoreError);
      }
    }

    res.json({ data: data.data });
  } catch (error) {
    console.error('❌ [Initialize Payment] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verify Payment - Firebase Function
 * Verifies Paystack transaction and updates user subscription
 */
export const verifyPayment = functions.https.onRequest(
  { secrets: [paystackSecretKeySecret] },
  async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      console.log('✅ [Verify Payment] Request received');
      const { reference } = req.body;

      if (!reference) {
        res.status(400).json({ error: 'Reference is required' });
        return;
      }

      const paystackSecretKey = paystackSecretKeySecret.value();

      if (!paystackSecretKey) {
        console.error('❌ [Verify Payment] Paystack secret key not configured');
        res.status(500).json({ error: 'Paystack secret key not configured' });
        return;
      }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data: any = await response.json();
    console.log('✅ [Verify Payment] Paystack response:', data);

    if (!data.status || data.data.status !== 'success') {
      res.status(400).json({ error: 'Transaction verification failed' });
      return;
    }

    const transactionData = data.data;
    const metadata = transactionData.metadata;

    // Check both subscriptionPayments and payments collections
    let paymentRef = db.collection('subscriptionPayments').doc(reference);
    let paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      paymentRef = db.collection('payments').doc(reference);
      paymentDoc = await paymentRef.get();
    }

    if (paymentDoc.exists) {
      await paymentRef.update({
        status: 'success',
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        transactionData,
      });
    }

    // Update user subscription status
    let userId = metadata?.userId;
    if (!userId && paymentDoc.exists) {
      const paymentData = paymentDoc.data();
      userId = paymentData?.userId;
    }

    if (userId) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        let plan = metadata?.plan;
        if (!plan && paymentDoc.exists) {
          const paymentData = paymentDoc.data();
          plan = paymentData?.plan;
        }

        let billing = metadata?.billing;
        if (!billing && paymentDoc.exists) {
          const paymentData = paymentDoc.data();
          billing = paymentData?.billing;
        }

        plan = plan || 'starter';
        const subscriptionEndDate = new Date();

        if (billing === 'yearly') {
          subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
        } else {
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        }

        await userRef.update({
          subscriptionStatus: 'active',
          subscriptionPlan: plan,
          subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
          subscriptionEndDate: admin.firestore.Timestamp.fromDate(subscriptionEndDate),
          lastPaymentReference: reference,
          lastPaymentAmount: transactionData.amount / 100,
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('✅ [Verify Payment] User subscription updated');
      }
    }

    res.json({ data: transactionData });
  } catch (error) {
    console.error('❌ [Verify Payment] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Paystack Webhook - Firebase Function
 * Handles Paystack webhook events
 */
export const paystackWebhook = functions.https.onRequest(
  { secrets: [paystackSecretKeySecret] },
  async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Paystack-Signature');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      console.log('🔔 [Paystack Webhook] Request received');
      const event = req.body;

      // Verify webhook signature (optional but recommended)
      const signature = req.headers['x-paystack-signature'] as string;
      const paystackSecretKey = paystackSecretKeySecret.value();
      
      if (signature && paystackSecretKey) {
        const crypto = require('crypto');
        const hash = crypto.createHmac('sha512', paystackSecretKey).update(JSON.stringify(req.body)).digest('hex');
        if (hash !== signature) {
          console.error('❌ [Paystack Webhook] Invalid signature');
          res.status(401).json({ error: 'Invalid signature' });
          return;
        }
      }

    console.log('🔔 [Paystack Webhook] Event:', event.event);

    // Handle successful payment
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      console.log('💰 [Paystack Webhook] Payment successful:', reference);

      // Update payment status in Firestore
      const paymentRef = db.collection('payments').doc(reference);
      const paymentDoc = await paymentRef.get();

      if (paymentDoc.exists) {
        await paymentRef.update({
          status: 'success',
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          webhookData: event.data,
        });
        console.log('💰 [Paystack Webhook] Payment updated in Firestore');
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ [Paystack Webhook] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
