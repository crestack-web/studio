import { getProfileManager } from '@/lib/services/mo-business-profile';

/**
 * Conversation Planner - MO's Internal Reasoning Architecture
 * 
 * This service executes before every AI response to:
 * 1. Detect user intent
 * 2. Detect topic changes
 * 3. Classify data vs general knowledge queries
 * 4. Determine conversation goal
 * 5. Decide response depth
 * 6. Retrieve relevant data selectively
 * 7. Perform reasoning/calculations
 * 8. Decide on actions
 * 9. Generate response
 * 10. Update memory/state
 */

export type UserIntent = 'information' | 'action' | 'teaching' | 'strategy' | 'discovery' | 'challenge';
export type ConversationGoal = 'inform' | 'discover' | 'teach' | 'challenge' | 'reason' | 'act' | 'clarify';
export type ResponseDepth = 'quick' | 'guided' | 'deep';
export type TopicType = 'business_data' | 'general_knowledge' | 'mixed';

export interface ConversationContext {
  previousMessages: Array<{ role: string; content: string }>;
  currentTopic?: string;
  previousTopics: string[];
  businessContext?: {
    businessId: string;
    businessName: string;
    industry?: string;
    plan?: string;
  };
  userPreferences?: {
    prefersDetailedResponses?: boolean;
    prefersDataVisualizations?: boolean;
    prefersActionOriented?: boolean;
  };
}

export interface PlannedResponse {
  intent: UserIntent;
  conversationGoal: ConversationGoal;
  responseDepth: ResponseDepth;
  topicType: TopicType;
  topicChanged: boolean;
  shouldRetrieveData: boolean;
  dataRequirements: DataRequirements;
  requiredDataForQuery: string[];
  availableDataForQuery: string[];
  canAnswerWithExistingData: boolean;
  topicRelevanceScores: Record<string, number>;
  shouldPerformAction: boolean;
  actionType?: string;
  reasoning: string;
  systemPrompt: string;
}

export interface DataRequirements {
  salesData?: boolean;
  inventoryData?: boolean;
  expenseData?: boolean;
  customerData?: boolean;
  staffData?: boolean;
  supplierData?: boolean;
  businessMetrics?: boolean;
  timeRange?: 'today' | 'week' | 'month' | 'year' | 'all';
  specificFields?: string[];
}

/**
 * Conversation Planner Class
 * Orchestrates the entire conversation pipeline
 */
export interface BusinessSnapshot {
  [key: string]: any;
}

export class ConversationPlanner {
  private context: ConversationContext;
  private businessSnapshot: BusinessSnapshot;
  private businessProfile: any;

  constructor(context: ConversationContext) {
    this.context = context;
    const profileManager = getProfileManager('default');
    this.businessSnapshot = {} as BusinessSnapshot;
    this.businessProfile = null;
  }

  /**
   * Main pipeline entry point - executes all detection steps
   */
  async planResponse(userMessage: string, businessData?: any): Promise<PlannedResponse> {
    // Update business profile from business data if available
    if (businessData && !this.businessProfile) {
      this.businessProfile = {
        businessId: businessData.businessId || businessData.businessDataFromDoc?.businessId,
        businessName: businessData.businessDataFromDoc?.businessName,
        industry: businessData.businessDataFromDoc?.industry,
        ...businessData.businessDataFromDoc
      };
    }
    
    // NEW: Data Dependency Analysis - Check what user is asking and what data is available
    const requiredDataForQuery = this.determineRequiredDataForQuery(userMessage);
    const availableDataForQuery = this.determineAvailableDataForQuery(requiredDataForQuery, this.businessProfile);
    const canAnswerWithExistingData = availableDataForQuery.length >= requiredDataForQuery.length * 0.8; // 80% threshold
    
    // NEW: Data Relevance Engine - Rank business information by relevance to user's question
    const topicRelevanceScores = this.calculateTopicRelevanceScores(userMessage);
    
    // Step 1: Detect user intent
    const intent = this.detectIntent(userMessage);
    
    // Step 2: Detect topic change
    const topicChanged = this.detectTopicChange(userMessage);
    
    // Step 3: Classify topic type (data vs general knowledge)
    const topicType = this.classifyTopicType(userMessage);
    
    // Step 4: Determine conversation goal
    const conversationGoal = this.determineConversationGoal(userMessage, intent);
    
    // Step 5: Decide response depth
    const responseDepth = this.decideResponseDepth(userMessage, intent, conversationGoal);
    
    // Step 6: Determine data requirements
    const dataRequirements = this.determineDataRequirements(userMessage, topicType, responseDepth);
    
    // NEW: Only retrieve data if truly needed and not available
    const shouldRetrieveData = this.shouldActuallyRetrieveData(dataRequirements, canAnswerWithExistingData, userMessage);
    
    // Step 7: Decide if action should be performed
    const { shouldPerformAction, actionType } = this.decideAction(userMessage, intent);
    
    // Step 8: Generate reasoning explanation
    const reasoning = this.generateReasoning({
      intent,
      topicChanged,
      topicType,
      conversationGoal,
      responseDepth,
      shouldPerformAction,
      canAnswerWithExistingData,
      requiredDataForQuery,
      availableDataForQuery,
    });
    
    // Step 9: Generate system prompt for AI
    const systemPrompt = this.generateSystemPrompt({
      intent,
      conversationGoal,
      responseDepth,
      topicType,
      dataRequirements,
      shouldPerformAction,
      canAnswerWithExistingData,
      requiredDataForQuery,
      availableDataForQuery,
      topicRelevanceScores,
    });

    return {
      intent,
      conversationGoal,
      responseDepth,
      topicType,
      topicChanged,
      shouldRetrieveData,
      dataRequirements,
      requiredDataForQuery,
      availableDataForQuery,
      canAnswerWithExistingData,
      topicRelevanceScores,
      shouldPerformAction,
      actionType,
      reasoning,
      systemPrompt,
    };
  }

  /**
   * NEW: Determine what specific data is required to answer the user's query
   */
  private determineRequiredDataForQuery(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const requiredData: string[] = [];

    // Sales-related queries
    if (/(analyze|review|check|show me|what are|how are).*sales|revenue|income|profit|money/i.test(lowerMessage)) {
      requiredData.push('sales_data', 'revenue', 'profit', 'orders');
    }
    
    // Inventory-related queries
    if (/(analyze|review|check|show me|what are|how are).*inventory|stock|products|items|goods|restock/i.test(lowerMessage)) {
      requiredData.push('inventory_data', 'stock_levels', 'low_stock', 'out_of_stock');
    }
    
    // Expense-related queries
    if (/(analyze|review|check|show me|what are|how are).*expenses|costs|spending|bills|overhead/i.test(lowerMessage)) {
      requiredData.push('expense_data', 'cost_breakdown', 'cash_flow');
    }
    
    // Customer-related queries
    if (/(analyze|review|check|show me|what are|how are).*customers|clients|buyers|purchasers/i.test(lowerMessage)) {
      requiredData.push('customer_data', 'customer_insights', 'sales_by_customer');
    }
    
    // Cash flow queries
    if (/(analyze|review|check|show me|what are|how are).*cash|balance|reserves|flow|available/i.test(lowerMessage)) {
      requiredData.push('cash_flow', 'balance', 'profitability', 'liquidity');
    }
    
    // Staff-related queries
    if (/(analyze|review|check|show me|what are|how are).*staff|employees|workers|team/i.test(lowerMessage)) {
      requiredData.push('staff_data', 'staff_performance', 'labor_costs');
    }
    
    // If it's a general business question, we might need multiple data types
    if (/(how is my business|business doing|overview|summary|performance|health)/i.test(lowerMessage)) {
      requiredData.push('sales_data', 'expense_data', 'inventory_data', 'cash_flow', 'staff_data', 'customer_data', 'supplier_data');
    }

    // Feature-related queries (Phase 1: Feature Guidance)
    if (/(what features|what can i do|what's included|what's available|what tools|help me get started|how do i use|show me features|my plan|what do i have access)/i.test(lowerMessage)) {
      requiredData.push('feature_list', 'user_plan', 'business_category');
    }

    // Remove duplicates
    return [...new Set(requiredData)];
  }

  /**
   * NEW: Determine what data is already available for the query
   */
  private determineAvailableDataForQuery(requiredData: string[], businessProfile: any): string[] {
    const availableData: string[] = [];
    
    // Check if we have business data
    if (businessProfile) {
      // Check for sales data availability
      if (businessProfile.saleList && businessProfile.saleList.length > 0) {
        availableData.push('sales_data', 'revenue', 'profit', 'orders');
      }
      
      // Check for inventory data availability
      if (businessProfile.productList && businessProfile.productList.length > 0) {
        availableData.push('inventory_data', 'stock_levels', 'low_stock', 'out_of_stock');
      }
      
      // Check for expense data availability
      if (businessProfile.expenseList && businessProfile.expenseList.length > 0) {
        availableData.push('expense_data', 'cost_breakdown', 'cash_flow');
      }
      
      // Check for customer data availability
      if (businessProfile.customerList && businessProfile.customerList.length > 0) {
        availableData.push('customer_data', 'customer_insights', 'sales_by_customer');
      }
      
      // Check for staff data availability
      if (businessProfile.staffPerformance && Object.keys(businessProfile.staffPerformance).length > 0) {
        availableData.push('staff_data', 'staff_performance', 'labor_costs');
      }
      
      // Check for supplier data availability
      if (businessProfile.suppliersList && businessProfile.suppliersList.length > 0) {
        availableData.push('supplier_data', 'supplier_relations');
      }
      
      // Check for basic business info
      if (businessProfile.industry || businessProfile.location || businessProfile.stage) {
        availableData.push('basic_business_info');
      }
    }
    
    // Add any data that's always available in business profile
    if (this.businessSnapshot) {
      if (this.businessSnapshot.openingCapital !== undefined) availableData.push('basic_business_info');
      if (this.businessSnapshot.cashAvailable !== undefined) availableData.push('cash_flow');
      if (this.businessSnapshot.totalSales !== undefined) availableData.push('sales_data');
      if (this.businessSnapshot.lowStockCount !== undefined) availableData.push('low_stock');
      if (this.businessSnapshot.outOfStockCount !== undefined) availableData.push('out_of_stock');
    }
    
    // Remove duplicates
    return [...new Set(availableData)];
  }

  /**
   * NEW: Calculate relevance scores for different business aspects
   */
  private calculateTopicRelevanceScores(message: string): Record<string, number> {
    const lowerMessage = message.toLowerCase();
    const scores: Record<string, number> = {};

    // Calculate relevance scores based on user query
    scores.sales = this.calculateRelevanceScore(lowerMessage, ['sales', 'revenue', 'sold', 'selling', 'transactions']);
    scores.revenue = this.calculateRelevanceScore(lowerMessage, ['revenue', 'income', 'money', 'profit']);
    scores.profit = this.calculateRelevanceScore(lowerMessage, ['profit', 'earnings', 'margin', 'gain']);
    scores.orders = this.calculateRelevanceScore(lowerMessage, ['orders', 'transactions', 'sales']);
    scores.customers = this.calculateRelevanceScore(lowerMessage, ['customers', 'clients', 'buyers', 'purchasers']);
    scores.inventory = this.calculateRelevanceScore(lowerMessage, ['inventory', 'stock', 'products', 'items', 'goods']);
    scores.cash_flow = this.calculateRelevanceScore(lowerMessage, ['cash', 'balance', 'reserves', 'flow', 'available']);
    scores.suppliers = this.calculateRelevanceScore(lowerMessage, ['suppliers', 'vendors', 'producers', 'supplies']);
    scores.expenses = this.calculateRelevanceScore(lowerMessage, ['expenses', 'costs', 'spending', 'bills', 'overhead']);
    scores.staff = this.calculateRelevanceScore(lowerMessage, ['staff', 'employees', 'workers', 'team', 'labor']);
    scores.low_stock = this.calculateRelevanceScore(lowerMessage, ['low stock', 'reorder', 'restock', 'out of stock']);
    scores.trends = this.calculateRelevanceScore(lowerMessage, ['trend', 'trends', 'growth', 'decline', 'change']);
    
    return scores;
  }

  /**
   * Helper to calculate relevance score
   */
  private calculateRelevanceScore(text: string, keywords: string[]): number {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 10;
      }
      // Partial matches
      if (text.includes(keyword.substring(0, Math.floor(keyword.length * 0.6)))) {
        score += 5;
      }
    }
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * NEW: Decide if we should actually retrieve data based on availability
   * FIXED: Always fetch fresh data when businessId exists to ensure accuracy
   */
  private shouldActuallyRetrieveData(dataRequirements: DataRequirements, canAnswerWithExistingData: boolean, userMessage: string): boolean {
    // Don't retrieve data if it's not needed for the query
    const hasDataRequirement = !!(dataRequirements.salesData || 
                               dataRequirements.inventoryData || 
                               dataRequirements.expenseData ||
                               dataRequirements.customerData ||
                               dataRequirements.staffData ||
                               dataRequirements.businessMetrics);
    
    // FIXED: Always retrieve fresh data when requirements exist
    // The canAnswerWithExistingData check is removed because cached data may be stale
    // Users prefer accurate, fresh data over cached potentially incorrect data
    if (hasDataRequirement) {
      return true;
    }
    
    return false;
  }

  /**
   * Step 1: Detect User Intent
   */
  private detectIntent(message: string): UserIntent {
    const lowerMessage = message.toLowerCase();
    
    // Action intent - user wants to perform an action
    const actionPatterns = [
      /^(record|add|create|delete|remove|update|edit)/i,
      /record (a|an|the)?\s*(sale|expense|payment|purchase|inventory)/i,
      /create|add (a|an)?\s*(customer|supplier|staff|product)/i,
      /send|email|notify/i,
    ];
    
    if (actionPatterns.some(pattern => pattern.test(message))) {
      return 'action';
    }

    // Teaching intent - user wants to learn
    const teachingPatterns = [
      /^(how|what|why|when|where)\s+(do|does|did|can|could|should|would|to)/i,
      /explain/i,
      /teach me/i,
      /show me/i,
      /what (is|are|was|were)/i,
      /how (do|does|can|to)/i,
    ];
    
    if (teachingPatterns.some(pattern => pattern.test(message))) {
      return 'teaching';
    }

    // Strategy intent - user wants strategic advice
    const strategyPatterns = [
      /scale/i,
      /grow/i,
      /improve/i,
      /optimize/i,
      /strategy/i,
      /plan/i,
      /forecast/i,
      /analyze/i,
      /should i/i,
      /best way to/i,
      /how to (increase|reduce|improve)/i,
    ];
    
    if (strategyPatterns.some(pattern => pattern.test(message))) {
      return 'strategy';
    }

    // Discovery intent - user wants to explore data
    const discoveryPatterns = [
      /show/i,
      /display/i,
      /what (do|have|are)/i,
      /list/i,
      /tell me about/i,
      /overview/i,
      /summary/i,
    ];
    
    if (discoveryPatterns.some(pattern => pattern.test(message))) {
      return 'discovery';
    }

    // Challenge intent - user wants to question or verify
    const challengePatterns = [
      /why (did|do|does)/i,
      /is (this|that|it) (right|correct|accurate)/i,
      /check/i,
      /verify/i,
      /are you sure/i,
    ];
    
    if (challengePatterns.some(pattern => pattern.test(message))) {
      return 'challenge';
    }

    // Default to information intent
    return 'information';
  }

  /**
   * Step 2: Detect Topic Change
   */
  private detectTopicChange(message: string): boolean {
    if (this.context.previousMessages.length === 0) {
      return true; // First message, no previous topic
    }

    const currentTopic = this.extractTopic(message);
    const previousTopic = this.context.currentTopic;

    if (!previousTopic) {
      return true; // No previous topic established
    }

    // Simple topic similarity check
    const topicSimilarity = this.calculateTopicSimilarity(currentTopic, previousTopic);
    return topicSimilarity < 0.3; // Threshold for considering it a topic change
  }

  private extractTopic(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Extract key terms that indicate topic
    const topicKeywords = {
      sales: ['sales', 'revenue', 'sold', 'selling', 'transactions'],
      inventory: ['inventory', 'stock', 'products', 'items', 'goods'],
      expenses: ['expenses', 'costs', 'spending', 'payments', 'bills'],
      customers: ['customers', 'clients', 'buyers', 'purchasers'],
      staff: ['staff', 'employees', 'workers', 'team'],
      pricing: ['price', 'pricing', 'cost', 'rates'],
      marketing: ['marketing', 'promotion', 'advertising'],
      finance: ['finance', 'cash', 'money', 'profit', 'loss'],
      suppliers: ['suppliers', 'vendors', 'producers', 'supplies'],
      cash_flow: ['cash', 'balance', 'reserves', 'flow', 'available'],
      profit: ['profit', 'earnings', 'margin', 'gain']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return topic;
      }
    }

    return 'general';
  }

  private calculateTopicSimilarity(topic1: string, topic2: string): number {
    if (topic1 === topic2) return 1.0;
    if (topic1 === 'general' || topic2 === 'general') return 0.2;
    
    // Related topics have higher similarity
    const relatedTopics: Record<string, string[]> = {
      sales: ['finance', 'pricing', 'revenue', 'profit', 'cash_flow'],
      inventory: ['sales', 'pricing', 'products', 'stock'],
      expenses: ['finance', 'costs', 'cash_flow'],
      customers: ['sales', 'marketing', 'profit'],
      finance: ['sales', 'expenses', 'pricing', 'cash_flow'],
      profit: ['sales', 'expenses', 'finance', 'revenue'],
      cash_flow: ['finance', 'sales', 'expenses']
    };

    if (relatedTopics[topic1]?.includes(topic2) || relatedTopics[topic2]?.includes(topic1)) {
      return 0.6;
    }

    return 0.1;
  }

  /**
   * Step 3: Classify Topic Type (Data vs General Knowledge)
   * 
   * IMPORTANT: We use AGGRESSIVE data loading by design.
   * Users value having their actual business data used in responses over conservative data loading.
   * Missing business data makes MO responses generic and less valuable.
   * The performance cost of loading data is worth the improved response quality.
   */
  private classifyTopicType(message: string): TopicType {
    const lowerMessage = message.toLowerCase();
    
    // Business data indicators - expanded to catch more business queries
    const businessDataPatterns = [
      /sales|revenue|profit|income|money|cash|balance/i,
      /inventory|stock|products|items|goods/i,
      /expenses|costs|spending|payments|bills/i,
      /customers|clients|buyers|purchasers/i,
      /staff|employees|workers|team/i,
      /today|this week|this month|this year/i,
      /how many|how much|how is/i,
      /show me|display|list/i,
      /record|log|track/i,
      /business|company|store|shop/i,
      /performance|doing|status|overview|summary/i,
      /restock|reorder|low stock|out of stock/i,
      /margin|growth|trend/i,
    ];

    // General knowledge indicators - more specific to avoid false positives
    const generalKnowledgePatterns = [
      /how (do|to|can|should) i (start|begin|create|set up)/i,
      /what (is|are|was|were) (the|a|an) (best|good|proper)/i,
      /why (do|does|did|is|are) (you|people|companies)/i,
      /explain (how|what|why)/i,
      /teach me (how|what|why)/i,
      /best practices for/i,
      /tips for|advice on/i,
      /business strategy (theory|concept|framework)/i,
    ];

    const hasBusinessData = businessDataPatterns.some(pattern => pattern.test(message));
    const hasGeneralKnowledge = generalKnowledgePatterns.some(pattern => pattern.test(message));

    // Prioritize business data classification
    if (hasBusinessData) {
      return hasGeneralKnowledge ? 'mixed' : 'business_data';
    }
    
    // If no clear business data indicators but has general knowledge patterns
    if (hasGeneralKnowledge) {
      return 'general_knowledge';
    }
    
    // Default to business_data if we have a business profile
    // This ensures we load data for ambiguous queries like "how is my business doing?"
    // INTENTIONAL: Aggressive default - users prefer data-loaded responses over generic ones
    if (this.businessProfile && (this.businessProfile.saleList || this.businessProfile.productList)) {
      return 'business_data';
    }
    
    return 'general_knowledge';
  }

  /**
   * Step 4: Determine Conversation Goal
   */
  private determineConversationGoal(message: string, intent: UserIntent): ConversationGoal {
    const lowerMessage = message.toLowerCase();

    // Direct mapping from intent to goal
    const intentToGoal: Record<UserIntent, ConversationGoal> = {
      action: 'act',
      teaching: 'teach',
      strategy: 'reason',
      discovery: 'discover',
      challenge: 'challenge',
      information: 'inform',
    };

    // Refine based on message content
    if (intent === 'information') {
      if (/(what|which|who|when|where)/i.test(message)) {
        return 'discover';
      }
      if (/check|verify|confirm/i.test(message)) {
        return 'challenge';
      }
    }

    if (intent === 'strategy') {
      if (/analyze|assessment|evaluation/i.test(message)) {
        return 'reason';
      }
      if (/should i|recommend|suggest/i.test(message)) {
        return 'teach';
      }
    }

    return intentToGoal[intent];
  }

  /**
   * Step 5: Decide Response Depth
   */
  private decideResponseDepth(
    message: string,
    intent: UserIntent,
    conversationGoal: ConversationGoal
  ): ResponseDepth {
    const lowerMessage = message.toLowerCase();
    const messageLength = message.split(' ').length;

    // Quick Answer triggers
    const quickTriggers = [
      messageLength < 5,
      /^(today|now|current|latest)/i.test(message),
      /^(how many|how much|what|which|who|when|where)/i.test(message) && messageLength < 10,
      intent === 'action' && messageLength < 8,
      this.context.userPreferences?.prefersDetailedResponses === false,
    ];

    if (quickTriggers.some(trigger => trigger === true)) {
      return 'quick';
    }

    // Deep Analysis triggers
    const deepTriggers = [
      intent === 'strategy',
      conversationGoal === 'reason',
      /scale|grow|improve|optimize|strategy/i.test(message),
      /analyze|assessment|evaluation|detailed/i.test(message),
      messageLength > 15,
      this.context.userPreferences?.prefersDetailedResponses === true,
    ];

    if (deepTriggers.some(trigger => trigger === true)) {
      return 'deep';
    }

    // Default to guided
    return 'guided';
  }

  /**
   * Step 6: Determine Data Requirements
   */
  private determineDataRequirements(
    message: string,
    topicType: TopicType,
    responseDepth: ResponseDepth
  ): DataRequirements {
    const requirements: DataRequirements = {};
    const lowerMessage = message.toLowerCase();

    // Only retrieve data if it's a business data query
    if (topicType === 'general_knowledge') {
      return requirements;
    }

    // Sales data - expanded patterns
    if (/sales|revenue|income|sold|selling|money|cash|balance|profit/i.test(message)) {
      requirements.salesData = true;
      requirements.timeRange = this.extractTimeRange(message);
    }
    
    // Inventory data - expanded patterns
    if (/inventory|stock|products|items|goods|restock|reorder/i.test(message)) {
      requirements.inventoryData = true;
    }
    
    // Expense data - expanded patterns
    if (/expenses|costs|spending|payments|bills|burn|cost/i.test(message)) {
      requirements.expenseData = true;
      requirements.timeRange = this.extractTimeRange(message);
    }
    
    // Customer data
    if (/customers|clients|buyers|purchasers/i.test(message)) {
      requirements.customerData = true;
    }
    
    // Staff data
    if (/staff|employees|workers|team/i.test(message)) {
      requirements.staffData = true;
    }
    
    // Supplier data
    if (/suppliers|vendors|producers|supplies/i.test(message)) {
      requirements.supplierData = true;
    }
    
    // Business metrics - load for all business data queries to provide context
    if (topicType === 'business_data' || topicType === 'mixed') {
      requirements.businessMetrics = true;
      requirements.timeRange = this.extractTimeRange(message) || 'month';
    }
    
    // For general business overview queries, load all relevant data
    if (/how is my business|business doing|overview|summary|status|performance/i.test(message)) {
      requirements.salesData = true;
      requirements.inventoryData = true;
      requirements.expenseData = true;
      requirements.customerData = true;
      requirements.staffData = true;
      requirements.supplierData = true;
      requirements.businessMetrics = true;
      requirements.timeRange = this.extractTimeRange(message) || 'month';
    }
    
    // If we need to perform calculations, require appropriate data
    if (lowerMessage.includes('calculate') || lowerMessage.includes('how much')) {
      if (lowerMessage.includes('profit')) {
        requirements.salesData = true;
        requirements.expenseData = true;
      }
      if (lowerMessage.includes('profit margin')) {
        requirements.salesData = true;
        requirements.expenseData = true;
      }
      if (lowerMessage.includes('inventory turnover')) {
        requirements.inventoryData = true;
        requirements.salesData = true;
      }
      if (lowerMessage.includes('cash flow')) {
        requirements.businessMetrics = true;
      }
    }

    return requirements;
  }

  private extractTimeRange(message: string): 'today' | 'week' | 'month' | 'year' | 'all' | undefined {
    const lowerMessage = message.toLowerCase();

    if (/today/i.test(message)) return 'today';
    if (/this week|week/i.test(message)) return 'week';
    if (/this month|month/i.test(message)) return 'month';
    if (/this year|year/i.test(message)) return 'year';
    if (/all|total|overall|ever/i.test(message)) return 'all';

    return undefined;
  }

  /**
   * Step 7: Decide if Action Should Be Performed
   */
  private decideAction(message: string, intent: UserIntent): { shouldPerformAction: boolean; actionType?: string } {
    if (intent !== 'action') {
      return { shouldPerformAction: false };
    }

    const lowerMessage = message.toLowerCase();

    // Map action patterns to action types
    const actionMappings: Array<{ pattern: RegExp; type: string }> = [
      { pattern: /record (a|the)?\s*sale/i, type: 'record_sale' },
      { pattern: /record (a|the)?\s*expense/i, type: 'record_expense' },
      { pattern: /add (a|the)?\s*customer/i, type: 'add_customer' },
      { pattern: /add (a|the)?\s*supplier/i, type: 'add_supplier' },
      { pattern: /add (a|the)?\s*staff/i, type: 'add_staff' },
      { pattern: /create (a|the)?\s*product/i, type: 'create_product' },
      { pattern: /send (a|the)?\s*email/i, type: 'send_email' },
      { pattern: /record (a|the)?\s*payment/i, type: 'record_payment' },
      { pattern: /record (a|the)?\s*expense/i, type: 'record_expense' },
      { pattern: /add (a|the)?\s*product/i, type: 'add_product' },
      { pattern: /update (a|the)?\s*product/i, type: 'update_product' },
      { pattern: /add (a|the)?\s*customer/i, type: 'add_customer' },
      { pattern: /add (a|the)?\s*supplier/i, type: 'add_supplier' },
      { pattern: /add (a|the)?\s*staff/i, type: 'add_staff' },
      { pattern: /add (a|the)?\s*expense/i, type: 'add_expense' },
      { pattern: /record (a|the)?\s*expense/i, type: 'record_expense' },
      { pattern: /record (a|the)?\s*payment/i, type: 'record_payment' },
      { pattern: /record (a|the)?\s*product/i, type: 'record_product' },
      { pattern: /record (a|the)?\s*inventory/i, type: 'record_inventory' },
      { pattern: /record (a|the)?\s*stock/i, type: 'record_stock' },
      { pattern: /record (a|the)?\s*customer/i, type: 'record_customer' },
      { pattern: /record (a|the)?\s*supplier/i, type: 'record_supplier' },
      { pattern: /record (a|the)?\s*staff/i, type: 'record_staff' },
      { pattern: /record (a|the)?\s*expense/i, type: 'record_expense' },
      { pattern: /record (a|the)?\s*payment/i, type: 'record_payment' },
      { pattern: /record (a|the)?\s*product/i, type: 'record_product' },
      { pattern: /record (a|the)?\s*inventory/i, type: 'record_inventory' },
      { pattern: /record (a|the)?\s*stock/i, type: 'record_stock' },
      { pattern: /record (a|the)?\s*customer/i, type: 'record_customer' },
      { pattern: /record (a|the)?\s*supplier/i, type: 'record_supplier' },
      { pattern: /record (a|the)?\s*staff/i, type: 'record_staff' },
      { pattern: /record (a|the)?\s*expense/i, type: 'record_expense' },
      { pattern: /record (a|the)?\s*payment/i, type: 'record_payment' },
    ];

    for (const { pattern, type } of actionMappings) {
      if (pattern.test(message)) {
        return { shouldPerformAction: true, actionType: type };
      }
    }

    return { shouldPerformAction: false };
  }

  /**
   * Step 8: Generate Reasoning Explanation
   */
  private generateReasoning(decisions: {
    intent: UserIntent;
    topicChanged: boolean;
    topicType: TopicType;
    conversationGoal: ConversationGoal;
    responseDepth: ResponseDepth;
    shouldPerformAction: boolean;
    canAnswerWithExistingData: boolean;
    requiredDataForQuery: string[];
    availableDataForQuery: string[];
  }): string {
    const parts: string[] = [];

    parts.push(`Intent: ${decisions.intent}`);
    parts.push(`Topic Changed: ${decisions.topicChanged}`);
    parts.push(`Topic Type: ${decisions.topicType}`);
    parts.push(`Conversation Goal: ${decisions.conversationGoal}`);
    parts.push(`Response Depth: ${decisions.responseDepth}`);
    parts.push(`Should Perform Action: ${decisions.shouldPerformAction}`);
    parts.push(`Can Answer With Existing Data: ${decisions.canAnswerWithExistingData}`);
    parts.push(`Required Data: [${decisions.requiredDataForQuery.join(', ')}]`);
    parts.push(`Available Data: [${decisions.availableDataForQuery.join(', ')}]`);

    return parts.join(' | ');
  }

  /**
   * Step 9: Generate System Prompt for AI
   */
  private generateSystemPrompt(decisions: {
    intent: UserIntent;
    conversationGoal: ConversationGoal;
    responseDepth: ResponseDepth;
    topicType: TopicType;
    dataRequirements: DataRequirements;
    shouldPerformAction: boolean;
    canAnswerWithExistingData: boolean;
    requiredDataForQuery: string[];
    availableDataForQuery: string[];
    topicRelevanceScores: Record<string, number>;
  }): string {
    const promptParts: string[] = [];

    // Base instruction
    promptParts.push('You are MO, an intelligent business assistant for Busmo.');

    // NEW: Data dependency planning instructions
    promptParts.push(`
DATA DEPENDENCY PLANNING:
- What is the user asking? "${decisions.intent}"
- What data is required to answer this? [${decisions.requiredDataForQuery.join(', ')}]
- What data is already available? [${decisions.availableDataForQuery.join(', ')}]
- Can I answer with existing data? ${decisions.canAnswerWithExistingData}

Before asking for more information, always check what data you already have.

If you can answer the question with existing data, do so immediately.

Only ask for additional information only if absolutely necessary to improve the response.
`);

    // NEW: Data relevance engine instructions
    const sortedRelevance = Object.entries(decisions.topicRelevanceScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5); // Top 5 most relevant topics
      
    promptParts.push(`
DATA RELEVANCE ENGINE:
The most relevant business information to the user's query is ranked by importance:
${sortedRelevance.map(([topic, score]) => `${topic}: ${score}%`).join('\n')}
Focus your analysis on the highest-ranked items when responding to the user's query.
`);

    // NEW: Response formatting instructions for concise data presentation
    promptParts.push(`
RESPONSE FORMAT INSTRUCTIONS:
- Provide CONCISE responses with key metrics in a DASHBOARD-like format
- Use bullet points, tables, or CARDS to present data
- Start with the most important information
- Use markdown formatting for better readability
- Present numerical data with currency symbols and thousands separators
- Summarize data in a way that's easy to scan and understand
- Use headers like **SALES DASHBOARD**, **INVENTORY DASHBOARD**, etc.
- Include today's figures vs totals when relevant
- Format responses as DATA CARDS for better visualization
- Keep responses SHORT and FOCUSED on the user's specific question
- If user asks about sales, show sales data first without extra text
- If user asks about inventory, show inventory data first without extra text
- Use bold headers and clear formatting to make data stand out
`);

    // Response depth instructions
    switch (decisions.responseDepth) {
      case 'quick':
        promptParts.push(`
RESPONSE DEPTH: QUICK ANSWER (CRITICAL)
- Answer in 1-3 sentences MAXIMUM
- Do NOT analyze, do NOT explain, do NOT recommend unless asked
- Do NOT add business insights or observations
- Just give the direct answer to the question
- Example: "What's my profit today?" → "Your profit today is ₦12,500."
- Example: "How many bags of rice?" → "You have 15 bags of rice in stock."
- Example: "Record sale: 5 bags of rice" → "Got it. Recording 5 bags of rice."
- NEVER exceed 50 words for a quick response
`);
        break;
      case 'guided':
        promptParts.push(`
RESPONSE DEPTH: GUIDED ANSWER
- Answer the question clearly in 2-4 sentences
- Add ONE relevant insight or recommendation max
- Keep it focused — don't over-explain
- Example: "How is my business doing?" → "Your revenue is up 12% this month at ₦185K, but expenses grew faster. Watch your food costs — they're eating into margin."
`);
        break;
      case 'deep':
        promptParts.push(`
RESPONSE DEPTH: DEEP ANALYSIS
- Perform detailed reasoning
- Use business data to support your analysis
- Provide calculations and comparisons
- Explain trade-offs clearly
- Recommend priorities with justification
- Use structured formatting for complex information
`);
        break;
    }

    // Conversation goal instructions
    switch (decisions.conversationGoal) {
      case 'inform':
        promptParts.push('GOAL: Provide accurate information clearly and directly.');
        break;
      case 'discover':
        promptParts.push('GOAL: Help the user explore their data and find insights.');
        break;
      case 'teach':
        promptParts.push('GOAL: Teach the user something new with clear explanations.');
        break;
      case 'challenge':
        promptParts.push('GOAL: Verify information and help the user question assumptions.');
        break;
      case 'reason':
        promptParts.push('GOAL: Provide strategic reasoning and analysis.');
        break;
      case 'act':
        promptParts.push('GOAL: Help the user perform an action efficiently.');
        break;
      case 'clarify':
        promptParts.push("GOAL: Ask clarifying questions to understand the user's needs better.");
        break;
    }

    // Topic type instructions
    if (decisions.topicType === 'business_data') {
      promptParts.push('FOCUS: Use the provided business data to answer accurately.');
    } else if (decisions.topicType === 'general_knowledge') {
      promptParts.push('FOCUS: Provide general business knowledge and best practices.');
    } else {
      promptParts.push('FOCUS: Combine business data with general knowledge for a comprehensive answer.');
    }

    // Action instructions
    if (decisions.shouldPerformAction) {
      promptParts.push('ACTION: The user wants to perform an action. Guide them through it or execute it if appropriate.');
    }

    // Data availability
    if (decisions.dataRequirements.salesData) {
      promptParts.push('DATA: Sales data is available for your analysis.');
    }
    if (decisions.dataRequirements.inventoryData) {
      promptParts.push('DATA: Inventory data is available for your analysis.');
    }
    if (decisions.dataRequirements.expenseData) {
      promptParts.push('DATA: Expense data is available for your analysis.');
    }
    if (decisions.dataRequirements.customerData) {
      promptParts.push('DATA: Customer data is available for your analysis.');
    }
    if (decisions.dataRequirements.staffData) {
      promptParts.push('DATA: Staff data is available for your analysis.');
    }
    if (decisions.dataRequirements.businessMetrics) {
      promptParts.push('DATA: Business metrics are available for your analysis.');
    }

    // NEW: Important instructions for preventing generic responses
    promptParts.push(`
IMPORTANT:
- Never ask for industry information when analyzing sales if you already have sales data
- Focus on the specific data relevant to the user's question (see DATA RELEVANCE ENGINE above)
- Do not repeatedly surface the same warning unless it's directly relevant to the user's request
- Answer with the available data first, then ask for additional information only if absolutely necessary
- If the user asks about sales, focus on sales data first, not general business information
- If the user asks about inventory, focus on inventory data first, not cash flow
- If the user asks about cash flow, focus on financial data first, not supplier information
- The quality of your response is measured by how well it solves the user's immediate need
- If the user makes a sale and then asks MO, it should know about the sale immediately
- Format responses as data cards with key metrics prominently displayed
- Keep responses concise and focused on business intelligence
- Act as a business data translator, converting raw data into actionable insights
`);

    return promptParts.join('\n\n');
  }

  /**
   * Update context after response
   */
  updateContext(newMessage: string, response: string) {
    const newTopic = this.extractTopic(newMessage);
    
    this.context.previousMessages.push(
      { role: 'user', content: newMessage },
      { role: 'assistant', content: response }
    );

    // Keep only last 10 messages in context
    if (this.context.previousMessages.length > 20) {
      this.context.previousMessages = this.context.previousMessages.slice(-20);
    }

    // Update topic if changed
    if (this.context.currentTopic !== newTopic) {
      if (this.context.currentTopic) {
        this.context.previousTopics.push(this.context.currentTopic);
      }
      this.context.currentTopic = newTopic;
    }
  }
}

/**
 * Factory function to create a conversation planner
 */
export function createConversationPlanner(context: ConversationContext): ConversationPlanner {
  return new ConversationPlanner(context);
}