import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BUSINESS_CONTEXT_PROMPT } from './business-context';
import { detectIntent } from './intent-detection';
import { executeAction } from './action-execution';
import { renderResponse } from './response-renderer';
import { getBusinessProfileManager } from '../lib/services/mo-business-profile';
import { getMasterProcessor, clearMasterProcessor } from '../lib/services/mo-master-processor';
import { getMemoryEngine, clearMemoryEngine } from '../lib/services/mo-memory-engine';
import { getLearningEngine, clearLearningEngine } from '../lib/services/mo-learning-engine';
import { getPlanningEngine } from '../lib/services/mo-planning-engine';
import { getProfileManager } from '../lib/services/mo-profile-manager';
import { getCalculationEngine } from '../lib/services/mo-calculation-engine';
import { getReasoningEngine } from '../lib/services/mo-reasoning-engine';
import { getOpportunityEngine } from '../lib/services/mo-opportunity-engine';
import { getRiskEngine } from '../lib/services/mo-risk-engine';
import { getActionEngine } from '../lib/services/mo-action-engine';
import { getResponsePlanner } from '../lib/services/mo-response-planner';

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      businessId,
      userId,
      userRole,
      conversationHistory,
      businessData,
      image,
      language = 'en',
      languageName = 'English',
    } = await request.json();

    if (!message || !businessId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, businessId, userId' },
        { status: 400 }
      );
    }

    // Get business profile manager
    const profileManager = getProfileManager(businessId);
    const businessProfile = profileManager.getProfile();
    const businessSnapshot = profileManager.getSnapshot();

    // Get industry intelligence
    const industryIntelligence = profileManager.getIndustryIntelligence();

    // NEW: Use conversation planner to check data dependency
    const planner = getPlanningEngine();
    const plannedResponse = planner.planResponse({
      message,
      businessId,
      businessProfile,
      businessData,
      conversationHistory,
      userRole,
      language,
      languageName,
    });

    // NEW: Check if we can answer with existing data before proceeding
    if (plannedResponse.canAnswerWithExistingData && !plannedResponse.requiresAdditionalData) {
      // Use the data from businessData
      const { businessDataFromDoc, sales, products, expenses, customers, suppliers, staff, cashFlow } = businessData;
      
      // Create a business data object that includes all key sections
      const businessDataObject = {
        businessDataFromDoc,
        sales,
        products,
        expenses,
        customers,
        suppliers,
        staff,
        cashFlow,
        lowStockItems: products?.filter((p: any) => p.stockLevel < p.reorderLevel) || [],
        outOfStockItems: products?.filter((p: any) => p.stockLevel === 0) || [],
        totalSales: sales?.reduce((sum: number, sale: any) => sum + (parseFloat(sale.amount) || 0), 0),
        todaySales: sales?.filter((sale: any) => {
          const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
          return saleDate.toDateString() === new Date().toDateString();
        })?.reduce((sum: number, sale: any) => sum + (parseFloat(sale.amount) || 0), 0),
        totalExpenses: expenses?.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0),
        todayExpenses: expenses?.filter((expense: any) => {
          const expenseDate = expense.createdAt?.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
          return expenseDate.toDateString() === new Date().toDateString();
        })?.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0),
        totalProfit: 0, // Will be calculated below
        todayProfit: 0, // Will be calculated below
        lowStockCount: products?.filter((p: any) => p.stockLevel < p.reorderLevel).length || 0,
        outOfStockCount: products?.filter((p: any) => p.stockLevel === 0).length || 0,
        productionCapacity: businessDataFromDoc?.productionCapacity || 0,
        deliveryStatus: businessDataFromDoc?.deliveryStatus || 0,
        inventoryShortages: businessDataFromDoc?.inventoryShortages || [],
        inventorySurplus: businessDataFromDoc?.inventorySurplus || [],
        staffPerformance: staff || [],
        cashFlow: cashFlow || [],
      };

      // Calculate profit data
      businessDataObject.totalProfit = businessDataObject.totalSales - businessDataObject.totalExpenses;
      businessDataObject.todayProfit = businessDataObject.todaySales - businessDataObject.todayExpenses;

      // Create a focused response based on the query
      const lowerMessage = message.toLowerCase();
      
      // If user asks about sales, focus on sales data
      if (/analyze.*sales|sales.*performance|how are sales|sales.*doing/i.test(lowerMessage)) {
        const totalRevenue = businessDataObject.sales?.reduce((sum: number, sale: any) => sum + (parseFloat(sale.amount) || 0), 0);
        const totalOrders = businessDataObject.sales?.length || 0;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Calculate profit
        let totalProfit = 0;
        businessDataObject.sales?.forEach((sale: any) => {
          if (sale.profit) {
            totalProfit += parseFloat(sale.profit) || 0;
          }
        });
        
        const grossMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        
        // Create a focused response about sales
        const focusedResponse = {
          answer: `Here's what I found in your sales data:

` +
                  `• Revenue: ₦${totalRevenue.toLocaleString()}
` +
                  `• Orders: ${totalOrders}
` +
                  `• Average Order Value: ₦${avgOrderValue.toLocaleString()}
` +
                  (totalProfit > 0 ? `• Profit: ₦${totalProfit.toLocaleString()}
` : '') +
                  (grossMargin > 0 ? `• Gross Margin: ${grossMargin.toFixed(1)}%
` : '') +
                  `
Which aspect of your sales would you like to explore further?`,
          intent: { intent: 'sales_analysis', confidence: 0.9 },
          planner: {
            intent: 'sales_analysis',
            conversationGoal: 'Understand sales performance',
            responseDepth: 'detailed',
            topicType: 'sales',
            topicChanged: false,
          },
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(focusedResponse);
      }
      
      // If user asks about inventory, focus on inventory data
      if (/analyze.*inventory|inventory.*performance|how is inventory|inventory.*doing/i.test(lowerMessage)) {
        const totalInventoryValue = businessDataObject.products?.reduce((sum: number, product: any) => {
          return sum + (parseFloat(product.cost) * product.stockLevel || 0);
        }, 0);
        
        const lowStockValue = businessDataObject.lowStockItems?.reduce((sum: number, product: any) => {
          return sum + (parseFloat(product.cost) * product.stockLevel || 0);
        }, 0);
        
        const outOfStockValue = businessDataObject.outOfStockItems?.reduce((sum: number, product: any) => {
          return sum + (parseFloat(product.cost) * product.stockLevel || 0);
        }, 0);
        
        // Create a focused response about inventory
        const focusedResponse = {
          answer: `Here's what I found in your inventory data:

` +
                  `• Total Inventory Value: ₦${totalInventoryValue.toLocaleString()}
` +
                  `• Low Stock Value: ₦${lowStockValue.toLocaleString()}
` +
                  `• Out of Stock Value: ₦${outOfStockValue.toLocaleString()}

` +
                  `You have ${businessDataObject.lowStockCount} low stock items and ${businessDataObject.outOfStockCount} out of stock items.
` +
                  `Would you like me to help you with inventory reordering?`,
          intent: { intent: 'inventory_analysis', confidence: 0.85 },
          planner: {
            intent: 'inventory_analysis',
            conversationGoal: 'Understand inventory performance',
            responseDepth: 'detailed',
            topicType: 'inventory',
            topicChanged: false,
          },
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(focusedResponse);
      }
      
      // If user asks about expenses, focus on expense data
      if (/analyze.*expenses|expenses.*performance|how are expenses|expenses.*doing/i.test(lowerMessage)) {
        const totalExpenses = businessDataObject.expenses?.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0);
        
        const todayExpenses = businessDataObject.expenses?.filter((expense: any) => {
          const expenseDate = expense.createdAt?.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
          return expenseDate.toDateString() === new Date().toDateString();
        })?.reduce((sum: number, expense: any) => sum + (parseFloat(expense.amount) || 0), 0);
        
        // Create a focused response about expenses
        const focusedResponse = {
          answer: `Here's what I found in your expense data:

` +
                  `• Total Expenses: ₦${totalExpenses.toLocaleString()}
` +
                  `• Today's Expenses: ₦${todayExpenses.toLocaleString()}

` +
                  `Your main expense categories are ${businessDataObject.expenses?.slice(0, 2).map((e: any) => e.category).join(', ') || 'not yet categorized'}.
` +
                  `Would you like me to help you optimize your expenses?`,
          intent: { intent: 'expense_analysis', confidence: 0.8 },
          planner: {
            intent: 'expense_analysis',
            conversationGoal: 'Understand expense patterns',
            responseDepth: 'detailed',
            topicType: 'expenses',
            topicChanged: false,
          },
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(focusedResponse);
      }
      
      // If user asks about cash flow, focus on cash flow data
      if (/analyze.*cash|cash.*performance|how is cash|cash.*doing/i.test(lowerMessage)) {
        const cashAvailable = businessDataObject.cashFlow?.find((cf: any) => cf.type === 'available')?.amount || 0;
        const cashInHand = businessDataObject.cashFlow?.find((cf: any) => cf.type === 'in_hand')?.amount || 0;
        const cashFlow = businessDataObject.cashFlow || [];
        
        // Create a focused response about cash flow
        const focusedResponse = {
          answer: `Here's what I found in your cash flow data:

` +
                  `• Cash Available: ₦${cashAvailable.toLocaleString()}
` +
                  `• Cash In Hand: ₦${cashInHand.toLocaleString()}

` +
                  `Your cash flow shows ${cashFlow.length} transactions.
` +
                  `Would you like me to analyze your cash flow patterns?`,
          intent: { intent: 'cash_analysis', confidence: 0.75 },
          planner: {
            intent: 'cash_analysis',
            conversationGoal: 'Understand cash flow patterns',
            responseDepth: 'detailed',
            topicType: 'cash',
            topicChanged: false,
          },
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(focusedResponse);
      }
      
      // If user asks about customers, focus on customer data
      if (/analyze.*customers|customers.*performance|how are customers|customers.*doing/i.test(lowerMessage)) {
        const customerCount = businessDataObject.customers?.length || 0;
        const activeCustomers = businessDataObject.customers?.filter((c: any) => c.active).length || 0;
        const customerValue = businessDataObject.sales?.reduce((sum: number, sale: any) => {
          const customer = businessDataObject.customers?.find((c: any) => c.id === sale.customerId);
          return sum + (customer ? (parseFloat(sale.amount) || 0) : 0);
        }, 0);
        
        // Create a focused response about customers
        const focusedResponse = {
          answer: `Here's what I found in your customer data:

` +
                  `• Total Customers: ${customerCount}
` +
                  `• Active Customers: ${activeCustomers}
` +
                  `• Customer Value: ₦${customerValue.toLocaleString()}

` +
                  `Would you like me to help you improve customer engagement?`,
          intent: { intent: 'customer_analysis', confidence: 0.7 },
          planner: {
            intent: 'customer_analysis',
            conversationGoal: 'Improve customer engagement',
            responseDepth: 'detailed',
            topicType: 'customers',
            topicChanged: false,
          },
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(focusedResponse);
      }
      
      // If user asks about suppliers, focus on supplier data
      if (/analyze.*suppliers|suppliers.*performance|how are suppliers|suppliers.*doing/i.test(lowerMessage)) {
        const supplierCount = businessDataObject.suppliers?.length || 0;
        const activeSuppliers = businessDataObject.suppliers?.filter((s: any) => s.active).length || 0;
        const supplierPerformance = businessDataObject.suppliers?.reduce((acc: Record<string, number>, supplier: any) => {
          if (supplier.onTimeDelivery) {
            acc[supplier.name] = (acc[supplier.name] || 0) + 1;
          }
          return acc;
        }, {});
        
        // Create a focused response about suppliers
        const supplierPerformanceText = Object.entries(supplierPerformance || {}).map(([supplier, count]: [string, number]) => {
          return `• ${supplier}: ${count} on-time deliveries`;
        }).join('\n');
        
        const focusedResponse = {
          answer: `🏭 **SUPPLIERS DASHBOARD**
          
**Total:** ${supplierCount}
**Active:** ${activeSuppliers}

${supplierPerformanceText || 'No performance data available'}`,
          intent: { intent: 'supplier_analysis', confidence: 0.65 },
          planner: {
            intent: 'supplier_analysis',
            conversationGoal: 'Improve supplier relationships',
            responseDepth: 'detailed',
            topicType: 'suppliers',
            topicChanged: false,
          },
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(focusedResponse);
      }
      
      // If user asks about staff, focus on staff data
      if (/analyze.*staff|staff.*performance|how is staff|staff.*doing/i.test(lowerMessage)) {
        const staffCount = businessDataObject.staff?.length || 0;
        const activeStaff = businessDataObject.staff?.filter((s: any) => s.active).length || 0;
        const staffPerformance = businessDataObject.staff?.reduce((acc: Record<string, number>, staff: any) => {
          if (staff.performanceRating) {
            acc[staff.name] = staff.performanceRating;
          }
          return acc;
        }, {});
        
        // Create a focused response about staff
        const focusedResponse = {
          answer: `Here's what I found in your staff data:

` +
                  `• Total Staff: ${staffCount}
` +
                  `• Active Staff: ${activeStaff}

` +
                  `Staff Performance:
` +
                  Object.entries(staffPerformance || {}).map(([staff, rating]: [string, number]) => {
                    return `• ${staff}: ${rating} performance rating`;
                  }).join('\n') || 'No performance data available',
          intent: { intent: 'staff_analysis', confidence: 0.6 },
          planner: {
            intent: 'staff_analysis',
            conversationGoal: 'Improve staff performance',
            responseDepth: 'detailed',
            topicType: 'staff',
            topicChanged: false,
          },
          timestamp: new Date().toISOString()
        };
        
        return NextResponse.json(focusedResponse);
      }
      
      // If no specific section is requested, use the master processor
      const masterProcessor = getMasterProcessor(businessId, userId);
      const processingResult = await masterProcessor.process({
        message,
        businessId,
        userId,
        conversationHistory,
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
      const dataDependencyContext = `DATA DEPENDENCY PLANNING RESULTS:
- Can Answer With Existing Data: ${plannedResponse.canAnswerWithExistingData}
- Required Data for Query: [${plannedResponse.requiredDataForQuery.join(', ')}]
- Available Data for Query: [${plannedResponse.availableDataForQuery.join(', ')}]
- Should Retrieve Additional Data: ${plannedResponse.shouldRetrieveData}

NEVER ask for information you already have.
If you can answer the question with existing data, do so immediately.
Only ask for additional information only if absolutely necessary to improve the response.`.trim();

      // NEW: Add response formatting instructions for concise data presentation
      const responseFormatContext = `RESPONSE FORMAT INSTRUCTIONS:
- Provide concise responses with key metrics in a dashboard-like format
- Use bullet points, tables, or cards to present data
- Start with the most important information
- Use code formatting for better readability
- Present numerical data with currency symbols and thousands separators
- Summarize data in a way that's easy to scan and understand
- Use headers like **SALES DASHBOARD**, **INVENTORY DASHBOARD**, etc.
- Include today's figures vs totals when relevant
- Format responses as data cards for better visualization`.trim();

      // NEW: Add data relevance engine context to system prompt
      const sortedRelevance = Object.entries(plannedResponse.topicRelevanceScores || {})
        .filter(([_, score]) => typeof score === 'number')
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5 most relevant topics

      const dataRelevanceContext = `DATA RELEVANCE RANKINGS:
The most relevant business information to the user's query is:
${sortedRelevance.map(([topic, score]) => `${topic}: ${score}%`).join('\\n')}

FOCUS your analysis on the highest-ranked items when responding to the user's query.`.trim();

      // Build system prompt - use planner's generated prompt as base
      let systemPrompt = `${BUSINESS_CONTEXT_PROMPT}

${dataDependencyContext}

${dataRelevanceContext}

${responseFormatContext}
`;

      // Add character integrity instructions
      systemPrompt += `
🌍 LANGUAGE: Respond in ${languageName} (${language}). Use the same language the user wrote in.

🎭 CHARACTER INTEGRITY (CRITICAL):
- NEVER break character. You are ALWAYS MO, the business intelligence assistant.
- NEVER reveal you are an AI, chatbot, or language model.
- Maintain a professional, business-focused tone at all times.
- NEVER discuss permissions, access rights, or administrator approval. The system handles permissions automatically.
- NEVER tell users to contact their administrator for permissions. If an action fails, explain the actual business reason (e.g., product not found, insufficient stock).
- NEVER say you don't have permission to perform an action. If you have business data, you have permission to analyze it.
      `.trim();

      // Add operational behavior instructions
      systemPrompt += `
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
      `.trim();

      // Add business context to system prompt
      if (businessSnapshot.openingCapital !== undefined || businessProfile.industry || businessProfile.location || businessDataObject.totalSales) {
        systemPrompt += `
        
📊 CURRENT BUSINESS CONTEXT:
${businessSnapshot.openingCapital !== undefined ? `- Opening Capital: ₦${businessSnapshot.openingCapital.toLocaleString()}` : ''}
${businessSnapshot.cashAvailable !== undefined ? `- Cash Available: ₦${businessSnapshot.cashAvailable.toLocaleString()}` : ''}
${businessSnapshot.profit !== undefined ? `- Current Profit: ₦${businessSnapshot.profit.toLocaleString()}` : ''}
${businessDataObject.totalSales !== undefined ? `- Total Sales: ₦${businessDataObject.totalSales.toLocaleString()}` : ''}
${businessDataObject.todaySales !== undefined ? `- Today's Sales: ₦${businessDataObject.todaySales.toLocaleString()}` : ''}
${businessDataObject.totalProfit !== undefined ? `- Total Profit: ₦${businessDataObject.totalProfit.toLocaleString()}` : ''}
${businessDataObject.todayProfit !== undefined ? `- Today's Profit: ₦${businessDataObject.todayProfit.toLocaleString()}` : ''}
${businessDataObject.lowStockCount !== undefined ? `- Low Stock Items: ${businessDataObject.lowStockCount}` : ''}
${businessDataObject.outOfStockCount !== undefined ? `- Out of Stock Items: ${businessDataObject.outOfStockCount}` : ''}
${businessProfile.industry ? `- Industry: ${businessProfile.industry}` : ''}
${businessProfile.location ? `- Location: ${businessProfile.location}` : ''}
${businessProfile.stage ? `- Business Stage: ${businessProfile.stage}` : ''}
${businessSnapshot.nextRecommendedAction ? `- Recommended Next Action: ${businessSnapshot.nextRecommendedAction}` : ''}
${industryIntelligence ? `- Industry Intelligence: ${industryIntelligence}` : ''}

Use this context to provide tailored advice. Never ask for information already shown above.
      `.trim();

      // Add stage-specific advice to system prompt
      const stageAdvice = profileManager.getStageSpecificAdvice();
      if (stageAdvice && !stageAdvice.includes('Define your business stage')) {
        systemPrompt += `
        
🎯 STAGE-SPECIFIC FOCUS:
${stageAdvice}

Tailor your advice to this business stage.
        `.trim();
      }

      // Add calculation results to system prompt
      if (processingResult.calculations.length > 0) {
        systemPrompt += `
        
📊 AUTOMATIC FINANCIAL ANALYSIS:
${processingResult.calculations.map((c: any) => `${c.type}: ${c.result}`).join('\\n')}
        
Use these calculations in your response. Show the user you understand their numbers and provide insights based on them.
        `.trim();
      }

      // Add reasoning results to system prompt
      systemPrompt += `
      
🧠 INTERNAL REASONING:
Intent: ${processingResult.intent.primaryIntent}
Goal: ${processingResult.reasoning.actualGoal}
Recommended: ${processingResult.reasoning.recommendedAction}

Use this reasoning to guide your response. Focus on the user's actual goal and the recommended action.
      `.trim();

      // Add proactive insights to system prompt
      if (processingResult.opportunities.length > 0) {
        systemPrompt += `
        
${processingResult.opportunities.map((o: any) => `${o.type.toUpperCase()} ${o.message}`).join('
')}
        
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
        `.trim();
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
${processingResult.busmoAction.requiresConfirmation ? '(Requires confirmation)' : '(Auto-executable)'}`
        `.trim();
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
              { inlineData: { mimeType: image.mimeType || 'image/jpeg', data: image.data }
            ];
          } else {
            messageParts = [{ text: message }];
          }

          result = await Promise.race([
            chat.sendMessage(messageParts),
            timeoutPromise
          ]) as any;

          break;
        } catch (error) {
          lastError = error;
          console.error(`❌ [Ask MO API] Attempt ${attempt} failed: `, error.message);

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
    const errorName = error instanceof Error ? error.name : 'Unknown';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
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

    const result = await executeAction(action, {
      businessId,
      userId,
      userEmail: userData?.email,
      userName: userData?.name,
      userRole: userRole || userData?.role,
      staffId: userData?.staffId,
    });

    console.log('✅ [Ask MO API] Action executed and rendered');
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