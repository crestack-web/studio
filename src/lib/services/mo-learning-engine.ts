// MO Learning Engine - Post-Conversation Knowledge Extraction
// Extracts and stores knowledge after every conversation

export interface LearnedFact {
  id: string;
  category: 'business' | 'financial' | 'operational' | 'strategic' | 'customer' | 'supplier' | 'product';
  fact: string;
  value: any;
  confidence: number; // 0-1
  source: 'user_provided' | 'inferred' | 'calculated';
  timestamp: Date;
  lastVerified: Date;
  verificationCount: number;
}

export interface ConversationSummary {
  conversationId: string;
  userId: string;
  businessId: string;
  startTime: Date;
  endTime: Date;
  messageCount: number;
  topicsDiscussed: string[];
  factsLearned: LearnedFact[];
  actionsTaken: string[];
  decisionsMade: string[];
  nextSteps: string[];
}

export interface LearningContext {
  conversationHistory: any[];
  businessProfile: any;
  businessData: any;
  extractedEntities: Record<string, any>;
  reasoning: any;
  calculations: any[];
}

export class LearningEngine {
  private learnedFacts: Map<string, LearnedFact> = new Map();
  private conversationSummaries: Map<string, ConversationSummary> = new Map();
  private businessId: string;
  private userId: string;
  
  constructor(businessId: string, userId: string) {
    this.businessId = businessId;
    this.userId = userId;
  }
  
  // Analyze conversation and extract knowledge
  learnFromConversation(context: LearningContext, conversationId: string): ConversationSummary {
    const { conversationHistory, businessProfile, extractedEntities, reasoning, calculations } = context;
    
    const factsLearned: LearnedFact[] = [];
    
    // Extract facts from conversation history
    conversationHistory.forEach((message: any) => {
      if (message.role === 'user') {
        const userFacts = this.extractFactsFromMessage(message.content, 'user_provided');
        factsLearned.push(...userFacts);
      }
    });
    
    // Extract facts from reasoning
    if (reasoning) {
      const reasoningFacts = this.extractFactsFromReasoning(reasoning);
      factsLearned.push(...reasoningFacts);
    }
    
    // Extract facts from calculations
    if (calculations && calculations.length > 0) {
      const calculationFacts = this.extractFactsFromCalculations(calculations);
      factsLearned.push(...calculationFacts);
    }
    
    // Extract facts from entities
    if (extractedEntities) {
      const entityFacts = this.extractFactsFromEntities(extractedEntities);
      factsLearned.push(...entityFacts);
    }
    
    // Store learned facts
    factsLearned.forEach(fact => {
      this.storeLearnedFact(fact);
    });
    
    // Identify topics discussed
    const topicsDiscussed = this.identifyTopics(conversationHistory);
    
    // Identify actions taken
    const actionsTaken = this.identifyActions(conversationHistory);
    
    // Identify decisions made
    const decisionsMade = this.identifyDecisions(conversationHistory);
    
    // Identify next steps
    const nextSteps = this.identifyNextSteps(conversationHistory, reasoning);
    
    // Create conversation summary
    const summary: ConversationSummary = {
      conversationId,
      userId: this.userId,
      businessId: this.businessId,
      startTime: conversationHistory[0]?.timestamp || new Date(),
      endTime: new Date(),
      messageCount: conversationHistory.length,
      topicsDiscussed,
      factsLearned,
      actionsTaken,
      decisionsMade,
      nextSteps,
    };
    
    this.conversationSummaries.set(conversationId, summary);
    
    return summary;
  }
  
  // Extract facts from user message
  private extractFactsFromMessage(message: string, source: 'user_provided' | 'inferred' | 'calculated'): LearnedFact[] {
    const facts: LearnedFact[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Extract capital information
    const capitalMatch = message.match(/(?:capital|budget|investment|money|funds)[\s:]*[₦$]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/i);
    if (capitalMatch) {
      facts.push({
        id: `fact_capital_${Date.now()}`,
        category: 'financial',
        fact: 'Business capital',
        value: parseFloat(capitalMatch[1].replace(/,/g, '')),
        confidence: 0.9,
        source,
        timestamp: new Date(),
        lastVerified: new Date(),
        verificationCount: 1,
      });
    }
    
    // Extract location information
    const locationMatch = message.match(/(?:located|in|at|based|city|town)[\s:]*([A-Z][a-zA-Z\s]+)/i);
    if (locationMatch) {
      facts.push({
        id: `fact_location_${Date.now()}`,
        category: 'business',
        fact: 'Business location',
        value: locationMatch[1].trim(),
        confidence: 0.85,
        source,
        timestamp: new Date(),
        lastVerified: new Date(),
        verificationCount: 1,
      });
    }
    
    // Extract industry information
    const industryPatterns = [
      /(?:i am|i'm|my business is|we are|we're)\s+(?:a\s+)?(restaurant|retail|wholesale|manufacturing|service|construction|agriculture|recycling)/i,
    ];
    
    for (const pattern of industryPatterns) {
      const match = message.match(pattern);
      if (match) {
        facts.push({
          id: `fact_industry_${Date.now()}`,
          category: 'business',
          fact: 'Business industry',
          value: match[1].toLowerCase(),
          confidence: 0.9,
          source,
          timestamp: new Date(),
          lastVerified: new Date(),
          verificationCount: 1,
        });
        break;
      }
    }
    
    // Extract staff count
    const staffMatch = message.match(/(?:staff|employees|workers|team)[\s:]*(\d+)/i);
    if (staffMatch) {
      facts.push({
        id: `fact_staff_${Date.now()}`,
        category: 'operational',
        fact: 'Staff count',
        value: parseInt(staffMatch[1]),
        confidence: 0.85,
        source,
        timestamp: new Date(),
        lastVerified: new Date(),
        verificationCount: 1,
      });
    }
    
    // Extract customer information
    const customerMatch = message.match(/(?:customer|client)[\s:]*([A-Z][a-zA-Z\s]+)/i);
    if (customerMatch) {
      facts.push({
        id: `fact_customer_${Date.now()}`,
        category: 'customer',
        fact: 'Customer name',
        value: customerMatch[1].trim(),
        confidence: 0.8,
        source,
        timestamp: new Date(),
        lastVerified: new Date(),
        verificationCount: 1,
      });
    }
    
    // Extract supplier information
    const supplierMatch = message.match(/(?:supplier|vendor)[\s:]*([A-Z][a-zA-Z\s]+)/i);
    if (supplierMatch) {
      facts.push({
        id: `fact_supplier_${Date.now()}`,
        category: 'supplier',
        fact: 'Supplier name',
        value: supplierMatch[1].trim(),
        confidence: 0.8,
        source,
        timestamp: new Date(),
        lastVerified: new Date(),
        verificationCount: 1,
      });
    }
    
    // Extract product information
    const productMatch = message.match(/(?:product|item)[\s:]*([A-Z][a-zA-Z0-9\s]+)/i);
    if (productMatch) {
      facts.push({
        id: `fact_product_${Date.now()}`,
        category: 'product',
        fact: 'Product name',
        value: productMatch[1].trim(),
        confidence: 0.75,
        source,
        timestamp: new Date(),
        lastVerified: new Date(),
        verificationCount: 1,
      });
    }
    
    // Extract goals
    const goalPatterns = [
      /(?:goal|objective|aim|target|want to|planning to)[\s:]+(.+?)(?:\.|$)/i,
      /(?:looking to|planning to|want to)\s+(.+)/i,
    ];
    
    for (const pattern of goalPatterns) {
      const match = message.match(pattern);
      if (match) {
        facts.push({
          id: `fact_goal_${Date.now()}`,
          category: 'strategic',
          fact: 'Business goal',
          value: match[1].trim(),
          confidence: 0.7,
          source,
          timestamp: new Date(),
          lastVerified: new Date(),
          verificationCount: 1,
        });
        break;
      }
    }
    
    return facts;
  }
  
  // Extract facts from reasoning
  private extractFactsFromReasoning(reasoning: any): LearnedFact[] {
    const facts: LearnedFact[] = [];
    
    if (reasoning.actualGoal) {
      facts.push({
        id: `fact_goal_${Date.now()}`,
        category: 'strategic',
        fact: 'Current business goal',
        value: reasoning.actualGoal,
        confidence: 0.8,
        source: 'inferred',
        timestamp: new Date(),
        lastVerified: new Date(),
        verificationCount: 1,
      });
    }
    
    if (reasoning.missingInformation && reasoning.missingInformation.length > 0) {
      reasoning.missingInformation.forEach((info: string) => {
        facts.push({
          id: `fact_missing_${Date.now()}_${Math.random()}`,
          category: 'business',
          fact: `Missing information: ${info}`,
          value: info,
          confidence: 0.9,
          source: 'inferred',
          timestamp: new Date(),
          lastVerified: new Date(),
          verificationCount: 1,
        });
      });
    }
    
    return facts;
  }
  
  // Extract facts from calculations
  private extractFactsFromCalculations(calculations: any[]): LearnedFact[] {
    const facts: LearnedFact[] = [];
    
    calculations.forEach(calc => {
      if (calc.type === 'margin') {
        facts.push({
          id: `fact_margin_${Date.now()}`,
          category: 'financial',
          fact: 'Profit margin calculated',
          value: calc.result,
          confidence: 0.95,
          source: 'calculated',
          timestamp: new Date(),
          lastVerified: new Date(),
          verificationCount: 1,
        });
      }
      
      if (calc.type === 'cash-runway') {
        facts.push({
          id: `fact_runway_${Date.now()}`,
          category: 'financial',
          fact: 'Cash runway calculated',
          value: calc.result,
          confidence: 0.95,
          source: 'calculated',
          timestamp: new Date(),
          lastVerified: new Date(),
          verificationCount: 1,
        });
      }
      
      if (calc.type === 'roi') {
        facts.push({
          id: `fact_roi_${Date.now()}`,
          category: 'financial',
          fact: 'ROI calculated',
          value: calc.result,
          confidence: 0.95,
          source: 'calculated',
          timestamp: new Date(),
          lastVerified: new Date(),
          verificationCount: 1,
        });
      }
    });
    
    return facts;
  }
  
  // Extract facts from entities
  private extractFactsFromEntities(entities: Record<string, any>): LearnedFact[] {
    const facts: LearnedFact[] = [];
    
    if (entities.amounts && entities.amounts.length > 0) {
      facts.push({
        id: `fact_amounts_${Date.now()}`,
        category: 'financial',
        fact: 'Monetary values mentioned',
        value: entities.amounts,
        confidence: 0.9,
        source: 'user_provided',
        timestamp: new Date(),
        lastVerified: new Date(),
        verificationCount: 1,
      });
    }
    
    if (entities.quantities && entities.quantities.length > 0) {
      facts.push({
        id: `fact_quantities_${Date.now()}`,
        category: 'operational',
        fact: 'Quantities mentioned',
        value: entities.quantities,
        confidence: 0.9,
        source: 'user_provided',
        timestamp: new Date(),
        lastVerified: new Date(),
        verificationCount: 1,
      });
    }
    
    if (entities.businessNames && entities.businessNames.length > 0) {
      entities.businessNames.forEach((name: string) => {
        facts.push({
          id: `fact_business_name_${Date.now()}_${Math.random()}`,
          category: 'business',
          fact: 'Business name mentioned',
          value: name,
          confidence: 0.85,
          source: 'user_provided',
          timestamp: new Date(),
          lastVerified: new Date(),
          verificationCount: 1,
        });
      });
    }
    
    return facts;
  }
  
  // Identify topics discussed
  private identifyTopics(conversationHistory: any[]): string[] {
    const topics: Set<string> = new Set();
    const topicKeywords = {
      sales: ['sale', 'sold', 'revenue', 'customer', 'buy'],
      inventory: ['stock', 'inventory', 'product', 'item', 'warehouse'],
      expenses: ['expense', 'cost', 'spent', 'paid', 'purchase'],
      suppliers: ['supplier', 'vendor', 'source', 'procure'],
      customers: ['customer', 'client', 'credit', 'owing'],
      pricing: ['price', 'pricing', 'cost', 'charge', 'discount'],
      cash_flow: ['cash', 'money', 'liquidity', 'flow'],
      growth: ['grow', 'expand', 'scale', 'increase'],
      hiring: ['hire', 'staff', 'employee', 'worker'],
      planning: ['plan', 'strategy', 'goal', 'objective'],
    };
    
    conversationHistory.forEach((message: any) => {
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        
        Object.entries(topicKeywords).forEach(([topic, keywords]) => {
          if (keywords.some(keyword => content.includes(keyword))) {
            topics.add(topic);
          }
        });
      }
    });
    
    return Array.from(topics);
  }
  
  // Identify actions taken
  private identifyActions(conversationHistory: any[]): string[] {
    const actions: string[] = [];
    
    conversationHistory.forEach((message: any) => {
      if (message.role === 'assistant') {
        const content = message.content.toLowerCase();
        
        if (content.includes('recorded') || content.includes('added')) {
          actions.push('Data recorded in Busmo');
        }
        
        if (content.includes('created') || content.includes('generated')) {
          actions.push('Document/record created');
        }
        
        if (content.includes('updated') || content.includes('modified')) {
          actions.push('Data updated');
        }
      }
    });
    
    return actions;
  }
  
  // Identify decisions made
  private identifyDecisions(conversationHistory: any[]): string[] {
    const decisions: string[] = [];
    
    conversationHistory.forEach((message: any) => {
      if (message.role === 'user') {
        const content = message.content.toLowerCase();
        
        const decisionPatterns = [
          /i (decided|decide|will|going to)\s+(.+)/i,
          /let's\s+(.+)/i,
          /i'll\s+(.+)/i,
        ];
        
        decisionPatterns.forEach(pattern => {
          const match = content.match(pattern);
          if (match) {
            decisions.push(match[2].trim());
          }
        });
      }
    });
    
    return decisions;
  }
  
  // Identify next steps
  private identifyNextSteps(conversationHistory: any[], reasoning: any): string[] {
    const nextSteps: string[] = [];
    
    // From reasoning
    if (reasoning?.recommendedAction) {
      nextSteps.push(reasoning.recommendedAction);
    }
    
    // From conversation
    conversationHistory.forEach((message: any) => {
      if (message.role === 'assistant') {
        const content = message.content.toLowerCase();
        
        const nextStepPatterns = [
          /next\s+(step|action|should|recommend):?\s*(.+)/i,
          /you should\s+(.+)/i,
          /recommend(ed|s):\s*(.+)/i,
        ];
        
        nextStepPatterns.forEach(pattern => {
          const match = content.match(pattern);
          if (match) {
            nextSteps.push(match[2].trim());
          }
        });
      }
    });
    
    return [...new Set(nextSteps)]; // Remove duplicates
  }
  
  // Store learned fact
  private storeLearnedFact(fact: LearnedFact): void {
    // Check if similar fact already exists
    const existingFact = Array.from(this.learnedFacts.values()).find(
      f => f.fact === fact.fact && f.category === fact.category
    );
    
    if (existingFact) {
      // Update existing fact
      existingFact.value = fact.value;
      existingFact.confidence = Math.max(existingFact.confidence, fact.confidence);
      existingFact.lastVerified = new Date();
      existingFact.verificationCount++;
    } else {
      // Store new fact
      this.learnedFacts.set(fact.id, fact);
    }
  }
  
  // Get learned facts by category
  getFactsByCategory(category: string): LearnedFact[] {
    return Array.from(this.learnedFacts.values()).filter(f => f.category === category);
  }
  
  // Get all learned facts
  getAllFacts(): LearnedFact[] {
    return Array.from(this.learnedFacts.values());
  }
  
  // Get fact by description
  getFact(fact: string): LearnedFact | undefined {
    return Array.from(this.learnedFacts.values()).find(f => f.fact === fact);
  }
  
  // Update fact confidence based on verification
  verifyFact(factId: string, confirmed: boolean): void {
    const fact = this.learnedFacts.get(factId);
    if (fact) {
      fact.lastVerified = new Date();
      fact.verificationCount++;
      
      if (confirmed) {
        fact.confidence = Math.min(fact.confidence + 0.1, 1.0);
      } else {
        fact.confidence = Math.max(fact.confidence - 0.2, 0);
      }
    }
  }
  
  // Get conversation summary
  getConversationSummary(conversationId: string): ConversationSummary | undefined {
    return this.conversationSummaries.get(conversationId);
  }
  
  // Get recent conversation summaries
  getRecentSummaries(limit: number = 5): ConversationSummary[] {
    return Array.from(this.conversationSummaries.values())
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
      .slice(0, limit);
  }
  
  // Export learning data
  exportLearningData(): Record<string, any> {
    return {
      businessId: this.businessId,
      userId: this.userId,
      facts: Array.from(this.learnedFacts.values()),
      conversationSummaries: Array.from(this.conversationSummaries.values()),
      exportedAt: new Date().toISOString(),
    };
  }
  
  // Import learning data
  importLearningData(data: Record<string, any>): void {
    if (data.businessId !== this.businessId || data.userId !== this.userId) {
      throw new Error('Learning data does not match business/user context');
    }
    
    if (data.facts && Array.isArray(data.facts)) {
      data.facts.forEach((fact: any) => {
        this.learnedFacts.set(fact.id, {
          ...fact,
          timestamp: new Date(fact.timestamp),
          lastVerified: new Date(fact.lastVerified),
        });
      });
    }
    
    if (data.conversationSummaries && Array.isArray(data.conversationSummaries)) {
      data.conversationSummaries.forEach((summary: any) => {
        this.conversationSummaries.set(summary.conversationId, {
          ...summary,
          startTime: new Date(summary.startTime),
          endTime: new Date(summary.endTime),
        });
      });
    }
  }
  
  // Clear all learning data
  clearAll(): void {
    this.learnedFacts.clear();
    this.conversationSummaries.clear();
  }
  
  // Format learned facts for AI response
  formatForAIResponse(): string {
    const facts = this.getAllFacts();
    if (facts.length === 0) return '';
    
    let response = '\n\n📚 LEARNED FACTS:\n';
    
    const factsByCategory: Record<string, LearnedFact[]> = {};
    facts.forEach(fact => {
      if (!factsByCategory[fact.category]) {
        factsByCategory[fact.category] = [];
      }
      factsByCategory[fact.category].push(fact);
    });
    
    Object.entries(factsByCategory).forEach(([category, categoryFacts]) => {
      response += `\n${category.toUpperCase()}:\n`;
      categoryFacts.forEach(fact => {
        response += `• ${fact.fact}: ${JSON.stringify(fact.value)} (confidence: ${(fact.confidence * 100).toFixed(0)}%)\n`;
      });
    });
    
    return response;
  }
}

// Singleton instances per business
const learningEngines: Map<string, LearningEngine> = new Map();

export function getLearningEngine(businessId: string, userId: string): LearningEngine {
  const key = `${businessId}:${userId}`;
  if (!learningEngines.has(key)) {
    learningEngines.set(key, new LearningEngine(businessId, userId));
  }
  return learningEngines.get(key)!;
}

export function clearLearningEngine(businessId: string, userId: string): void {
  const key = `${businessId}:${userId}`;
  const engine = learningEngines.get(key);
  if (engine) {
    engine.clearAll();
    learningEngines.delete(key);
  }
}
