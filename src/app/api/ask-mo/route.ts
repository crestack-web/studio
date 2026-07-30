import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminDb } from '@/lib/firebase-admin';
import { detectIntent } from '@/lib/services/mo-intent-router';
import { executeAction, validatePermission } from '@/lib/services/mo-action-router';
import { renderResponse } from '@/lib/services/mo-response-renderer';
import { getBusinessProfileManager, BusinessSnapshot } from '@/lib/services/mo-business-profile';
import { getMasterProcessor } from '@/lib/services/mo-master-processor';
import { createConversationPlanner, ConversationContext } from '@/services/ai/conversation-planner';
import { getFeaturesByPlan, getFeaturesByBusinessCategory, type Plan, type BusinessCategory } from '@/lib/featureRegistry';

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
You are MO, the AI Operating Intelligence for Busmo. You are NOT a chatbot, NOT customer support, NOT an accounting assistant. You are the strategic business intelligence that helps African business owners make better decisions.

CORE IDENTITY:
- Think like: Founder, CEO, CFO, Operations Manager, Sales Manager, Business Consultant, Financial Analyst, Supply Chain Expert, Risk Analyst, Business Coach
- Every response should make the business owner think: "This AI understands my business better than I do."
- Before responding, internally reason through the business context instead of simply answering the last message

INTERNAL BUSINESS BRAIN:
Continuously maintain and evolve understanding of:
- Business Profile: Industry, business model, stage (idea/startup/growing/mature), location, staff count, products, services, customers, suppliers, revenue streams, goals, challenges, risks, priorities
- Financial State: Opening capital, cash available, inventory value, assets, liabilities, expected expenses, expected income, monthly burn, profit trend
- Operational State: Suppliers, customers, outstanding invoices, credit sales, inventory shortages/surplus, production capacity, delivery status, staff performance
- Conversation Memory: Never ask again for information already learned. Build business profile continuously from conversations

RESPONSE PHILOSOPHY:
1. STOP BEING REACTIVE - Before responding, analyze the business context. Calculate. Estimate. Challenge assumptions. Think ahead.
2. UNDERSTAND INTENT - Never respond literally. Identify the user's actual goal. Every message should begin with: "What is the user actually trying to accomplish?"
3. ALWAYS THINK AHEAD - Answer: "What will this business owner need next?" Anticipate problems and prevent expensive mistakes.
4. PERFORM CALCULATIONS AUTOMATICALLY - When users mention money, price, capital, profit, inventory, quantity, time, margins: automatically calculate. Never leave numbers unexplored.
5. CHALLENGE ASSUMPTIONS - Don't blindly agree. Respectfully challenge: yield, hidden charges, moisture deductions, packaging, delivery, etc.
6. PRIORITIZE ACTIONS - Decide what matters most. Guide users one important step at a time. Don't overwhelm.
7. BECOME PROACTIVE - Notice things automatically: "I notice you have inventory but no supplier recorded," "Your profit margin dropped," "You haven't reordered your best seller."
8. SHOW REASONING RESULTS - Show progress with business snapshots. Users should always understand where the business stands.
9. ASK BETTER QUESTIONS - Replace generic questions with intelligent ones that improve future advice.
10. USE MEMORY PROPERLY - If you know capital, location, industry, suppliers, products, goals: use that knowledge continuously.
11. EXPLAIN DECISIONS - Don't only recommend. Explain why.
12. THINK LIKE A CONSULTANT - Each answer should include: Observation, Analysis, Risk, Recommendation, Next Step.
13. ADAPT TO BUSINESS STAGE:
   - Idea Stage: Focus on validation, customers, pricing, costs
   - Startup Stage: Focus on cash flow, operations, first customers
   - Growing Business: Focus on automation, hiring, expansion
   - Established Business: Focus on efficiency, margins, scaling

RESPONSE LENGTH RULES (CRITICAL):
- The conversation planner assigns a response depth: QUICK, GUIDED, or DEEP. You MUST respect it.
- QUICK questions (short, simple, direct): "How many did I sell today?", "What's my profit?", "Add 5 bags of rice" → Reply in 1-3 sentences. No analysis. No recommendations. Just the answer.
- GUIDED questions (moderate): "How is my business doing?", "Should I restock?" → Reply with a clear answer + 1-2 key insights. Keep it focused.
- DEEP questions (strategic, complex): "How can I scale?", "Analyze my margins", "What's my growth strategy?" → Full analysis with Observation, Analysis, Risk, Recommendation, Next Step.
- NEVER give a deep analysis response to a quick question. If someone asks "what's my profit today?", just say "Your profit today is ₦X,XXX." Don't add paragraphs of analysis.
- NEVER ask for more information when the user gives a simple question. Just answer it.
- If the user's message is short (< 10 words), your response should be short (< 50 words) unless they explicitly ask for analysis.

RESPONSE STYLE:
- Avoid: "Great initiative," "Fantastic business," "Excellent idea," "Happy to help"
- Be: Confident, direct, practical, insightful
- Every sentence should move the business forward
- No unnecessary compliments
- Match the user's energy: short question = short answer, detailed question = detailed answer
- NEVER end responses with "Would you like me to...?" or "Should I...?" unless the user explicitly asked for options
- NEVER ask unnecessary follow-up questions after answering. Answer and stop.

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
- Retail: General retail shops (know: fast moving inventory, dead stock, reorder points, margin optimization)
- Restaurant: Food service establishments (know: food cost, wastage, recipe costing, menu engineering, peak hours)
- Wholesale: Bulk goods distribution
- Service: Service-based businesses
- Manufacturing: Production-based businesses (know: production cost, yield, capacity, downtime)
- E-commerce: Online businesses

INDUSTRY-SPECIFIC INTELLIGENCE:
Every industry has different intelligence. Become an expert in the user's industry.
- Plastic Recycling: Know PET grades, color separation, moisture, yield loss, processing stages, buyers, export quality, collection networks
- Agriculture: Know seasons, inputs, yield, harvest planning
- Construction: Know project costing, materials, labour

When suggesting navigation, always use the exact sidebar button names as referenced above.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, image, audio, businessId, userId, conversationHistory = [], language = 'en', languageName = 'English', businessCategory = 'retail', userRole = 'owner', businessSummary, userPlan = 'starter' } = body;

    console.log('📡 [Ask MO API] Request received', {
      messageLength: message?.length,
      hasImage: !!image,
      businessId,
      language,
      conversationHistoryLength: conversationHistory.length,
    });

    // Detect if this is a new conversation start — only when no history is provided
    // (the frontend sends empty history on first message or explicit "New Chat")
    // Do NOT strip history on greetings mid-conversation (e.g. "Hey Mo, what's my profit?")
    const isNewConversation = conversationHistory.length === 0;

    // If it's a new conversation, clear conversation history to prevent context bleeding
    const effectiveHistory = isNewConversation ? [] : conversationHistory;

    if (isNewConversation) {
      console.log('🆕 [Ask MO API] New conversation detected, clearing history');
      // Reset business profile for new conversation
      const profileManager = getBusinessProfileManager(businessId);
      profileManager.reset();
    }

    // Get business profile manager instance
    const profileManager = getBusinessProfileManager(businessId);

    // Get current business snapshot
    const businessSnapshot = profileManager.getSnapshot();
    const businessProfile = profileManager.getProfile();
    const industryIntelligence = profileManager.getIndustryIntelligence();

    // STEP 1: Initialize Conversation Planner
    const conversationContext: ConversationContext = {
      previousMessages: effectiveHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      currentTopic: undefined,
      previousTopics: [],
      businessContext: businessId ? {
        businessId,
        businessName: 'Your Business',
        industry: businessProfile?.industry,
      } : undefined,
      userPreferences: {
        prefersDetailedResponses: undefined,
        prefersDataVisualizations: undefined,
        prefersActionOriented: undefined,
      },
    };

    let plannedResponse;
    let planner: any = null;
    try {
      planner = createConversationPlanner(conversationContext);
      console.log('🧠 [Ask MO API] Running conversation planner...');
      plannedResponse = await planner.planResponse(message);
      console.log('🎯 [Ask MO API] Planner decisions:', plannedResponse.reasoning);
    } catch (plannerError) {
      console.error('❌ [Ask MO API] Conversation Planner error:', plannerError);
      // Continue with default response if planner fails
      plannedResponse = {
        intent: 'information' as any,
        conversationGoal: 'inform' as any,
        responseDepth: 'guided' as any,
        topicType: 'business_data' as any,
        topicChanged: false,
        shouldRetrieveData: true,
        dataRequirements: { 
          salesData: true, 
          inventoryData: true, 
          expenseData: true,
          customerData: true,
          staffData: true,
          businessMetrics: true,
          timeRange: 'month' as any 
        },
        requiredDataForQuery: [],
        availableDataForQuery: [],
        canAnswerWithExistingData: false,
        topicRelevanceScores: {},
        shouldPerformAction: false,
        reasoning: 'Planner failed, using defaults',
        systemPrompt: '',
      };
    }

    console.log('🧠 [Ask MO API] Business Profile:', {
      industry: businessProfile?.industry,
      location: businessProfile?.location,
    });

    console.log('📊 [Ask MO API] Planner data requirements:', {
      shouldRetrieveData: plannedResponse.shouldRetrieveData,
      dataRequirements: plannedResponse.dataRequirements,
      canAnswerWithExistingData: plannedResponse.canAnswerWithExistingData,
    });

    // STEP 3: Load business data based on planner requirements
    // IMPORTANT: The conversation planner now includes data dependency planning
    // It checks if we can answer with existing data before requesting more
    let businessData: any = {};
    
    // Fetch data directly from Firestore like StatementPage does
    if (businessId && plannedResponse.shouldRetrieveData) {
      console.log('✅ [Ask MO API] Planner requested data retrieval');
      try {
        const db = getAdminDb();
        const dataReqs = plannedResponse.dataRequirements;

        console.log('📋 [Ask MO API] Data requirements:', JSON.stringify(dataReqs, null, 2));

        // Load sales data only if required
        if (dataReqs.salesData) {
          console.log('🔍 [Ask MO API] Loading sales data...');
          const salesQuery = db.collection('businesses').doc(businessId).collection('sales')
            .orderBy('createdAt', 'desc');
          
          // Apply time range filter only if explicitly requested by user
          // Default to 'all' to include all historical data
          if (dataReqs.timeRange === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            salesQuery.where('createdAt', '>=', today);
            console.log('📅 [Ask MO API] Applying today filter');
          } else if (dataReqs.timeRange === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            salesQuery.where('createdAt', '>=', weekAgo);
            console.log('📅 [Ask MO API] Applying week filter');
          } else if (dataReqs.timeRange === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            salesQuery.where('createdAt', '>=', monthAgo);
            console.log('📅 [Ask MO API] Applying month filter');
          } else {
            console.log('📅 [Ask MO API] Loading all-time sales data (no time filter)');
          }
          
          const salesSnapshot = await salesQuery.limit(500).get();
          businessData.sales = salesSnapshot.docs.map(doc => doc.data());
          console.log('📊 [Ask MO API] Loaded sales data:', businessData.sales.length, 'records');
          
          // Calculate totals like StatementPage does
          let totalSales = 0;
          let totalProfit = 0;
          let todaySales = 0;
          let todayProfit = 0;
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          
          businessData.sales.forEach((sale: any) => {
            // Standardize field mapping - handle all possible field name variations
            const amount = parseFloat(sale.totalRevenue) || parseFloat(sale.total) || parseFloat(sale.amount) || 0;
            const profit = parseFloat(sale.profit) || 0;
            totalSales += amount;
            totalProfit += profit;
            
            const saleDate = sale.createdAt?.toDate();
            if (saleDate && saleDate >= todayDate) {
              todaySales += amount;
              todayProfit += profit;
            }
          });
          
          businessData.totalSales = totalSales;
          businessData.totalProfit = totalProfit;
          businessData.todaySales = todaySales;
          businessData.todayProfit = todayProfit;
          
          // Phase 1: Financial health metrics
          businessData.profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100) : 0;
          businessData.averageTransactionValue = businessData.sales.length > 0 ? (totalSales / businessData.sales.length) : 0;
          
          console.log('📊 [Ask MO API] Calculated totals:', { totalSales, totalProfit, todaySales, todayProfit });
          
          // Log field mapping sample for debugging
          if (businessData.sales.length > 0) {
            const sampleSale = businessData.sales[0];
            console.log('🔍 [Ask MO API] Sample sale fields:', Object.keys(sampleSale));
            console.log('🔍 [Ask MO API] Sample sale values:', {
              totalRevenue: sampleSale.totalRevenue,
              total: sampleSale.total,
              amount: sampleSale.amount,
              profit: sampleSale.profit,
              createdAt: sampleSale.createdAt
            });
          }
        } else {
          console.log('⚠️ [Ask MO API] Sales data NOT required by planner');
        }

        // Load inventory data only if required
        if (dataReqs.inventoryData) {
          const productsSnapshot = await db.collection('businesses').doc(businessId).collection('products')
            .where('active', '==', true)
            .get();
          
          const products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Load sales to calculate last sale date for each product
          const salesSnapshot = await db.collection('businesses').doc(businessId).collection('sales')
            .orderBy('createdAt', 'desc')
            .limit(500)
            .get();
          
          const sales = salesSnapshot.docs.map(doc => doc.data());
          
          // Create a map of product ID to last sale date
          const productLastSaleDate: Record<string, Date> = {};
          
          sales.forEach((sale: any) => {
            if (sale.products && Array.isArray(sale.products)) {
              sale.products.forEach((soldProduct: any) => {
                const productId = soldProduct.productId || soldProduct.id;
                if (productId && !productLastSaleDate[productId]) {
                  const saleDate = sale.createdAt?.toDate();
                  if (saleDate) {
                    productLastSaleDate[productId] = saleDate;
                  }
                }
              });
            }
          });
          
          // Enhance product data with last sale date
          businessData.products = products.map((product: any) => ({
            name: product.name || product.productName,
            quantity: product.stock || product.quantity || 0,
            costPrice: product.costPrice || product.cost || 0,
            sellingPrice: product.sellingPrice || product.price || 0,
            lastSaleDate: productLastSaleDate[product.id] ? productLastSaleDate[product.id].toISOString() : null,
            category: product.category,
            lowStockThreshold: product.lowStockThreshold || product.reorderLevel || 10,
            sku: product.sku || product.productCode,
          }));
          
          // Calculate out of stock and low stock products with names
          const outOfStockProducts = products
            .filter((p: any) => (p.stock || p.quantity || 0) === 0)
            .map((p: any) => ({
              name: p.name || p.productName || 'Unknown Product',
              quantity: p.stock || p.quantity || 0,
              sku: p.sku || p.productCode,
            }));
          
          const lowStockProducts = products
            .filter((p: any) => {
              const stock = p.stock || p.quantity || 0;
              const threshold = p.lowStockThreshold || p.reorderLevel || 10;
              return stock > 0 && stock <= threshold;
            })
            .map((p: any) => ({
              name: p.name || p.productName || 'Unknown Product',
              quantity: p.stock || p.quantity || 0,
              threshold: p.lowStockThreshold || p.reorderLevel || 10,
              sku: p.sku || p.productCode,
            }));
          
          businessData.outOfStockProducts = outOfStockProducts;
          businessData.lowStockProducts = lowStockProducts;
          businessData.outOfStockCount = outOfStockProducts.length;
          businessData.lowStockCount = lowStockProducts.length;
          
          // Phase 1: Calculate top selling products
          const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
          sales.forEach((sale: any) => {
            if (sale.products && Array.isArray(sale.products)) {
              sale.products.forEach((item: any) => {
                const productName = item.name || item.productName || 'Unknown Product';
                const quantity = item.quantity || 0;
                const revenue = item.total || (item.price * quantity) || 0;
                
                if (!productSales[productName]) {
                  productSales[productName] = { name: productName, quantity: 0, revenue: 0 };
                }
                productSales[productName].quantity += quantity;
                productSales[productName].revenue += revenue;
              });
            }
          });
          
          const topSellingProducts = Object.values(productSales)
            .sort((a: any, b: any) => b.revenue - a.revenue)
            .slice(0, 10)
            .map((p: any) => ({ name: p.name, quantity: p.quantity, revenue: p.revenue }));
          
          businessData.topSellingProducts = topSellingProducts;
          console.log('📦 [Ask MO API] Top selling products calculated:', topSellingProducts.length);
          
          console.log('📦 [Ask MO API] Loaded inventory data:', businessData.products.length, 'products with last sale dates');
          console.log('📦 [Ask MO API] Out of stock products:', outOfStockProducts.length);
          console.log('📦 [Ask MO API] Low stock products:', lowStockProducts.length);
          
          // Phase 1: Calculate product margins
          const productMargins = products
            .filter((p: any) => (p.sellingPrice || p.price || 0) > 0)
            .map((p: any) => {
              const sellingPrice = p.sellingPrice || p.price || 0;
              const costPrice = p.costPrice || p.cost || 0;
              const margin = sellingPrice - costPrice;
              const marginPercentage = (margin / sellingPrice) * 100;
              return {
                name: p.name || p.productName || 'Unknown Product',
                margin,
                marginPercentage,
                sellingPrice,
                costPrice,
              };
            })
            .sort((a: any, b: any) => b.marginPercentage - a.marginPercentage)
            .slice(0, 10);
          
          businessData.productMargins = productMargins;
          console.log('📦 [Ask MO API] Product margins calculated:', productMargins.length);
        }

        // Load expense data only if required
        if (dataReqs.expenseData) {
          const expensesQuery = db.collection('businesses').doc(businessId).collection('expenses')
            .orderBy('createdAt', 'desc');
          
          // Apply time range filter only if explicitly requested by user
          if (dataReqs.timeRange === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expensesQuery.where('createdAt', '>=', today);
            console.log('📅 [Ask MO API] Applying today filter to expenses');
          } else if (dataReqs.timeRange === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            expensesQuery.where('createdAt', '>=', weekAgo);
            console.log('📅 [Ask MO API] Applying week filter to expenses');
          } else if (dataReqs.timeRange === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            expensesQuery.where('createdAt', '>=', monthAgo);
            console.log('📅 [Ask MO API] Applying month filter to expenses');
          } else {
            console.log('📅 [Ask MO API] Loading all-time expense data (no time filter)');
          }
          
          const expensesSnapshot = await expensesQuery.limit(500).get();
          businessData.expenses = expensesSnapshot.docs.map(doc => doc.data());
          
          // Phase 1: Calculate expense categories breakdown
          const expenseCategories: Record<string, { amount: number; count: number }> = {};
          businessData.expenses.forEach((expense: any) => {
            const amount = expense.amount || 0;
            const category = expense.category || expense.type || 'Other';
            if (!expenseCategories[category]) {
              expenseCategories[category] = { amount: 0, count: 0 };
            }
            expenseCategories[category].amount += amount;
            expenseCategories[category].count += 1;
          });
          
          businessData.expenseCategories = Object.entries(expenseCategories)
            .map(([category, data]) => ({ category, amount: data.amount, count: data.count }))
            .sort((a: any, b: any) => b.amount - a.amount);
          
          console.log('💰 [Ask MO API] Loaded expense data:', businessData.expenses.length, 'records');
          console.log('💰 [Ask MO API] Expense categories calculated:', businessData.expenseCategories.length);
        }

        // Load customer data only if required
        if (dataReqs.customerData) {
          const customersSnapshot = await db.collection('businesses').doc(businessId).collection('credit_customers')
            .get();
          businessData.customers = customersSnapshot.docs.map(doc => doc.data());
          console.log('👥 [Ask MO API] Loaded customer data:', businessData.customers.length, 'customers');
        }

        // Load staff data only if required
        if (dataReqs.staffData) {
          const staffSnapshot = await db.collection('businesses').doc(businessId).collection('staff')
            .get();
          businessData.staff = staffSnapshot.docs.map(doc => doc.data());
          console.log('👷 [Ask MO API] Loaded staff data:', businessData.staff.length, 'staff');
        }

        // Load business metrics for deep analysis
        if (dataReqs.businessMetrics) {
          // Load cash flow
          const cashFlowSnapshot = await db.collection('businesses').doc(businessId).collection('cashFlow')
            .orderBy('date', 'desc')
            .limit(30)
            .get();
          businessData.cashFlow = cashFlowSnapshot.docs.map(doc => doc.data());
          console.log('📈 [Ask MO API] Loaded business metrics');
        }
        
      } catch (error) {
        console.error('Error loading business data:', error);
      }
    } else {
      console.log('⏭️ [Ask MO API] Skipping data load (not required by planner)');
    }

    // Update profile manager with business data so snapshot contains actual metrics
    if (businessData && Object.keys(businessData).length > 0) {
      await profileManager.updateWithFullData(businessData);
    } else {
      console.log('⚠️ [Ask MO API] No businessData to update profile manager. businessData keys:', Object.keys(businessData));
    }

    // Phase 2: Load available features based on user's plan and business category
    const normalizedPlan = (userPlan as Plan) || 'starter';
    const normalizedCategory = (businessCategory as BusinessCategory) || 'retail';
    const planFeatures = getFeaturesByPlan(normalizedPlan);
    const categoryFeatures = getFeaturesByBusinessCategory(normalizedCategory);
    
    // Filter features that are available for both plan and category
    const availableFeatures = planFeatures.filter(f => 
      categoryFeatures.some(cf => cf.id === f.id)
    );
    
    // Format features for AI context
    const featureContext = availableFeatures.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      category: f.category,
      pageId: f.pageId,
      pageName: f.pageId ? PAGE_NAMES[f.pageId as keyof typeof PAGE_NAMES] : undefined,
    }));
    
    businessData.availableFeatures = featureContext;
    businessData.userPlan = normalizedPlan;
    businessData.businessCategory = normalizedCategory;
    
    console.log('🎯 [Ask MO API] Available features loaded:', featureContext.length, 'features for plan:', normalizedPlan);

    // REMOVED: Early return for sales analysis to ensure comprehensive data processing
    // The profile manager needs to be updated and full AI processing should run
    // This ensures consistent data handling and better responses

    // Run Master Processor - orchestrates all MO engines
    let processingResult;
    try {
      const masterProcessor = getMasterProcessor(businessId || 'default', userId || 'default');
      processingResult = await masterProcessor.process({
        message,
        businessId: businessId || 'default',
        userId: userId || 'default',
        conversationId: conversationHistory.length > 0 ? 'current' : 'new',
        conversationHistory: effectiveHistory,
        businessData,
        userRole,
        language,
        languageName,
      });
    } catch (processorError) {
      console.error('❌ [Ask MO API] Master Processor error:', processorError);
      throw new Error(`Master Processor failed: ${processorError instanceof Error ? processorError.message : 'Unknown error'}`);
    }

    console.log('🚀 [Ask MO API] Master Processing completed:', {
      processingTime: processingResult.processingTime,
      intent: processingResult.intent.primaryIntent,
      principlesScore: processingResult.principlesScore,
    });

    // Detect if user is asking about starting a new business (outside their current business)
    const newBusinessPatterns = [
      /want to start/i,
      /thinking of starting/i,
      /planning to start/i,
      /considering starting/i,
      /how do i start/i,
      /should i start/i,
      /new business idea/i,
      /business to start/i,
      /what business should/i,
      /looking to start/i,
      /want to open/i,
      /thinking about opening/i,
      /planning to open/i,
    ];
    
    const isNewBusinessInquiry = newBusinessPatterns.some(pattern => pattern.test(message));
    
    if (isNewBusinessInquiry) {
      console.log('💡 [Ask MO API] New business inquiry detected');
    }

    // Step 1: Detect intent using pattern matching
    const intent = detectIntent(message);
    console.log('🎯 [Ask MO API] Intent detected:', intent.intent, 'confidence:', intent.confidence);

    // Step 2: If we have a structured intent with data, execute it
    let actionResult = null;
    let renderedResponse = null;

    // Intents that require client-side confirmation before executing
    const INTENTS_NEEDING_CONFIRMATION = ['record_sale', 'add_expense', 'add_product', 'record_payment', 'record_purchase', 'adjust_inventory'];

    if (intent.intent !== 'unknown' && intent.intent !== 'ask_question') {
      console.log('🎯 [Ask MO API] Intent detected for execution:', intent.intent, 'with data:', intent.data);
      
      // Check permissions using the centralized validator
      // (allows staff to record sales, blocks other actions for non-owners)
      const permCheck = validatePermission(intent.intent, userRole, userPlan);
      
      if (!permCheck.allowed) {
        console.log('🔒 [Ask MO API] Permission denied for user role:', userRole, 'on intent:', intent.intent, 'reason:', permCheck.reason);
        return NextResponse.json({
          answer: permCheck.reason || `Sorry, you don't have permission for this action.`,
          intent,
          permissionDenied: true,
          timestamp: new Date().toISOString()
        });
      }

      // For intents needing confirmation, pre-fetch data and return enriched pending action
      if (INTENTS_NEEDING_CONFIRMATION.includes(intent.intent)) {
        console.log('⏳ [Ask MO API] Intent needs confirmation, pre-fetching data for:', intent.intent);
        
        let enrichedData = { ...intent.data };

        // For record_sale: look up products from inventory to get real prices and calculate profit
        if (intent.intent === 'record_sale' && businessId) {
          try {
            const { findProductByName } = await import('@/lib/services/record-sale-service');
            const items = intent.data.items || [];
            const resolvedItems: any[] = [];
            let totalRevenue = 0;
            let totalCost = 0;

            for (const item of items) {
              const searchResult = await findProductByName(businessId, item.productName);
              if (searchResult.found) {
                // Use exact match or first fuzzy match to populate real product prices
                const product = searchResult.product || searchResult.matches?.[0];
                if (product) {
                  const costPrice = product.costPrice || product.cost || 0;
                  const sellingPrice = product.sellingPrice || product.price || item.price || 0;
                  const quantity = parseInt(item.quantity) || 1;
                  const itemRevenue = sellingPrice * quantity;
                  const itemCost = costPrice * quantity;

                  resolvedItems.push({
                    productName: product.name || item.productName,
                    quantity,
                    price: sellingPrice,
                    costPrice,
                    productId: product.id,
                    stock: product.stock || product.quantity || 0,
                  });

                  totalRevenue += itemRevenue;
                  totalCost += itemCost;
                } else {
                  resolvedItems.push({
                    productName: item.productName,
                    quantity: parseInt(item.quantity) || 1,
                    price: item.price || 0,
                    costPrice: 0,
                    productId: null,
                    stock: 0,
                  });
                  totalRevenue += (item.price || 0) * (parseInt(item.quantity) || 1);
                }
              } else {
                // Product not found — include what we have from text parsing
                resolvedItems.push({
                  productName: item.productName,
                  quantity: parseInt(item.quantity) || 1,
                  price: item.price || 0,
                  costPrice: 0,
                  productId: null,
                  stock: 0,
                });
                totalRevenue += (item.price || 0) * (parseInt(item.quantity) || 1);
              }
            }

            enrichedData = {
              ...intent.data,
              items: resolvedItems,
              productName: resolvedItems[0]?.productName || intent.data.productName,
              quantity: resolvedItems[0]?.quantity || intent.data.quantity,
              price: resolvedItems[0]?.price || intent.data.price,
              costPrice: resolvedItems[0]?.costPrice || 0,
              totalRevenue,
              totalCost,
              profit: totalRevenue - totalCost,
            };

            console.log('✅ [Ask MO API] Enriched sale data:', {
              items: resolvedItems.length,
              totalRevenue,
              totalCost,
              profit: totalRevenue - totalCost,
            });
          } catch (err) {
            console.error('❌ [Ask MO API] Error pre-fetching sale product data:', err);
          }
        }

        renderedResponse = renderResponse(
          `Please confirm: ${enrichedData.productName || enrichedData.category || intent.intent}`,
          undefined,
          intent
        );

        // Attach card data for confirmation UI
        if (intent.intent === 'record_sale' && enrichedData.items?.length > 0) {
          renderedResponse.card = {
            type: 'sale',
            items: enrichedData.items.map((item: any) => ({
              name: item.productName,
              quantity: item.quantity || 1,
              price: item.price || 0,
              costPrice: item.costPrice || 0,
            })),
            totalRevenue: enrichedData.totalRevenue || 0,
            totalProfit: enrichedData.profit || 0,
            timestamp: new Date(),
          };
        } else if (intent.intent === 'add_product') {
          renderedResponse.card = {
            type: 'product',
            name: enrichedData.name || 'Product',
            price: enrichedData.price || 0,
            cost: enrichedData.costPrice || 0,
            stock: enrichedData.stock || 0,
            sku: enrichedData.sku,
            message: `Add ${enrichedData.name || 'product'} to inventory`,
          };
        } else if (intent.intent === 'add_expense') {
          renderedResponse.card = {
            type: 'expense',
            category: enrichedData.category || 'General',
            amount: enrichedData.amount || 0,
            date: enrichedData.date || new Date().toISOString().split('T')[0],
            message: `Record ${enrichedData.category || 'expense'}: ₦${(enrichedData.amount || 0).toLocaleString()}`,
          };
        }

        return NextResponse.json({
          answer: renderedResponse.content,
          rendered: renderedResponse,
          pendingAction: { action: intent.intent, data: enrichedData },
          intent,
          timestamp: new Date().toISOString()
        });
      }

      // Execute action
      try {
        const db = getAdminDb();
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        console.log('🚀 [Ask MO API] About to execute action with context:', {
          businessId,
          userId,
          userEmail: userData?.email,
          userName: userData?.name,
          userRole: userRole || userData?.role,
          staffId: userData?.staffId,
        });

        actionResult = await executeAction(intent, {
          businessId,
          userId,
          userEmail: userData?.email,
          userName: userData?.name,
          userRole: userRole || userData?.role,
          staffId: userData?.staffId,
        });

        console.log('✅ [Ask MO API] Action execution result:', actionResult);
        
        // Render the result
        renderedResponse = renderResponse(actionResult.message || actionResult.data?.message || 'Action completed', actionResult, intent);
        console.log('✅ [Ask MO API] Action executed and rendered');
      } catch (error) {
        console.error('❌ [Ask MO API] Error executing action:', error);
        // Even if there's an error, we'll continue to let the AI provide a response
        actionResult = {
          success: false,
          message: `Error executing action: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
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
      
      // Fallback response if no API key
      return NextResponse.json({
        answer: 'I apologize, but the AI service is not properly configured. Please contact support.',
        error: 'Google Gen AI API key is not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // NEW: Add data dependency planning context to system prompt
    const dataDependencyContext = `
DATA DEPENDENCY PLANNING RESULTS:
- Can Answer With Existing Data: ${plannedResponse.canAnswerWithExistingData}
- Required Data for Query: [${plannedResponse.requiredDataForQuery.join(', ')}]
- Available Data for Query: [${plannedResponse.availableDataForQuery.join(', ')}]
- Should Retrieve Additional Data: ${plannedResponse.shouldRetrieveData}

NEVER ask for information you already have.
If you can answer the question with existing data, do so immediately.
Only ask for additional information if it's truly necessary to improve the response.
`;

    // NEW: Add data relevance engine context to system prompt
    const sortedRelevance = Object.entries(plannedResponse.topicRelevanceScores)
      .sort(([,a], [,b]) => (b as number) - (a as number) as number)
      .slice(0, 5); // Top 5 most relevant topics

    const dataRelevanceContext = `
DATA RELEVANCE RANKINGS:
The most relevant business information to the user's query is:
${sortedRelevance.map(([topic, score]) => `${topic}: ${score}%`).join('\n')}

FOCUS your analysis on the highest-ranked items when responding to the user's query.
`;

    // Build system prompt - use planner's generated prompt as base
    let systemPrompt = `${BUSINESS_CONTEXT_PROMPT}

${dataDependencyContext}

${dataRelevanceContext}

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

SALE RECORDING RULES (CRITICAL):
- When a user says "record sale of X" or "sold X", do NOT ask for the selling price or cost price.
- The system automatically looks up the product in your inventory and uses its existing prices.
- If the product exists in inventory, its current selling price and cost price will be used automatically.
- Only ask for price if the product is NOT found in your inventory.
- NEVER ask "What is the selling price?" or "How much did you sell it for?" for products already in inventory.
- NEVER ask "What is the cost price?" — cost prices are already stored in your product inventory.

CRITICAL: Respond with natural text only. Do NOT use JSON, XML, or action blocks in your response.

${plannedResponse.systemPrompt}`;

    // Add business context to system prompt
    if (businessSnapshot.openingCapital !== undefined || businessSnapshot.totalSales !== undefined || businessProfile?.industry || businessProfile?.location) {
      systemPrompt += `

📊 CURRENT BUSINESS CONTEXT:
${businessSnapshot.openingCapital !== undefined ? `- Opening Capital: ₦${businessSnapshot.openingCapital.toLocaleString()}` : ''}
${businessSnapshot.cashAvailable !== undefined ? `- Cash Available: ₦${businessSnapshot.cashAvailable.toLocaleString()}` : ''}
${businessSnapshot.profit !== undefined ? `- Current Profit: ₦${businessSnapshot.profit.toLocaleString()}` : ''}
${businessSnapshot.totalSales !== undefined ? `- Total Sales: ₦${businessSnapshot.totalSales.toLocaleString()}` : ''}
${businessSnapshot.todaySales !== undefined ? `- Today's Sales: ₦${businessSnapshot.todaySales.toLocaleString()}` : ''}
${businessSnapshot.totalProfit !== undefined ? `- Total Profit: ₦${businessSnapshot.totalProfit.toLocaleString()}` : ''}
${businessSnapshot.todayProfit !== undefined ? `- Today's Profit: ₦${businessSnapshot.todayProfit.toLocaleString()}` : ''}
${businessSnapshot.lowStockCount !== undefined ? `- Low Stock Items: ${businessSnapshot.lowStockCount}` : ''}
${businessSnapshot.outOfStockCount !== undefined ? `- Out of Stock Items: ${businessSnapshot.outOfStockCount}` : ''}
${businessProfile?.industry ? `- Industry: ${businessProfile.industry}` : ''}
${businessProfile?.location ? `- Location: ${businessProfile.location}` : ''}
${businessSnapshot.nextRecommendedAction ? `- Recommended Next Action: ${businessSnapshot.nextRecommendedAction}` : ''}
${industryIntelligence ? `- Industry Intelligence: ${industryIntelligence}` : ''}

Use this context to provide tailored advice. Never ask for information already shown above.`;
    }


    // Add calculation results to system prompt if available
    if (processingResult.calculations.length > 0) {
      systemPrompt += `

📊 AUTOMATIC FINANCIAL ANALYSIS:
${processingResult.calculations.map((c: any) => `${c.type}: ${c.result}`).join('\n')}

Use these calculations in your response. Show the user you understand their numbers and provide insights based on them.`;
    }

    // Add reasoning results to system prompt
    systemPrompt += `

🧠 INTERNAL REASONING:
Intent: ${processingResult.intent.primaryIntent}
Goal: ${processingResult.reasoning.actualGoal}
Recommended: ${processingResult.reasoning.recommendedAction}

Use this reasoning to guide your response. Focus on the user's actual goal and the recommended action.`;

    // Add proactive insights to system prompt if available
    if (processingResult.opportunities.length > 0) {
      systemPrompt += `
          
${processingResult.opportunities.map((o: any) => `${o.type.toUpperCase()} ${o.message}`).join('\n')}
          
Use these insights to provide proactive recommendations. Don't wait for the user to ask about these issues.
        `.trim();
    }

    // Add new business inquiry specific instructions
    if (isNewBusinessInquiry) {
      systemPrompt += `

🚀 NEW BUSINESS INQUIRY MODE:
The user is asking about starting a NEW business (outside their current business activity).
Your role shifts from operational assistant to business advisor.

IMPORTANT BEHAVIOR:
- DO NOT use their current business data to answer questions about the new business
- Ask clarifying questions to understand their situation:
  * What type of business are they considering?
  * What is their budget/capital available?
  * What skills/experience do they have?
  * What is their location/target market?
  * What are their goals (income, lifestyle, growth)?
  * What resources do they have (time, equipment, space)?
- Provide advice based on their specific situation, not generic advice
- Consider local market conditions, competition, and feasibility
- Be realistic about challenges and requirements
- Suggest practical next steps based on their answers

Remember: This is about a NEW business venture, not their existing business. Treat it as a fresh inquiry.`;
    }

    // Add master processor results to system prompt
    if (processingResult.finalResponse) {
      systemPrompt += `

${processingResult.finalResponse}`;
    }

    // Add Busmo action suggestion if available
    if (processingResult.busmoAction) {
      systemPrompt += `

🎯 SUGGESTED BUSMO ACTION:
${processingResult.busmoAction.description}
Confidence: ${(processingResult.busmoAction.confidence * 100).toFixed(0)}%
${processingResult.busmoAction.requiresConfirmation ? '(Requires confirmation)' : '(Auto-executable)'}`;
    }

    // Add next action if available
    if (processingResult.nextAction) {
      systemPrompt += `

🎯 RECOMMENDED NEXT ACTION:
${processingResult.nextAction}`;
    }

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

        let messageParts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: message }];
        if (image && typeof image === 'string') {
          const [imgHeader, imgData] = image.split(',');
          const imgMimeType = imgHeader?.split(';')[0]?.split(':')[1] || 'image/jpeg';
          if (imgData) {
            messageParts.push({ inlineData: { mimeType: imgMimeType, data: imgData } });
          }
        }
        if (audio && typeof audio === 'string') {
          const [audioHeader, audioData] = audio.split(',');
          const audioMimeType = audioHeader?.split(';')[0]?.split(':')[1] || 'audio/webm';
          if (audioData) {
            messageParts.push({ inlineData: { mimeType: audioMimeType, data: audioData } });
          }
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

    // Use the AI's conversational response as the primary answer
    // The rendered card/alerts/suggestions are attached separately in the response
    const finalAnswer = text;

    // STEP 4: Update conversation context after response
    planner.updateContext(message, finalAnswer);
    console.log('🔄 [Ask MO API] Conversation context updated');

    return NextResponse.json({
      answer: finalAnswer,
      intent,
      actionResult,
      rendered: renderedResponse,
      planner: {
        intent: plannedResponse.intent,
        conversationGoal: plannedResponse.conversationGoal,
        responseDepth: plannedResponse.responseDepth,
        topicType: plannedResponse.topicType,
        topicChanged: plannedResponse.topicChanged,
        canAnswerWithExistingData: plannedResponse.canAnswerWithExistingData,
        requiredDataForQuery: plannedResponse.requiredDataForQuery,
        availableDataForQuery: plannedResponse.availableDataForQuery,
        topicRelevanceScores: plannedResponse.topicRelevanceScores,
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [Ask MO API] Error:', error);
    console.error('❌ [Ask MO API] Error type:', typeof error);
    console.error('❌ [Ask MO API] Error constructor:', error?.constructor?.name);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    const errorName = error instanceof Error ? error.name : 'Unknown';
    
    console.error('❌ [Ask MO API] Error details:', {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
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
    const { action, businessId, userId, userRole } = body;

    if (!action || !businessId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, businessId, userId' },
        { status: 400 }
      );
    }

    // Check permissions using the centralized validator
    const permCheck = validatePermission(action.action, userRole);
    
    if (!permCheck.allowed) {
      console.log('🔒 [Ask MO API] Permission denied for user role:', userRole, 'on action:', action.action, 'reason:', permCheck.reason);
      return NextResponse.json({
        success: false,
        message: permCheck.reason || `Sorry, you don't have permission for this action.`,
        permissionDenied: true,
      });
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