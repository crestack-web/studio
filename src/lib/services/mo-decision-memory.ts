// MO Decision Memory - Store Major Business Decisions
// Records business decisions with reasons, expected outcomes, actual outcomes, and lessons learned

export interface BusinessDecision {
  id: string;
  date: Date;
  decision: string;
  category: 'pricing' | 'supplier' | 'product' | 'marketing' | 'expansion' | 'hiring' | 'investment' | 'operational' | 'other';
  reason: string;
  expectedOutcome: string;
  actualOutcome?: string;
  outcomeDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  impact: 'high' | 'medium' | 'low';
  lessonsLearned?: string;
  confidence: number;
  relatedData?: any;
  businessId: string;
}

export interface DecisionContext {
  businessId: string;
  userId?: string;
  conversationId?: string;
}

export class DecisionMemory {
  private decisions: Map<string, BusinessDecision> = new Map();
  private businessId: string;
  
  constructor(businessId: string) {
    this.businessId = businessId;
  }
  
  // Record a new decision
  recordDecision(decision: Omit<BusinessDecision, 'id' | 'date' | 'businessId'>, context: DecisionContext): BusinessDecision {
    const newDecision: BusinessDecision = {
      id: this.generateId(),
      date: new Date(),
      businessId: context.businessId,
      ...decision,
    };
    
    this.decisions.set(newDecision.id, newDecision);
    return newDecision;
  }
  
  // Update decision with actual outcome
  updateOutcome(decisionId: string, actualOutcome: string, lessonsLearned?: string): void {
    const decision = this.decisions.get(decisionId);
    if (!decision) return;
    
    decision.actualOutcome = actualOutcome;
    decision.outcomeDate = new Date();
    decision.status = 'completed';
    decision.lessonsLearned = lessonsLearned;
    
    this.decisions.set(decisionId, decision);
  }
  
  // Mark decision as failed
  markAsFailed(decisionId: string, reason: string): void {
    const decision = this.decisions.get(decisionId);
    if (!decision) return;
    
    decision.actualOutcome = reason;
    decision.outcomeDate = new Date();
    decision.status = 'failed';
    
    this.decisions.set(decisionId, decision);
  }
  
  // Update decision status
  updateStatus(decisionId: string, status: BusinessDecision['status']): void {
    const decision = this.decisions.get(decisionId);
    if (!decision) return;
    
    decision.status = status;
    this.decisions.set(decisionId, decision);
  }
  
  // Get decision by ID
  getDecision(decisionId: string): BusinessDecision | undefined {
    return this.decisions.get(decisionId);
  }
  
  // Get all decisions
  getAllDecisions(): BusinessDecision[] {
    return Array.from(this.decisions.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  // Get decisions by category
  getDecisionsByCategory(category: BusinessDecision['category']): BusinessDecision[] {
    return this.getAllDecisions().filter(d => d.category === category);
  }
  
  // Get decisions by status
  getDecisionsByStatus(status: BusinessDecision['status']): BusinessDecision[] {
    return this.getAllDecisions().filter(d => d.status === status);
  }
  
  // Get recent decisions (last N days)
  getRecentDecisions(days: number = 30): BusinessDecision[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.getAllDecisions().filter(d => d.date >= cutoffDate);
  }
  
  // Get high-impact decisions
  getHighImpactDecisions(): BusinessDecision[] {
    return this.getAllDecisions().filter(d => d.impact === 'high');
  }
  
  // Get completed decisions with outcomes
  getCompletedDecisions(): BusinessDecision[] {
    return this.getAllDecisions().filter(d => d.status === 'completed' && d.actualOutcome);
  }
  
  // Get failed decisions for learning
  getFailedDecisions(): BusinessDecision[] {
    return this.getAllDecisions().filter(d => d.status === 'failed');
  }
  
  // Search decisions by keyword
  searchDecisions(keyword: string): BusinessDecision[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.getAllDecisions().filter(d => 
      d.decision.toLowerCase().includes(lowerKeyword) ||
      d.reason.toLowerCase().includes(lowerKeyword) ||
      d.expectedOutcome.toLowerCase().includes(lowerKeyword) ||
      (d.actualOutcome && d.actualOutcome.toLowerCase().includes(lowerKeyword)) ||
      (d.lessonsLearned && d.lessonsLearned.toLowerCase().includes(lowerKeyword))
    );
  }
  
  // Get similar past decisions
  getSimilarDecisions(decision: string, category?: BusinessDecision['category']): BusinessDecision[] {
    const lowerDecision = decision.toLowerCase();
    const decisions = category ? this.getDecisionsByCategory(category) : this.getAllDecisions();
    
    return decisions.filter(d => 
      d.decision.toLowerCase().includes(lowerDecision) ||
      lowerDecision.includes(d.decision.toLowerCase())
    );
  }
  
  // Analyze decision outcomes
  analyzeOutcomes(): {
    totalDecisions: number;
    completed: number;
    failed: number;
    pending: number;
    successRate: number;
    byCategory: Record<string, { total: number; completed: number; failed: number; successRate: number }>;
  } {
    const all = this.getAllDecisions();
    const completed = all.filter(d => d.status === 'completed');
    const failed = all.filter(d => d.status === 'failed');
    const pending = all.filter(d => d.status === 'pending' || d.status === 'in_progress');
    
    const byCategory: Record<string, any> = {};
    
    all.forEach(d => {
      if (!byCategory[d.category]) {
        byCategory[d.category] = { total: 0, completed: 0, failed: 0 };
      }
      byCategory[d.category].total++;
      if (d.status === 'completed') byCategory[d.category].completed++;
      if (d.status === 'failed') byCategory[d.category].failed++;
    });
    
    Object.keys(byCategory).forEach(cat => {
      const catData = byCategory[cat];
      catData.successRate = catData.total > 0 ? (catData.completed / catData.total) * 100 : 0;
    });
    
    const successRate = completed.length + failed.length > 0 
      ? (completed.length / (completed.length + failed.length)) * 100 
      : 0;
    
    return {
      totalDecisions: all.length,
      completed: completed.length,
      failed: failed.length,
      pending: pending.length,
      successRate,
      byCategory,
    };
  }
  
  // Get lessons learned from past decisions
  getLessonsLearned(category?: BusinessDecision['category']): string[] {
    const decisions = category ? this.getDecisionsByCategory(category) : this.getCompletedDecisions();
    
    return decisions
      .filter(d => d.lessonsLearned)
      .map(d => d.lessonsLearned!)
      .filter((lesson, index, self) => self.indexOf(lesson) === index);
  }
  
  // Extract decision from conversation
  extractDecisionFromMessage(message: string, context: DecisionContext): BusinessDecision | null {
    const lowerMessage = message.toLowerCase();
    
    // Price increase decision
    const priceIncreaseMatch = message.match(/increase[d]? price[s]? by (\d+)%?/i);
    if (priceIncreaseMatch) {
      return this.recordDecision({
        decision: `Increase prices by ${priceIncreaseMatch[1]}%`,
        category: 'pricing',
        reason: 'User indicated price increase',
        expectedOutcome: 'Maintain or improve margins',
        status: 'pending',
        impact: 'medium',
        confidence: 0.7,
      }, context);
    }
    
    // Supplier change decision
    const supplierChangeMatch = message.match(/(change|switch|replace) supplier/i);
    if (supplierChangeMatch) {
      return this.recordDecision({
        decision: 'Change supplier',
        category: 'supplier',
        reason: 'User indicated supplier change',
        expectedOutcome: 'Improve reliability or reduce costs',
        status: 'pending',
        impact: 'high',
        confidence: 0.6,
      }, context);
    }
    
    // Product launch decision
    const productLaunchMatch = message.match(/(launch|add|start selling) (new )?product/i);
    if (productLaunchMatch) {
      return this.recordDecision({
        decision: 'Launch new product',
        category: 'product',
        reason: 'User indicated new product launch',
        expectedOutcome: 'Increase revenue and market share',
        status: 'pending',
        impact: 'high',
        confidence: 0.7,
      }, context);
    }
    
    // Marketing campaign decision
    const marketingMatch = message.match(/(start|run|launch) (marketing )?campaign/i);
    if (marketingMatch) {
      return this.recordDecision({
        decision: 'Run marketing campaign',
        category: 'marketing',
        reason: 'User indicated marketing campaign',
        expectedOutcome: 'Increase customer acquisition and sales',
        status: 'pending',
        impact: 'medium',
        confidence: 0.6,
      }, context);
    }
    
    // Hiring decision
    const hiringMatch = message.match(/hire (new )?(staff|employee|worker)/i);
    if (hiringMatch) {
      return this.recordDecision({
        decision: 'Hire new staff',
        category: 'hiring',
        reason: 'User indicated hiring',
        expectedOutcome: 'Increase capacity and productivity',
        status: 'pending',
        impact: 'medium',
        confidence: 0.7,
      }, context);
    }
    
    return null;
  }
  
  // Format decisions for AI response
  formatForAIResponse(limit: number = 5): string {
    const recentDecisions = this.getRecentDecisions(90).slice(0, limit);
    
    if (recentDecisions.length === 0) {
      return '\n\nNo recent business decisions recorded.';
    }
    
    let response = '\n\n📋 RECENT BUSINESS DECISIONS:\n';
    
    recentDecisions.forEach(decision => {
      response += `\n• ${decision.decision} (${decision.date.toLocaleDateString()})\n`;
      response += `  Reason: ${decision.reason}\n`;
      response += `  Expected: ${decision.expectedOutcome}\n`;
      
      if (decision.actualOutcome) {
        response += `  Actual: ${decision.actualOutcome}\n`;
        if (decision.lessonsLearned) {
          response += `  Lesson: ${decision.lessonsLearned}\n`;
        }
      } else {
        response += `  Status: ${decision.status}\n`;
      }
    });
    
    const analysis = this.analyzeOutcomes();
    if (analysis.totalDecisions > 0) {
      response += `\n📊 Decision Analysis:\n`;
      response += `• Total decisions: ${analysis.totalDecisions}\n`;
      response += `• Success rate: ${analysis.successRate.toFixed(0)}%\n`;
      response += `• Completed: ${analysis.completed}, Failed: ${analysis.failed}, Pending: ${analysis.pending}\n`;
    }
    
    return response;
  }
  
  // Get decision recommendations based on history
  getRecommendationForDecision(decision: string, category: BusinessDecision['category']): {
    similarDecisions: BusinessDecision[];
    lessonsLearned: string[];
    successRate: number;
    recommendation: string;
  } {
    const similarDecisions = this.getSimilarDecisions(decision, category);
    const completedSimilar = similarDecisions.filter(d => d.status === 'completed');
    const failedSimilar = similarDecisions.filter(d => d.status === 'failed');
    
    const lessonsLearned = completedSimilar
      .filter(d => d.lessonsLearned)
      .map(d => d.lessonsLearned!);
    
    const successRate = completedSimilar.length + failedSimilar.length > 0
      ? (completedSimilar.length / (completedSimilar.length + failedSimilar.length)) * 100
      : 0;
    
    let recommendation = '';
    
    if (similarDecisions.length === 0) {
      recommendation = 'No similar past decisions found. Proceed with caution.';
    } else if (successRate >= 70) {
      recommendation = `Based on ${similarDecisions.length} similar decisions with ${successRate.toFixed(0)}% success rate, this approach has worked well in the past.`;
    } else if (successRate >= 50) {
      recommendation = `Similar decisions have had mixed results (${successRate.toFixed(0)}% success rate). Consider the lessons learned before proceeding.`;
    } else {
      recommendation = `Similar decisions have had low success rate (${successRate.toFixed(0)}%). This approach may not be optimal.`;
    }
    
    return {
      similarDecisions,
      lessonsLearned,
      successRate,
      recommendation,
    };
  }
  
  // Export decisions
  export(): string {
    return JSON.stringify(this.getAllDecisions(), null, 2);
  }
  
  // Import decisions
  import(data: string): void {
    try {
      const parsed = JSON.parse(data);
      parsed.forEach((decision: BusinessDecision) => {
        decision.date = new Date(decision.date);
        if (decision.outcomeDate) {
          decision.outcomeDate = new Date(decision.outcomeDate);
        }
        this.decisions.set(decision.id, decision);
      });
    } catch (error) {
      console.error('Failed to import decisions:', error);
    }
  }
  
  // Clear all decisions
  clear(): void {
    this.decisions.clear();
  }
  
  private generateId(): string {
    return `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instances per business
const decisionMemories: Map<string, DecisionMemory> = new Map();

export function getDecisionMemory(businessId: string): DecisionMemory {
  if (!decisionMemories.has(businessId)) {
    decisionMemories.set(businessId, new DecisionMemory(businessId));
  }
  return decisionMemories.get(businessId)!;
}

export function clearDecisionMemory(businessId: string): void {
  decisionMemories.delete(businessId);
}
