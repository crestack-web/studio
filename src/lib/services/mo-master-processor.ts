// MO Master Processor - Integrates All Engines
// The master processing loop that orchestrates all MO engines

import { getIntentEngine, IntentClassification } from './mo-intent-engine';
import { getMemoryEngine, clearMemoryEngine } from './mo-memory-engine';
import { getBusinessProfileManager } from './mo-business-profile';
import { getCalculationEngine } from './mo-calculation-engine';
import { getReasoningEngine } from './mo-reasoning-engine';
import { getIndustryIntelligenceEngine } from './mo-industry-intelligence';
import { getRiskEngine } from './mo-risk-engine';
import { getPlanningEngine, clearPlanningEngine } from './mo-planning-engine';
import { getBusmoActionEngine } from './mo-action-engine';
import { getResponsePlanner, PlannedResponse } from './mo-response-planner';
import { getLearningEngine, clearLearningEngine } from './mo-learning-engine';
import { getPrinciplesEnforcer } from './mo-principles-enforcer';

export interface ProcessingContext {
  message: string;
  businessId: string;
  userId: string;
  conversationId: string;
  conversationHistory: any[];
  businessData: any;
  userRole?: string;
  language?: string;
  languageName?: string;
}

export interface ProcessingResult {
  intent: IntentClassification;
  reasoning: any;
  calculations: any[];
  risks: any[];
  opportunities: any[];
  plannedResponse: PlannedResponse;
  busmoAction?: any;
  nextAction?: string;
  learnedFacts: any[];
  principlesScore: number;
  finalResponse: string;
  processingTime: number;
}

export class MasterProcessor {
  private businessId: string;
  private userId: string;
  
  constructor(businessId: string, userId: string) {
    this.businessId = businessId;
    this.userId = userId;
  }
  
  // Master processing loop - executes all engines in sequence
  async process(context: ProcessingContext): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    console.log('🚀 [MO Master Processor] Starting processing loop');
    
    // Step 1: Initialize engines
    const intentEngine = getIntentEngine();
    const memoryEngine = getMemoryEngine(this.businessId, this.userId);
    const profileManager = getBusinessProfileManager();
    const calculationEngine = getCalculationEngine();
    const reasoningEngine = getReasoningEngine();
    const industryEngine = getIndustryIntelligenceEngine();
    const riskEngine = getRiskEngine();
    const planningEngine = getPlanningEngine(this.businessId);
    const actionEngine = getBusmoActionEngine();
    const responsePlanner = getResponsePlanner();
    const learningEngine = getLearningEngine(this.businessId, this.userId);
    const principlesEnforcer = getPrinciplesEnforcer();
    
    // Step 2: Retrieve relevant memory
    const relevantMemory = memoryEngine.getRelevantMemories(context.message, 10);
    console.log('🧠 [MO Master Processor] Retrieved relevant memories:', relevantMemory.length);
    
    // Step 3: Get business profile
    const businessProfile = profileManager.getProfile();
    const businessSnapshot = profileManager.getSnapshot();
    console.log('📊 [MO Master Processor] Business profile loaded');
    
    // Step 4: Classify intent
    const intent = intentEngine.classifyIntent({
      message: context.message,
      conversationHistory: context.conversationHistory,
      businessProfile,
      businessData: context.businessData,
    });
    console.log('🎯 [MO Master Processor] Intent classified:', intent.primaryIntent, 'confidence:', intent.confidence);
    
    // Step 5: Extract entities
    const extractedEntities = intentEngine.extractEntities(context.message);
    console.log('🔍 [MO Master Processor] Entities extracted:', Object.keys(extractedEntities).length);
    
    // Step 6: Run reasoning engine
    const reasoning = reasoningEngine.reason({
      message: context.message,
      businessProfile,
      businessSnapshot,
      calculations: [],
      conversationHistory: context.conversationHistory,
    });
    console.log('💭 [MO Master Processor] Reasoning completed');
    
    // Step 7: Run calculation engine
    const calculations = calculationEngine.generateInsights(context.message, {
      capital: businessProfile.openingCapital,
      expenses: businessProfile.expectedExpenses,
      revenue: businessProfile.expectedIncome,
    });
    if (calculations.length > 0) {
      console.log('🧮 [MO Master Processor] Calculations generated:', calculations.length);
    }
    
    // Step 8: Get industry intelligence
    const industryIntelligence = industryEngine.getIndustryAdvice(businessProfile.industry || 'retail');
    console.log('🏭 [MO Master Processor] Industry intelligence loaded');
    
    // Step 9: Assess risks
    const risks = riskEngine.assessRisks({
      businessProfile,
      businessData: context.businessData,
      financialData: businessSnapshot,
      operationalData: context.businessData,
    });
    if (risks.length > 0) {
      console.log('⚠️ [MO Master Processor] Risks assessed:', risks.length);
    }
    
    // Step 10: Generate proactive insights
    const proactiveInsights = this.generateProactiveInsights(context.businessData, businessProfile);
    
    // Step 11: Determine next priority action
    const planningContext = {
      businessProfile,
      businessData: context.businessData,
      currentIntent: intent.primaryIntent,
      risks,
      opportunities: proactiveInsights,
      missingInformation: reasoning.missingInformation,
    };
    const nextPriority = planningEngine.determineNextPriority(planningContext);
    console.log('📋 [MO Master Processor] Next priority determined');
    
    // Step 12: Check for Busmo actions
    const actionContext = {
      message: context.message,
      intent: intent.primaryIntent,
      businessData: context.businessData,
      businessProfile,
      extractedEntities,
    };
    const busmoAction = actionEngine.determineAction(actionContext);
    if (busmoAction) {
      console.log('🎯 [MO Master Processor] Busmo action detected:', busmoAction.type);
    }
    
    // Step 13: Plan response structure
    const responsePlanningContext = {
      userMessage: context.message,
      intent: intent.primaryIntent,
      reasoning,
      calculations,
      risks,
      opportunities: proactiveInsights,
      businessContext: businessProfile,
      suggestedAction: reasoning.recommendedAction,
      busmoAction,
    };
    let plannedResponse = responsePlanner.planResponse(responsePlanningContext);
    console.log('📝 [MO Master Processor] Response planned');
    
    // Step 14: Enforce principles
    const principlesCheck = principlesEnforcer.checkPrinciples({
      message: plannedResponse.summary,
      sections: plannedResponse.sections,
      context: businessProfile,
    });
    
    if (!principlesCheck.valid) {
      console.log('⚡ [MO Master Processor] Principles violations detected:', principlesCheck.violations.length);
      // Auto-fix violations
      plannedResponse = responsePlanner.applyPrinciples(plannedResponse);
    }
    
    // Step 15: Format final response
    let finalResponse = this.formatFinalResponse({
      intent,
      reasoning,
      calculations,
      risks,
      businessProfile,
      businessSnapshot,
      industryIntelligence,
      proactiveInsights,
      nextPriority,
      busmoAction,
      plannedResponse,
    });
    
    // Step 16: Store conversation memory
    memoryEngine.storeConversation('last_intent', intent.primaryIntent, 3600);
    memoryEngine.storeConversation('last_topic', reasoning.actualGoal, 3600);
    
    // Step 17: Extract and store learned facts
    const learningContext = {
      conversationHistory: context.conversationHistory,
      businessProfile,
      businessData: context.businessData,
      extractedEntities,
      reasoning,
      calculations,
    };
    const conversationSummary = learningEngine.learnFromConversation(learningContext, context.conversationId);
    console.log('📚 [MO Master Processor] Learning completed:', conversationSummary.factsLearned.length, 'facts');
    
    // Step 18: Update business profile with new information
    if (extractedEntities.amounts && extractedEntities.amounts.length > 0) {
      profileManager.updateFromMessage(context.message, { capital: extractedEntities.amounts[0] });
    }
    
    const processingTime = Date.now() - startTime;
    console.log('✅ [MO Master Processor] Processing completed in', processingTime, 'ms');
    
    return {
      intent,
      reasoning,
      calculations,
      risks,
      opportunities: proactiveInsights,
      plannedResponse,
      busmoAction,
      nextAction: nextPriority?.title,
      learnedFacts: conversationSummary.factsLearned,
      principlesScore: principlesCheck.score,
      finalResponse,
      processingTime,
    };
  }
  
  // Generate proactive insights (simplified version)
  private generateProactiveInsights(businessData: any, businessProfile: any): any[] {
    const insights: any[] = [];
    
    // Check for common proactive insights
    if (businessProfile?.openingCapital && businessProfile.openingCapital < 50000) {
      insights.push({
        type: 'risk',
        priority: 'high',
        category: 'Financial',
        message: 'Low capital reserves - consider building emergency fund',
      });
    }
    
    if (businessData?.products && businessData.products.length > 0 && !businessProfile?.suppliers) {
      insights.push({
        type: 'opportunity',
        priority: 'medium',
        category: 'Operations',
        message: 'Add suppliers for your products to improve inventory management',
      });
    }
    
    return insights;
  }
  
  // Format final response with all engine outputs
  private formatFinalResponse(data: any): string {
    let response = '';
    
    // Add business context if available
    if (data.businessProfile?.industry || data.businessProfile?.stage || data.businessSnapshot?.openingCapital) {
      response += '\n📊 BUSINESS CONTEXT:\n';
      if (data.businessProfile?.industry) {
        response += `• Industry: ${data.businessProfile.industry}\n`;
      }
      if (data.businessProfile?.stage) {
        response += `• Stage: ${data.businessProfile.stage}\n`;
      }
      if (data.businessSnapshot?.openingCapital) {
        response += `• Capital: ₦${data.businessSnapshot.openingCapital.toLocaleString()}\n`;
      }
    }
    
    // Add reasoning
    if (data.reasoning?.actualGoal) {
      response += '\n🔍 ANALYSIS:\n';
      response += `• Goal: ${data.reasoning.actualGoal}\n`;
      if (data.reasoning?.recommendedAction) {
        response += `• Recommended: ${data.reasoning.recommendedAction}\n`;
      }
    }
    
    // Add calculations
    if (data.calculations && data.calculations.length > 0) {
      response += '\n🧮 CALCULATIONS:\n';
      data.calculations.slice(0, 2).forEach((calc: any) => {
        response += `• ${calc.type}: ${calc.result}\n`;
      });
    }
    
    // Add risks
    const criticalRisks = data.risks?.filter((r: any) => r.severity === 'critical' || r.severity === 'high');
    if (criticalRisks && criticalRisks.length > 0) {
      response += '\n⚠️ RISKS:\n';
      criticalRisks.slice(0, 2).forEach((risk: any) => {
        response += `• [${risk.severity.toUpperCase()}] ${risk.description}\n`;
      });
    }
    
    // Add industry intelligence
    if (data.industryIntelligence?.focusAreas) {
      response += '\n🏭 INDUSTRY FOCUS:\n';
      data.industryIntelligence.focusAreas.slice(0, 2).forEach((focus: string) => {
        response += `• ${focus}\n`;
      });
    }
    
    // Add next action
    if (data.nextPriority) {
      response += '\n🎯 NEXT ACTION:\n';
      response += `• ${data.nextPriority.title}\n`;
      response += `  ${data.nextPriority.description}\n`;
    }
    
    // Add Busmo action if available
    if (data.busmoAction) {
      response += '\n🎯 BUSMO ACTION:\n';
      response += `• ${data.busmoAction.description}\n`;
      response += `  Confidence: ${(data.busmoAction.confidence * 100).toFixed(0)}%\n`;
    }
    
    return response;
  }
  
  // Get processing statistics
  getStats(): Record<string, any> {
    const memoryEngine = getMemoryEngine(this.businessId, this.userId);
    const learningEngine = getLearningEngine(this.businessId, this.userId);
    
    return {
      businessId: this.businessId,
      userId: this.userId,
      memoryStats: memoryEngine.getStats(),
      learnedFactsCount: learningEngine.getAllFacts().length,
      conversationSummariesCount: learningEngine.getRecentSummaries(100).length,
    };
  }
}

// Singleton instances per business
const masterProcessors: Map<string, MasterProcessor> = new Map();

export function getMasterProcessor(businessId: string, userId: string): MasterProcessor {
  const key = `${businessId}:${userId}`;
  if (!masterProcessors.has(key)) {
    masterProcessors.set(key, new MasterProcessor(businessId, userId));
  }
  return masterProcessors.get(key)!;
}

export function clearMasterProcessor(businessId: string, userId: string): void {
  const key = `${businessId}:${userId}`;
  masterProcessors.delete(key);
  
  // Also clear dependent engines
  clearMemoryEngine(businessId, userId);
  clearLearningEngine(businessId, userId);
  clearPlanningEngine(businessId);
}
