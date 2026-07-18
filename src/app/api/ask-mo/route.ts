import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAdminDb } from '@/lib/firebase-admin';
import { detectIntent } from '@/lib/services/mo-intent-router';
import { executeAction } from '@/lib/services/mo-action-router';
import { renderResponse } from '@/lib/services/mo-response-renderer';
import { getBusinessProfileManager, BusinessSnapshot } from '@/lib/services/mo-business-profile';
import { getMasterProcessor } from '@/lib/services/mo-master-processor';
import { createConversationPlanner, ConversationContext } from '@/services/ai/conversation-planner';

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

RESPONSE STYLE:
- Avoid: "Great initiative," "Fantastic business," "Excellent idea," "Happy to help"
- Be: Confident, direct, practical, insightful
- Every sentence should move the business forward
- No unnecessary compliments

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
    const { message, image, businessId, userId, conversationHistory = [], language = 'en', languageName = 'English', businessCategory = 'retail', userRole, businessSummary } = body;

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

    const planner = createConversationPlanner(conversationContext);

    // STEP 2: Run Conversation Planner Pipeline
    console.log('🧠 [Ask MO API] Running conversation planner...');
    const plannedResponse = await planner.planResponse(message);
    console.log('🎯 [Ask MO API] Planner decisions:', plannedResponse.reasoning);

    console.log('🧠 [Ask MO API] Business Profile:', {
      industry: businessProfile?.industry,
      location: businessProfile?.location,
    });

    // STEP 3: Load business data based on planner requirements
    // IMPORTANT: The conversation planner now includes data dependency planning
    // It checks if we can answer with existing data before requesting more
    let businessData: any = {};
    
    // Use businessSummary from frontend if available (already loaded by useAskMO hook)
    if (businessSummary) {
      console.log('📊 [Ask MO API] Using businessSummary from frontend');
      businessData = {
        ...businessSummary,
        // Ensure sales data is properly formatted
        sales: businessSummary.totalSales !== undefined ? [{ totalRevenue: businessSummary.totalSales, profit: businessSummary.totalProfit }] : [],
      };
    } else if (businessId && plannedResponse.shouldRetrieveData) {
      try {
        const db = getAdminDb();
        const dataReqs = plannedResponse.dataRequirements;

        // Load sales data only if required
        if (dataReqs.salesData) {
          const salesQuery = db.collection('businesses').doc(businessId).collection('sales')
            .orderBy('createdAt', 'desc');
          
          // Apply time range filter
          if (dataReqs.timeRange === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            salesQuery.where('createdAt', '>=', today);
          } else if (dataReqs.timeRange === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            salesQuery.where('createdAt', '>=', weekAgo);
          } else if (dataReqs.timeRange === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            salesQuery.where('createdAt', '>=', monthAgo);
          }
          
          const salesSnapshot = await salesQuery.limit(50).get();
          businessData.sales = salesSnapshot.docs.map(doc => doc.data());
          console.log('📊 [Ask MO API] Loaded sales data:', businessData.sales.length, 'records');
        }

        // Load inventory data only if required
        if (dataReqs.inventoryData) {
          const productsSnapshot = await db.collection('businesses').doc(businessId).collection('products')
            .where('active', '==', true)
            .get();
          businessData.products = productsSnapshot.docs.map(doc => doc.data());
          console.log('📦 [Ask MO API] Loaded inventory data:', businessData.products.length, 'products');
        }

        // Load expense data only if required
        if (dataReqs.expenseData) {
          const expensesQuery = db.collection('businesses').doc(businessId).collection('expenses')
            .orderBy('createdAt', 'desc');
          
          // Apply time range filter
          if (dataReqs.timeRange === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expensesQuery.where('createdAt', '>=', today);
          } else if (dataReqs.timeRange === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            expensesQuery.where('createdAt', '>=', weekAgo);
          } else if (dataReqs.timeRange === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            expensesQuery.where('createdAt', '>=', monthAgo);
          }
          
          const expensesSnapshot = await expensesQuery.limit(50).get();
          businessData.expenses = expensesSnapshot.docs.map(doc => doc.data());
          console.log('💰 [Ask MO API] Loaded expense data:', businessData.expenses.length, 'records');
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

    // NEW: Check if we can answer with existing data before proceeding
    if (plannedResponse.canAnswerWithExistingData && businessData.sales && businessData.sales.length > 0) {
      console.log('✅ [Ask MO API] Can answer with existing data, preparing focused response');
      
      // Prepare a focused response based on available data and user query
      const lowerMessage = message.toLowerCase();
      
      // If user asks about sales, focus on sales data
      if (/analyze.*sales|sales.*performance|how are sales|sales.*doing/i.test(lowerMessage)) {
        const totalRevenue = businessData.sales.reduce((sum: number, sale: any) => sum + (parseFloat(sale.amount) || 0), 0);
        const totalOrders = businessData.sales.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Calculate profit if available
        let totalProfit = 0;
        businessData.sales.forEach((sale: any) => {
          if (sale.profit) {
            totalProfit += parseFloat(sale.profit) || 0;
          }
        });
        
        const grossMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        
        // Create a focused response about sales
        const focusedResponse = {
          answer: `Here's what I found in your sales data:\n\n` +
                  `• Revenue: ₦${totalRevenue.toLocaleString()}\n` +
                  `• Orders: ${totalOrders}\n` +
                  `• Average Order Value: ₦${avgOrderValue.toLocaleString()}\n` +
                  (totalProfit > 0 ? `• Profit: ₦${totalProfit.toLocaleString()}\n` : '') +
                  (grossMargin > 0 ? `• Gross Margin: ${grossMargin.toFixed(1)}%\n` : '') +
                  `\nObservation: Revenue looks healthy, though I'd need to see more data to identify trends. Which aspect of your sales would you like to explore further?`,
          intent: { intent: 'sales_analysis', confidence: 0.9 },
          actionResult: null,
          rendered: null,
          planner: {
            intent: plannedResponse.intent,
            conversationGoal: plannedResponse.conversationGoal,
            responseDepth: plannedResponse.responseDepth,
            topicType: plannedResponse.topicType,
            topicChanged: plannedResponse.topicChanged,
          },
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(focusedResponse);
      }
    }

    // Run Master Processor - orchestrates all MO engines
    const masterProcessor = getMasterProcessor(businessId || 'default', userId || 'default');
    const processingResult = await masterProcessor.process({
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

    if (intent.intent !== 'unknown' && intent.intent !== 'ask_question') {
      console.log('🎯 [Ask MO API] Intent detected for execution:', intent.intent, 'with data:', intent.data);
      
      // Check permissions (inline implementation)
      const hasPermission = userRole === 'owner' || userRole === 'admin' || 
        (userRole === 'staff' && ['record_sale', 'add_product', 'update_product'].includes(intent.intent));
      
      if (!hasPermission) {
        console.log('🔒 [Ask MO API] Permission denied for user role:', userRole, 'on intent:', intent.intent);
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
      
      return NextResponse.json(
        { error: 'Google Gen AI API key is not configured' },
        { status: 500 }
      );
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
      .sort(([,a], [,b]) => b - a)
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

CRITICAL: Respond with natural text only. Do NOT use JSON, XML, or action blocks in your response.

${plannedResponse.systemPrompt}`;

    // Add business context to system prompt
    if (businessSnapshot.openingCapital !== undefined || businessProfile?.industry || businessProfile?.location || businessData?.totalSales) {
      systemPrompt += `

📊 CURRENT BUSINESS CONTEXT:
${businessSnapshot.openingCapital !== undefined ? `- Opening Capital: ₦${businessSnapshot.openingCapital.toLocaleString()}` : ''}
${businessSnapshot.cashAvailable !== undefined ? `- Cash Available: ₦${businessSnapshot.cashAvailable.toLocaleString()}` : ''}
${businessSnapshot.profit !== undefined ? `- Current Profit: ₦${businessSnapshot.profit.toLocaleString()}` : ''}
${businessData?.totalSales !== undefined ? `- Total Sales: ₦${businessData.totalSales.toLocaleString()}` : ''}
${businessData?.todaySales !== undefined ? `- Today's Sales: ₦${businessData.todaySales.toLocaleString()}` : ''}
${businessData?.totalProfit !== undefined ? `- Total Profit: ₦${businessData.totalProfit.toLocaleString()}` : ''}
${businessData?.todayProfit !== undefined ? `- Today's Profit: ₦${businessData.todayProfit.toLocaleString()}` : ''}
${businessData?.lowStockCount !== undefined ? `- Low Stock Items: ${businessData.lowStockCount}` : ''}
${businessData?.outOfStockCount !== undefined ? `- Out of Stock Items: ${businessData.outOfStockCount}` : ''}
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

${processingResult.opportunities.map((o: any) => `[${o.type.toUpperCase()}] ${o.message}`).join('\n')}

Use these insights to provide proactive recommendations. Don't wait for the user to ask about these issues.`;
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