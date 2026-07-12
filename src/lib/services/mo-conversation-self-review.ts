// MO Conversation Self-Review System - Response quality check before sending
// Ask internal questions: Am I answering the real question? Have I talked too much? Should I ask instead of tell?

export interface ReviewCriteria {
  answersRealQuestion: boolean;
  notTooLong: boolean;
  asksInsteadOfTells: boolean;
  notRepeating: boolean;
  simplerExplanation: boolean;
  helpingBusinessMoveForward: boolean;
  wouldMentorSayThis: boolean;
}

export interface ReviewContext {
  userMessage: string;
  proposedResponse: string;
  conversationMode: string;
  emotionalState: string;
  goal: string;
  targetLength: number;
  establishedFacts: string[];
  previousResponses: string[];
}

export interface ReviewResult {
  passesReview: boolean;
  criteria: ReviewCriteria;
  issues: string[];
  suggestions: string[];
  revisedResponse?: string;
  confidence: number;
}

export class ConversationSelfReviewEngine {
  
  // Perform self-review of proposed response
  reviewResponse(context: ReviewContext): ReviewResult {
    const criteria = this.evaluateCriteria(context);
    const issues = this.identifyIssues(criteria, context);
    const suggestions = this.generateSuggestions(issues, context);
    const passesReview = issues.length === 0;
    const confidence = this.calculateReviewConfidence(criteria, issues);
    
    return {
      passesReview,
      criteria,
      issues,
      suggestions,
      confidence,
    };
  }
  
  // Evaluate each review criterion
  private evaluateCriteria(context: ReviewContext): ReviewCriteria {
    return {
      answersRealQuestion: this.checkAnswersRealQuestion(context),
      notTooLong: this.checkNotTooLong(context),
      asksInsteadOfTells: this.checkAsksInsteadOfTells(context),
      notRepeating: this.checkNotRepeating(context),
      simplerExplanation: this.checkSimplerExplanation(context),
      helpingBusinessMoveForward: this.checkHelpingBusinessMoveForward(context),
      wouldMentorSayThis: this.checkWouldMentorSayThis(context),
    };
  }
  
  // Check if response answers the real question
  private checkAnswersRealQuestion(context: ReviewContext): boolean {
    const { userMessage, proposedResponse } = context;
    
    // Extract key question from user message
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'should', 'do'];
    const hasQuestion = questionWords.some(word => 
      userMessage.toLowerCase().startsWith(word) || 
      userMessage.includes('?')
    );
    
    if (!hasQuestion) {
      return true; // Not a question, so this criterion doesn't apply
    }
    
    // Check if response addresses the question topic
    const userTopics = this.extractTopics(userMessage);
    const responseTopics = this.extractTopics(proposedResponse);
    
    const hasOverlap = userTopics.some(topic => 
      responseTopics.some(rt => rt.includes(topic) || topic.includes(rt))
    );
    
    return hasOverlap;
  }
  
  // Check if response is not too long
  private checkNotTooLong(context: ReviewContext): boolean {
    const { proposedResponse, targetLength } = context;
    const actualLength = proposedResponse.split(/\s+/).length;
    
    // Allow 20% deviation from target
    const deviation = Math.abs(actualLength - targetLength) / targetLength;
    return deviation <= 0.2;
  }
  
  // Check if response asks instead of tells when appropriate
  private checkAsksInsteadOfTells(context: ReviewContext): boolean {
    const { proposedResponse, conversationMode, goal } = context;
    
    // In discovery mode, should ask more than tell
    if (conversationMode === 'discovery' || goal === 'discover') {
      const questionCount = (proposedResponse.match(/\?/g) || []).length;
      return questionCount > 0;
    }
    
    // In action mode, should tell more than ask
    if (conversationMode === 'action' || goal === 'take_action') {
      const questionCount = (proposedResponse.match(/\?/g) || []).length;
      return questionCount <= 1;
    }
    
    return true; // Other modes are flexible
  }
  
  // Check if response is not repeating
  private checkNotRepeating(context: ReviewContext): boolean {
    const { proposedResponse, establishedFacts, previousResponses } = context;
    
    // Check against established facts
    for (const fact of establishedFacts) {
      if (proposedResponse.includes(fact) && fact.length > 20) {
        return false;
      }
    }
    
    // Check against previous responses
    for (const prev of previousResponses.slice(-2)) {
      const similarity = this.calculateSimilarity(proposedResponse, prev);
      if (similarity > 0.7) {
        return false;
      }
    }
    
    return true;
  }
  
  // Check if there's a simpler explanation
  private checkSimplerExplanation(context: ReviewContext): boolean {
    const { proposedResponse, conversationMode } = context;
    
    // In teaching mode, check for complexity
    if (conversationMode === 'teaching') {
      const complexWords = ['furthermore', 'consequently', 'nevertheless', 'accordingly', 'therefore'];
      const hasComplexWords = complexWords.some(word => 
        proposedResponse.toLowerCase().includes(word)
      );
      
      if (hasComplexWords) {
        return false; // Could be simpler
      }
    }
    
    return true;
  }
  
  // Check if response helps business move forward
  private checkHelpingBusinessMoveForward(context: ReviewContext): boolean {
    const { proposedResponse, goal } = context;
    
    // Action-oriented words
    const actionWords = ['should', 'recommend', 'let\'s', 'here\'s', 'try', 'consider', 'do'];
    const hasAction = actionWords.some(word => 
      proposedResponse.toLowerCase().includes(word)
    );
    
    // If goal is action or decide, should have action words
    if (goal === 'take_action' || goal === 'decide') {
      return hasAction;
    }
    
    return true;
  }
  
  // Check if a mentor would say this
  private checkWouldMentorSayThis(context: ReviewContext): boolean {
    const { proposedResponse, emotionalState } = context;
    
    // Check for excessive praise
    const praiseWords = ['amazing', 'incredible', 'perfect', 'awesome', 'fantastic'];
    const praiseCount = praiseWords.filter(word => 
      proposedResponse.toLowerCase().includes(word)
    ).length;
    
    if (praiseCount >= 2) {
      return false; // Too much praise
    }
    
    // Check for definitive statements when uncertain
    const definitiveWords = ['definitely', 'certainly', 'absolutely', 'without doubt'];
    const hasDefinitive = definitiveWords.some(word => 
      proposedResponse.toLowerCase().includes(word)
    );
    
    if (hasDefinitive && emotionalState !== 'confident') {
      return false; // Too definitive
    }
    
    return true;
  }
  
  // Identify issues based on failed criteria
  private identifyIssues(criteria: ReviewCriteria, context: ReviewContext): string[] {
    const issues: string[] = [];
    
    if (!criteria.answersRealQuestion) {
      issues.push('Response may not be answering the real question');
    }
    
    if (!criteria.notTooLong) {
      issues.push('Response is too long or too short for target length');
    }
    
    if (!criteria.asksInsteadOfTells) {
      issues.push('Response should ask more questions in this mode');
    }
    
    if (!criteria.notRepeating) {
      issues.push('Response repeats previously established information');
    }
    
    if (!criteria.simplerExplanation) {
      issues.push('Explanation could be simpler');
    }
    
    if (!criteria.helpingBusinessMoveForward) {
      issues.push('Response lacks actionable guidance');
    }
    
    if (!criteria.wouldMentorSayThis) {
      issues.push('Response doesn\'t sound like a mentor');
    }
    
    return issues;
  }
  
  // Generate suggestions for improvement
  private generateSuggestions(issues: string[], context: ReviewContext): string[] {
    const suggestions: string[] = [];
    
    issues.forEach(issue => {
      if (issue.includes('real question')) {
        suggestions.push('Focus on directly addressing the user\'s core question');
      }
      
      if (issue.includes('too long')) {
        suggestions.push('Condense the response to match target length');
      }
      
      if (issue.includes('too short')) {
        suggestions.push('Expand the response with more relevant detail');
      }
      
      if (issue.includes('ask more questions')) {
        suggestions.push('Add clarifying questions to better understand the situation');
      }
      
      if (issue.includes('repeating')) {
        suggestions.push('Reference established facts instead of repeating them');
      }
      
      if (issue.includes('simpler')) {
        suggestions.push('Use simpler language and shorter sentences');
      }
      
      if (issue.includes('actionable')) {
        suggestions.push('Add specific recommendations or next steps');
      }
      
      if (issue.includes('mentor')) {
        suggestions.push('Adjust tone to be more balanced and professional');
      }
    });
    
    return suggestions;
  }
  
  // Calculate review confidence
  private calculateReviewConfidence(criteria: ReviewCriteria, issues: string[]): number {
    const passedCount = Object.values(criteria).filter(c => c).length;
    const totalCount = Object.keys(criteria).length;
    
    const baseConfidence = passedCount / totalCount;
    
    // Reduce confidence if there are critical issues
    const criticalIssues = issues.filter(i => 
      i.includes('real question') || i.includes('mentor')
    );
    
    const penalty = criticalIssues.length * 0.1;
    
    return Math.max(0.3, Math.min(0.95, baseConfidence - penalty));
  }
  
  // Extract topics from text
  private extractTopics(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once'];
    
    return words.filter(word => word.length > 3 && !stopWords.includes(word));
  }
  
  // Calculate similarity between two texts
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = this.extractTopics(text1);
    const words2 = this.extractTopics(text2);
    
    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }
  
  // Format for AI response
  formatForAIResponse(result: ReviewResult): string {
    let response = '\n\n✅ CONVERSATION SELF-REVIEW:\n';
    response += `Passes Review: ${result.passesReview ? 'Yes' : 'No'}\n`;
    response += `Confidence: ${(result.confidence * 100).toFixed(0)}%\n`;
    
    response += '\nCriteria:\n';
    response += `• Answers real question: ${result.criteria.answersRealQuestion ? '✓' : '✗'}\n`;
    response += `• Not too long: ${result.criteria.notTooLong ? '✓' : '✗'}\n`;
    response += `• Asks instead of tells: ${result.criteria.asksInsteadOfTells ? '✓' : '✗'}\n`;
    response += `• Not repeating: ${result.criteria.notRepeating ? '✓' : '✗'}\n`;
    response += `• Simpler explanation: ${result.criteria.simplerExplanation ? '✓' : '✗'}\n`;
    response += `• Helping business move forward: ${result.criteria.helpingBusinessMoveForward ? '✓' : '✗'}\n`;
    response += `• Would mentor say this: ${result.criteria.wouldMentorSayThis ? '✓' : '✗'}\n`;
    
    if (result.issues.length > 0) {
      response += '\nIssues:\n';
      result.issues.forEach(issue => {
        response += `• ${issue}\n`;
      });
    }
    
    if (result.suggestions.length > 0) {
      response += '\nSuggestions:\n';
      result.suggestions.forEach(suggestion => {
        response += `• ${suggestion}\n`;
      });
    }
    
    return response;
  }
}

// Singleton instance
let conversationSelfReviewEngineInstance: ConversationSelfReviewEngine | null = null;

export function getConversationSelfReviewEngine(): ConversationSelfReviewEngine {
  if (!conversationSelfReviewEngineInstance) {
    conversationSelfReviewEngineInstance = new ConversationSelfReviewEngine();
  }
  return conversationSelfReviewEngineInstance;
}
