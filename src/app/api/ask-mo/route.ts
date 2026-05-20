import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';

// Initialize Firebase once
let db: ReturnType<typeof getFirestore> | null = null;
try {
  const firebaseApp = initializeFirebase();
  db = getFirestore(firebaseApp.firebaseApp);
} catch (error) {
  console.warn('Firebase not initialized for Ask MO:', error);
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
  
  // Sale intent patterns
  const salePatterns = [
    /sold\s+(\d+)\s+(.+?)\s+for\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /sold\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+of\s+(.+)/i,
    /record\s+sale\s+of\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(.+)/i,
    /sale:\s*(.+)/i,
    /i\s+sold\s+(.+)/i,
    /made\s+a\s+sale\s+(.+)/i,
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
      // Pattern: "sold 5000 of rice"
      else if (match[1] && match[2]) {
        const firstNum = parseFloat(match[1].replace(/,/g, ''));
        if (firstNum > 100) {
          price = firstNum;
          productName = match[2].trim();
        } else {
          quantity = firstNum;
          productName = match[2].trim();
          price = quantity * 1000; // Estimate
        }
      }
      
      // Detect payment method
      if (lower.includes('transfer') || lower.includes('bank')) paymentMethod = 'transfer';
      else if (lower.includes('card') || lower.includes('pos')) paymentMethod = 'card';
      
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
function detectProductIntent(message: string): {
  isProductIntent: boolean;
  name?: string;
  price?: number;
  stock?: number;
  category?: string;
  confidence?: number;
} {
  const lower = message.toLowerCase();
  
  // Product intent patterns
  const productPatterns = [
    /add\s+(?:product\s+)?(?:named\s+)?(.+?)\s+(?:at\s+|for\s+|₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /new\s+product:\s*(.+)/i,
    /create\s+product\s+(.+)/i,
    /i\s+want\s+to\s+add\s+(.+)/i,
    /add\s+to\s+inventory:\s*(.+)/i,
    /stock\s+(.+)/i,
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
      if (lower.includes('rice') || lower.includes('beans') || lower.includes('food')) category = 'Food & Grains';
      else if (lower.includes('soap') || lower.includes('sabuni') || lower.includes('cleaning')) category = 'Cleaning';
      else if (lower.includes('water') || lower.includes('drink') || lower.includes('beverage')) category = 'Beverages';
      else if (lower.includes('bag') || lower.includes('fashion') || lower.includes('cloth')) category = 'Fashion';
      
      return {
        isProductIntent: true,
        name: productName,
        price,
        stock,
        category,
        confidence: 0.75,
      };
    }
  }
  
  return { isProductIntent: false };
}

/**
 * Save product to Firestore
 */
async function addProductToFirestore(merchantId: string, productData: any) {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const docRef = await addDoc(collection(db, 'merchants', merchantId, 'products'), {
      name: productData.name || 'Unnamed Product',
      price: productData.price || 0,
      costPrice: (productData.price || 0) * 0.7, // Estimate 70% cost
      stock: productData.stock || 0,
      lowStockThreshold: 10,
      category: productData.category || 'General',
      active: true,
      createdAt: Timestamp.now(),
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
async function saveSaleToFirestore(merchantId: string, saleData: any) {
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  
  try {
    const products = saleData.products || [];
    const subtotal = products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
    const profit = subtotal * 0.3; // Estimate 30% profit margin
    
    const docRef = await addDoc(collection(db, 'merchants', merchantId, 'record_sale'), {
      products: products.map((p: any) => ({
        name: p.name,
        quantity: p.quantity || 1,
        price: p.price || 0,
        costPrice: (p.price || 0) * 0.7, // Estimate cost
        profit: (p.price || 0) * 0.3,
      })),
      subtotal,
      profit,
      paymentMethod: saleData.paymentMethod || 'cash',
      note: saleData.note || '',
      createdAt: Timestamp.now(),
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
 * Fetch comprehensive business data from Firestore
 */
async function getBusinessContext(merchantId: string) {
  if (!db) {
    return {
      error: 'Firestore not initialized',
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
    };

    // Fetch Business Profile
    try {
      const businessDoc = await getDocs(collection(db, 'merchants', merchantId, 'profile'));
      if (!businessDoc.empty) {
        const data = businessDoc.docs[0].data();
        context.businessName = data.businessName || 'Your Business';
        context.businessCategory = data.category || 'General Retail';
        context.country = data.country || 'Nigeria';
        context.city = data.city || '';
        context.marketPresence = data.hasStorefront || false;
        context.hasStorefront = data.hasStorefront || false;
      }
    } catch (e) {
      console.warn('Could not fetch business profile:', e);
      context.businessName = 'Your Business';
      context.businessCategory = 'General Retail';
      context.country = 'Nigeria';
    }

    // Fetch Staff
    try {
      const staffQuery = query(
        collection(db, 'merchants', merchantId, 'staff'),
        where('active', '==', true),
        limit(50)
      );
      
      const staffSnapshot = await getDocs(staffQuery);
      context.staffCount = staffSnapshot.size;
      
      staffSnapshot.forEach(doc => {
        const data = doc.data();
        context.staffMembers.push({
          name: data.name || 'Staff Member',
          role: data.role || 'Employee',
        });
      });
    } catch (e) {
      console.warn('Could not fetch staff:', e);
    }

    // Fetch Sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const salesQuery = query(
      collection(db, 'merchants', merchantId, 'record_sale'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const salesSnapshot = await getDocs(salesQuery);
    const productRevenue = new Map<string, { name: string; revenue: number; quantity: number; lastSold?: Date }>();
    const productSales = new Map<string, Date>();
    
    salesSnapshot.forEach(doc => {
      const data = doc.data();
      const saleDate = data.createdAt?.toDate() || new Date();
      const isToday = saleDate >= today;
      
      context.totalSales += data.subtotal || 0;
      context.totalProfit += data.profit || 0;
      context.transactionCount += 1;
      
      if (isToday) {
        context.todaySales += data.subtotal || 0;
        context.todayProfit += data.profit || 0;
      }
      
      // Track product performance and last sold date
      if (data.products && Array.isArray(data.products)) {
        data.products.forEach((p: any) => {
          const existing = productRevenue.get(p.productId || p.name) || {
            name: p.name,
            revenue: 0,
            quantity: 0,
          };
          existing.revenue += (p.price || 0) * (p.quantity || 0);
          existing.quantity += p.quantity || 0;
          existing.lastSold = saleDate;
          productRevenue.set(p.productId || p.name, existing);
          productSales.set(p.productId || p.name, saleDate);
        });
      }
      
      // Recent sales (last 5)
      if (context.recentSales.length < 5) {
        context.recentSales.push({
          product: data.products?.[0]?.name || 'Sale',
          amount: data.subtotal || 0,
          date: saleDate.toLocaleDateString(),
        });
      }
    });
    
    context.topProducts = Array.from(productRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    context.weekSales = context.totalSales * 0.23; // Approximate
    context.monthSales = context.totalSales;
    context.averageTransactionValue = context.transactionCount > 0 
      ? context.totalSales / context.transactionCount 
      : 0;
    context.profitMargin = context.totalSales > 0 
      ? ((context.totalProfit / context.totalSales) * 100) 
      : 0;

    // Fetch Expenses (last 30 days)
    const expensesQuery = query(
      collection(db, 'merchants', merchantId, 'expense'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const categoryExpenses = new Map<string, number>();
    const expensesSnapshot = await getDocs(expensesQuery);
    
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

    // Fetch Products/Inventory
    const productsQuery = query(
      collection(db, 'merchants', merchantId, 'products'),
      where('active', '==', true),
      limit(200)
    );
    
    const productsSnapshot = await getDocs(productsQuery);
    context.totalProducts = productsSnapshot.size;
    
    const now = new Date();
    
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
    
    context.lowStockProducts.sort((a, b) => a.stock - b.stock);
    context.deadStockProducts.sort((a, b) => b.daysSinceSale - a.daysSinceSale);
    
    return context;
  } catch (error) {
    console.error('Error fetching business context:', error);
    return { error: 'Failed to fetch business data' };
  }
}

/**
 * POST /api/ask-mo
 * Ask MO AI assistant with optional image
 * Supports: Business questions + Recording sales via text
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, image, merchantId, language = 'en', languageName = 'English' } = body;

    console.log('🤖 MO API Request:', {
      message: message?.substring(0, 100),
      hasImage: !!image,
      merchantId: merchantId || 'not provided',
      language: language || 'en',
      languageName: languageName || 'English'
    });

    // Validate input
    if (!message && !image) {
      return NextResponse.json(
        { error: 'Message or image is required' },
        { status: 400 }
      );
    }

    // Check if user wants to record a sale
    const saleIntent = detectSaleIntent(message);
    
    if (saleIntent.isSaleIntent && merchantId) {
      console.log('💰 Sale intent detected:', saleIntent);
      
      try {
        // Save sale to Firestore
        const result = await saveSaleToFirestore(merchantId, saleIntent);
        
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
        console.error('Failed to record sale:', error);
        return NextResponse.json({
          answer: `⚠️ I detected you want to record a sale, but I couldn't save it.\n\n` +
                  `Please use the Record Sale page instead, or try again with more details:\n` +
                  `Example: "Sold 2 bags of rice for 5000 naira cash"`,
          saleRecorded: false,
        });
      }
    }

    // Check if user wants to add a product
    const productIntent = detectProductIntent(message);
    
    if (productIntent.isProductIntent && merchantId) {
      console.log('📦 Product intent detected:', productIntent);
      
      try {
        // Add product to Firestore
        const result = await addProductToFirestore(merchantId, productIntent);
        
        return NextResponse.json({
          answer: `✅ **Product Added Successfully!**\n\n` +
                  `📦 Name: ${result.name}\n` +
                  `💰 Price: ₦${(result.price || 0).toLocaleString()}\n` +
                  `📊 Stock: ${result.stock || 0} units\n` +
                  `🏷️ Category: ${result.category}\n` +
                  `📈 Est. Cost: ₦${((result.price || 0) * 0.7).toLocaleString()}\n\n` +
                  `Product ID: ${result.id}\n\n` +
                  `Product is now active in your inventory! 🎉`,
          productAdded: true,
          productId: result.id,
        });
      } catch (error) {
        console.error('Failed to add product:', error);
        return NextResponse.json({
          answer: `⚠️ I detected you want to add a product, but I couldn't save it.\n\n` +
                  `Please use the Add Product page instead, or try again with more details:\n` +
                  `Example: "Add rice at 25000 with 50 stock"`,
          productAdded: false,
        });
      }
    }

    // Get API key from environment
    const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

    // Fetch comprehensive business context from Firestore
    let businessContext: any = {};
    if (merchantId && db) {
      businessContext = await getBusinessContext(merchantId);
      console.log('📊 Business Context:', {
        totalSales: businessContext.totalSales,
        totalProfit: businessContext.totalProfit,
        lowStockCount: businessContext.lowStockProducts?.length,
        cashRunway: businessContext.cashRunway,
      });
    }

    if (!DASHSCOPE_API_KEY) {
      console.error('❌ DASHSCOPE_API_KEY not configured');
      // Return mock response with business context
      return NextResponse.json({
        answer: getMockResponse(message, businessContext)
      });
    }

    // Build comprehensive master prompt with ALL business data
    const systemPrompt = `You are MO, a friendly and professional AI business assistant for African entrepreneurs.
You have COMPLETE visibility into the business and provide actionable, data-driven insights.

🌍 LANGUAGE: Respond in ${languageName} (${language}). Use the same language the user wrote in.

═══════════════════════════════════════════
📊 COMPREHENSIVE BUSINESS CONTEXT
═══════════════════════════════════════════

🏢 BUSINESS PROFILE:
• Business: ${businessContext.businessName || 'Your Business'}
• Category: ${businessContext.businessCategory || 'General Retail'}
• Location: ${businessContext.city || ''}${businessContext.city ? ', ' : ''}${businessContext.country || 'Nigeria'}
• Busmo Market: ${businessContext.marketPresence ? '✅ Has Storefront' : '❌ Not on Market'}
• Staff: ${businessContext.staffCount} ${businessContext.staffCount === 1 ? 'employee' : 'employees'}
${businessContext.staffMembers?.length > 0 ? businessContext.staffMembers.map(s => `   - ${s.name} (${s.role})`).join('\n') : ''}

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
${businessContext.outOfStockProducts?.length > 0 ? businessContext.outOfStockProducts.map(p => `   - ${p}`).join('\n') : '   None'}
• 🔴 LOW STOCK: ${businessContext.lowStockProducts?.length || 0} products
${businessContext.lowStockProducts?.length > 0 ? businessContext.lowStockProducts.map(p => `   - ${p.name}: ${p.stock} left (threshold: ${p.threshold})`).join('\n') : '   None'}
• 💀 DEAD STOCK: ${businessContext.deadStockProducts?.length || 0} products (not sold in 30+ days)
${businessContext.deadStockProducts?.length > 0 ? businessContext.deadStockProducts.slice(0, 5).map(p => `   - ${p.name}: ${p.stock} units, last sold ${p.lastSold} (${p.daysSinceSale} days ago), value: ₦${(p.value || 0).toLocaleString()}`).join('\n') : '   None'}

🏆 TOP PRODUCTS (by revenue):
${businessContext.topProducts?.length > 0 ? businessContext.topProducts.map((p: any, i: number) => `${i + 1}. ${p.name}: ₦${(p.revenue || 0).toLocaleString()} (${p.quantity} units)`).join('\n') : 'No sales data'}

📈 RECENT SALES:
${businessContext.recentSales?.length > 0 ? businessContext.recentSales.map((s: any) => `• ${s.product} - ₦${(s.amount || 0).toLocaleString()} (${s.date})`).join('\n') : 'No recent sales'}

═══════════════════════════════════════════

GUIDELINES:
1. Be SPECIFIC — use actual numbers from the data above
2. Be ACTIONABLE — tell them exactly what to do
3. Be ENCOURAGING — celebrate wins, address concerns constructively
4. Be CONCISE — under 200 words, use emoji sparingly (📊💰📈🔴🟢💀)
5. PRIORITIZE — address urgent issues first (out of stock, dead stock, negative cash flow)
6. Use NIGERIAN/AFRICAN BUSINESS CONTEXT — understand local market realities
7. Format numbers with commas (e.g., 1,000)
8. If data is insufficient, say so and suggest what to track
9. Consider STAFF efficiency when discussing performance
10. Mention BUSMO MARKET opportunities if they don't have storefront

ANSWER IN THIS FORMAT:
- Start with direct answer to their question
- Include relevant data points
- End with specific action item`;

    // Prepare messages for Qwen
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add message
    if (image) {
      messages.push({
        role: 'user',
        content: [
          { type: 'image', image: image },
          { type: 'text', text: message || 'Analyse this business image and provide insights based on my business data above.' }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: message
      });
    }

    console.log('📡 Calling Qwen API with comprehensive business context...');

    // Call Qwen API
    const response = await fetch(
      'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-max',
          input: { messages },
          parameters: {
            result_format: 'message',
            max_tokens: 1000,
            temperature: 0.7
          }
        })
      }
    );

    console.log('📥 Qwen API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Qwen API Error:', response.status, errorText);
      throw new Error(`Qwen API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Qwen API Success');

    const answer = data.output?.text;

    if (!answer) {
      console.warn('⚠️ No answer in Qwen response');
      return NextResponse.json({
        answer: getMockResponse(message, businessContext)
      });
    }

    return NextResponse.json({ answer });

  } catch (error: any) {
    console.error('Ask MO API error:', error);
    // Return mock response on error
    return NextResponse.json({
      answer: getMockResponse('', {})
    });
  }
}

// Mock responses for testing when API key is not configured
function getMockResponse(message: string, context: any = {}): string {
  const lower = message.toLowerCase();
  
  // Use real business context if available
  const businessName = context.businessName || 'Your Business';
  const category = context.businessCategory || 'General Retail';
  const country = context.country || 'Nigeria';
  const staffCount = context.staffCount || 0;
  const hasMarket = context.marketPresence || false;
  const sales = context.totalSales || 45000;
  const profit = context.totalProfit || 13050;
  const cashBalance = context.cashBalance || 150000;
  const expenses = context.totalExpenses || 28400;
  const margin = context.profitMargin || 29;
  const runway = context.cashRunway || 45;
  const lowStock = context.lowStockProducts || [];
  const outOfStock = context.outOfStockProducts || [];
  const deadStock = context.deadStockProducts || [];
  const topProducts = context.topProducts || [];

  if (lower.includes('profit') || lower.includes('today')) {
    return `📊 ${businessName} Performance:\n\nToday's profit: **₦${profit.toLocaleString()}** — **${margin}% margin**\n${staffCount > 0 ? `Your ${staffCount} ${staffCount === 1 ? 'staff member is' : 'staff members are'} doing ${margin >= 25 ? '✅ great' : '⚠️ okay'}!` : ''}\n\n${topProducts[0] ? `${topProducts[0].name} is your highest margin product.` : ''}`;
  }
  if (lower.includes('restock') || lower.includes('inventory')) {
    if (outOfStock.length > 0) {
      return `🔴 CRITICAL: These are OUT OF STOCK:\n${outOfStock.map(p => `• ${p}`).join('\n')}\n\nRestock IMMEDIATELY or lose sales!`;
    }
    if (lowStock.length > 0) {
      return `🔴 URGENT: Restock these ASAP:\n${lowStock.map(p => `• ${p.name}: only ${p.stock} left`).join('\n')}\n\nThese ${lowStock.length} products are below threshold.`;
    }
    return '✅ All products have healthy stock levels. No immediate restocking needed.';
  }
  if (lower.includes('dead stock') || lower.includes('not selling')) {
    if (deadStock.length > 0) {
      return `💀 DEAD STOCK ALERT:\n${deadStock.slice(0, 5).map(p => `• ${p.name}: ${p.stock} units, not sold in ${p.daysSinceSale} days`).join('\n')}\n\nTotal tied up: ₦${deadStock.reduce((sum: number, p: any) => sum + (p.value || 0), 0).toLocaleString()}\n\n🎯 Action: Run promotions or bundle deals to clear this stock!`;
    }
    return '✅ No dead stock! All products are moving well.';
  }
  if (lower.includes('staff') || lower.includes('employee') || lower.includes('team')) {
    if (staffCount === 0) {
      return `👥 You're running ${businessName} solo! Consider hiring help when sales exceed ₦100K/month.`;
    }
    return `👥 Your Team:\n${staffCount} ${staffCount === 1 ? 'staff member' : 'staff members'}\n${context.staffMembers?.length > 0 ? context.staffMembers.map((s: any) => `• ${s.name} (${s.role})`).join('\n') : ''}\n\n${staffCount >= 3 ? '✅ Good team size!' : 'Consider expanding team as you grow.'}`;
  }
  if (lower.includes('market') || lower.includes('storefront') || lower.includes('online')) {
    return `🏪 Busmo Market Status:\n${hasMarket ? '✅ You have a storefront!' : '❌ Not on Busmo Market yet'}\n\n${!hasMarket ? `🎯 Opportunity: Join ${country}'s largest marketplace to reach 10x more customers! Set up your storefront in Settings.` : 'Keep your storefront updated with new products!'}`;
  }
  if (lower.includes('expense') || lower.includes('spending')) {
    return `💵 Expenses: **₦${expenses.toLocaleString()}** (${((expenses/sales)*100).toFixed(0)}% of revenue)\n${((expenses/sales)*100) > 20 ? '⚠️ Above 20% threshold — review spending.' : '✅ Within healthy range.'}\n\nTop category: ${context.topExpenseCategory || 'Various'}`;
  }
  if (lower.includes('cash') || lower.includes('balance') || lower.includes('runway')) {
    return `💵 Cash: **₦${cashBalance.toLocaleString()}**\nRunway: **${runway} days**\n${runway >= 30 ? '✅ Strong position!' : runway >= 14 ? '⚠️ Monitor closely.' : '🔴 Increase sales or reduce expenses.'}`;
  }
  if (lower.includes('how') || lower.includes('business')) {
    return `📊 ${businessName} Summary:\n\n💰 Sales: ₦${sales.toLocaleString()}\n📈 Profit: ₦${profit.toLocaleString()} (${margin}%)\n💵 Cash: ₦${cashBalance.toLocaleString()} (${runway} days)\n${outOfStock.length > 0 ? `\n🔴 Critical: ${outOfStock.length} products OUT OF STOCK` : ''}\n${deadStock.length > 0 ? `\n💀 Dead Stock: ${deadStock.length} products not selling` : ''}\n${!hasMarket ? `\n🏪 Not on Busmo Market` : ''}\n\n${runway >= 30 && margin >= 25 ? '✅ You are doing excellently!' : 'Focus on improving cash flow and margins.'}`;
  }

  return `📊 ${businessName} (${category}) in ${country}\n\n₦${sales.toLocaleString()} sales, ${margin}% margin, ₦${cashBalance.toLocaleString()} cash, ${staffCount} staff\n\nWhat would you like to know? I can help with sales, inventory, cash flow, dead stock, or team performance! 📈`;
}
