// MO Thinking Out Loud System - Express reasoning when appropriate
// Allows users to see part of MO's reasoning to build trust and understanding

export interface ThinkingContext {
  conversationMode: string;
  goal: string;
  complexity: number; // 0-1
  userUnderstanding: number; // 0-1
  hasAssumptions: boolean;
  emotionalState: string;
}

export interface ThoughtExpression {
  shouldExpress: boolean;
  expressionType: 'initial_thought' | 'revision' | 'realization' | 'consideration' | 'hesitation';
  template: string;
  reasoning: string;
  confidence: number;
}

export interface ThinkingPattern {
  trigger: string;
  expression: string;
  useCase: string;
}

export class ThinkingOutLoudEngine {
  private patterns: ThinkingPattern[];
  private recentExpressions: string[] = [];
  
  constructor() {
    this.patterns = this.initializePatterns();
  }
  
  // Initialize thinking patterns
  private initializePatterns(): ThinkingPattern[] {
    return [
      {
        trigger: 'initial_thought_different',
        expression: 'My first thought was different, but...',
        useCase: 'When initial analysis changes with more information',
      },
      {
        trigger: 'something_stands_out',
        expression: 'Something stands out here...',
        useCase: 'When noticing an important pattern or anomaly',
      },
      {
        trigger: 'more_i_think',
        expression: 'The more I think about it...',
        useCase: 'When deeper analysis reveals new insights',
      },
      {
        trigger: 'bigger_issue',
        expression: 'I think the bigger issue is...',
        useCase: 'When identifying root cause vs symptom',
      },
      {
        trigger: 'almost_recommended',
        expression: 'I almost recommended something else...',
        useCase: 'When considering but rejecting an alternative',
      },
      {
        trigger: 'considering_options',
        expression: 'I\'m considering a few options here...',
        useCase: 'When evaluating multiple approaches',
      },
      {
        trigger: 'important_distinction',
        expression: 'An important distinction here...',
        useCase: 'When clarifying a subtle but important difference',
      },
      {
        trigger: 'worth_noting',
        expression: 'Something worth noting...',
        useCase: 'When highlighting relevant context',
      },
      {
        trigger: 'changed_my_mind',
        expression: 'I\'ve changed my thinking on this...',
        useCase: 'When revising opinion based on new information',
      },
      {
        trigger: 'initially_uncertain',
        expression: 'I was initially uncertain, but...',
        useCase: 'When confidence increases with analysis',
      },
      {
        trigger: 'trade_off',
        expression: 'There\'s a trade-off here...',
        useCase: 'When explaining competing priorities',
      },
      {
        trigger: 'looking_closely',
        expression: 'Looking more closely at this...',
        useCase: 'When diving deeper into specific aspect',
      },
    ];
  }
  
  // Determine if thinking should be expressed
  shouldExpressThinking(context: ThinkingContext): ThoughtExpression {
    const shouldExpress = this.evaluateExpressionWorthiness(context);
    
    if (!shouldExpress) {
      return {
        shouldExpress: false,
        expressionType: 'initial_thought',
        template: '',
        reasoning: 'Not appropriate to express thinking in this context',
        confidence: 0,
      };
    }
    
    const expressionType = this.selectExpressionType(context);
    const template = this.selectTemplate(expressionType, context);
    const reasoning = this.explainDecision(context, expressionType);
    
    return {
      shouldExpress: true,
      expressionType,
      template,
      reasoning,
      confidence: this.calculateConfidence(context, expressionType),
    };
  }
  
  // Evaluate if thinking is worth expressing
  private evaluateExpressionWorthiness(context: ThinkingContext): boolean {
    // Express thinking in reasoning and challenge modes
    if (context.conversationMode === 'reasoning' || context.conversationMode === 'challenge') {
      return true;
    }
    
    // Express thinking for teaching mode
    if (context.conversationMode === 'teaching') {
      return true;
    }
    
    // Express thinking when complexity is high
    if (context.complexity > 0.7) {
      return true;
    }
    
    // Express thinking when user has assumptions
    if (context.hasAssumptions) {
      return true;
    }
    
    // Express thinking when user understanding is low
    if (context.userUnderstanding < 0.5) {
      return true;
    }
    
    // Don't express thinking for urgent or frustrated users
    if (context.emotionalState === 'urgent' || context.emotionalState === 'frustrated') {
      return false;
    }
    
    // Don't express thinking in action mode
    if (context.conversationMode === 'action') {
      return false;
    }
    
    return false;
  }
  
  // Select expression type based on context
  private selectExpressionType(context: ThinkingContext): 'initial_thought' | 'revision' | 'realization' | 'consideration' | 'hesitation' {
    // Revision when complexity is high
    if (context.complexity > 0.8) {
      return 'revision';
    }
    
    // Realization when user has assumptions
    if (context.hasAssumptions) {
      return 'realization';
    }
    
    // Consideration in teaching mode
    if (context.conversationMode === 'teaching') {
      return 'consideration';
    }
    
    // Hesitation when uncertain
    if (context.userUnderstanding < 0.4) {
      return 'hesitation';
    }
    
    // Default to initial thought
    return 'initial_thought';
  }
  
  // Select template for expression
  private selectTemplate(expressionType: string, context: ThinkingContext): string {
    const availablePatterns = this.patterns.filter(p => 
      !this.recentExpressions.includes(p.trigger)
    );
    
    // Select based on expression type and context
    if (expressionType === 'revision') {
      const revisionPatterns = availablePatterns.filter(p => 
        p.trigger === 'changed_my_mind' || 
        p.trigger === 'more_i_think' ||
        p.trigger === 'almost_recommended'
      );
      if (revisionPatterns.length > 0) {
        return revisionPatterns[0].expression;
      }
      return 'The more I think about it...';
    }
    
    if (expressionType === 'realization') {
      const realizationPatterns = availablePatterns.filter(p => 
        p.trigger === 'something_stands_out' ||
        p.trigger === 'bigger_issue' ||
        p.trigger === 'important_distinction'
      );
      if (realizationPatterns.length > 0) {
        return realizationPatterns[0].expression;
      }
      return 'Something stands out here...';
    }
    
    if (expressionType === 'consideration') {
      const considerationPatterns = availablePatterns.filter(p => 
        p.trigger === 'considering_options' ||
        p.trigger === 'trade_off' ||
        p.trigger === 'looking_closely'
      );
      if (considerationPatterns.length > 0) {
        return considerationPatterns[0].expression;
      }
      return 'I\'m considering a few options here...';
    }
    
    if (expressionType === 'hesitation') {
      const hesitationPatterns = availablePatterns.filter(p => 
        p.trigger === 'initially_uncertain' ||
        p.trigger === 'worth_noting'
      );
      if (hesitationPatterns.length > 0) {
        return hesitationPatterns[0].expression;
      }
      return 'I was initially uncertain, but...';
    }
    
    // Default
    return 'Something worth noting...';
  }
  
  // Explain the decision
  private explainDecision(context: ThinkingContext, expressionType: string): string {
    const reasons: string[] = [];
    
    if (context.conversationMode === 'reasoning') {
      reasons.push('Reasoning mode benefits from showing thought process');
    }
    
    if (context.complexity > 0.7) {
      reasons.push('High complexity justifies expressing reasoning');
    }
    
    if (context.hasAssumptions) {
      reasons.push('User assumptions need addressing through visible thinking');
    }
    
    if (context.userUnderstanding < 0.5) {
      reasons.push('Low user understanding benefits from seeing reasoning');
    }
    
    return reasons.join('. ');
  }
  
  // Calculate confidence in expression decision
  private calculateConfidence(context: ThinkingContext, expressionType: string): number {
    let confidence = 0.7;
    
    // Higher confidence in reasoning and teaching modes
    if (context.conversationMode === 'reasoning' || context.conversationMode === 'teaching') {
      confidence += 0.15;
    }
    
    // Higher confidence when complexity is high
    if (context.complexity > 0.7) {
      confidence += 0.1;
    }
    
    // Lower confidence if recently used similar expression
    if (this.recentExpressions.length > 0) {
      confidence -= 0.05;
    }
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }
  
  // Record expression usage
  recordExpression(trigger: string): void {
    this.recentExpressions.push(trigger);
    // Keep only last 3 expressions
    if (this.recentExpressions.length > 3) {
      this.recentExpressions.shift();
    }
  }
  
  // Generate full thinking expression
  generateExpression(expression: ThoughtExpression, actualReasoning: string): string {
    if (!expression.shouldExpress) {
      return '';
    }
    
    this.recordExpression(expression.expressionType);
    
    return `${expression.template} ${actualReasoning}`;
  }
  
  // Get statistics
  getStatistics(): {
    totalExpressions: number;
    expressionTypes: Record<string, number>;
    mostUsedPattern: string | null;
  } {
    const expressionTypes: Record<string, number> = {
      initial_thought: 0,
      revision: 0,
      realization: 0,
      consideration: 0,
      hesitation: 0,
    };
    
    this.recentExpressions.forEach(trigger => {
      const pattern = this.patterns.find(p => p.trigger === trigger);
      if (pattern) {
        // Map trigger to expression type
        if (['changed_my_mind', 'more_i_think', 'almost_recommended'].includes(trigger)) {
          expressionTypes.revision++;
        } else if (['something_stands_out', 'bigger_issue', 'important_distinction'].includes(trigger)) {
          expressionTypes.realization++;
        } else if (['considering_options', 'trade_off', 'looking_closely'].includes(trigger)) {
          expressionTypes.consideration++;
        } else if (['initially_uncertain', 'worth_noting'].includes(trigger)) {
          expressionTypes.hesitation++;
        } else {
          expressionTypes.initial_thought++;
        }
      }
    });
    
    let mostUsedPattern: string | null = null;
    let maxCount = 0;
    
    Object.entries(expressionTypes).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsedPattern = type;
      }
    });
    
    return {
      totalExpressions: this.recentExpressions.length,
      expressionTypes,
      mostUsedPattern,
    };
  }
  
  // Reset history
  resetHistory(): void {
    this.recentExpressions = [];
  }
  
  // Format for AI response
  formatForAIResponse(expression: ThoughtExpression): string {
    if (!expression.shouldExpress) {
      return '\n\n💭 THINKING OUT LOUD: Not expressing reasoning in this context\n';
    }
    
    let response = '\n\n💭 THINKING OUT LOUD:\n';
    response += `Expression Type: ${expression.expressionType}\n`;
    response += `Template: "${expression.template}"\n`;
    response += `Reasoning: ${expression.reasoning}\n`;
    response += `Confidence: ${(expression.confidence * 100).toFixed(0)}%\n`;
    
    return response;
  }
  
  // Get all patterns
  getAllPatterns(): ThinkingPattern[] {
    return this.patterns;
  }
  
  // Add custom pattern
  addCustomPattern(pattern: ThinkingPattern): void {
    this.patterns.push(pattern);
  }
}

// Singleton instance
let thinkingOutLoudEngineInstance: ThinkingOutLoudEngine | null = null;

export function getThinkingOutLoudEngine(): ThinkingOutLoudEngine {
  if (!thinkingOutLoudEngineInstance) {
    thinkingOutLoudEngineInstance = new ThinkingOutLoudEngine();
  }
  return thinkingOutLoudEngineInstance;
}
