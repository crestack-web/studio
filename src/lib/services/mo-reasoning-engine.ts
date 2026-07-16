// MO Reasoning Engine - Internal Context Analysis
// Internally reasons through business context before responding

export interface BusinessContext {
  message: string;
  businessProfile: any;
  businessSnapshot: any;
  calculations: any[];
  conversationHistory: any[];
  businessData?: any; // NEW: Include business data for analysis
}

export interface ReasoningResult {
  userIntent: string;
  actualGoal: string;
  missingInformation: string[];
  nextNeeds: string[];
  risks: string[];
  opportunities: string[];
  recommendedAction: string;
  contextSummary: string;
  canAnswerWithExistingData: boolean; // NEW: Can we answer with existing data?
  relevantDataPoints: string[]; // NEW: What data is most relevant?
}

export class ReasoningEngine {
  
  // Analyze user's actual intent
  analyzeIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Information gathering
    if (lowerMessage.includes('how much') || lowerMessage.includes('what is') || lowerMessage.includes('tell me about')) {
      return 'information_seeking';
    }
    
    // Decision making
    if (lowerMessage.includes('should i') || lowerMessage.includes('can i') || lowerMessage.includes('is it a good idea')) {
      return 'decision_support';
    }
    
    // Problem solving
    if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('challenge') || lowerMessage.includes('help')) {
      return 'problem_solving';
    }
    
    // Planning
    if (lowerMessage.includes('plan') || lowerMessage.includes('strategy') || lowerMessage.includes('how to')) {
      return 'planning';
    }
    
    // Operational
    if (lowerMessage.includes('record') || lowerMessage.includes('add') || lowerMessage.includes('update') || lowerMessage.includes('delete')) {
      return 'operational';
    }
    
    // NEW: Data analysis
    if (lowerMessage.includes('analyze') || lowerMessage.includes('review') || lowerMessage.includes('evaluate')) {
      return 'data_analysis';
    }
    
    // Default
    return 'general_inquiry';
  }
  
  // Determine what user is actually trying to accomplish
  determineActualGoal(message: string, intent: string): string {
    const lowerMessage = message.toLowerCase();
    
    switch (intent) {
      case 'information_seeking':
        if (lowerMessage.includes('profit') || lowerMessage.includes('money')) {
          return 'Understand financial performance';
        }
        if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
          return 'Manage inventory levels';
        }
        if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
          return 'Improve customer relationships';
        }
        return 'Get business information';
        
      case 'data_analysis': // NEW: Handle data analysis intent
        if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) {
          return 'Analyze sales performance';
        }
        if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
          return 'Analyze inventory performance';
        }
        if (lowerMessage.includes('expense') || lowerMessage.includes('cost')) {
          return 'Analyze expense patterns';
        }
        if (lowerMessage.includes('profit') || lowerMessage.includes('margin')) {
          return 'Analyze profitability';
        }
        return 'Analyze business performance';
        
      case 'decision_support':
        if (lowerMessage.includes('buy') || lowerMessage.includes('purchase') || lowerMessage.includes('invest')) {
          return 'Make purchasing/investment decision';
        }
        if (lowerMessage.includes('start') || lowerMessage.includes('launch')) {
          return 'Start new business initiative';
        }
        if (lowerMessage.includes('hire') || lowerMessage.includes('staff')) {
          return 'Make hiring decision';
        }
        return 'Make business decision';
        
      case 'problem_solving':
        if (lowerMessage.includes('low sales') || lowerMessage.includes('no sales')) {
          return 'Increase sales';
        }
        if (lowerMessage.includes('cash') || lowerMessage.includes('money')) {
          return 'Improve cash flow';
        }
        if (lowerMessage.includes('stock') || lowerMessage.includes('inventory')) {
          return 'Resolve inventory issues';
        }
        return 'Solve business problem';
        
      case 'planning':
        if (lowerMessage.includes('growth') || lowerMessage.includes('expand')) {
          return 'Plan business growth';
        }
        if (lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
          return 'Plan financial strategy';
        }
        return 'Create business plan';
        
      case 'operational':
        return 'Execute business operation';
        
      default:
        return 'Get general business advice';
    }
  }
  
  // NEW: Check if we can answer with existing data
  canAnswerWithExistingData(context: BusinessContext): boolean {
    const lowerMessage = context.message.toLowerCase();
    const businessData = context.businessData || {};
    
    // Check for sales analysis
    if (/analyze.*sales|sales.*performance|how are sales|sales.*doing/i.test(lowerMessage)) {
      return !!(businessData.sales && businessData.sales.length > 0);
    }
    
    // Check for inventory analysis
    if (/analyze.*inventory|inventory.*performance|how is inventory|inventory.*doing/i.test(lowerMessage)) {
      return !!(businessData.products && businessData.products.length > 0);
    }
    
    // Check for expense analysis
    if (/analyze.*expense|expense.*performance|how are expenses|expenses.*doing/i.test(lowerMessage)) {
      return !!(businessData.expenses && businessData.expenses.length > 0);
    }
    
    // General business overview
    if (/how is my business|business doing|overview|summary|performance/i.test(lowerMessage)) {
      // Need at least sales OR expenses OR products to provide meaningful info
      return !!(businessData.sales || businessData.expenses || businessData.products);
    }
    
    // Default to true if we have some business data
    return !!(context.businessProfile || businessData);
  }
  
  // NEW: Determine what data is most relevant to the user's question
  determineRelevantDataPoints(message: string, businessData: any = {}): string[] {
    const lowerMessage = message.toLowerCase();
    const relevantData: string[] = [];
    
    // Sales data relevance
    if (/(analyze|review|check|show me|what are|how are).*sales|revenue|income|profit|money/i.test(lowerMessage)) {
      if (businessData.sales && businessData.sales.length > 0) {
        relevantData.push('sales_data');
        // Add specific sales metrics
        if (businessData.totalSales) relevantData.push('total_sales');
        if (businessData.todaySales) relevantData.push('today_sales');
        if (businessData.totalProfit) relevantData.push('total_profit');
      }
    }
    
    // Inventory data relevance
    if (/(analyze|review|check|show me|what are|how are).*inventory|stock|products|items|goods|restock/i.test(lowerMessage)) {
      if (businessData.products && businessData.products.length > 0) {
        relevantData.push('inventory_data');
        if (businessData.lowStockCount) relevantData.push('low_stock_items');
        if (businessData.outOfStockCount) relevantData.push('out_of_stock_items');
      }
    }
    
    // Expense data relevance
    if (/(analyze|review|check|show me|what are|how are).*expenses|costs|spending|bills|overhead/i.test(lowerMessage)) {
      if (businessData.expenses && businessData.expenses.length > 0) {
        relevantData.push('expense_data');
      }
    }
    
    // Cash flow data relevance
    if (/(analyze|review|check|show me|what are|how are).*cash|balance|reserves|flow|available/i.test(lowerMessage)) {
      if (businessData.cashAvailable !== undefined) {
        relevantData.push('cash_available');
      }
    }
    
    // Customer data relevance
    if (/(analyze|review|check|show me|what are|how are).*customers|clients|buyers|purchasers/i.test(lowerMessage)) {
      if (businessData.customers && businessData.customers.length > 0) {
        relevantData.push('customer_data');
      }
    }
    
    // Add general business profile if relevant
    if (relevantData.length > 0) {
      relevantData.push('business_profile');
    }
    
    return relevantData;
  }
  
  // Identify missing critical information
  identifyMissingInformation(context: BusinessContext): string[] {
    const missing: string[] = [];
    const profile = context.businessProfile;
    
    // Critical business information
    if (!profile.industry) missing.push('Industry type');
    if (!profile.location) missing.push('Business location');
    if (!profile.businessModel) missing.push('Business model');
    if (profile.openingCapital === undefined) missing.push('Capital/budget');
    if (!profile.stage) missing.push('Business stage');
    
    // Context-specific missing info
    const intent = this.analyzeIntent(context.message);
    const goal = this.determineActualGoal(context.message, intent);
    
    if (goal.includes('financial') && !profile.expectedExpenses) {
      missing.push('Expense information');
    }
    
    if (goal.includes('inventory') && !profile.products) {
      missing.push('Product information');
    }
    
    if (goal.includes('customer') && !profile.customers) {
      missing.push('Customer information');
    }
    
    return missing;
  }
  
  // Predict what the business owner will need next
  predictNextNeeds(goal: string, profile: any): string[] {
    const needs: string[] = [];
    
    switch (goal) {
      case 'Understand financial performance':
        needs.push('Profit trend analysis', 'Expense breakdown', 'Revenue comparison');
        break;
        
      case 'Manage inventory levels':
        needs.push('Reorder point calculation', 'Supplier information', 'Demand forecasting');
        break;
        
      case 'Analyze sales performance': // NEW: Handle sales analysis
        needs.push('Sales trend analysis', 'Top performing products', 'Customer buying patterns');
        break;
        
      case 'Analyze inventory performance': // NEW: Handle inventory analysis
        needs.push('Inventory turnover rates', 'Slow moving items', 'Restocking schedule');
        break;
        
      case 'Analyze expense patterns': // NEW: Handle expense analysis
        needs.push('Expense categorization', 'Cost reduction opportunities', 'Budget tracking');
        break;
        
      case 'Make purchasing/investment decision':
        needs.push('ROI calculation', 'Cash flow impact', 'Risk assessment');
        break;
        
      case 'Start new business initiative':
        needs.push('Market research', 'Competitor analysis', 'Cost estimation', 'Revenue projection');
        break;
        
      case 'Increase sales':
        needs.push('Marketing strategy', 'Pricing review', 'Customer acquisition plan');
        break;
        
      case 'Improve cash flow':
        needs.push('Payment terms optimization', 'Expense reduction', 'Revenue acceleration');
        break;
        
      case 'Plan business growth':
        needs.push('Scaling strategy', 'Resource planning', 'Hiring plan');
        break;
        
      default:
        needs.push('Action plan', 'Timeline', 'Resource requirements');
    }
    
    return needs.slice(0, 3); // Return top 3 needs
  }
  
  // Identify potential risks
  identifyRisks(context: BusinessContext): string[] {
    const risks: string[] = [];
    const profile = context.businessProfile;
    const snapshot = context.businessSnapshot;
    
    // Financial risks
    if (snapshot.cashAvailable !== undefined && snapshot.cashAvailable < 50000) {
      risks.push('Low cash reserves - may struggle with unexpected expenses');
    }
    
    if (profile.monthlyBurn && profile.openingCapital) {
      const runway = profile.openingCapital / profile.monthlyBurn;
      if (runway < 3) {
        risks.push('Critical cash runway - less than 3 months');
      }
    }
    
    // Operational risks
    if (profile.inventoryShortages && profile.inventoryShortages.length > 0) {
      risks.push('Inventory shortages may lead to lost sales');
    }
    
    if (profile.outstandingInvoices && profile.outstandingInvoices > 100000) {
      risks.push('High outstanding invoices - cash flow risk');
    }
    
    // Market risks based on industry
    if (profile.industry?.toLowerCase() === 'retail') {
      risks.push('Competition and price sensitivity');
    }
    
    if (profile.industry?.toLowerCase() === 'restaurant') {
      risks.push('Food cost volatility and wastage');
    }
    
    return risks;
  }
  
  // Identify opportunities
  identifyOpportunities(context: BusinessContext): string[] {
    const opportunities: string[] = [];
    const profile = context.businessProfile;
    const snapshot = context.businessSnapshot;
    
    // Financial opportunities
    if (snapshot.profit && snapshot.profit > 0) {
      opportunities.push('Reinvest profits for growth');
    }
    
    if (profile.cashAvailable && profile.cashAvailable > 200000) {
      opportunities.push('Capital available for expansion or investment');
    }
    
    // Operational opportunities
    if (profile.products && profile.products.length > 0) {
      opportunities.push('Optimize product mix for higher margins');
    }
    
    if (profile.customers && profile.customers.length > 0) {
      opportunities.push('Leverage customer base for referrals and repeat business');
    }
    
    // Stage-specific opportunities
    switch (profile.stage) {
      case 'startup':
        opportunities.push('Establish strong foundation for growth');
        break;
      case 'growing':
        opportunities.push('Scale successful processes');
        break;
      case 'mature':
        opportunities.push('Explore new markets or product lines');
        break;
    }
    
    return opportunities;
  }
  
  // Generate recommended action
  generateRecommendedAction(goal: string, missingInfo: string[], risks: string[]): string {
    // If critical information is missing, prioritize that
    if (missingInfo.length > 0) {
      return `Provide ${missingInfo[0].toLowerCase()} for accurate analysis`;
    }
    
    // If there are immediate risks, address those
    if (risks.some(r => r.includes('Critical') || r.includes('less than 3 months'))) {
      return 'Address critical cash flow situation immediately';
    }
    
    // Otherwise, provide goal-specific recommendation
    switch (goal) {
      case 'Analyze sales performance': // NEW: Specific recommendation for sales
        return 'Review your sales data to identify top performers and trends';
      case 'Analyze inventory performance': // NEW: Specific recommendation for inventory
        return 'Analyze inventory turnover and identify slow-moving items';
      case 'Analyze expense patterns': // NEW: Specific recommendation for expenses
        return 'Categorize expenses to identify cost reduction opportunities';
      case 'Understand financial performance':
        return 'Review profit and loss statement for insights';
      case 'Manage inventory levels':
        return 'Analyze inventory turnover and reorder points';
      case 'Make purchasing/investment decision':
        return 'Calculate ROI and assess cash flow impact';
      case 'Start new business initiative':
        return 'Conduct market validation before full commitment';
      case 'Increase sales':
        return 'Identify and target high-value customer segments';
      case 'Improve cash flow':
        return 'Optimize payment terms and reduce expenses';
      case 'Plan business growth':
        return 'Develop phased growth plan with milestones';
      default:
        return 'Focus on highest-impact activity for current stage';
    }
  }
  
  // Generate context summary
  generateContextSummary(context: BusinessContext): string {
    const profile = context.businessProfile;
    const snapshot = context.businessSnapshot;
    
    const parts: string[] = [];
    
    if (profile.industry) parts.push(`${profile.industry} business`);
    if (profile.location) parts.push(`in ${profile.location}`);
    if (profile.stage) parts.push(`at ${profile.stage} stage`);
    if (snapshot.openingCapital !== undefined) parts.push(`with ₦${snapshot.openingCapital.toLocaleString()} capital`);
    
    return parts.join(' ') || 'Business';
  }
  
  // Main reasoning function
  reason(context: BusinessContext): ReasoningResult {
    const intent = this.analyzeIntent(context.message);
    const actualGoal = this.determineActualGoal(context.message, intent);
    const missingInfo = this.identifyMissingInformation(context);
    const nextNeeds = this.predictNextNeeds(actualGoal, context.businessProfile);
    const risks = this.identifyRisks(context);
    const opportunities = this.identifyOpportunities(context);
    const recommendedAction = this.generateRecommendedAction(actualGoal, missingInfo, risks);
    const contextSummary = this.generateContextSummary(context);
    
    // NEW: Determine if we can answer with existing data
    const canAnswerWithExistingData = this.canAnswerWithExistingData(context);
    
    // NEW: Determine relevant data points
    const relevantDataPoints = this.determineRelevantDataPoints(context.message, context.businessData);
    
    return {
      userIntent: intent,
      actualGoal,
      missingInformation: missingInfo,
      nextNeeds,
      risks,
      opportunities,
      recommendedAction,
      contextSummary,
      canAnswerWithExistingData, // NEW
      relevantDataPoints, // NEW
    };
  }
  
  // Format reasoning results for AI response
  formatForAIResponse(reasoning: ReasoningResult): string {
    let response = '\n\n🧠 INTERNAL REASONING:\n';
    response += `- User Intent: ${reasoning.userIntent}\n`;
    response += `- Actual Goal: ${reasoning.actualGoal}\n`;
    response += `- Context: ${reasoning.contextSummary}\n`;
    response += `- Can Answer With Existing Data: ${reasoning.canAnswerWithExistingData}\n`; // NEW
    response += `- Relevant Data Points: [${reasoning.relevantDataPoints.join(', ')}]\n`; // NEW
    
    if (reasoning.missingInformation.length > 0) {
      response += `- Missing Information: ${reasoning.missingInformation.join(', ')}\n`;
    }
    
    if (reasoning.nextNeeds.length > 0) {
      response += `- Next Needs: ${reasoning.nextNeeds.join(', ')}\n`;
    }
    
    if (reasoning.risks.length > 0) {
      response += `- ⚠️ Risks: ${reasoning.risks.join(', ')}\n`;
    }
    
    if (reasoning.opportunities.length > 0) {
      response += `- 💡 Opportunities: ${reasoning.opportunities.join(', ')}\n`;
    }
    
    response += `- Recommended Action: ${reasoning.recommendedAction}\n`;
    
    return response;
  }
}

// Singleton instance
let reasoningEngineInstance: ReasoningEngine | null = null;

export function getReasoningEngine(): ReasoningEngine {
  if (!reasoningEngineInstance) {
    reasoningEngineInstance = new ReasoningEngine();
  }
  return reasoningEngineInstance;
}