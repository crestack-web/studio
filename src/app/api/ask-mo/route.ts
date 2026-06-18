import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getGoogleAIService } from '@/services/ai/google-ai-service';
import { validateAIRequest, checkRateLimit, checkAbuse, getClientIP, validateInput, sanitizeBusinessContext } from '@/lib/ai-security';
import { aiRequestQueue } from '@/lib/ai-queue';
import { AskMOErrorFactory, ErrorSource, ErrorCode, logError, errorToResponse } from '@/lib/ask-mo-errors';

// Initialize Firebase Admin for server-side use
let db: ReturnType<typeof getFirestore> | null = null;
let adminInitialized = false;

// Load environment variables explicitly
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

console.log('🔍 Firebase Admin Environment Check:', {
  hasProjectId: !!projectId,
  hasPrivateKey: !!privateKey,
  hasClientEmail: !!clientEmail,
  projectId: projectId || 'missing',
  clientEmail: clientEmail || 'missing',
  privateKeyLength: privateKey?.length || 0
});

try {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: projectId,
      privateKey: privateKey,
      clientEmail: clientEmail,
    };
    
    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      adminInitialized = true;
      console.log('✅ Firebase Admin initialized for Ask MO');
    } else {
      console.warn('⚠️ Firebase Admin credentials missing:', {
        hasProjectId: !!serviceAccount.projectId,
        hasPrivateKey: !!serviceAccount.privateKey,
        hasClientEmail: !!serviceAccount.clientEmail,
      });
    }
  } else {
    adminInitialized = true;
    console.log('✅ Firebase Admin already initialized for Ask MO');
  }
  
  if (adminInitialized) {
    db = getFirestore();
    console.log('✅ Firestore initialized for Ask MO');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error for Ask MO:', error);
}

/**
 * Detect if user wants to record a sale and extract sale data
 */
function detectSaleIntent(message: string): {
  isSaleIntent: boolean;
  products?: Array<{ name: string; quantity: number; price: number }>;
  paymentMethod?: string;
  confidence?: number;
} {
  const lower = message.toLowerCase();
  
  // Sale intent patterns - enhanced with more natural language variations
  const salePatterns = [
    // Pattern: "sold 2 bags of rice for 5000"
    /sold\s+(\d+)\s+(.+?)\s+for\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    // Pattern: "sold 5000 of rice"
    /sold\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+of\s+(.+)/i,
    // Pattern: "record sale of 5000 rice"
    /record\s+sale\s+of\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(.+)/i,
    // Pattern: "sale: 2 rice at 5000"
    /sale:\s*(.+)/i,
    // Pattern: "i sold rice"
    /i\s+sold\s+(.+)/i,
    // Pattern: "made a sale of rice"
    /made\s+a\s+sale\s+(.+)/i,
    // Pattern: "just sold 2 rice"
    /just\s+sold\s+(\d+)\s+(.+)/i,
    // Pattern: "sold rice 2 units"
    /sold\s+(.+?)\s+(\d+)\s*(?:units?|pcs?|pieces?)/i,
    // Pattern: "2 rice sold"
    /(\d+)\s+(.+?)\s+sold/i,
    // Pattern: "sold rice for 5000"
    /sold\s+(.+?)\s+for\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    // Pattern: "customer bought 2 rice"
    /customer\s+bought\s+(\d+)\s+(.+)/i,
    // Pattern: "sold 2x rice"
    /sold\s+(\d+)x\s+(.+)/i,
  ];
  
  for (const pattern of salePatterns) {
    const match = message.match(pattern);
    if (match) {
      // Extract sale data
      let quantity = 1;
      let productName = '';
      let price = 0;
      let paymentMethod = 'cash';
      
      // Pattern: "sold 2 bags of rice for 5000"
      if (match[1] && match[2] && match[3]) {
        quantity = parseInt(match[1].replace(/,/g, ''));
        productName = match[2].trim();
        price = parseFloat(match[3].replace(/,/g, ''));
      }
      // Pattern: "sold 5000 of rice" or "sold rice for 5000"
      else if (match[1] && match[2]) {
        const firstNum = parseFloat(match[1].replace(/,/g, ''));
        const secondPart = match[2].trim();
        
        // Check if first number is price (> 100 likely price)
        if (firstNum > 100) {
          price = firstNum;
          productName = secondPart;
        } else {
          // First number is quantity
          quantity = firstNum;
          productName = secondPart;
          // Try to extract price from the message
          const priceMatch = message.match(/(?:₦|naira|ngn|at|for)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
          if (priceMatch) {
            const extractedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (extractedPrice !== quantity) {
              price = extractedPrice;
            }
          }
          // Estimate price if not found
          if (price === 0) {
            price = quantity * 1000;
          }
        }
      }
      // Pattern: "sold rice 2 units" or "sold rice for 5000"
      else if (match[1] && !match[2]) {
        productName = match[1].trim();
        // Try to extract quantity
        const qtyMatch = message.match(/(\d+)\s*(?:units?|pcs?|pieces?)/i);
        if (qtyMatch) {
          quantity = parseInt(qtyMatch[1]);
        }
        // Try to extract price
        const priceMatch = message.match(/(?:₦|naira|ngn|at|for)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
        if (priceMatch) {
          const extractedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (extractedPrice !== quantity) {
            price = extractedPrice;
          }
        }
        // Estimate price if not found
        if (price === 0) {
          price = quantity * 1000;
        }
      }
      
      // Clean up product name (remove trailing words like "bags of", "pieces of")
      productName = productName.replace(/\s+(?:bags?|pieces?|pcs?|units?|of)\s*$/gi, '').trim();
      
      // Detect payment method
      if (lower.includes('transfer') || lower.includes('bank')) paymentMethod = 'transfer';
      else if (lower.includes('card') || lower.includes('pos')) paymentMethod = 'card';
      else if (lower.includes('cash')) paymentMethod = 'cash';
      
      return {
        isSaleIntent: true,
        products: [{ name: productName, quantity, price }],
        paymentMethod,
        confidence: 0.8,
      };
    }
  }
  
  return { isSaleIntent: false };
}

/**
 * Detect if user wants to add a product and extract product data
 */
function detectProductIntent(message: string, image?: string): {
  isProductIntent: boolean;
  name?: string;
  price?: number;
  stock?: number;
  category?: string;
  hasImage?: boolean;
  confidence?: number;
} {
  const lower = message.toLowerCase();
  
  // Product intent patterns - enhanced with more natural language variations
  const productPatterns = [
    // Pattern: "add rice at 25000 with 50 stock"
    /add\s+(?:product\s+)?(?:named\s+)?(.+?)\s+(?:at\s+|for\s+|₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    // Pattern: "new product: rice 25000"
    /new\s+product:\s*(.+)/i,
    // Pattern: "create product rice"
    /create\s+product\s+(.+)/i,
    // Pattern: "i want to add rice"
    /i\s+want\s+to\s+add\s+(.+)/i,
    // Pattern: "add to inventory: rice"
    /add\s+to\s+inventory:\s*(.+)/i,
    // Pattern: "stock rice"
    /stock\s+(.+)/i,
    // Pattern: "add rice to inventory"
    /add\s+(.+?)\s+to\s+inventory/i,
    // Pattern: "new item rice"
    /new\s+item\s+(.+)/i,
    // Pattern: "add rice"
    /add\s+(.+)/i,
  ];
  
  for (const pattern of productPatterns) {
    const match = message.match(pattern);
    if (match) {
      let productName = '';
      let price = 0;
      let stock = 10; // Default stock
      let category = 'General';
      
      // Pattern: "add rice at 25000 with 50 stock"
      const details = match[1] || match[0];
      
      // Extract product name (first part before numbers)
      const nameMatch = details.match(/([a-zA-Z\s]+?)(?:\s+(?:at|for|with|₦|\d)|$)/i);
      if (nameMatch) {
        productName = nameMatch[1].trim();
      } else {
        productName = details.trim();
      }
      
      // Extract price
      const priceMatch = details.match(/(?:₦|naira|ngn|at|for)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/,/g, ''));
      }
      
      // Extract stock quantity
      const stockMatch = details.match(/(?:with|stock|qty|quantity)[:\s]*(\d+)/i);
      if (stockMatch) {
        stock = parseInt(stockMatch[1]);
      }
      
      // Detect category
      if (lower.includes('rice') || lower.includes('beans') || lower.includes('yam') || lower.includes('food') || lower.includes('grain')) category = 'Food & Grains';
      else if (lower.includes('soap') || lower.includes('sabuni') || lower.includes('cleaning') || lower.includes('detergent')) category = 'Cleaning';
      else if (lower.includes('water') || lower.includes('drink') || lower.includes('beverage') || lower.includes('juice') || lower.includes('soda')) category = 'Beverages';
      else if (lower.includes('bag') || lower.includes('fashion') || lower.includes('cloth') || lower.includes('shoe') || lower.includes('wear')) category = 'Fashion';
      else if (lower.includes('phone') || lower.includes('electronic') || lower.includes('gadget') || lower.includes('charger')) category = 'Electronics';
      else if (lower.includes('oil') || lower.includes('fuel') || lower.includes('gas')) category = 'Fuel & Energy';
      else if (lower.includes('medicine') || lower.includes('drug') || lower.includes('pharm')) category = 'Health';
      
      return {
        isProductIntent: true,
        name: productName,
        price,
        stock,
        category,
        hasImage: !!image,
        confidence: 0.75,
      };
    }
  }
  
  // If image is provided without clear text, still consider it a product intent
  if (image) {
    return {
      isProductIntent: true,
      name: 'Product from image',
      price: 0,
      stock: 10,
      category: 'General',
      hasImage: true,
      confidence: 0.5,
    };
  }
  
  return { isProductIntent: false };
}

/**
 * Save product to Firestore
 */
async function addProductToFirestore(businessId: string, productData: any) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const docRef = await db.collection('businesses').doc(businessId).collection('products').add({
      name: productData.name || 'Unnamed Product',
      price: productData.price || 0,
      costPrice: (productData.price || 0) * 0.7, // Estimate 70% cost
      stock: productData.stock || 0,
      lowStockThreshold: 10,
      category: productData.category || 'General',
      active: true,
      image: productData.image || null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: 'ask-mo',
    });
    
    console.log('✅ Product added:', docRef.id);
    return { success: true, id: docRef.id, ...productData };
  } catch (error) {
    console.error('❌ Error adding product:', error);
    throw error;
  }
}

/**
 * Save sale to Firestore
 */
async function saveSaleToFirestore(businessId: string, saleData: any) {
  if (!db) {
    console.error('❌ Database not initialized in saveSaleToFirestore');
    throw new Error('Database not initialized');
  }
  
  try {
    const products = saleData.products || [];
    const subtotal = products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
    const profit = subtotal * 0.3; // Estimate 30% profit margin
    
    const docRef = await db.collection('businesses').doc(businessId).collection('sales').add({
      products: products.map((p: any) => ({
        name: p.name,
        quantity: p.quantity || 1,
        price: p.price || 0,
        costPrice: (p.price || 0) * 0.7, // Estimate cost
        profit: (p.price || 0) * 0.3,
      })),
      total: subtotal,
      profit,
      paymentMethod: saleData.paymentMethod || 'cash',
      note: saleData.note || '',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: saleData.createdBy || 'ask-mo',
    });
    
    console.log('✅ Sale saved:', docRef.id);
    return { success: true, id: docRef.id, subtotal, profit };
  } catch (error) {
    console.error('❌ Error saving sale:', error);
    throw error;
  }
}

/**
 * Fetch comprehensive business data from Firestore with robust error handling
 */
async function getBusinessContext(businessId: string) {
  const contextStartTime = Date.now();
  console.log('📊 [Ask MO API] Starting business context fetch for:', businessId);
  
  if (!db) {
    return {
      error: 'Database not initialized',
    };
  }

  try {
    const context: any = {
      // Business Profile
      businessName: '',
      businessCategory: '',
      country: '',
      city: '',
      marketPresence: false,
      hasStorefront: false,
      
      // Staff
      staffCount: 0,
      staffMembers: [] as Array<{ name: string; role: string }>,
      
      // Sales Data
      totalSales: 0,
      todaySales: 0,
      weekSales: 0,
      monthSales: 0,
      totalProfit: 0,
      todayProfit: 0,
      transactionCount: 0,
      averageTransactionValue: 0,
      
      // Expenses
      totalExpenses: 0,
      monthExpenses: 0,
      topExpenseCategory: '',
      
      // Cash Flow
      cashBalance: 0,
      dailyBurnRate: 0,
      cashRunway: 0,
      
      // Inventory
      totalProducts: 0,
      lowStockProducts: [] as Array<{ name: string; stock: number; threshold: number }>,
      outOfStockProducts: [] as string[],
      deadStockProducts: [] as Array<{ name: string; lastSold: string; daysSinceSale: number; stock: number }>,
      totalInventoryValue: 0,
      topProducts: [] as Array<{ name: string; revenue: number; quantity: number }>,
      
      // Recent Activity
      recentSales: [] as Array<{ product: string; amount: number; date: string }>,
      profitMargin: 0,
      
      // Query timing info
      queryTimings: {} as Record<string, number>,
    };

    // Fetch Business Profile
    try {
      const profileStart = Date.now();
      const businessDoc = await db.collection('businesses').doc(businessId).collection('profile').get();
      context.queryTimings.profile = Date.now() - profileStart;
      
      if (!businessDoc.empty) {
        const data = businessDoc.docs[0].data();
        context.businessName = data.businessName || 'Your Business';
        context.businessCategory = data.category || 'General Retail';
        context.country = data.country || 'Nigeria';
        context.city = data.city || '';
        context.marketPresence = data.hasStorefront || false;
        context.hasStorefront = data.hasStorefront || false;
        console.log('✅ [Ask MO API] Business profile loaded', { time: context.queryTimings.profile });
      } else {
        console.warn('⚠️ [Ask MO API] Business profile collection empty');
      }
    } catch (e) {
      console.error('❌ [Ask MO API] Could not fetch business profile:', e);
      context.businessName = 'Your Business';
      context.businessCategory = 'General Retail';
      context.country = 'Nigeria';
      context.queryTimings.profile = -1; // Error indicator
    }

    // Fetch Staff
    try {
      const staffStart = Date.now();
      const staffQuery = db.collection('businesses').doc(businessId).collection('staff')
        .where('active', '==', true)
        .limit(50);
      
      const staffSnapshot = await staffQuery.get();
      context.queryTimings.staff = Date.now() - staffStart;
      context.staffCount = staffSnapshot.size;
      
      staffSnapshot.forEach(doc => {
        const data = doc.data();
        context.staffMembers.push({
          name: data.name || 'Staff Member',
          role: data.role || 'Employee',
        });
      });
      console.log('✅ [Ask MO API] Staff data loaded', { count: context.staffCount, time: context.queryTimings.staff });
    } catch (e) {
      console.error('❌ [Ask MO API] Could not fetch staff:', e);
      context.queryTimings.staff = -1;
    }

    // Fetch Sales (last 30 days)
    try {
      const salesStart = Date.now();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const salesQuery = db.collection('businesses').doc(businessId).collection('sales')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .orderBy('createdAt', 'desc')
        .limit(100);
      
      const salesSnapshot = await salesQuery.get();
      context.queryTimings.sales = Date.now() - salesStart;
      
      const productRevenue = new Map<string, { name: string; revenue: number; quantity: number; lastSold?: Date }>();
      const productSales = new Map<string, Date>();
      
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        const saleDate = data.createdAt?.toDate() || new Date();
        const isToday = saleDate >= today;
        
        const total = data.total || 0;
        context.totalSales += total;
        context.totalProfit += data.profit || 0;
        context.transactionCount += 1;
        
        if (isToday) {
          context.todaySales += total;
          context.todayProfit += data.profit || 0;
        }
        
        // Track product performance and last sold date
        if (data.products && Array.isArray(data.products)) {
          data.products.forEach((p: any) => {
            const existing = productRevenue.get(p.productId || p.name) || {
              name: p.name,
              revenue: 0,
              quantity: 0,
              lastSold: undefined as Date | undefined,
            };
            existing.revenue += (p.price || 0) * (p.quantity || 1);
            existing.quantity += p.quantity || 1;
            existing.lastSold = saleDate;
            productRevenue.set(p.productId || p.name, existing);
            productSales.set(p.productId || p.name, saleDate);
          });
        }
        
        // Recent sales (last 5)
        if (context.recentSales.length < 5) {
          context.recentSales.push({
            product: data.products?.[0]?.name || 'Sale',
            amount: total,
            date: saleDate.toLocaleDateString(),
          });
        }
      });
      
      context.topProducts = Array.from(productRevenue.values())
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);
      
      context.weekSales = context.totalSales * 0.23; // Approximate
      context.monthSales = context.totalSales;
      context.averageTransactionValue = context.transactionCount > 0 
        ? context.totalSales / context.transactionCount 
        : 0;
      context.profitMargin = context.totalSales > 0 
        ? ((context.totalProfit / context.totalSales) * 100) 
        : 0;
      
      console.log('✅ [Ask MO API] Sales data loaded', { 
        totalSales: context.totalSales, 
        transactionCount: context.transactionCount,
        time: context.queryTimings.sales 
      });
    } catch (e) {
      console.error('❌ [Ask MO API] Could not fetch sales:', e);
      context.queryTimings.sales = -1;
    }

    // Fetch Expenses (last 30 days)
    try {
      const expensesStart = Date.now();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const expensesQuery = db.collection('businesses').doc(businessId).collection('expenses')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .orderBy('createdAt', 'desc')
        .limit(100);
      
      const categoryExpenses = new Map<string, number>();
      const expensesSnapshot = await expensesQuery.get();
      context.queryTimings.expenses = Date.now() - expensesStart;
      
      expensesSnapshot.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        context.totalExpenses += amount;
        
        const category = data.category || 'Other';
        categoryExpenses.set(category, (categoryExpenses.get(category) || 0) + amount);
      });
      
      context.monthExpenses = context.totalExpenses;
      context.topExpenseCategory = Array.from(categoryExpenses.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      
      context.dailyBurnRate = context.totalExpenses / 30;
      context.cashBalance = context.totalSales - context.totalExpenses;
      context.cashRunway = context.dailyBurnRate > 0
        ? Math.round(context.cashBalance / context.dailyBurnRate)
        : 0;
      
      console.log('✅ [Ask MO API] Expenses data loaded', { 
        totalExpenses: context.totalExpenses,
        time: context.queryTimings.expenses 
      });
    } catch (e) {
      console.error('❌ [Ask MO API] Could not fetch expenses:', e);
      context.queryTimings.expenses = -1;
    }

    // Fetch Products/Inventory
    try {
      const productsStart = Date.now();
      const productsQuery = db.collection('businesses').doc(businessId).collection('products')
        .where('active', '==', true)
        .limit(200);
      
      const productsSnapshot = await productsQuery.get();
      context.queryTimings.products = Date.now() - productsStart;
      context.totalProducts = productsSnapshot.size;
      
      const now = new Date();
      
      // Need to re-declare productSales here since it was in the sales try block
      const productSales = new Map<string, Date>();
      
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        const stock = data.stock || 0;
        const threshold = data.lowStockThreshold || 10;
        const costPrice = data.costPrice || 0;
        const productId = doc.id;
        
        context.totalInventoryValue += stock * costPrice;
        
        if (stock === 0) {
          context.outOfStockProducts.push(data.name || 'Unknown Product');
        } else if (stock <= threshold) {
          context.lowStockProducts.push({
            name: data.name || 'Unknown Product',
            stock: stock,
            threshold: threshold,
          });
        }
        
        // Calculate dead stock (products not sold in 30+ days with stock > 0)
        const lastSold = productSales.get(productId);
        if (stock > 0 && (!lastSold || (now.getTime() - lastSold.getTime()) > (30 * 24 * 60 * 60 * 1000))) {
          const daysSinceSale = lastSold
            ? Math.floor((now.getTime() - lastSold.getTime()) / (24 * 60 * 60 * 1000))
            : 0;
          
          if (daysSinceSale >= 30) {
            context.deadStockProducts.push({
              name: data.name || 'Unknown Product',
              lastSold: lastSold?.toLocaleDateString() || 'Never',
              daysSinceSale: daysSinceSale,
              stock: stock,
              value: stock * (data.price || 0),
            });
          }
        }
      });
      
      context.lowStockProducts.sort((a: any, b: any) => a.stock - b.stock);
      context.deadStockProducts.sort((a: any, b: any) => b.daysSinceSale - a.daysSinceSale);
      
      console.log('✅ [Ask MO API] Products data loaded', { 
        totalProducts: context.totalProducts,
        lowStockCount: context.lowStockProducts.length,
        outOfStockCount: context.outOfStockProducts.length,
        time: context.queryTimings.products 
      });
    } catch (e) {
      console.error('❌ [Ask MO API] Could not fetch products:', e);
      context.queryTimings.products = -1;
    }
    
    const totalTime = Date.now() - contextStartTime;
    console.log('✅ [Ask MO API] Business context fetch completed', { 
      totalTime,
      queryTimings: context.queryTimings 
    });
    
    return context;
  } catch (error) {
    console.error('❌ [Ask MO API] Error fetching business context:', error);
    return { error: 'Failed to fetch business data' };
  }
}


/**
 * Summarize conversation history to manage token limits
 */
function summarizeConversationHistory(conversationHistory: any[]): string {
  if (!conversationHistory || conversationHistory.length === 0) {
    return '';
  }

  const recentMessages = conversationHistory.slice(-6); // Keep last 6 messages for context
  const summary = recentMessages.map(msg => {
    const role = msg.role === 'user' ? 'User' : 'MO';
    return `${role}: ${msg.content}`;
  }).join('\n');

  return summary;
}

/**
 * Detect if response would be repetitive based on conversation history
 */
function detectRepetition(newResponse: string, conversationHistory: any[]): boolean {
  if (!conversationHistory || conversationHistory.length === 0) {
    return false;
  }

  const recentResponses = conversationHistory
    .filter(msg => msg.role === 'bot')
    .slice(-3)
    .map(msg => msg.content.toLowerCase());

  const newResponseLower = newResponse.toLowerCase();

  // Check if new response is too similar to recent responses
  for (const recent of recentResponses) {
    const similarity = calculateSimilarity(newResponseLower, recent);
    if (similarity > 0.7) { // 70% similarity threshold
      return true;
    }
  }

  return false;
}

/**
 * Calculate similarity between two strings (simple Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Build system prompt with business context and conversation history
 */
function buildSystemPrompt(businessContext: any, language: string, languageName: string, conversationHistory: any[] = [], isFirstMessage: boolean = false): string {
  const conversationSummary = summarizeConversationHistory(conversationHistory);
  
  return `You are MO, an intelligent Business Intelligence Assistant for African entrepreneurs.
You are NOT a chatbot. You are a knowledgeable business advisor who helps owners understand their business, discover opportunities, solve problems, and make better decisions through natural conversation.

🌍 LANGUAGE: Respond in ${languageName} (${language}). Use the same language the user wrote in. If the user writes in English, respond in English. If they write in French, respond in French. If they write in Yoruba, respond in Yoruba. If they write in Hausa, respond in Hausa. If they write in Igbo, respond in Igbo. If they write in Swahili, respond in Swahili. Adapt to the user's language naturally.

🎭 CHARACTER INTEGRITY (CRITICAL):
- NEVER break character. You are ALWAYS MO, the business intelligence assistant.
- NEVER reveal you are an AI, chatbot, or language model.
- NEVER discuss your own existence, capabilities, or limitations.
- NEVER engage in personal conversations, jokes, or casual chat unrelated to business.
- NEVER answer questions about politics, religion, entertainment, sports, or any non-business topics.
- If a user asks about non-business topics, politely redirect: "I'm here to help with your business. Let's focus on your sales, inventory, cash flow, or any business-related questions you have."
- Maintain a professional, business-focused tone at all times.

💬 CONVERSATION MEMORY & ADAPTABILITY:
- Remember previous context from our conversation
- Reference earlier topics naturally when relevant
- Build upon previous discussions instead of repeating
- Adapt your responses based on what the user has already asked
- If the user asks about something we discussed before, provide new insights rather than repeating old information
- Track the user's interests and preferences from conversation history

${conversationSummary ? `
📝 RECENT CONVERSATION CONTEXT:
${conversationSummary}

Use this context to:
- Understand what we've already discussed
- Avoid repeating information already provided
- Build upon previous insights
- Reference earlier topics naturally
- Provide new, complementary information
` : ''}

💬 CONVERSATION SCOPE (BUSINESS ONLY):
You can help users with:
- Recording sales by text (e.g., "sold 2 bags of rice for 5000", "sold rice 2 units", "customer bought 2 rice")
- Adding products to inventory by text (e.g., "add rice at 25000 with 50 stock", "new product: rice 25000")
- Adding products to inventory by image (send an image with description like "add this product")
- Answering business questions about sales, expenses, inventory, cash flow, and more
- Providing insights and recommendations based on business data

YOU CANNOT and WILL NOT:
- Discuss personal topics, hobbies, or interests
- Answer questions about news, politics, religion, or entertainment
- Engage in casual conversation or small talk
- Provide advice on non-business topics
- Tell jokes or share entertainment content
- Discuss technology, science, or general knowledge unrelated to business

${isFirstMessage ? `
🎯 PROACTIVE SUGGESTIONS (FIRST MESSAGE):
Since this is our first conversation, proactively mention:
- "You can add products to your inventory by sending me product details or images"
- "I can help you record sales quickly - just tell me what you sold"
- "Ask me about your sales performance, cash flow, or inventory anytime"
- "I'm here to help you understand your business data better"
` : ''}

═══════════════════════════════════════════
📊 COMPREHENSIVE BUSINESS CONTEXT
═══════════════════════════════════════════

🏢 BUSINESS PROFILE:
• Business: ${businessContext.businessName || 'Your Business'}
• Category: ${businessContext.businessCategory || 'General Retail'}
• Location: ${businessContext.city || ''}${businessContext.city ? ', ' : ''}${businessContext.country || 'Nigeria'}
• Busmo Market: ${businessContext.marketPresence ? '✅ Has Storefront' : '❌ Not on Market'}
• Staff: ${businessContext.staffCount} ${businessContext.staffCount === 1 ? 'employee' : 'employees'}
${businessContext.staffMembers?.length > 0 ? businessContext.staffMembers.map((s: any) => `   - ${s.name} (${s.role})`).join('\n') : ''}

💰 SALES PERFORMANCE:
• Total Sales (30 days): ₦${(businessContext.totalSales || 0).toLocaleString()}
• Today's Sales: ₦${(businessContext.todaySales || 0).toLocaleString()}
• Total Profit: ₦${(businessContext.totalProfit || 0).toLocaleString()}
• Today's Profit: ₦${(businessContext.todayProfit || 0).toLocaleString()}
• Profit Margin: ${(businessContext.profitMargin || 0).toFixed(1)}%
• Transactions: ${businessContext.transactionCount || 0}
• Avg Transaction: ₦${(businessContext.averageTransactionValue || 0).toLocaleString()}

💵 CASH FLOW:
• Cash Balance: ₦${(businessContext.cashBalance || 0).toLocaleString()}
• Daily Burn Rate: ₦${(businessContext.dailyBurnRate || 0).toLocaleString()}
• Cash Runway: ${businessContext.cashRunway || 0} days
• Total Expenses (30 days): ₦${(businessContext.totalExpenses || 0).toLocaleString()}
• Top Expense Category: ${businessContext.topExpenseCategory || 'N/A'}

📦 INVENTORY STATUS:
• Total Products: ${businessContext.totalProducts || 0}
• Total Inventory Value: ₦${(businessContext.totalInventoryValue || 0).toLocaleString()}
• ⚠️ OUT OF STOCK: ${businessContext.outOfStockProducts?.length || 0} products
${businessContext.outOfStockProducts?.length > 0 ? businessContext.outOfStockProducts.map((p: any) => `   - ${p}`).join('\n') : '   None'}
• 🔴 LOW STOCK: ${businessContext.lowStockProducts?.length || 0} products
${businessContext.lowStockProducts?.length > 0 ? businessContext.lowStockProducts.map((p: any) => `   - ${p.name}: ${p.stock} left (threshold: ${p.threshold})`).join('\n') : '   None'}
• 💀 DEAD STOCK: ${businessContext.deadStockProducts?.length || 0} products (not sold in 30+ days)
${businessContext.deadStockProducts?.length > 0 ? businessContext.deadStockProducts.slice(0, 5).map((p: any) => `   - ${p.name}: ${p.stock} units, last sold ${p.lastSold} (${p.daysSinceSale} days ago), value: ₦${(p.value || 0).toLocaleString()}`).join('\n') : '   None'}

🏆 TOP PRODUCTS (by revenue):
${businessContext.topProducts?.length > 0 ? businessContext.topProducts.map((p: any, i: number) => `${i + 1}. ${p.name}: ₦${(p.revenue || 0).toLocaleString()} (${p.quantity} units)`).join('\n') : 'No sales data'}

📈 RECENT SALES:
${businessContext.recentSales?.length > 0 ? businessContext.recentSales.map((s: any) => `• ${s.product} - ₦${(s.amount || 0).toLocaleString()} (${s.date})`).join('\n') : 'No recent sales'}

═══════════════════════════════════════════

🎯 RESPONSE FRAMEWORK:
Structure your responses using this 4-part framework:

1. OBSERVATION: What you noticed in the data
2. INSIGHT: What it means for their business
3. RECOMMENDATION: What they should do about it
4. FOLLOW-UP QUESTION: Engage them in the next step

Example:
"Your revenue reached ₦1.25M this month, which is about 14% higher than last month. Most of the growth came from beverages and household items. One thing that stands out is that profit didn't grow at the same pace as revenue, which suggests costs may be increasing. Would you like me to show where margins are shrinking?"

🗣️ CONVERSATIONAL TONE:
Sound like a knowledgeable business advisor, NOT a system.

AVOID:
- "According to the data"
- "The system indicates"
- "Based on records"
- "I found that"
- Repeating the same information across responses
- Starting every response with the same greeting

PREFER:
- "I noticed"
- "One thing that stands out"
- "It looks like"
- "You might want to consider"
- "A possible opportunity here"
- "Building on what we discussed earlier"
- "Following up on our previous conversation"

🔮 PROACTIVE INTELLIGENCE:
When the business data contains important signals, naturally mention them:

• Unusual drop in sales
• Increasing expenses
• Low stock items
• Dead inventory
• Customer debts
• Cash flow risks
• Top performing products
• Revenue spikes
• Staff performance anomalies

🧠 SMART BUSINESS INSIGHTS:
Continuously look for:
• Revenue trends
• Profit trends
• Expense trends
• Customer behavior
• Inventory movement
• Cash flow health
• Debt collection opportunities
• Restocking recommendations
• Growth opportunities

📋 GUIDELINES:
1. Be SPECIFIC — use actual numbers from the data above
2. Be ACTIONABLE — tell them exactly what to do
3. Be ENCOURAGING — celebrate wins, address concerns constructively
4. Be CONVERSATIONAL — write like a human advisor, not a report generator
5. PRIORITIZE — address urgent issues first (out of stock, dead stock, negative cash flow)
6. Use NIGERIAN/AFRICAN BUSINESS CONTEXT — understand local market realities
7. Format numbers with commas (e.g., 1,000)
8. If data is insufficient, say so and suggest what to track
9. Consider STAFF efficiency when discussing performance
10. Mention BUSMO MARKET opportunities if they don't have storefront
11. Keep responses under 250 words unless explaining complex analysis
12. Use emoji sparingly and purposefully (📊💰📈🔴🟢💀)
13. MAINTAIN CHARACTER — never break your role as MO, the business intelligence assistant
14. BUSINESS ONLY — refuse to discuss non-business topics and redirect politely
15. EXPLAIN THE "WHY" — don't just state numbers, explain what they mean for their business
16. CONNECT THE DOTS — show relationships between different metrics (e.g., "Your profit margin dropped because expenses increased faster than sales")
17. BE PROACTIVE — suggest next steps before the user asks
18. AVOID REPETITION — don't repeat information already provided in conversation history
19. BUILD ON CONTEXT — reference previous discussions naturally
20. ADAPT TO USER — adjust responses based on user's interests and questions

💎 IMPORTANT NUMBERS:
Highlight key metrics prominently when relevant:
- Revenue: ₦1.25M
- Profit: ₦420K
- Outstanding Debt: ₦145K
- Low Stock Items: 8

🎯 GOAL:
The user should leave conversations feeling "I understand my business better now" instead of "I received a report."

═══════════════════════════════════════════

🏥 BUSINESS HEALTH SUMMARY:
When users ask "How is my business doing?" or "How healthy is my business?", generate a comprehensive health report covering:

1. REVENUE HEALTH
   - Current revenue vs previous period
   - Growth rate
   - Revenue trends

2. PROFITABILITY
   - Current profit margin
   - Profit trends
   - Cost efficiency

3. CASH FLOW STATUS
   - Cash balance
   - Burn rate
   - Runway (months of operation)
   - Cash flow risks

4. INVENTORY HEALTH
   - Total inventory value
   - Low stock items (urgent)
   - Dead stock (not sold in 30+ days)
   - Restocking needs

5. CUSTOMER DEBTS
   - Outstanding debt amount
   - Debt collection opportunities
   - Risk assessment

6. GROWTH OPPORTUNITIES
   - Top performing products
   - Market expansion potential
   - Busmo Market opportunities

7. RISKS & CONCERNS
   - Urgent issues (out of stock, negative cash flow)
   - Warning signs (declining margins, increasing expenses)
   - Recommendations for mitigation

Format the health summary with clear sections and actionable insights. Use the Observation-Insight-Recommendation-Question framework for each section.`;
}

/**
 * POST /api/ask-mo
 * Ask MO AI assistant with optional image
 * Supports: Business questions + Recording sales via text
 */
export async function POST(req: NextRequest) {
  let requestId: string | undefined;
  const requestStartTime = Date.now();
  const timings: Record<string, number> = {};
  
  try {
    console.log('🚀 [Ask MO API] Request received');
    timings.requestReceived = Date.now();
    
    const body = await req.json();
    timings.bodyParsed = Date.now();
    
    const { message, image, businessId, language = 'en', languageName = 'English', userId, conversationHistory = [] } = body;

    console.log('🤖 [Ask MO API] Request details:', {
      message: message?.substring(0, 100),
      hasImage: !!image,
      businessId: businessId || 'not provided',
      language: language || 'en',
      languageName: languageName || 'English',
      userId: userId || 'not provided',
      conversationHistoryLength: conversationHistory?.length || 0,
      timestamp: new Date().toISOString(),
      parseTime: timings.bodyParsed - timings.requestReceived,
    });

    // Validate input
    const inputValidationStart = Date.now();
    const inputValidation = validateInput(message, image);
    timings.inputValidation = Date.now() - inputValidationStart;
    
    if (!inputValidation.valid) {
      const error = AskMOErrorFactory.invalidInput(inputValidation.error || 'Invalid input');
      logError(error, 'Input Validation');
      return errorToResponse(error);
    }
    console.log('✅ [Ask MO API] Input validation passed', { time: timings.inputValidation });

    // Validate and authenticate AI request
    console.log('🔐 [Ask MO API] Starting authentication...');
    const authStart = Date.now();
    
    let authenticatedUserId: string;
    let authenticatedBusinessId: string;
    
    // Skip authentication if database is not initialized (for development/testing)
    if (!db) {
      console.warn('⚠️ [Ask MO API] Database not initialized, skipping authentication validation');
      const error = AskMOErrorFactory.databaseNotInitialized();
      logError(error, 'Authentication');
      
      // Proceed without authentication for development/testing
      const { userId, devUserId, businessId: devBusinessId } = body;
      
      if (!devUserId && !userId) {
        return errorToResponse(AskMOErrorFactory.invalidInput('User ID is required'));
      }
      if (!devBusinessId && !businessId) {
        return errorToResponse(AskMOErrorFactory.invalidInput('Business ID is required'));
      }
      
      authenticatedUserId = devUserId || userId;
      authenticatedBusinessId = devBusinessId || businessId;
      console.log('⚠️ [Ask MO API] Using development mode authentication');
    } else {
      const authValidation = await validateAIRequest(req, body);
      timings.authentication = Date.now() - authStart;
      
      if (!authValidation.valid) {
        console.error('❌ [Ask MO API] Authentication failed:', authValidation.error);
        const error = authValidation.error?.includes('User not found') 
          ? AskMOErrorFactory.userNotFound(userId || 'unknown')
          : authValidation.error?.includes('Business not found')
          ? AskMOErrorFactory.businessNotFound(businessId || 'unknown')
          : authValidation.error?.includes('Unauthorized')
          ? AskMOErrorFactory.unauthorized(userId || 'unknown', businessId || 'unknown')
          : AskMOErrorFactory.fromError(new Error(authValidation.error), ErrorSource.AUTHENTICATION, ErrorCode.AUTH_USER_NOT_FOUND);
        
        logError(error, 'Authentication');
        return errorToResponse(error);
      }

      console.log('✅ [Ask MO API] Authentication successful:', {
        userId: authValidation.userId,
        businessId: authValidation.businessId,
        time: timings.authentication,
      });

      authenticatedUserId = authValidation.userId!;
      authenticatedBusinessId = authValidation.businessId!;
    }

    // Check rate limiting for user
    const rateLimitStart = Date.now();
    const userRateLimit = await checkRateLimit(authenticatedUserId, 'USER');
    if (!userRateLimit.allowed) {
      const error = AskMOErrorFactory.rateLimitUserExceeded(userRateLimit.retryAfter || 60);
      logError(error, 'Rate Limiting');
      return errorToResponse(error);
    }

    // Check rate limiting for business
    const businessRateLimit = await checkRateLimit(authenticatedBusinessId, 'BUSINESS');
    if (!businessRateLimit.allowed) {
      const error = AskMOErrorFactory.rateLimitBusinessExceeded(businessRateLimit.retryAfter || 60);
      logError(error, 'Rate Limiting');
      return errorToResponse(error);
    }

    // Check rate limiting for IP
    const clientIP = getClientIP(req);
    const ipRateLimit = await checkRateLimit(clientIP, 'IP');
    timings.rateLimiting = Date.now() - rateLimitStart;
    
    if (!ipRateLimit.allowed) {
      const error = AskMOErrorFactory.rateLimitIpExceeded(ipRateLimit.retryAfter || 60);
      logError(error, 'Rate Limiting');
      return errorToResponse(error);
    }
    console.log('✅ [Ask MO API] Rate limiting checks passed', { time: timings.rateLimiting });

    // Check for abuse
    const abuseCheck = checkAbuse(authenticatedUserId);
    if (!abuseCheck.allowed) {
      const error = AskMOErrorFactory.fromError(new Error(abuseCheck.message || 'Abuse detected'), ErrorSource.VALIDATION, ErrorCode.VALIDATION_INVALID_INPUT);
      logError(error, 'Abuse Check');
      return errorToResponse(error);
    }

    // Check request queue to prevent duplicate/concurrent requests
    const queueStart = Date.now();
    const queueCheck = aiRequestQueue.addRequest(authenticatedUserId, authenticatedBusinessId);
    timings.queueCheck = Date.now() - queueStart;
    
    if (!queueCheck.allowed) {
      const error = queueCheck.message?.includes('in progress') 
        ? AskMOErrorFactory.requestInProgress()
        : AskMOErrorFactory.duplicateRequest();
      logError(error, 'Request Queue');
      return errorToResponse(error);
    }

    const requestId = queueCheck.requestId!;
    aiRequestQueue.startProcessing(requestId);
    console.log('✅ [Ask MO API] Request queue check passed', { requestId, time: timings.queueCheck });

    // Check if user wants to record a sale
    const intentDetectionStart = Date.now();
    const saleIntent = detectSaleIntent(message);
    timings.intentDetection = Date.now() - intentDetectionStart;
    
    if (saleIntent.isSaleIntent && authenticatedBusinessId) {
      console.log('💰 [Ask MO API] Sale intent detected:', saleIntent);
      
      if (!db) {
        console.warn('⚠️ [Ask MO API] Firebase Admin not initialized, cannot record sale');
        const error = AskMOErrorFactory.databaseNotInitialized();
        logError(error, 'Sale Recording');
        aiRequestQueue.completeRequest(requestId);
        return errorToResponse(error);
      }
      
      try {
        // Save sale to Firestore
        const saleSaveStart = Date.now();
        const result = await saveSaleToFirestore(authenticatedBusinessId, saleIntent);
        timings.saleSave = Date.now() - saleSaveStart;
        
        aiRequestQueue.completeRequest(requestId);
        
        console.log('✅ [Ask MO API] Sale recorded successfully', { 
          saleId: result.id, 
          amount: result.subtotal,
          time: timings.saleSave 
        });
        
        return NextResponse.json({
          answer: `✅ **Sale Recorded Successfully!**\n\n` +
                  `💰 Amount: ₦${result.subtotal.toLocaleString()}\n` +
                  `📦 Products: ${saleIntent.products?.map(p => `${p.quantity}x ${p.name}`).join(', ')}\n` +
                  `💵 Payment: ${saleIntent.paymentMethod}\n` +
                  `📈 Profit: ₦${result.profit.toLocaleString()}\n\n` +
                  `Sale ID: ${result.id}\n\n` +
                  `Keep up the great work! 🎉`,
          saleRecorded: true,
          saleId: result.id,
        });
      } catch (error) {
        console.error('❌ [Ask MO API] Failed to record sale:', error);
        const err = AskMOErrorFactory.fromError(error, ErrorSource.FIRESTORE, ErrorCode.FIRESTORE_CONTEXT_LOAD_FAILED);
        logError(err, 'Sale Recording');
        aiRequestQueue.failRequest(requestId, 'Sale recording failed');
        return errorToResponse(err);
      }
    }

    // Check if user wants to add a product
    const productIntent = detectProductIntent(message, image);
    
    if (productIntent.isProductIntent && authenticatedBusinessId) {
      console.log('📦 [Ask MO API] Product intent detected:', productIntent);
      
      if (!db) {
        console.warn('⚠️ [Ask MO API] Firebase Admin not initialized, cannot add product');
        const error = AskMOErrorFactory.databaseNotInitialized();
        logError(error, 'Product Addition');
        aiRequestQueue.completeRequest(requestId);
        return errorToResponse(error);
      }
      
      try {
        // Add product to Firestore
        const productSaveStart = Date.now();
        const result = await addProductToFirestore(authenticatedBusinessId, { ...productIntent, image });
        timings.productSave = Date.now() - productSaveStart;
        
        aiRequestQueue.completeRequest(requestId);
        
        console.log('✅ [Ask MO API] Product added successfully', { 
          productId: result.id, 
          name: result.name,
          time: timings.productSave 
        });
        
        let responseMessage = `✅ **Product Added Successfully!**\n\n` +
                  `📦 Name: ${result.name}\n` +
                  `💰 Price: ₦${(result.price || 0).toLocaleString()}\n` +
                  `📊 Stock: ${result.stock || 0} units\n` +
                  `🏷️ Category: ${result.category}\n` +
                  `📈 Est. Cost: ₦${((result.price || 0) * 0.7).toLocaleString()}\n\n`;
        
        if (result.hasImage) {
          responseMessage += `🖼️ Image: Attached\n\n`;
        }
        
        responseMessage += `Product ID: ${result.id}\n\n` +
                         `Product is now active in your inventory! 🎉`;
        
        return NextResponse.json({
          answer: responseMessage,
          productAdded: true,
          productId: result.id,
        });
      } catch (error) {
        console.error('❌ [Ask MO API] Failed to add product:', error);
        const err = AskMOErrorFactory.fromError(error, ErrorSource.FIRESTORE, ErrorCode.FIRESTORE_CONTEXT_LOAD_FAILED);
        logError(err, 'Product Addition');
        aiRequestQueue.failRequest(requestId, 'Product addition failed');
        return errorToResponse(err);
      }
    }

    // Get API keys from environment
    const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;

    // Validate API key is present
    if (!GOOGLE_GENAI_API_KEY) {
      console.error('❌ [Ask MO API] GOOGLE_GENAI_API_KEY not configured');
      const error = AskMOErrorFactory.googleAIKeyMissing();
      logError(error, 'Environment Validation');
      aiRequestQueue.failRequest(requestId, 'API key missing');
      return errorToResponse(error);
    }

    console.log('🔑 [Ask MO API] API Key Status:', {
      hasGoogleGenAI: !!GOOGLE_GENAI_API_KEY,
      keyLength: GOOGLE_GENAI_API_KEY?.length
    });

    // Fetch comprehensive business context from Firestore
    const contextLoadStart = Date.now();
    let businessContext: any = {};
    let dbError: string | null = null;
    
    if (authenticatedBusinessId && db) {
      try {
        console.log('📊 [Ask MO API] Loading business context for:', authenticatedBusinessId);
        businessContext = await getBusinessContext(authenticatedBusinessId);
        timings.contextLoad = Date.now() - contextLoadStart;
        
        // Check if getBusinessContext returned an error
        if (businessContext.error) {
          dbError = businessContext.error;
          console.warn('⚠️ [Ask MO API] Business context error:', dbError);
          businessContext = {};
        } else {
          // Sanitize business context to reduce token usage
          businessContext = sanitizeBusinessContext(businessContext);
          console.log('📊 [Ask MO API] Business Context loaded:', {
            totalSales: businessContext.totalSales,
            totalProfit: businessContext.totalProfit,
            lowStockCount: businessContext.lowStockProducts?.length,
            cashRunway: businessContext.cashRunway,
            time: timings.contextLoad,
          });
        }
      } catch (error) {
        console.error('❌ [Ask MO API] Error fetching business context:', error);
        const err = AskMOErrorFactory.contextLoadFailed(error instanceof Error ? error.message : 'Unknown error', { businessId: authenticatedBusinessId });
        logError(err, 'Firestore Context Loading');
        dbError = 'Failed to fetch business context';
        businessContext = {};
        timings.contextLoad = Date.now() - contextLoadStart;
      }
    } else if (!db) {
      console.warn('⚠️ [Ask MO API] Firebase Admin not initialized, cannot fetch business context');
      console.warn('⚠️ [Ask MO API] To enable business data, configure Firebase Admin environment variables:');
      console.warn('   - NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      console.warn('   - FIREBASE_ADMIN_PRIVATE_KEY');
      console.warn('   - FIREBASE_ADMIN_CLIENT_EMAIL');
      dbError = 'Database not initialized';
      timings.contextLoad = Date.now() - contextLoadStart;
    } else {
      console.warn('⚠️ [Ask MO API] No business ID provided, cannot fetch business context');
      timings.contextLoad = Date.now() - contextLoadStart;
    }

    // Use GoogleAIService for AI responses
    let answer: string | null = null;

    try {
      console.log('📡 [Ask MO API] Calling GoogleAIService...');
      const aiService = getGoogleAIService();
      
      // Determine if this is the first message
      const isFirstMessage = conversationHistory.length === 0;
      
      const systemPromptStart = Date.now();
      const systemPrompt = buildSystemPrompt(businessContext, language, languageName, conversationHistory, isFirstMessage);
      timings.systemPromptBuild = Date.now() - systemPromptStart;
      
      console.log('📝 [Ask MO API] System prompt length:', systemPrompt.length, { time: timings.systemPromptBuild });
      console.log('📝 [Ask MO API] Message length:', message?.length || 0);
      
      // Use streaming for better UX
      const aiStartTime = Date.now();
      console.log('📡 [Ask MO API] Starting AI generation', {
        provider: 'Google Gen AI',
        model: 'gemini-pro-latest',
        promptLength: (message || '').length,
        contextLength: systemPrompt.length,
        businessDataSize: JSON.stringify(businessContext).length,
      });
      
      const streamResponse = await aiService.generateStream({
        prompt: message || 'Analyse this business image and provide insights based on my business data above.',
        context: systemPrompt,
        businessData: businessContext,
      });
      
      const aiInitTime = Date.now() - aiStartTime;
      timings.aiInit = aiInitTime;
      console.log('✅ [Ask MO API] AI stream initialized', {
        timeToFirstByte: aiInitTime,
        provider: 'Google Gen AI',
        model: 'gemini-pro-latest',
      });
      
      // Handle streaming response
      const encoder = new TextEncoder();
      let totalChars = 0;
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const reader = streamResponse.stream.getReader();
            const streamStartTime = Date.now();
            let chunkCount = 0;
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // value is already a string from Google AI service
              if (value) {
                totalChars += value.length;
                chunkCount++;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: value })}\n\n`));
                
                // Log every 10 chunks for debugging
                if (chunkCount % 10 === 0) {
                  console.log(`📡 [Ask MO API] Streaming progress: ${chunkCount} chunks, ${totalChars} chars`);
                }
              }
            }
            
            const streamDuration = Date.now() - streamStartTime;
            const totalRequestTime = Date.now() - requestStartTime;
            timings.streaming = streamDuration;
            timings.total = totalRequestTime;
            
            console.log('✅ [Ask MO API] Streaming completed', {
              totalChars,
              chunkCount,
              streamDuration,
              charsPerSecond: Math.round((totalChars / streamDuration) * 1000),
              totalRequestTime,
              provider: 'Google Gen AI',
              model: 'gemini-pro-latest',
              timings,
            });
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('❌ [Ask MO API] Streaming error:', {
              error: error instanceof Error ? error.message : 'Unknown error',
              provider: 'Google Gen AI',
              model: 'gemini-pro-latest',
            });
            const err = AskMOErrorFactory.streamInterrupted({ error: error instanceof Error ? error.message : 'Unknown error' });
            logError(err, 'Streaming');
            controller.error(error);
          }
        },
      });
      
      aiRequestQueue.completeRequest(requestId);
      
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      const errorTime = Date.now() - requestStartTime;
      timings.total = errorTime;
      console.error('❌ [Ask MO API] AI Service failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeUntilError: errorTime,
        provider: 'Google Gen AI',
        model: 'gemini-pro-latest',
        timings,
      });
      
      const err = AskMOErrorFactory.fromError(error, ErrorSource.GEMINI_API, ErrorCode.GEMINI_MODEL_FAILED);
      logError(err, 'AI Service');
      aiRequestQueue.failRequest(requestId, 'AI generation failed');
      return errorToResponse(err);
    }

  } catch (error: any) {
    const errorTime = Date.now() - requestStartTime;
    console.error('❌ [Ask MO API] Unhandled error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timeUntilError: errorTime,
      timings,
    });
    
    const err = AskMOErrorFactory.fromError(error, ErrorSource.MOBILE_CLIENT, ErrorCode.CLIENT_NETWORK_ERROR);
    logError(err, 'Unhandled Error');
    
    if (requestId) {
      aiRequestQueue.failRequest(requestId, 'API error');
    }
    return errorToResponse(err);
  }
}
