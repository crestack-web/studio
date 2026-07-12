// MO Intent Engine - Sophisticated Intent Classification
// Classifies user intent beyond simple pattern matching

export type IntentCategory =
  | 'business_advice'
  | 'record_transaction'
  | 'inventory_management'
  | 'financial_planning'
  | 'pricing'
  | 'supplier_management'
  | 'customer_management'
  | 'manufacturing'
  | 'business_troubleshooting'
  | 'growth_strategy'
  | 'marketing'
  | 'expansion'
  | 'hiring'
  | 'cash_flow'
  | 'reporting'
  | 'forecasting'
  | 'unknown';

export interface IntentClassification {
  primaryIntent: IntentCategory;
  secondaryIntents: IntentCategory[];
  confidence: number;
  context: string;
  actionable: boolean;
  requiresBusmoAction: boolean;
  suggestedAction?: string;
}

export interface IntentContext {
  message: string;
  conversationHistory: any[];
  businessProfile: any;
  businessData: any;
}

export class IntentEngine {
  
  // Classify intent with sophisticated analysis
  classifyIntent(context: IntentContext): IntentClassification {
    const { message, businessProfile, businessData } = context;
    const lowerMessage = message.toLowerCase();
    
    const intents: IntentCategory[] = [];
    const scores: Record<IntentCategory, number> = this.calculateIntentScores(context);
    
    // Get top scoring intents
    const sortedIntents = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score > 0.3);
    
    if (sortedIntents.length === 0) {
      return {
        primaryIntent: 'unknown',
        secondaryIntents: [],
        confidence: 0,
        context: 'Unable to classify intent',
        actionable: false,
        requiresBusmoAction: false,
      };
    }
    
    const primaryIntent = sortedIntents[0][0] as IntentCategory;
    const secondaryIntents = sortedIntents.slice(1, 5).map(([intent]) => intent as IntentCategory);
    const confidence = sortedIntents[0][1];
    
    // Determine if actionable
    const actionable = this.isActionable(primaryIntent, context);
    
    // Determine if requires Busmo action
    const requiresBusmoAction = this.requiresBusmoAction(primaryIntent, context);
    
    // Suggest action if applicable
    const suggestedAction = requiresBusmoAction 
      ? this.suggestBusmoAction(primaryIntent, context)
      : undefined;
    
    return {
      primaryIntent,
      secondaryIntents,
      confidence,
      context: this.generateContextDescription(primaryIntent, context),
      actionable,
      requiresBusmoAction,
      suggestedAction,
    };
  }
  
  // Calculate scores for each intent category
  private calculateIntentScores(context: IntentContext): Record<IntentCategory, number> {
    const { message, businessProfile, businessData } = context;
    const lowerMessage = message.toLowerCase();
    const scores: Record<IntentCategory, number> = {
      business_advice: 0,
      record_transaction: 0,
      inventory_management: 0,
      financial_planning: 0,
      pricing: 0,
      supplier_management: 0,
      customer_management: 0,
      manufacturing: 0,
      business_troubleshooting: 0,
      growth_strategy: 0,
      marketing: 0,
      expansion: 0,
      hiring: 0,
      cash_flow: 0,
      reporting: 0,
      forecasting: 0,
      unknown: 0,
    };
    
    // Transaction recording patterns
    if (this.matchesPatterns(lowerMessage, [
      'sold', 'sale', 'buy', 'purchase', 'expense', 'spent', 'paid', 'received',
      'record', 'add transaction', 'log sale', 'add expense'
    ])) {
      scores.record_transaction += 0.8;
    }
    
    // Inventory management patterns
    if (this.matchesPatterns(lowerMessage, [
      'stock', 'inventory', 'reorder', 'restock', 'out of stock', 'low stock',
      'product', 'item', 'warehouse', 'storage'
    ])) {
      scores.inventory_management += 0.7;
    }
    
    // Financial planning patterns
    if (this.matchesPatterns(lowerMessage, [
      'budget', 'plan', 'forecast', 'project', 'financial', 'capital',
      'investment', 'profit', 'margin', 'cost', 'expense'
    ])) {
      scores.financial_planning += 0.6;
    }
    
    // Pricing patterns
    if (this.matchesPatterns(lowerMessage, [
      'price', 'pricing', 'cost', 'charge', 'discount', 'markup',
      'profit margin', 'competitive pricing'
    ])) {
      scores.pricing += 0.7;
    }
    
    // Supplier management patterns
    if (this.matchesPatterns(lowerMessage, [
      'supplier', 'vendor', 'source', 'procure', 'buy from', 'purchase from',
      'supplier relationship', 'negotiate'
    ])) {
      scores.supplier_management += 0.8;
    }
    
    // Customer management patterns
    if (this.matchesPatterns(lowerMessage, [
      'customer', 'client', 'credit', 'owing', 'balance', 'payment',
      'customer relationship', 'loyalty', 'retention'
    ])) {
      scores.customer_management += 0.7;
    }
    
    // Manufacturing patterns
    if (this.matchesPatterns(lowerMessage, [
      'produce', 'manufacture', 'production', 'process', 'yield',
      'raw material', 'capacity', 'downtime', 'quality'
    ])) {
      scores.manufacturing += 0.8;
    }
    
    // Business troubleshooting patterns
    if (this.matchesPatterns(lowerMessage, [
      'problem', 'issue', 'challenge', 'trouble', 'struggling', 'declining',
      'drop', 'decrease', 'not working', 'help with'
    ])) {
      scores.business_troubleshooting += 0.7;
    }
    
    // Growth strategy patterns
    if (this.matchesPatterns(lowerMessage, [
      'grow', 'expand', 'scale', 'increase', 'improve', 'strategy',
      'growth plan', 'business development'
    ])) {
      scores.growth_strategy += 0.6;
    }
    
    // Marketing patterns
    if (this.matchesPatterns(lowerMessage, [
      'market', 'marketing', 'promote', 'advertise', 'campaign',
      'customer acquisition', 'brand', 'promotion'
    ])) {
      scores.marketing += 0.7;
    }
    
    // Expansion patterns
    if (this.matchesPatterns(lowerMessage, [
      'new location', 'open new', 'branch', 'franchise', 'expand to',
      'new market', 'geographic expansion'
    ])) {
      scores.expansion += 0.8;
    }
    
    // Hiring patterns
    if (this.matchesPatterns(lowerMessage, [
      'hire', 'staff', 'employee', 'worker', 'recruit', 'team',
      'personnel', 'workforce'
    ])) {
      scores.hiring += 0.8;
    }
    
    // Cash flow patterns
    if (this.matchesPatterns(lowerMessage, [
      'cash flow', 'liquidity', 'working capital', 'cash on hand',
      'money coming in', 'money going out', 'cash position'
    ])) {
      scores.cash_flow += 0.7;
    }
    
    // Reporting patterns
    if (this.matchesPatterns(lowerMessage, [
      'report', 'summary', 'overview', 'status', 'performance',
      'analytics', 'dashboard', 'show me'
    ])) {
      scores.reporting += 0.6;
    }
    
    // Forecasting patterns
    if (this.matchesPatterns(lowerMessage, [
      'forecast', 'predict', 'project', 'future', 'trend',
      'projection', 'estimate', 'prediction'
    ])) {
      scores.forecasting += 0.7;
    }
    
    // Business advice patterns (catch-all for general questions)
    if (this.matchesPatterns(lowerMessage, [
      'how to', 'what should', 'should i', 'can i', 'is it good',
      'advice', 'recommend', 'suggest', 'best way', 'help me'
    ])) {
      scores.business_advice += 0.5;
    }
    
    // Adjust scores based on business context
    if (businessProfile?.industry === 'manufacturing') {
      scores.manufacturing *= 1.2;
      scores.inventory_management *= 1.1;
    }
    
    if (businessProfile?.industry === 'retail') {
      scores.inventory_management *= 1.2;
      scores.pricing *= 1.1;
    }
    
    if (businessProfile?.stage === 'startup') {
      scores.financial_planning *= 1.2;
      scores.cash_flow *= 1.2;
    }
    
    // Normalize scores
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
      Object.keys(scores).forEach(key => {
        scores[key as IntentCategory] /= maxScore;
      });
    }
    
    return scores;
  }
  
  // Check if message matches any of the patterns
  private matchesPatterns(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }
  
  // Determine if intent is actionable
  private isActionable(intent: IntentCategory, context: IntentContext): boolean {
    const actionableIntents: IntentCategory[] = [
      'record_transaction',
      'inventory_management',
      'supplier_management',
      'customer_management',
      'manufacturing',
      'pricing',
    ];
    
    return actionableIntents.includes(intent);
  }
  
  // Determine if intent requires Busmo action
  private requiresBusmoAction(intent: IntentCategory, context: IntentContext): boolean {
    const busmoActionIntents: IntentCategory[] = [
      'record_transaction',
      'inventory_management',
      'supplier_management',
      'customer_management',
    ];
    
    return busmoActionIntents.includes(intent);
  }
  
  // Suggest Busmo action based on intent
  private suggestBusmoAction(intent: IntentCategory, context: IntentContext): string {
    switch (intent) {
      case 'record_transaction':
        return 'Record this transaction in Busmo';
      case 'inventory_management':
        return 'Update inventory in Busmo';
      case 'supplier_management':
        return 'Manage supplier in Busmo';
      case 'customer_management':
        return 'Manage customer in Busmo';
      default:
        return '';
    }
  }
  
  // Generate context description for the intent
  private generateContextDescription(intent: IntentCategory, context: IntentContext): string {
    const { message, businessProfile } = context;
    
    const descriptions: Record<IntentCategory, string> = {
      business_advice: 'User is seeking business advice or guidance',
      record_transaction: 'User wants to record a transaction (sale, expense, etc.)',
      inventory_management: 'User is managing inventory or stock levels',
      financial_planning: 'User is planning finances or budgeting',
      pricing: 'User is working on pricing strategy or costs',
      supplier_management: 'User is managing supplier relationships',
      customer_management: 'User is managing customer relationships',
      manufacturing: 'User is dealing with production or manufacturing',
      business_troubleshooting: 'User is facing a business problem',
      growth_strategy: 'User is planning business growth',
      marketing: 'User is working on marketing or promotion',
      expansion: 'User is planning business expansion',
      hiring: 'User is planning to hire staff',
      cash_flow: 'User is concerned about cash flow',
      reporting: 'User wants a report or status update',
      forecasting: 'User wants a forecast or prediction',
      unknown: 'Intent could not be determined',
    };
    
    let description = descriptions[intent];
    
    // Add business context
    if (businessProfile?.industry) {
      description += ` in ${businessProfile.industry} industry`;
    }
    
    if (businessProfile?.stage) {
      description += ` at ${businessProfile.stage} stage`;
    }
    
    return description;
  }
  
  // Extract entities from message
  extractEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {};
    const lowerMessage = message.toLowerCase();
    
    // Extract amounts
    const amountPattern = /[₦$]\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g;
    const amounts = message.match(amountPattern);
    if (amounts) {
      entities.amounts = amounts.map(a => parseFloat(a.replace(/[₦$,]/g, '')));
    }
    
    // Extract quantities
    const quantityPattern = /(\d+)\s*(?:tons?|kg|kilograms?|pieces?|items?|units?|bottles?|boxes?|cartons?)/gi;
    const quantities = message.match(quantityPattern);
    if (quantities) {
      entities.quantities = quantities.map(q => parseFloat(q.match(/\d+/)![0]));
    }
    
    // Extract dates
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
    const dates = message.match(datePattern);
    if (dates) {
      entities.dates = dates;
    }
    
    // Extract business names
    const businessNamePattern = /(?:called|named)\s+([A-Z][a-zA-Z\s]+)/g;
    const businessNames = message.match(businessNamePattern);
    if (businessNames) {
      entities.businessNames = businessNames.map(bn => bn.replace(/(?:called|named)\s+/, ''));
    }
    
    return entities;
  }
}

// Singleton instance
let intentEngineInstance: IntentEngine | null = null;

export function getIntentEngine(): IntentEngine {
  if (!intentEngineInstance) {
    intentEngineInstance = new IntentEngine();
  }
  return intentEngineInstance;
}
