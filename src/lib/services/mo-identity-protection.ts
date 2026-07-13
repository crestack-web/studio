// MO Identity Protection Service
// Ensures MO's responses always prioritize Busmo data over generic business advice
// Prevents MO from drifting away from its core identity as Busmo's AI

export interface BusinessDataContext {
  businessId: string;
  hasSalesData: boolean;
  hasInventoryData: boolean;
  hasCashFlowData: boolean;
  hasCreditData: boolean;
  hasExpenseData: boolean;
  hasStaffData: boolean;
  hasBankData: boolean;
  dataFreshness: 'recent' | 'stale' | 'none';
  dataCompleteness: number; // 0-1 scale
}

export interface UserQuestion {
  text: string;
  intent: 'business_data' | 'general_business' | 'busmo_feature' | 'other';
  confidence: number;
}

export interface IdentityProtectionResult {
  shouldUseBusmoData: boolean;
  dataPriority: 'busmo_data_first' | 'general_advice' | 'mixed';
  requiredDataSources: string[];
  systemPromptAdditions: string;
  responseGuidance: string;
  followUpQuestionGuidance: string;
}

export class MOIdentityProtection {
  
  // Analyze the user's question to determine its primary intent
  analyzeQuestionIntent(question: string, businessContext: BusinessDataContext): UserQuestion {
    const lowerQuestion = question.toLowerCase();
    
    // Keywords that indicate business data questions
    const businessDataKeywords = [
      'profit', 'revenue', 'sales', 'income', 'money',
      'inventory', 'stock', 'product', 'item',
      'cash flow', 'cash', 'balance', 'money in', 'money out',
      'credit', 'customer', 'owing', 'debt',
      'expense', 'cost', 'spending',
      'my business', 'my store', 'my shop',
      'how much', 'how many', 'what is my',
      'performance', 'trend', 'growth',
      'best', 'worst', 'top',
    ];
    
    // Keywords that indicate Busmo feature questions
    const busmoFeatureKeywords = [
      'how do i', 'how to', 'can i',
      'feature', 'use busmo', 'in busmo',
      'record', 'add', 'delete', 'edit',
      'dashboard', 'report',
    ];
    
    // Count matches
    const dataMatches = businessDataKeywords.filter(kw => lowerQuestion.includes(kw)).length;
    const featureMatches = busmoFeatureKeywords.filter(kw => lowerQuestion.includes(kw)).length;
    
    // Determine intent
    if (dataMatches >= 2 || (dataMatches >= 1 && businessContext.dataCompleteness > 0.3)) {
      return {
        text: question,
        intent: 'business_data',
        confidence: Math.min(0.9, 0.6 + (dataMatches * 0.1) + (businessContext.dataCompleteness * 0.2)),
      };
    }
    
    if (featureMatches >= 1) {
      return {
        text: question,
        intent: 'busmo_feature',
        confidence: 0.8,
      };
    }
    
    // Default to general business advice
    return {
      text: question,
      intent: 'general_business',
      confidence: 0.6,
    };
  }
  
  // Determine if Busmo data should be used for this question
  determineDataPriority(question: UserQuestion, businessContext: BusinessDataContext): IdentityProtectionResult {
    const result: IdentityProtectionResult = {
      shouldUseBusmoData: false,
      dataPriority: 'general_advice',
      requiredDataSources: [],
      systemPromptAdditions: '',
      responseGuidance: '',
      followUpQuestionGuidance: '',
    };
    
    // If question is about business data and we have relevant data
    if (question.intent === 'business_data' && businessContext.dataCompleteness > 0.2) {
      result.shouldUseBusmoData = true;
      result.dataPriority = 'busmo_data_first';
      
      // Determine which data sources are needed
      const lowerQuestion = question.text.toLowerCase();
      
      if (lowerQuestion.includes('profit') || lowerQuestion.includes('revenue') || lowerQuestion.includes('sales')) {
        result.requiredDataSources.push('sales');
      }
      if (lowerQuestion.includes('inventory') || lowerQuestion.includes('stock') || lowerQuestion.includes('product')) {
        result.requiredDataSources.push('inventory');
      }
      if (lowerQuestion.includes('cash') || lowerQuestion.includes('money')) {
        result.requiredDataSources.push('cashFlow');
      }
      if (lowerQuestion.includes('credit') || lowerQuestion.includes('owing') || lowerQuestion.includes('customer')) {
        result.requiredDataSources.push('credit');
      }
      if (lowerQuestion.includes('expense') || lowerQuestion.includes('cost') || lowerQuestion.includes('spending')) {
        result.requiredDataSources.push('expenses');
      }
      
      // Generate system prompt additions
      result.systemPromptAdditions = this.generateDataFirstPrompt(businessContext, result.requiredDataSources);
      result.responseGuidance = this.generateDataFirstResponseGuidance();
      result.followUpQuestionGuidance = this.generateDataFirstFollowUpGuidance();
      
    } else if (question.intent === 'general_business' && businessContext.dataCompleteness > 0.3) {
      // General business question but we have relevant data - use mixed approach
      result.shouldUseBusmoData = true;
      result.dataPriority = 'mixed';
      
      result.systemPromptAdditions = this.generateMixedPrompt(businessContext);
      result.responseGuidance = this.generateMixedResponseGuidance();
      result.followUpQuestionGuidance = this.generateMixedFollowUpGuidance();
      
    } else {
      // Pure general advice or no data available
      result.shouldUseBusmoData = false;
      result.dataPriority = 'general_advice';
      
      result.systemPromptAdditions = this.generateGeneralPrompt();
      result.responseGuidance = this.generateGeneralResponseGuidance();
      result.followUpQuestionGuidance = this.generateGeneralFollowUpGuidance();
    }
    
    return result;
  }
  
  // Generate system prompt additions for data-first responses
  private generateDataFirstPrompt(businessContext: BusinessDataContext, requiredSources: string[]): string {
    const sources = requiredSources.length > 0 
      ? requiredSources.join(', ') 
      : 'relevant business data';
    
    return `
## IDENTITY PROTECTION: DATA-FIRST RESPONSE

You are MO, Busmo's AI assistant. The user is asking about their business.

CRITICAL RULES:
1. FIRST: Retrieve and analyze the user's actual ${sources} from Busmo
2. SECOND: Answer the question directly using that data
3. THIRD: Explain what the data means
4. FOURTH: Highlight risks or opportunities in the data
5. FIFTH: Recommend the next best action based on the data
6. SIXTH: Ask a follow-up question ONLY if it improves future advice

FORBIDDEN:
- Never begin with generic business education when the answer exists in their data
- Never say "businesses should..." when you can say "your business shows..."
- Never provide general advice without connecting it to their actual data
- Never sound like you forgot you are Busmo's AI

The user's business data is your primary source of truth. Think "What does their data tell me?" before "What do I know about this topic?"
`;
  }
  
  // Generate response guidance for data-first responses
  private generateDataFirstResponseGuidance(): string {
    return `
Response Structure:
1. Direct answer using their data (e.g., "Your profit this month is ₦45,000")
2. Data analysis (e.g., "This is 15% higher than last month because...")
3. Insights from the data (e.g., "Your best-selling product is...")
4. Risks/opportunities (e.g., "Stock is running low on...")
5. Recommended action (e.g., "Consider restocking...")
6. Follow-up only if needed (e.g., "Would you like me to analyze your sales trends?")
`;
  }
  
  // Generate follow-up guidance for data-first responses
  private generateDataFirstFollowUpGuidance(): string {
    return `
Follow-up questions should:
- Relate to improving future advice about their business
- Help gather missing data if it would improve recommendations
- Focus on their specific business situation, not general topics
`;
  }
  
  // Generate system prompt additions for mixed responses
  private generateMixedPrompt(businessContext: BusinessDataContext): string {
    return `
## IDENTITY PROTECTION: MIXED RESPONSE

You are MO, Busmo's AI assistant. The user is asking general business advice.

CRITICAL RULES:
1. Provide the general business advice they requested
2. CONNECT it back to their actual Busmo data
3. Use phrases like "Based on your current [metric] in Busmo, this advice is especially relevant because..."
4. Their business should always be the anchor for recommendations
5. Never sound like a generic business advisor - you are Busmo's AI

The user's own business context must be the foundation of your recommendations.
`;
  }
  
  // Generate response guidance for mixed responses
  private generateMixedResponseGuidance(): string {
    return `
Response Structure:
1. Provide the general business advice
2. Immediately connect to their data (e.g., "Based on your current cash flow in Busmo...")
3. Explain why this is relevant to their specific situation
4. Recommend actions tailored to their business
`;
  }
  
  // Generate follow-up guidance for mixed responses
  private generateMixedFollowUpGuidance(): string {
    return `
Follow-up questions should:
- Help them apply the advice to their specific business
- Relate to their Busmo data
- Focus on implementation in their context
`;
  }
  
  // Generate system prompt additions for general responses
  private generateGeneralPrompt(): string {
    return `
## IDENTITY PROTECTION: GENERAL RESPONSE

You are MO, Busmo's AI assistant. The user is asking a question where their Busmo data is not relevant or not available.

CRITICAL RULES:
1. Answer their question helpfully
2. Remember you are Busmo's AI - maintain that identity
3. If relevant, mention how Busmo could help with this in the future
4. Never drift into sounding like a generic AI assistant
5. Keep the door open to connecting this to their business data later

Even without data, you are still MO, Busmo's AI assistant.
`;
  }
  
  // Generate response guidance for general responses
  private generateGeneralResponseGuidance(): string {
    return `
Response Structure:
1. Answer their question directly
2. Maintain MO's identity as Busmo's AI
3. If relevant, mention Busmo features that could help
4. Keep it helpful but brief
`;
  }
  
  // Generate follow-up guidance for general responses
  private generateGeneralFollowUpGuidance(): string {
    return `
Follow-up questions should:
- Only ask if it helps understand their needs better
- Relate to how Busmo could help them
`;
  }
  
  // Validate that a response follows identity protection rules
  validateResponse(response: string, question: UserQuestion, businessContext: BusinessDataContext): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const lowerResponse = response.toLowerCase();
    
    // Check for generic business education when data is available
    if (question.intent === 'business_data' && businessContext.dataCompleteness > 0.3) {
      const genericPhrases = [
        'businesses should',
        'companies should',
        'generally speaking',
        'in general',
        'most businesses',
        'typically',
      ];
      
      const hasGenericPhrases = genericPhrases.some(phrase => lowerResponse.includes(phrase));
      if (hasGenericPhrases) {
        issues.push('Response contains generic business phrases instead of using user data');
        suggestions.push('Replace generic phrases with specific references to their business data');
      }
      
      // Check if response mentions their business
      if (!lowerResponse.includes('your') && !lowerResponse.includes('you have')) {
        issues.push('Response does not reference the user\'s business');
        suggestions.push('Include references to their specific business data');
      }
    }
    
    // Check for Busmo identity
    if (!lowerResponse.includes('busmo') && !lowerResponse.includes('in busmo')) {
      suggestions.push('Consider mentioning Busmo to maintain identity');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      suggestions,
    };
  }
}

// Singleton instance
let identityProtectionInstance: MOIdentityProtection | null = null;

export function getMOIdentityProtection(): MOIdentityProtection {
  if (!identityProtectionInstance) {
    identityProtectionInstance = new MOIdentityProtection();
  }
  return identityProtectionInstance;
}
