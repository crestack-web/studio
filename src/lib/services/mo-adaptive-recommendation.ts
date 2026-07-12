// MO Adaptive Recommendation Engine - Personalized Recommendations Using Historical Knowledge
// Generates recommendations based on past decisions, outcomes, and business-specific patterns

import { BusinessDecision, getDecisionMemory } from './mo-decision-memory';
import { Insight } from './mo-insight-engine';
import { ValidationResult, getOutcomeValidationEngine } from './mo-outcome-validation';

export interface AdaptiveRecommendation {
  id: string;
  recommendation: string;
  category: string;
  context: string;
  historicalBasis: {
    similarDecisions: BusinessDecision[];
    validationResults: ValidationResult[];
    lessonsLearned: string[];
  };
  confidence: number;
  personalizedReasoning: string;
  expectedOutcome: string;
  riskFactors: string[];
  successProbability: number;
  createdAt: Date;
}

export interface RecommendationContext {
  businessId: string;
  currentSituation: string;
  businessStage?: string;
  industry?: string;
  currentBusinessData?: any;
}

export class AdaptiveRecommendationEngine {
  
  // Generate adaptive recommendation based on historical knowledge
  generateRecommendation(
    situation: string,
    context: RecommendationContext
  ): AdaptiveRecommendation {
    const decisionMemory = getDecisionMemory(context.businessId);
    const validationEngine = getOutcomeValidationEngine();
    
    // Find similar past decisions
    const similarDecisions = decisionMemory.getSimilarDecisions(situation);
    
    // Get validation results for similar decisions
    const validationResults = similarDecisions
      .map(d => validationEngine.getValidationResults(context.businessId)
        .find(v => v.recommendationId === d.id))
      .filter((v): v is ValidationResult => v !== undefined);
    
    // Get lessons learned
    const lessonsLearned = decisionMemory.getLessonsLearned();
    
    // Calculate confidence based on historical success
    const successRate = this.calculateSuccessRate(validationResults);
    const confidence = this.calculateConfidence(similarDecisions, validationResults, lessonsLearned);
    
    // Generate personalized reasoning
    const personalizedReasoning = this.generatePersonalizedReasoning(
      situation,
      similarDecisions,
      validationResults,
      lessonsLearned,
      context
    );
    
    // Determine category
    const category = this.determineCategory(situation);
    
    // Generate expected outcome
    const expectedOutcome = this.generateExpectedOutcome(situation, similarDecisions, validationResults);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(similarDecisions, validationResults, context);
    
    return {
      id: this.generateId(),
      recommendation: this.generateRecommendationText(situation, context),
      category,
      context: situation,
      historicalBasis: {
        similarDecisions,
        validationResults,
        lessonsLearned,
      },
      confidence,
      personalizedReasoning,
      expectedOutcome,
      riskFactors,
      successProbability: successRate,
      createdAt: new Date(),
    };
  }
  
  // Calculate success rate from validation results
  private calculateSuccessRate(validationResults: ValidationResult[]): number {
    if (validationResults.length === 0) return 0.5; // Neutral if no data
    
    const successful = validationResults.filter(v => v.status === 'success').length;
    const partial = validationResults.filter(v => v.status === 'partial').length;
    
    return ((successful + (partial * 0.5)) / validationResults.length) * 100;
  }
  
  // Calculate confidence based on historical data
  private calculateConfidence(
    decisions: BusinessDecision[],
    validations: ValidationResult[],
    lessons: string[]
  ): number {
    let confidence = 0.5; // Base confidence
    
    // More similar decisions = higher confidence
    confidence += Math.min(decisions.length * 0.1, 0.2);
    
    // More validation results = higher confidence
    confidence += Math.min(validations.length * 0.05, 0.15);
    
    // More lessons learned = higher confidence
    confidence += Math.min(lessons.length * 0.03, 0.1);
    
    // Success rate adjustment
    if (validations.length > 0) {
      const successRate = this.calculateSuccessRate(validations) / 100;
      confidence += (successRate - 0.5) * 0.2;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  // Generate personalized reasoning
  private generatePersonalizedReasoning(
    situation: string,
    decisions: BusinessDecision[],
    validations: ValidationResult[],
    lessons: string[],
    context: RecommendationContext
  ): string {
    let reasoning = '';
    
    if (decisions.length > 0) {
      const successfulDecisions = decisions.filter(d => {
        const validation = validations.find(v => v.recommendationId === d.id);
        return validation?.status === 'success';
      });
      
      if (successfulDecisions.length > 0) {
        reasoning += `Based on ${successfulDecisions.length} similar successful decisions in your business history, `;
        const lastSuccess = successfulDecisions[0];
        if (lastSuccess.actualOutcome) {
          reasoning += `the last time you took a similar approach, ${lastSuccess.actualOutcome.toLowerCase()}. `;
        }
      } else {
        reasoning += `Based on ${decisions.length} similar decisions in your history, `;
      }
    }
    
    if (validations.length > 0) {
      const successRate = this.calculateSuccessRate(validations);
      reasoning += `Similar approaches have had a ${successRate.toFixed(0)}% success rate. `;
    }
    
    if (lessons.length > 0) {
      const relevantLessons = lessons.slice(0, 2);
      reasoning += `Key lessons from your experience: ${relevantLessons.join(', ')}. `;
    }
    
    if (context.businessStage) {
      reasoning += `Given your ${context.businessStage} stage, this recommendation is tailored to your current business maturity. `;
    }
    
    if (reasoning === '') {
      reasoning = 'This recommendation is based on general business best practices for your situation.';
    }
    
    return reasoning;
  }
  
  // Determine category from situation
  private determineCategory(situation: string): string {
    const lower = situation.toLowerCase();
    
    if (lower.includes('price') || lower.includes('cost') || lower.includes('margin')) {
      return 'pricing';
    }
    if (lower.includes('supplier') || lower.includes('vendor') || lower.includes('procure')) {
      return 'supplier';
    }
    if (lower.includes('inventory') || lower.includes('stock') || lower.includes('product')) {
      return 'inventory';
    }
    if (lower.includes('customer') || lower.includes('client') || lower.includes('marketing')) {
      return 'customer';
    }
    if (lower.includes('cash') || lower.includes('money') || lower.includes('fund')) {
      return 'cash_flow';
    }
    if (lower.includes('hire') || lower.includes('staff') || lower.includes('employee')) {
      return 'hiring';
    }
    if (lower.includes('expand') || lower.includes('grow') || lower.includes('scale')) {
      return 'growth';
    }
    
    return 'general';
  }
  
  // Generate expected outcome
  private generateExpectedOutcome(
    situation: string,
    decisions: BusinessDecision[],
    validations: ValidationResult[]
  ): string {
    if (validations.length > 0) {
      const successfulValidations = validations.filter(v => v.status === 'success');
      if (successfulValidations.length > 0) {
        return `Based on past outcomes, expect results similar to your previous successful attempts.`;
      }
    }
    
    if (decisions.length > 0) {
      const lastDecision = decisions[0];
      if (lastDecision.expectedOutcome) {
        return `Similar to your previous expectation: ${lastDecision.expectedOutcome}`;
      }
    }
    
    return 'Expected to improve the current situation based on historical patterns.';
  }
  
  // Identify risk factors
  private identifyRiskFactors(
    decisions: BusinessDecision[],
    validations: ValidationResult[],
    context: RecommendationContext
  ): string[] {
    const risks: string[] = [];
    
    // Check for failed similar decisions
    const failedValidations = validations.filter(v => v.status === 'failure');
    if (failedValidations.length > 0) {
      risks.push('Similar approaches have failed in the past');
      failedValidations.slice(0, 2).forEach(v => {
        if (v.unmetCriteria.length > 0) {
          risks.push(`Previous failure: ${v.unmetCriteria[0]}`);
        }
      });
    }
    
    // Check business stage risks
    if (context.businessStage === 'startup') {
      risks.push('Limited resources may constrain execution');
    }
    
    // Check for low confidence
    if (decisions.length === 0) {
      risks.push('No historical precedent for this decision');
    }
    
    return risks;
  }
  
  // Generate recommendation text
  private generateRecommendationText(situation: string, context: RecommendationContext): string {
    const lower = situation.toLowerCase();
    
    // Price increase
    if (lower.includes('increase price')) {
      const priceMatch = situation.match(/(\d+)%/);
      const percentage = priceMatch ? priceMatch[1] : 'small';
      return `Consider a ${percentage}% price increase, as this has worked well in your business before when supplier costs rose.`;
    }
    
    // Supplier change
    if (lower.includes('change supplier') || lower.includes('switch supplier')) {
      return `Evaluate alternative suppliers, focusing on reliability and cost. Your past decisions show this can improve margins when done carefully.`;
    }
    
    // Inventory reduction
    if (lower.includes('reduce inventory')) {
      return `Reduce inventory levels for slow-moving items to free up cash. Your historical data suggests this improves cash flow without significant stockouts.`;
    }
    
    // Marketing spend
    if (lower.includes('marketing') || lower.includes('advertise')) {
      return `Increase marketing spend gradually, tracking ROI. Your past campaigns show mixed results, so start small and scale based on performance.`;
    }
    
    // Hiring
    if (lower.includes('hire')) {
      return `Consider hiring to increase capacity. Your business stage suggests this could be appropriate if revenue growth justifies the cost.`;
    }
    
    // Default
    return `Based on your business history and current situation, proceed with this approach while monitoring key metrics.`;
  }
  
  // Generate multiple recommendations for a situation
  generateRecommendations(
    situation: string,
    context: RecommendationContext,
    count: number = 3
  ): AdaptiveRecommendation[] {
    const recommendations: AdaptiveRecommendation[] = [];
    
    for (let i = 0; i < count; i++) {
      const recommendation = this.generateRecommendation(situation, context);
      
      // Vary the recommendations slightly
      if (i === 1) {
        recommendation.recommendation = this.generateAlternativeRecommendation(recommendation.recommendation, 'conservative');
        recommendation.confidence *= 0.9;
      } else if (i === 2) {
        recommendation.recommendation = this.generateAlternativeRecommendation(recommendation.recommendation, 'aggressive');
        recommendation.confidence *= 0.85;
      }
      
      recommendations.push(recommendation);
    }
    
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }
  
  // Generate alternative recommendation
  private generateAlternativeRecommendation(original: string, approach: 'conservative' | 'aggressive'): string {
    if (approach === 'conservative') {
      return original.replace(/consider/i, 'cautiously consider')
        .replace(/increase/i, 'modestly increase')
        .replace(/reduce/i, 'gradually reduce');
    } else {
      return original.replace(/consider/i, 'strongly consider')
        .replace(/increase/i, 'significantly increase')
        .replace(/reduce/i, 'aggressively reduce');
    }
  }
  
  // Get recommendation based on insights
  generateRecommendationFromInsight(insight: Insight, context: RecommendationContext): AdaptiveRecommendation {
    const decisionMemory = getDecisionMemory(context.businessId);
    const validationEngine = getOutcomeValidationEngine();
    
    const similarDecisions = decisionMemory.getDecisionsByCategory(
      insight.category as any
    );
    
    const validationResults = similarDecisions
      .map(d => validationEngine.getValidationResults(context.businessId)
        .find(v => v.recommendationId === d.id))
      .filter((v): v is ValidationResult => v !== undefined);
    
    return {
      id: this.generateId(),
      recommendation: insight.recommendation,
      category: insight.category,
      context: insight.observation,
      historicalBasis: {
        similarDecisions,
        validationResults,
        lessonsLearned: decisionMemory.getLessonsLearned(insight.category as any),
      },
      confidence: insight.confidence,
      personalizedReasoning: `${insight.explanation} ${this.generatePersonalizedReasoning(
        insight.observation,
        similarDecisions,
        validationResults,
        decisionMemory.getLessonsLearned(),
        context
      )}`,
      expectedOutcome: insight.insight,
      riskFactors: insight.type === 'risk' ? [insight.observation] : [],
      successProbability: this.calculateSuccessRate(validationResults),
      createdAt: new Date(),
    };
  }
  
  // Format recommendation for AI response
  formatForAIResponse(recommendation: AdaptiveRecommendation): string {
    let response = `\n\n🎯 ADAPTIVE RECOMMENDATION:\n`;
    response += `${recommendation.recommendation}\n\n`;
    response += `📊 Historical Basis:\n`;
    
    if (recommendation.historicalBasis.similarDecisions.length > 0) {
      response += `• ${recommendation.historicalBasis.similarDecisions.length} similar past decisions\n`;
    }
    
    if (recommendation.historicalBasis.validationResults.length > 0) {
      const successRate = this.calculateSuccessRate(recommendation.historicalBasis.validationResults);
      response += `• ${successRate.toFixed(0)}% success rate on similar approaches\n`;
    }
    
    response += `\n💭 Personalized Reasoning:\n${recommendation.personalizedReasoning}\n`;
    
    if (recommendation.riskFactors.length > 0) {
      response += `\n⚠️ Risk Factors:\n`;
      recommendation.riskFactors.forEach(risk => {
        response += `• ${risk}\n`;
      });
    }
    
    response += `\n📈 Confidence: ${(recommendation.confidence * 100).toFixed(0)}%\n`;
    response += `🎲 Success Probability: ${recommendation.successProbability.toFixed(0)}%\n`;
    
    return response;
  }
  
  private generateId(): string {
    return `adapt-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let adaptiveRecommendationEngineInstance: AdaptiveRecommendationEngine | null = null;

export function getAdaptiveRecommendationEngine(): AdaptiveRecommendationEngine {
  if (!adaptiveRecommendationEngineInstance) {
    adaptiveRecommendationEngineInstance = new AdaptiveRecommendationEngine();
  }
  return adaptiveRecommendationEngineInstance;
}
