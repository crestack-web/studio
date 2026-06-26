import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { recordSale, findProductByName } from '@/lib/services/record-sale-service';
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

    // Detect formality
    if (/\b(please|kindly|would|could|may|regarding|concerning|appreciate)\b/i.test(content)) {
      formalCount++;
    }
    if (/\b(hey|hi|yo|what's up|gonna|wanna|gotta|cool|awesome)\b/i.test(content)) {
      casualCount++;
    }

    // Detect length preference
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
 * Execute action (create product or record sale)
 */
async function executeAction(action: any, businessId: string, userId: string): Promise<{ success: boolean; message: string; data: any }> {
  const db = getAdminDb();
  
  try {
    if (action.action === 'add_product') {
      const data = action.data;
      
      // Check if product with same name already exists
      const existingProductQuery = await db.collection('businesses').doc(businessId).collection('products')
        .where('name', '==', data.name)
        .where('active', '==', true)
        .limit(1)
        .get();
      
      if (!existingProductQuery.empty) {
        return { 
          success: false, 
          message: `A product named "${data.name}" already exists in your inventory. Please use a different name or update the existing product.`, 
          data: null 
        };
      }

      // Validate required fields
      if (!data.name || !data.name.trim()) {
        return { success: false, message: 'Product name is required', data: null };
      }
      if (!data.category) {
        return { success: false, message: 'Product category is required', data: null };
      }
      
      // Only require selling price for non-ingredient products
      const isIngredient = data.productType === 'ingredient';
      if (!isIngredient && (!data.price || parseFloat(data.price) <= 0)) {
        return { success: false, message: 'Selling price is required and must be greater than 0', data: null };
      }
      
      // Cost price is required for all products including ingredients
      if (!data.costPrice || parseFloat(data.costPrice) <= 0) {
        return { success: false, message: 'Cost price is required and must be greater than 0', data: null };
      }

      // Handle image upload if provided
      let imageUrl = '';
      if (data.imageData) {
        try {
          // Convert base64 to buffer
          const base64Data = data.imageData.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Initialize Firebase Storage
          const storage = getStorage();
          const imageRef = ref(storage, `products/${businessId}/${Date.now()}_product.jpg`);
          
          await uploadBytes(imageRef, buffer);
          imageUrl = await getDownloadURL(imageRef);
          console.log('✅ Product image uploaded successfully');
        } catch (uploadError) {
          console.error('❌ Image upload failed:', uploadError);
          // Continue without image rather than failing
        }
      }

      // Generate SKU if not provided
      const sku = data.sku && data.sku.trim() ? data.sku.trim() : `SKU-${Date.now()}`;

      // Build product data matching Add Product page structure
      const productData: any = {
        name: data.name.trim(),
        description: data.description || '',
        category: data.category,
        price: isIngredient ? 0 : (parseFloat(data.price) || 0),
        cost: parseFloat(data.costPrice) || 0,
        stock: parseInt(data.stock) || 0,
        lowStockThreshold: parseInt(data.lowStockThreshold) || 5,
        active: true,
        attributes: {
          emoji: data.emoji || (isIngredient ? '🥘' : '📦'),
          sku: sku,
        },
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };

      // Add product type for restaurant businesses
      if (data.productType) {
        productData.productType = data.productType;
      }

      // Add image URL if uploaded
      if (imageUrl) {
        productData.imageUrl = imageUrl;
      }

      // Add optional fields if provided
      if (data.imageUrl) {
        productData.imageUrl = data.imageUrl;
      }
      if (data.unit) {
        productData.unit = data.unit;
      }
      if (data.supplier) {
        productData.supplier = data.supplier;
      }
      if (data.reorderLevel !== undefined) {
        productData.reorderLevel = parseInt(data.reorderLevel) || 0;
      }

      // Handle stock by location for wholesale/distributor
      if (data.stockByLocation) {
        productData.stockByLocation = data.stockByLocation;
      }

      const docRef = await db.collection('businesses').doc(businessId).collection('products').add(productData);
      return { 
        success: true, 
        message: `Product "${data.name}" added successfully with SKU: ${sku}${imageUrl ? ' and image' : ''}`, 
        data: { 
          productId: docRef.id,
          product: {
            id: docRef.id,
            name: data.name,
            sku,
            category: data.category,
            price: isIngredient ? 0 : parseFloat(data.price),
            cost: parseFloat(data.costPrice) || 0,
            stock: parseInt(data.stock) || 0,
            imageUrl: imageUrl || null,
            productType: data.productType || 'product',
          }
        } 
      };
    }

    if (action.action === 'record_sale') {
      const data = action.data;
      
      // Find product in inventory
      const productSearch = await findProductByName(businessId, data.productName);
      
      if (!productSearch.found) {
        // Check if there are multiple matches
        if (productSearch.matches && productSearch.matches.length > 0) {
          const matchList = productSearch.matches
            .map((p: any, i: number) => `${i + 1}. ${p.name} (Stock: ${p.stock || p.quantity || 0})`)
            .join('\n');
          return { 
            success: false, 
            message: `I found multiple products matching "${data.productName}":\n\n${matchList}\n\nPlease specify which one you want to sell.`, 
            data: { 
              requiresClarification: true,
              matches: productSearch.matches.map((p: any) => ({ id: p.id, name: p.name, stock: p.stock || p.quantity || 0 }))
            } 
          };
        }
        return { 
          success: false, 
          message: `Product "${data.productName}" not found in your inventory. Please add this product first or check the spelling.`, 
          data: null 
        };
      }

      const product = productSearch.product;
      const quantity = parseInt(data.quantity) || 1;
      
      // Use product's stored prices
      const costPrice = product.cost || product.costPrice || 0;
      const sellingPrice = product.price || parseFloat(data.price) || 0;

      // Check stock availability
      const currentStock = product.stock || product.quantity || 0;
      if (currentStock < quantity) {
        return { 
          success: false, 
          message: `Insufficient stock for "${product.name}". Only ${currentStock} units available, but you requested ${quantity}.`, 
          data: null 
        };
      }

      // Use the shared record sale service
      const result = await recordSale({
        businessId,
        userId,
        items: [{
          productId: product.id,
          name: product.name,
          quantity,
          price: sellingPrice,
          costPrice,
          emoji: product.attributes?.emoji || '📦',
        }],
        paymentType: 'cash',
        source: 'mo_ai',
        recordedBy: {
          uid: userId,
          email: 'mo@busmo.ai',
          displayName: 'MO AI',
          role: 'AI Assistant',
          staffId: null,
        }
      });

      if (!result.success) {
        return {
          success: false,
          message: result.message,
          data: null
        };
      }

      const profit = result.data?.totalProfit || 0;
      const remainingStock = result.data?.remainingStock[product.id] || 0;

      return { 
        success: true, 
        message: `Sale recorded successfully for ${quantity}x ${product.name} (Profit: ₦${profit.toLocaleString()})`, 
        data: { 
          saleId: result.saleId, 
          profit,
          totalRevenue: result.data?.totalRevenue,
          product: {
            id: product.id,
            name: product.name,
            sku: product.attributes?.sku || product.sku,
            costPrice,
            sellingPrice,
            remainingStock,
          }
        } 
      };
    }

    return { success: false, message: 'Unknown action type', data: null };
  } catch (error: any) {
    console.error('Error executing action:', error);
    return { success: false, message: `Failed to execute action: ${error.message}`, data: null };
  }
}

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
    const conversationStyle = detectConversationStyle(conversationHistory);
    const systemPrompt = buildSystemPrompt(businessContext, language, languageName, conversationHistory, businessCategory, conversationStyle);

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
    const modelName = image ? 'gemini-pro-vision' : 'gemini-pro-latest';
    const model = genAI.getGenerativeModel({ 
      model: modelName,
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

    // Extract action data from response if present
    let actionData = null;
    const actionMatch = text.match(/\{"action":\s*"([^"]+)",\s*"data":\s*\{[^}]+\}\}/);
    if (actionMatch) {
      try {
        actionData = JSON.parse(actionMatch[0]);
        console.log('🎯 [Ask MO API] Action detected:', actionData.action);
        // Don't execute automatically - return to client for confirmation
      } catch (error) {
        console.error('❌ [Ask MO API] Failed to parse action JSON:', error);
      }
    }

    return NextResponse.json({
      answer: text,
      action: actionData,
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

    const result = await executeAction(action, businessId, userId);

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

    // Fetch sales (last 30 days) with detailed data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesSnapshot = await db.collection('businesses').doc(businessId).collection('sales')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    context.sales = []; // Store detailed sales data
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

      // Add detailed sales data
      context.sales.push({
        id: doc.id,
        totalRevenue: total,
        profit: profit,
        paymentMethod: data.paymentMethod || 'cash',
        products: data.products || [],
        createdAt: saleDate,
        recordedBy: data.recordedBy?.displayName || 'Unknown',
      });

      // Track product sales for best-selling analysis
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

    // Calculate best-selling products
    context.bestSellingProducts = Array.from(productSalesMap.entries())
      .map(([name, stats]) => ({
        name,
        quantitySold: stats.quantity,
        totalRevenue: stats.revenue,
        totalProfit: stats.profit,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10); // Top 10 best-selling products

    // Fetch products with detailed data
    const productsSnapshot = await db.collection('businesses').doc(businessId).collection('products')
      .where('active', '==', true)
      .limit(200)
      .get();

    context.totalProducts = productsSnapshot.size;
    context.products = []; // Store detailed product data

    let totalInventoryValue = 0;
    productsSnapshot.forEach(doc => {
      const data = doc.data();
      const stock = data.stock || 0;
      const costPrice = data.cost || data.costPrice || 0; // Use cost price for inventory value
      const sellingPrice = data.price || 0;
      const threshold = data.lowStockThreshold || 10;

      totalInventoryValue += stock * costPrice;

      if (stock === 0) context.outOfStockCount++;
      else if (stock <= threshold) context.lowStockCount++;

      // Add detailed product data to context
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
function buildSystemPrompt(businessContext: any, language: string, languageName: string, conversationHistory: any[] = [], businessCategory: string = 'retail', conversationStyle: { style: string; tone: string; length: string } = { style: 'balanced', tone: 'professional', length: 'medium' }): string {
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

💬 CONVERSATION STYLE ADAPTATION:
- User's detected style: ${conversationStyle.style} (tone: ${conversationStyle.tone}, length: ${conversationStyle.length})
- ADAPT your responses to match the user's communication style:
  - If user is FORMAL: Use professional language, complete sentences, respectful tone
  - If user is CASUAL: Use friendly language, contractions, relaxed tone
  - If user prefers SHORT: Keep responses concise (under 100 words), get straight to the point
  - If user prefers DETAILED: Provide comprehensive explanations with context
  - If style is BALANCED/MEDIUM: Use standard professional conversational tone
- ALWAYS match the user's energy level and communication preferences

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
8. ADAPT LENGTH — match user's preference (short/concise vs detailed)
9. ADAPT TONE — match user's formality (formal vs casual)
10. MAINTAIN CHARACTER — never break your role as MO
11. BUSINESS ONLY — refuse to discuss non-business topics and redirect politely
12. USE LIVE DATA — Always use the actual product and sales data provided in the context above. Never estimate or guess inventory values, stock levels, or sales figures. The context contains real-time data from your business.

🛠️ ACTION CAPABILITIES:
You can perform business operations when requested:

RECORDING SALES:
- When user wants to record a sale, extract: product name, quantity, price/amount, cost price
- If any required field is missing, ASK the user for it before providing the action JSON
- Required fields: productName, quantity, price (or amount), costPrice
- Return structured JSON in your response for sale recording:
  {"action": "record_sale", "data": {"productName": "...", "quantity": 1, "amount": 0, "price": 0, "costPrice": 0}}
- If user sends an image of a product/receipt, analyze it to extract sale details
- If information is incomplete from image, ask user to provide missing details

ADDING PRODUCTS:
- When user wants to add a new product, extract: name, price, stock, category
- If any required field is missing, ASK the user for it before providing the action JSON
- Required fields: name, price, stock, category
- Optional fields: description, costPrice, lowStockThreshold
- Return structured JSON in your response for product addition:
  {"action": "add_product", "data": {"name": "...", "price": 0, "stock": 0, "category": "...", "description": "...", "costPrice": 0, "lowStockThreshold": 5}}
- If user sends an image of a product, analyze it to extract product details
- If information is incomplete from image, ask user to provide missing details

IMAGE ANALYSIS:
- When user sends an image, analyze it to understand:
  - Product names, prices, quantities (for receipts/invoices)
  - Product details (for product photos)
  - Business context (for general business images)
- Always provide both text analysis AND structured action data if applicable
- If image analysis is incomplete, ask user for missing information

POST-ACTION INSIGHTS:
After successfully recording a sale or adding a product, provide helpful business insights:
- For sales: Mention inventory reduction, updated daily revenue, remaining stock, and any relevant business impact
- For products: Mention how the new product fits into inventory, its impact on stock value, and any reorder considerations
- Keep insights concise but valuable - help users understand the business impact of their actions
`;
}
