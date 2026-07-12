// MO Outcome Validation Engine - Validate Previous Recommendations
// Tracks whether previous recommendations worked and updates future confidence

export interface Recommendation {
  id: string;
  recommendation: string;
  category: string;
  date: Date;
  expectedOutcome: string;
  successCriteria: string[];
  status: 'pending' | 'in_progress' | 'validated' | 'failed';
  validationDate?: Date;
  actualOutcome?: string;
  confidence: number;
  businessId: string;
}

export interface ValidationResult {
  recommendationId: string;
  recommendation: string;
  status: 'success' | 'partial' | 'failure' | 'inconclusive';
  actualOutcome: string;
  metCriteria: string[];
  unmetCriteria: string[];
  confidenceChange: number;
  lessonsLearned: string[];
  validationDate: Date;
}

export interface ValidationContext {
  businessId: string;
  currentBusinessData: any;
  timeSinceRecommendation: number; // days
}

export class OutcomeValidationEngine {
  private recommendations: Map<string, Recommendation> = new Map();
  private validationResults: Map<string, ValidationResult> = new Map();
  
  // Record a recommendation for future validation
  recordRecommendation(
    recommendation: string,
    category: string,
    expectedOutcome: string,
    successCriteria: string[],
    context: ValidationContext
  ): Recommendation {
    const newRecommendation: Recommendation = {
      id: this.generateId(),
      recommendation,
      category,
      date: new Date(),
      expectedOutcome,
      successCriteria,
      status: 'pending',
      confidence: 0.7, // Initial confidence
      businessId: context.businessId,
    };
    
    this.recommendations.set(newRecommendation.id, newRecommendation);
    return newRecommendation;
  }
  
  // Validate a recommendation against current business data
  validateRecommendation(
    recommendationId: string,
    context: ValidationContext
  ): ValidationResult | null {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) return null;
    
    const validationResult = this.performValidation(recommendation, context);
    this.validationResults.set(validationResult.recommendationId, validationResult);
    
    // Update recommendation status
    recommendation.status = validationResult.status === 'success' ? 'validated' : 
                           validationResult.status === 'failure' ? 'failed' : 'in_progress';
    recommendation.validationDate = validationResult.validationDate;
    recommendation.actualOutcome = validationResult.actualOutcome;
    recommendation.confidence = Math.max(0, Math.min(1, 
      recommendation.confidence + validationResult.confidenceChange
    ));
    
    this.recommendations.set(recommendationId, recommendation);
    
    return validationResult;
  }
  
  // Perform validation logic
  private performValidation(
    recommendation: Recommendation,
    context: ValidationContext
  ): ValidationResult {
    const metCriteria: string[] = [];
    const unmetCriteria: string[] = [];
    const lessonsLearned: string[] = [];
    
    // Check each success criterion
    recommendation.successCriteria.forEach(criterion => {
      const result = this.checkCriterion(criterion, context);
      if (result.met) {
        metCriteria.push(criterion);
      } else {
        unmetCriteria.push(criterion);
      }
    });
    
    // Determine overall status
    let status: ValidationResult['status'];
    const successRate = metCriteria.length / recommendation.successCriteria.length;
    
    if (successRate >= 0.8) {
      status = 'success';
    } else if (successRate >= 0.5) {
      status = 'partial';
    } else if (successRate >= 0.2) {
      status = 'inconclusive';
    } else {
      status = 'failure';
    }
    
    // Calculate confidence change
    let confidenceChange = 0;
    if (status === 'success') {
      confidenceChange = 0.1;
      lessonsLearned.push('Recommendation approach validated as effective');
    } else if (status === 'failure') {
      confidenceChange = -0.15;
      lessonsLearned.push('Recommendation approach did not work; reconsider similar strategies');
    } else if (status === 'partial') {
      confidenceChange = 0.02;
      lessonsLearned.push('Recommendation partially successful; may need refinement');
    }
    
    // Generate actual outcome description
    const actualOutcome = this.generateOutcomeDescription(recommendation, metCriteria, unmetCriteria, context);
    
    return {
      recommendationId: recommendation.id,
      recommendation: recommendation.recommendation,
      status,
      actualOutcome,
      metCriteria,
      unmetCriteria,
      confidenceChange,
      lessonsLearned,
      validationDate: new Date(),
    };
  }
  
  // Check if a criterion is met
  private checkCriterion(criterion: string, context: ValidationContext): { met: boolean; reason: string } {
    const lowerCriterion = criterion.toLowerCase();
    const data = context.currentBusinessData;
    
    // Sales-related criteria
    if (lowerCriterion.includes('increase sales') || lowerCriterion.includes('sales increase')) {
      const sales = data.sales || [];
      if (sales.length < 2) return { met: false, reason: 'Insufficient sales data' };
      
      const recentSales = sales.slice(-10);
      const olderSales = sales.slice(0, -10);
      
      if (olderSales.length === 0) return { met: false, reason: 'Insufficient historical data' };
      
      const recentAvg = recentSales.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0) / recentSales.length;
      const olderAvg = olderSales.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0) / olderSales.length;
      
      const growth = ((recentAvg - olderAvg) / olderAvg) * 100;
      return { met: growth > 0, reason: `Sales growth: ${growth.toFixed(1)}%` };
    }
    
    // Expense-related criteria
    if (lowerCriterion.includes('reduce expenses') || lowerCriterion.includes('expense reduction')) {
      const expenses = data.expenses || [];
      if (expenses.length < 2) return { met: false, reason: 'Insufficient expense data' };
      
      const recentExpenses = expenses.slice(-5);
      const olderExpenses = expenses.slice(0, -5);
      
      if (olderExpenses.length === 0) return { met: false, reason: 'Insufficient historical data' };
      
      const recentAvg = recentExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) / recentExpenses.length;
      const olderAvg = olderExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) / olderExpenses.length;
      
      const reduction = ((olderAvg - recentAvg) / olderAvg) * 100;
      return { met: reduction > 0, reason: `Expense reduction: ${reduction.toFixed(1)}%` };
    }
    
    // Inventory-related criteria
    if (lowerCriterion.includes('reduce inventory') || lowerCriterion.includes('inventory reduction')) {
      const products = data.products || [];
      const totalStock = products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0);
      
      // This would need historical comparison - simplified for now
      return { met: totalStock > 0, reason: `Current stock: ${totalStock}` };
    }
    
    // Cash flow-related criteria
    if (lowerCriterion.includes('improve cash flow') || lowerCriterion.includes('cash flow improvement')) {
      const cashFlow = data.cashFlow || [];
      if (cashFlow.length < 2) return { met: false, reason: 'Insufficient cash flow data' };
      
      const recentFlow = cashFlow.slice(-5);
      const avgFlow = recentFlow.reduce((sum: number, cf: any) => 
        sum + ((cf.moneyIn || 0) - (cf.moneyOut || 0)), 0
      ) / recentFlow.length;
      
      return { met: avgFlow > 0, reason: `Average daily flow: ₦${avgFlow.toFixed(0)}` };
    }
    
    // Default: inconclusive
    return { met: false, reason: 'Unable to validate criterion automatically' };
  }
  
  // Generate outcome description
  private generateOutcomeDescription(
    recommendation: Recommendation,
    metCriteria: string[],
    unmetCriteria: string[],
    context: ValidationContext
  ): string {
    const daysPassed = context.timeSinceRecommendation;
    
    let description = `After ${daysPassed} days, `;
    
    if (metCriteria.length > 0 && unmetCriteria.length === 0) {
      description += 'all success criteria were met. ';
    } else if (metCriteria.length > unmetCriteria.length) {
      description += `most criteria (${metCriteria.length}/${recommendation.successCriteria.length}) were met. `;
    } else if (unmetCriteria.length > metCriteria.length) {
      description += `most criteria (${unmetCriteria.length}/${recommendation.successCriteria.length}) were not met. `;
    } else {
      description += 'criteria were partially met. ';
    }
    
    if (metCriteria.length > 0) {
      description += `Met: ${metCriteria.slice(0, 2).join(', ')}. `;
    }
    
    if (unmetCriteria.length > 0) {
      description += `Not met: ${unmetCriteria.slice(0, 2).join(', ')}. `;
    }
    
    return description;
  }
  
  // Get pending recommendations for validation
  getPendingRecommendations(businessId: string): Recommendation[] {
    return Array.from(this.recommendations.values())
      .filter(r => r.businessId === businessId && r.status === 'pending' || r.status === 'in_progress')
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  // Get validation results for a business
  getValidationResults(businessId: string): ValidationResult[] {
    return Array.from(this.validationResults.values())
      .filter(r => {
        const recommendation = this.recommendations.get(r.recommendationId);
        return recommendation?.businessId === businessId;
      })
      .sort((a, b) => b.validationDate.getTime() - a.validationDate.getTime());
  }
  
  // Get success rate for recommendations
  getSuccessRate(businessId: string, category?: string): {
    total: number;
    successful: number;
    failed: number;
    partial: number;
    rate: number;
  } {
    const results = this.getValidationResults(businessId);
    const filtered = category ? results.filter(r => {
      const recommendation = this.recommendations.get(r.recommendationId);
      return recommendation?.category === category;
    }) : results;
    
    const successful = filtered.filter(r => r.status === 'success').length;
    const failed = filtered.filter(r => r.status === 'failure').length;
    const partial = filtered.filter(r => r.status === 'partial').length;
    const total = filtered.length;
    
    return {
      total,
      successful,
      failed,
      partial,
      rate: total > 0 ? (successful / total) * 100 : 0,
    };
  }
  
  // Get recommendations by category
  getRecommendationsByCategory(businessId: string, category: string): Recommendation[] {
    return Array.from(this.recommendations.values())
      .filter(r => r.businessId === businessId && r.category === category)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  // Update recommendation confidence based on validation
  updateConfidenceBasedOnValidation(recommendationId: string, validation: ValidationResult): void {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) return;
    
    recommendation.confidence = Math.max(0, Math.min(1, 
      recommendation.confidence + validation.confidenceChange
    ));
    
    this.recommendations.set(recommendationId, recommendation);
  }
  
  // Get lessons learned from validations
  getLessonsLearned(businessId: string): string[] {
    const results = this.getValidationResults(businessId);
    const lessons: string[] = [];
    
    results.forEach(result => {
      lessons.push(...result.lessonsLearned);
    });
    
    // Remove duplicates
    return [...new Set(lessons)];
  }
  
  // Format validation results for AI response
  formatForAIResponse(businessId: string, limit: number = 5): string {
    const results = this.getValidationResults(businessId).slice(0, limit);
    
   if (results.length === 0) {
      return '\n\nNo recommendation validations performed yet.';
    }
    
    let response = '\n\n📊 RECOMMENDATION VALIDATIONS:\n';
    
    results.forEach(result => {
      const statusIcon = result.status === 'success' ? '✅' : 
                        result.status === 'failure' ? '❌' : 
                        result.status === 'partial' ? '⚠️' : '❓';
      
      response += `\n${statusIcon} ${result.recommendation}\n`;
      response += `  Status: ${result.status}\n`;
      response += `  Outcome: ${result.actualOutcome}\n`;
      
      if (result.lessonsLearned.length > 0) {
        response += `  Lessons: ${result.lessonsLearned.join(', ')}\n`;
      }
    });
    
    const successRate = this.getSuccessRate(businessId);
    response += `\n📈 Overall Success Rate: ${successRate.rate.toFixed(0)}% (${successRate.successful}/${successRate.total})\n`;
    
    return response;
  }
  
  // Clear all data for a business
  clearBusiness(businessId: string): void {
    Array.from(this.recommendations.entries())
      .forEach(([id, rec]) => {
        if (rec.businessId === businessId) {
          this.recommendations.delete(id);
        }
      });
    
    Array.from(this.validationResults.entries())
      .forEach(([id, result]) => {
        const recommendation = this.recommendations.get(result.recommendationId);
        if (recommendation?.businessId === businessId) {
          this.validationResults.delete(id);
        }
      });
  }
  
  private generateId(): string {
    return `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let outcomeValidationEngineInstance: OutcomeValidationEngine | null = null;

export function getOutcomeValidationEngine(): OutcomeValidationEngine {
  if (!outcomeValidationEngineInstance) {
    outcomeValidationEngineInstance = new OutcomeValidationEngine();
  }
  return outcomeValidationEngineInstance;
}
