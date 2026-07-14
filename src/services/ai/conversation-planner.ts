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
  businessMetrics?: boolean;
  timeRange?: 'today' | 'week' | 'month' | 'year' | 'all';
  specificFields?: string[];
}

/**
 * Conversation Planner Class
 * Orchestrates the entire conversation pipeline
 */
export class ConversationPlanner {
  private context: ConversationContext;

  constructor(context: ConversationContext) {
    this.context = context;
  }

  /**
   * Main pipeline entry point - executes all detection steps
   */
  async planResponse(userMessage: string): Promise<PlannedResponse> {
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
    });
    
    // Step 9: Generate system prompt for AI
    const systemPrompt = this.generateSystemPrompt({
      intent,
      conversationGoal,
      responseDepth,
      topicType,
      dataRequirements,
      shouldPerformAction,
    });

    return {
      intent,
      conversationGoal,
      responseDepth,
      topicType,
      topicChanged,
      shouldRetrieveData: !!(dataRequirements.salesData || 
                         dataRequirements.inventoryData || 
                         dataRequirements.expenseData ||
                         dataRequirements.customerData ||
                         dataRequirements.staffData ||
                         dataRequirements.businessMetrics),
      dataRequirements,
      shouldPerformAction,
      actionType,
      reasoning,
      systemPrompt,
    };
  }

  /**
   * Step 1: Detect User Intent
   */
  private detectIntent(message: string): UserIntent {
    const lowerMessage = message.toLowerCase();
    
    // Action intent - user wants to perform an action
    const actionPatterns = [
      /^(record|add|create|delete|remove|update|edit|set)/i,
      /(record|log|track) (a|an|the)?\s*(sale|expense|payment|purchase|inventory)/i,
      /(create|add) (a|an)?\s*(customer|supplier|staff|product)/i,
      /(send|email|notify)/i,
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
      sales: ['finance', 'pricing'],
      inventory: ['sales', 'pricing'],
      expenses: ['finance'],
      customers: ['sales', 'marketing'],
      finance: ['sales', 'expenses', 'pricing'],
    };

    if (relatedTopics[topic1]?.includes(topic2) || relatedTopics[topic2]?.includes(topic1)) {
      return 0.5;
    }

    return 0.1;
  }

  /**
   * Step 3: Classify Topic Type (Data vs General Knowledge)
   */
  private classifyTopicType(message: string): TopicType {
    const lowerMessage = message.toLowerCase();
    
    // Business data indicators
    const businessDataPatterns = [
      /sales|revenue|profit|income/i,
      /inventory|stock|products/i,
      /expenses|costs|spending/i,
      /customers|clients/i,
      /staff|employees/i,
      /today|this week|this month|this year/i,
      /how many|how much/i,
      /show me|display|list/i,
      /record|log|track/i,
    ];

    // General knowledge indicators
    const generalKnowledgePatterns = [
      /how (do|to|can|should) i/i,
      /what (is|are|was|were)/i,
      /why (do|does|did|is|are)/i,
      /explain/i,
      /teach/i,
      /best practices/i,
      /tips|advice/i,
      /strategy/i,
    ];

    const hasBusinessData = businessDataPatterns.some(pattern => pattern.test(message));
    const hasGeneralKnowledge = generalKnowledgePatterns.some(pattern => pattern.test(message));

    if (hasBusinessData && hasGeneralKnowledge) {
      return 'mixed';
    } else if (hasBusinessData) {
      return 'business_data';
    } else {
      return 'general_knowledge';
    }
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

    // Sales data
    if (/sales|revenue|income|sold|selling/i.test(message)) {
      requirements.salesData = true;
      requirements.timeRange = this.extractTimeRange(message);
    }

    // Inventory data
    if (/inventory|stock|products|items|goods/i.test(message)) {
      requirements.inventoryData = true;
    }

    // Expense data
    if (/expenses|costs|spending|payments|bills/i.test(message)) {
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

    // Business metrics (for deep analysis)
    if (responseDepth === 'deep' || topicType === 'mixed') {
      requirements.businessMetrics = true;
      requirements.timeRange = this.extractTimeRange(message) || 'month';
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
  }): string {
    const parts: string[] = [];

    parts.push(`Intent: ${decisions.intent}`);
    parts.push(`Topic Changed: ${decisions.topicChanged}`);
    parts.push(`Topic Type: ${decisions.topicType}`);
    parts.push(`Conversation Goal: ${decisions.conversationGoal}`);
    parts.push(`Response Depth: ${decisions.responseDepth}`);
    parts.push(`Should Perform Action: ${decisions.shouldPerformAction}`);

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
  }): string {
    const promptParts: string[] = [];

    // Base instruction
    promptParts.push('You are MO, an intelligent business assistant for Busmo.');

    // Response depth instructions
    switch (decisions.responseDepth) {
      case 'quick':
        promptParts.push(`
RESPONSE DEPTH: QUICK ANSWER
- Answer directly and concisely
- Use 1-3 short paragraphs or bullet points
- Do not teach unless explicitly asked
- Prioritize the most important information
- No fluff or unnecessary explanations
`);
        break;
      case 'guided':
        promptParts.push(`
RESPONSE DEPTH: GUIDED ANSWER
- Answer the question clearly
- Provide 1-2 relevant insights
- Offer one clear recommendation
- Keep the response focused
- Use progressive disclosure - start with the most valuable answer
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
        promptParts.push('GOAL: Ask clarifying questions to understand the user\'s needs better.');
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

    // Final instruction
    promptParts.push(`
IMPORTANT:
- Match your response length to the RESPONSE DEPTH specified above
- Do not overwhelm the user with information they didn't ask for
- If additional information would be helpful, invite the user to ask for it
- Always prioritize clarity over completeness
- The quality of your response is measured by how well it solves the user's immediate need
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
