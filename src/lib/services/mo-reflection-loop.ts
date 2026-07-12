// MO Internal Reflection Loop - Automatic End-of-Interaction Reflection
// Executes automatic reflection after every interaction to improve future recommendations

import { getKnowledgeGraph } from './mo-knowledge-graph';
import { getPatternDetectionEngine } from './mo-pattern-detection';
import { getInsightEngine } from './mo-insight-engine';
import { getDecisionMemory } from './mo-decision-memory';
import { getConfidenceEngine } from './mo-confidence-engine';
import { getOutcomeValidationEngine } from './mo-outcome-validation';
import { getAdaptiveRecommendationEngine } from './mo-adaptive-recommendation';
import { getDataLearningEngine } from './o-data-learning';
import { getForgettingEngine } from './mo-forgetting-engine';

export interface ReflectionContext {
  businessId: string;
  userId?: string;
  conversationId: string;
  message: string;
  conversationHistory: any[];
  businessData: any;
  timestamp: Date;
}

export interface ReflectionResult {
  whatWasLearned: string[];
  whatChanged: string[];
  whatBecameMoreCertain: string[];
  whatBecameLessCertain: string[];
  newRisksIdentified: string[];
  newOpportunitiesIdentified: string[];
  shouldFutureRecommendationsChange: boolean;
  recommendedActions: string[];
  confidenceUpdates: Record<string, number>;
  reflectionSummary: string;
  reflectionTimestamp: Date;
}

export class ReflectionLoop {
  
  // Execute internal reflection after interaction
  async executeReflection(context: ReflectionContext): Promise<ReflectionResult> {
    const whatWasLearned: string[] = [];
    const whatChanged: string[] = [];
    const whatBecameMoreCertain: string[] = [];
    const whatBecameLessCertain: string[] = [];
    const newRisksIdentified: string[] = [];
    const newOpportunitiesIdentified: string[] = [];
    const recommendedActions: string[] = [];
    const confidenceUpdates: Record<string, number> = {};
    
    // 1. Extract new facts from the interaction
    const knowledgeGraph = getKnowledgeGraph(context.businessId);
    const facts = knowledgeGraph.extractFactsFromMessage(context.message);
    if (Object.keys(facts).length > 0) {
      knowledgeGraph.applyFacts(facts);
      whatWasLearned.push(...this.extractFactDescriptions(facts));
      whatChanged.push('Business knowledge graph updated');
    }
    
    // 2. Learn from business data
    const dataLearningEngine = getDataLearningEngine();
    const learningResult = dataLearningEngine.learnFromAllData(context.businessData, {
      businessId: context.businessId,
      timestamp: context.timestamp,
    });
    
    if (learningResult.knowledgeUpdated) {
      whatWasLearned.push(...learningResult.factsLearned);
      whatChanged.push('Business data analyzed and learned');
      
      // Update confidence scores
      Object.entries(learningResult.confidenceScores).forEach(([source, metrics]) => {
        confidenceUpdates[source] = metrics.overallConfidence;
        if (metrics.overallConfidence > 0.7) {
          whatBecameMoreCertain.push(`${source} data confidence increased to ${(metrics.overallConfidence * 100).toFixed(0)}%`);
        }
      });
    }
    
    // 3. Detect patterns in updated data
    const patternDetectionEngine = getPatternDetectionEngine();
    const patterns = patternDetectionEngine.analyzePatterns(context.businessData);
    
    // 4. Generate insights from patterns
    const insightEngine = getInsightEngine();
    const insights = insightEngine.generateInsights(patterns);
    
    insights.forEach(insight => {
      if (insight.type === 'risk') {
        newRisksIdentified.push(insight.observation);
      } else if (insight.type === 'opportunity') {
        newOpportunitiesIdentified.push(insight.observation);
      }
      
      if (insight.confidence > 0.7) {
        whatBecameMoreCertain.push(`${insight.category} insight: ${insight.insight}`);
      }
    });
    
    // 5. Check for decision extraction
    const decisionMemory = getDecisionMemory(context.businessId);
    const extractedDecision = decisionMemory.extractDecisionFromMessage(context.message, {
      businessId: context.businessId,
      conversationId: context.conversationId,
    });
    
    if (extractedDecision) {
      whatChanged.push(`New decision recorded: ${extractedDecision.decision}`);
      whatWasLearned.push(`Decision intent: ${extractedDecision.reason}`);
    }
    
    // 6. Validate pending recommendations if enough time has passed
    const outcomeValidationEngine = getOutcomeValidationEngine();
    const pendingRecommendations = outcomeValidationEngine.getPendingRecommendations(context.businessId);
    
    pendingRecommendations.forEach(rec => {
      const daysSince = (context.timestamp.getTime() - rec.date.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince >= 7) { // Validate after 7 days
        const validation = outcomeValidationEngine.validateRecommendation(rec.id, {
          businessId: context.businessId,
          currentBusinessData: context.businessData,
          timeSinceRecommendation: daysSince,
        });
        
        if (validation) {
          whatChanged.push(`Recommendation validated: ${rec.recommendation}`);
          if (validation.status === 'success') {
            whatBecameMoreCertain.push(`Similar recommendations validated as effective`);
          } else if (validation.status === 'failure') {
            whatBecameLessCertain.push(`Similar recommendations failed; confidence reduced`);
          }
          
          confidenceUpdates[rec.category] = rec.confidence;
        }
      }
    });
    
    // 7. Apply forgetting if needed
    const forgettingEngine = getForgettingEngine();
    const forgettingStats = forgettingEngine.getStatistics(
      knowledgeGraph.getGraph(),
      { businessId: context.businessId, currentDate: context.timestamp, preserveImportantDecisions: true }
    );
    
    if (forgettingStats.eligibleForRemoval > 0 || forgettingStats.eligibleForArchival > 0) {
      const forgettingResult = forgettingEngine.applyForgetting(knowledgeGraph.getGraph(), {
        businessId: context.businessId,
        currentDate: context.timestamp,
        preserveImportantDecisions: true,
      });
      
      whatChanged.push(`Memory cleanup: ${forgettingResult.summary}`);
    }
    
    // 8. Determine if future recommendations should change
    const shouldFutureRecommendationsChange = 
      newRisksIdentified.length > 0 ||
      newOpportunitiesIdentified.length > 0 ||
      whatBecameLessCertain.length > 0 ||
      (whatBecameMoreCertain.length > 0 && insights.some(i => i.priority === 'critical'));
    
    // 9. Generate recommended actions
    if (newRisksIdentified.length > 0) {
      recommendedActions.push(`Address identified risks: ${newRisksIdentified.slice(0, 2).join(', ')}`);
    }
    
    if (newOpportunitiesIdentified.length > 0) {
      recommendedActions.push(`Consider opportunities: ${newOpportunitiesIdentified.slice(0, 2).join(', ')}`);
    }
    
    if (whatBecameLessCertain.length > 0) {
      recommendedActions.push('Re-evaluate strategies with reduced confidence');
    }
    
    if (learningResult.insightsGenerated.length > 0) {
      const criticalInsights = learningResult.insightsGenerated.filter(i => i.priority === 'critical');
      if (criticalInsights.length > 0) {
        recommendedActions.push('Address critical insights immediately');
      }
    }
    
    // 10. Generate reflection summary
    const reflectionSummary = this.generateReflectionSummary({
      whatWasLearned,
      whatChanged,
      whatBecameMoreCertain,
      whatBecameLessCertain,
      newRisksIdentified,
      newOpportunitiesIdentified,
      shouldFutureRecommendationsChange,
    });
    
    return {
      whatWasLearned,
      whatChanged,
      whatBecameMoreCertain,
      whatBecameLessCertain,
      newRisksIdentified,
      newOpportunitiesIdentified,
      shouldFutureRecommendationsChange,
      recommendedActions,
      confidenceUpdates,
      reflectionSummary,
      reflectionTimestamp: context.timestamp,
    };
  }
  
  // Extract fact descriptions from graph changes
  private extractFactDescriptions(facts: any): string[] {
    const descriptions: string[] = [];
    
    if (facts.operations?.suppliers) {
      descriptions.push(`Supplier count updated: ${facts.operations.suppliers.length}`);
    }
    
    if (facts.operations?.products) {
      const activeProducts = facts.operations.products.filter((p: any) => p.active);
      const removedProducts = facts.operations.products.filter((p: any) => !p.active);
      if (removedProducts.length > 0) {
        descriptions.push(`Products discontinued: ${removedProducts.map((p: any) => p.name).join(', ')}`);
      }
    }
    
    if (facts.identity) {
      Object.entries(facts.identity).forEach(([key, value]) => {
        if (value) {
          descriptions.push(`Business ${key} updated`);
        }
      });
    }
    
    return descriptions;
  }
  
  // Generate reflection summary
  private generateReflectionSummary(reflection: {
    whatWasLearned: string[];
    whatChanged: string[];
    whatBecameMoreCertain: string[];
    whatBecameLessCertain: string[];
    newRisksIdentified: string[];
    newOpportunitiesIdentified: string[];
    shouldFutureRecommendationsChange: boolean;
  }): string {
    const parts: string[] = [];
    
    if (reflection.whatWasLearned.length > 0) {
      parts.push(`Learned ${reflection.whatWasLearned.length} new facts`);
    }
    
    if (reflection.whatChanged.length > 0) {
      parts.push(`${reflection.whatChanged.length} changes detected`);
    }
    
    if (reflection.newRisksIdentified.length > 0) {
      parts.push(`${reflection.newRisksIdentified.length} new risks identified`);
    }
    
    if (reflection.newOpportunitiesIdentified.length > 0) {
      parts.push(`${reflection.newOpportunitiesIdentified.length} new opportunities identified`);
    }
    
    if (reflection.shouldFutureRecommendationsChange) {
      parts.push('Future recommendations should be adjusted');
    }
    
    if (parts.length === 0) {
      return 'No significant changes detected in this interaction.';
    }
    
    return parts.join(', ') + '.';
  }
  
  // Format reflection for AI response
  formatForAIResponse(result: ReflectionResult): string {
    let response = '\n\n🤔 INTERNAL REFLECTION:\n';
    response += result.reflectionSummary + '\n';
    
    if (result.whatWasLearned.length > 0) {
      response += '\n📚 What Was Learned:\n';
      result.whatWasLearned.slice(0, 3).forEach(fact => {
        response += `• ${fact}\n`;
      });
    }
    
    if (result.newRisksIdentified.length > 0) {
      response += '\n⚠️ New Risks:\n';
      result.newRisksIdentified.slice(0, 2).forEach(risk => {
        response += `• ${risk}\n`;
      });
    }
    
    if (result.newOpportunitiesIdentified.length > 0) {
      response += '\n💡 New Opportunities:\n';
      result.newOpportunitiesIdentified.slice(0, 2).forEach(opp => {
        response += `• ${opp}\n`;
      });
    }
    
    if (result.recommendedActions.length > 0) {
      response += '\n🎯 Recommended Actions:\n';
      result.recommendedActions.forEach(action => {
        response += `• ${action}\n`;
      });
    }
    
    if (result.shouldFutureRecommendationsChange) {
      response += '\n⚡ Future recommendations will be adjusted based on these insights.\n';
    }
    
    return response;
  }
  
  // Get reflection history for a business
  getReflectionHistory(businessId: string, limit: number = 10): ReflectionResult[] {
    // This would typically be stored in a database
    // For now, return empty array as reflection is ephemeral
    return [];
  }
  
  // Schedule future reflection if needed
  scheduleFutureReflection(businessId: string, triggerCondition: string, delay: number): void {
    // This would integrate with a job scheduler
    // For now, this is a placeholder
    console.log(`Scheduled reflection for ${businessId} in ${delay}ms on condition: ${triggerCondition}`);
  }
}

// Singleton instance
let reflectionLoopInstance: ReflectionLoop | null = null;

export function getReflectionLoop(): ReflectionLoop {
  if (!reflectionLoopInstance) {
    reflectionLoopInstance = new ReflectionLoop();
  }
  return reflectionLoopInstance;
}
