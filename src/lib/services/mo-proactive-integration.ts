// MO Proactive Intelligence Integration - Integrate proactive intelligence with existing MO conversation system
// MO should proactively surface insights during conversations, not just wait for questions

import { getProactiveIntelligenceEngine, MonitoringContext, BusinessInsight } from './mo-proactive-intelligence';
import { getDailyBusinessAwarenessEngine, DailyContext, DailyEvaluation } from './mo-daily-awareness';
import { getWeeklyReviewEngine, WeeklyContext, WeeklyReview } from './mo-weekly-review';
import { getPredictiveIntelligenceEngine, PredictionContext, Prediction } from './mo-predictive-intelligence';
import { getBusinessCoachEngine, CoachingContext, CoachingRecommendation } from './mo-business-coach';
import { getConversationIntelligenceEngine, ConversationIntelligenceInput, ConversationIntelligenceOutput } from './mo-conversation-intelligence';

export interface ProactiveIntegrationContext {
  businessId: string;
  conversationId: string;
  userId?: string;
  businessData: any;
  conversationHistory: any[];
  knowledgeGraph: any;
  goals: any[];
  timestamp: Date;
}

export interface ProactiveConversationContext {
  userMessage: string;
  proactiveInsights: BusinessInsight[];
  dailyEvaluation?: DailyEvaluation;
  weeklyReview?: WeeklyReview;
  predictions: Prediction[];
  coachingRecommendations: CoachingRecommendation[];
}

export interface ProactiveResponseAdditions {
  shouldProactivelyShare: boolean;
  proactiveContent: string;
  relevantInsights: BusinessInsight[];
  relevantPredictions: Prediction[];
  relevantRecommendations: CoachingRecommendation[];
  confidence: number;
}

export class ProactiveIntelligenceIntegration {
  
  // Enhance conversation intelligence with proactive insights
  async enhanceConversation(
    conversationInput: ConversationIntelligenceInput,
    proactiveContext: ProactiveIntegrationContext
  ): Promise<ConversationIntelligenceOutput> {
    // First, get standard conversation intelligence
    const conversationOutput = await getConversationIntelligenceEngine().processMessage(conversationInput);
    
    // Then, gather proactive intelligence
    const proactiveInsights = await this.gatherProactiveInsights(proactiveContext);
    const dailyEvaluation = await this.getDailyEvaluation(proactiveContext);
    const weeklyReview = await this.getWeeklyReview(proactiveContext);
    const predictions = await this.getPredictions(proactiveContext);
    const coachingRecommendations = await this.getCoachingRecommendations(proactiveContext);
    
    // Determine if proactive content should be shared
    const proactiveAdditions = this.determineProactiveAdditions({
      userMessage: conversationInput.userMessage,
      proactiveInsights,
      dailyEvaluation,
      weeklyReview,
      predictions,
      coachingRecommendations,
    });
    
    // Add proactive content to system prompt if appropriate
    if (proactiveAdditions.shouldProactivelyShare) {
      conversationOutput.systemPromptAdditions += this.formatProactiveAdditions(proactiveAdditions);
    }
    
    return conversationOutput;
  }
  
  // Gather proactive insights
  private async gatherProactiveInsights(context: ProactiveIntegrationContext): Promise<BusinessInsight[]> {
    const monitoringContext: MonitoringContext = {
      businessId: context.businessId,
      businessData: context.businessData,
      previousInsights: [],
      knowledgeGraph: context.knowledgeGraph,
      timestamp: context.timestamp,
    };
    
    const result = await getProactiveIntelligenceEngine().analyzeBusiness(monitoringContext);
    return result.insights;
  }
  
  // Get daily evaluation
  private async getDailyEvaluation(context: ProactiveIntegrationContext): Promise<DailyEvaluation | undefined> {
    const dailyContext: DailyContext = {
      businessId: context.businessId,
      businessData: context.businessData,
      knowledgeGraph: context.knowledgeGraph,
      goals: context.goals,
    };
    
    return await getDailyBusinessAwarenessEngine().evaluateDaily(dailyContext);
  }
  
  // Get weekly review
  private async getWeeklyReview(context: ProactiveIntegrationContext): Promise<WeeklyReview | undefined> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weeklyContext: WeeklyContext = {
      businessId: context.businessId,
      weekStart,
      weekEnd,
      businessData: context.businessData,
      goals: context.goals,
    };
    
    return await getWeeklyReviewEngine().generateWeeklyReview(weeklyContext);
  }
  
  // Get predictions
  private async getPredictions(context: ProactiveIntegrationContext): Promise<Prediction[]> {
    const predictionContext: PredictionContext = {
      businessId: context.businessId,
      businessData: context.businessData,
      historicalData: context.businessData, // In production, this would be separate historical data
      knowledgeGraph: context.knowledgeGraph,
    };
    
    return await getPredictiveIntelligenceEngine().generatePredictions(predictionContext);
  }
  
  // Get coaching recommendations
  private async getCoachingRecommendations(context: ProactiveIntegrationContext): Promise<CoachingRecommendation[]> {
    const coachingContext: CoachingContext = {
      businessId: context.businessId,
      businessData: context.businessData,
      goals: context.goals,
      history: {
        dailyEvaluations: [],
        weeklyReviews: [],
        insights: [],
      },
      knowledgeGraph: context.knowledgeGraph,
      conversationHistory: context.conversationHistory,
    };
    
    return await getBusinessCoachEngine().generateRecommendations(coachingContext);
  }
  
  // Determine if proactive content should be shared
  private determineProactiveAdditions(context: ProactiveConversationContext): ProactiveResponseAdditions {
    const relevantInsights = this.filterRelevantInsights(context.proactiveInsights, context.userMessage);
    const relevantPredictions = this.filterRelevantPredictions(context.predictions, context.userMessage);
    const relevantRecommendations = this.filterRelevantRecommendations(context.coachingRecommendations, context.userMessage);
    
    // Always share critical insights
    const criticalInsights = relevantInsights.filter(i => i.priority === 'critical');
    
    // Share if there are critical items or if user is asking about business status
    const shouldProactivelyShare = 
      criticalInsights.length > 0 ||
      this.isUserAskingAboutBusiness(context.userMessage) ||
      (relevantInsights.length > 0 && this.isContextuallyRelevant(context.userMessage));
    
    const proactiveContent = this.generateProactiveContent({
      insights: relevantInsights,
      predictions: relevantPredictions,
      recommendations: relevantRecommendations,
      dailyEvaluation: context.dailyEvaluation,
    });
    
    return {
      shouldProactivelyShare,
      proactiveContent,
      relevantInsights,
      relevantPredictions,
      relevantRecommendations,
      confidence: this.calculateProactiveConfidence(relevantInsights, relevantPredictions, relevantRecommendations),
    };
  }
  
  // Filter insights relevant to user message
  private filterRelevantInsights(insights: BusinessInsight[], userMessage: string): BusinessInsight[] {
    const lowerMessage = userMessage.toLowerCase();
    
    // Always include critical and high priority insights
    const priorityInsights = insights.filter(i => i.priority === 'critical' || i.priority === 'high');
    
    // Check for topic relevance
    const topicKeywords: Record<string, string[]> = {
      sales: ['sales', 'revenue', 'sell', 'sold', 'income'],
      inventory: ['inventory', 'stock', 'product', 'item'],
      cash: ['cash', 'money', 'balance', 'flow'],
      customer: ['customer', 'client', 'payment'],
      supplier: ['supplier', 'vendor', 'delivery'],
      expense: ['expense', 'cost', 'spend'],
    };
    
    const relevantByTopic = insights.filter(insight => {
      const keywords = topicKeywords[insight.source] || [];
      return keywords.some(keyword => lowerMessage.includes(keyword));
    });
    
    // Combine and deduplicate
    const allRelevant = [...priorityInsights, ...relevantByTopic];
    const uniqueInsights = new Map(allRelevant.map(i => [i.id, i]));
    
    return Array.from(uniqueInsights.values());
  }
  
  // Filter predictions relevant to user message
  private filterRelevantPredictions(predictions: Prediction[], userMessage: string): Prediction[] {
    const lowerMessage = userMessage.toLowerCase();
    
    // High confidence predictions
    const highConfidence = predictions.filter(p => p.confidence > 0.7);
    
    // Check for topic relevance
    const topicKeywords: Record<string, string[]> = {
      inventory_shortage: ['inventory', 'stock', 'product', 'run out'],
      cash_flow_shortage: ['cash', 'money', 'balance', 'flow'],
      seasonal_demand: ['demand', 'seasonal', 'trend'],
      revenue_trend: ['sales', 'revenue', 'growth'],
      expense_trend: ['expense', 'cost', 'spending'],
    };
    
    const relevantByTopic = predictions.filter(prediction => {
      const keywords = topicKeywords[prediction.type] || [];
      return keywords.some(keyword => lowerMessage.includes(keyword));
    });
    
    // Combine and deduplicate
    const allRelevant = [...highConfidence, ...relevantByTopic];
    const uniquePredictions = new Map(allRelevant.map(p => [p.id, p]));
    
    return Array.from(uniquePredictions.values());
  }
  
  // Filter recommendations relevant to user message
  private filterRelevantRecommendations(recommendations: CoachingRecommendation[], userMessage: string): CoachingRecommendation[] {
    const lowerMessage = userMessage.toLowerCase();
    
    // High priority recommendations
    const highPriority = recommendations.filter(r => r.priority === 'high');
    
    // Check for topic relevance
    const topicKeywords: Record<string, string[]> = {
      improvement: ['improve', 'better', 'fix', 'problem'],
      achievement: ['goal', 'achieve', 'target', 'success'],
      warning: ['risk', 'warning', 'concern'],
      opportunity: ['opportunity', 'grow', 'expand'],
    };
    
    const relevantByTopic = recommendations.filter(rec => {
      const keywords = topicKeywords[rec.type] || [];
      return keywords.some(keyword => lowerMessage.includes(keyword));
    });
    
    // Combine and deduplicate
    const allRelevant = [...highPriority, ...relevantByTopic];
    const uniqueRecommendations = new Map(allRelevant.map(r => [r.id, r]));
    
    return Array.from(uniqueRecommendations.values());
  }
  
  // Check if user is asking about business status
  private isUserAskingAboutBusiness(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const businessKeywords = [
      'how is business',
      'how are things',
      'business status',
      'what\'s happening',
      'how\'s it going',
      'business doing',
      'current situation',
      'overview',
      'summary',
      'report',
    ];
    
    return businessKeywords.some(keyword => lowerMessage.includes(keyword));
  }
  
  // Check if contextually relevant to share proactively
  private isContextuallyRelevant(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // If user is asking for help or advice, proactive insights are relevant
    if (lowerMessage.includes('help') || lowerMessage.includes('advice') || lowerMessage.includes('recommend')) {
      return true;
    }
    
    // If user is asking about problems or issues
    if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('wrong')) {
      return true;
    }
    
    return false;
  }
  
  // Generate proactive content
  private generateProactiveContent(context: {
    insights: BusinessInsight[];
    predictions: Prediction[];
    recommendations: CoachingRecommendation[];
    dailyEvaluation?: DailyEvaluation;
  }): string {
    const parts: string[] = [];
    
    if (context.insights.length > 0) {
      parts.push('\n\n## PROACTIVE INSIGHTS');
      context.insights.slice(0, 3).forEach(insight => {
        parts.push(`- ${insight.title}: ${insight.description}`);
      });
    }
    
    if (context.predictions.length > 0) {
      parts.push('\n\n## PREDICTIONS');
      context.predictions.slice(0, 2).forEach(prediction => {
        parts.push(`- ${prediction.title}: ${prediction.description}`);
      });
    }
    
    if (context.recommendations.length > 0) {
      parts.push('\n\n## COACHING RECOMMENDATIONS');
      context.recommendations.slice(0, 2).forEach(rec => {
        parts.push(`- ${rec.title}: ${rec.message}`);
      });
    }
    
    if (context.dailyEvaluation && context.dailyEvaluation.whatOwnerShouldKnowImmediately.length > 0) {
      parts.push('\n\n## IMMEDIATE ATTENTION');
      context.dailyEvaluation.whatOwnerShouldKnowImmediately.forEach(item => {
        parts.push(`- ${item}`);
      });
    }
    
    return parts.join('\n');
  }
  
  // Format proactive additions for system prompt
  private formatProactiveAdditions(additions: ProactiveResponseAdditions): string {
    return `\n\n## PROACTIVE INTELLIGENCE\n${additions.proactiveContent}\n\nProactive Confidence: ${(additions.confidence * 100).toFixed(0)}%`;
  }
  
  // Calculate proactive confidence
  private calculateProactiveConfidence(
    insights: BusinessInsight[],
    predictions: Prediction[],
    recommendations: CoachingRecommendation[]
  ): number {
    const confidences = [
      ...insights.map(i => i.confidence),
      ...predictions.map(p => p.confidence),
      ...recommendations.map(() => 0.7), // Recommendations have subjective confidence
    ];
    
    if (confidences.length === 0) return 0.5;
    
    const sum = confidences.reduce((a, b) => a + b, 0);
    return sum / confidences.length;
  }
  
  // Get proactive summary for dashboard
  async getProactiveSummary(context: ProactiveIntegrationContext): Promise<{
    insights: BusinessInsight[];
    dailyEvaluation?: DailyEvaluation;
    weeklyReview?: WeeklyReview;
    predictions: Prediction[];
    coachingRecommendations: CoachingRecommendation[];
    summary: string;
    priorityActions: string[];
  }> {
    const insights = await this.gatherProactiveInsights(context);
    const dailyEvaluation = await this.getDailyEvaluation(context);
    const weeklyReview = await this.getWeeklyReview(context);
    const predictions = await this.getPredictions(context);
    const coachingRecommendations = await this.getCoachingRecommendations(context);
    
    const priorityActions = [
      ...insights.filter(i => i.priority === 'critical').map(i => i.title),
      ...(dailyEvaluation?.whatOwnerShouldKnowImmediately || []),
      ...coachingRecommendations.filter(r => r.priority === 'high').map(r => r.title),
    ];
    
    const summary = this.generateProactiveSummary({
      insights,
      dailyEvaluation,
      weeklyReview,
      predictions,
      coachingRecommendations,
      priorityActions,
    });
    
    return {
      insights,
      dailyEvaluation,
      weeklyReview,
      predictions,
      coachingRecommendations,
      summary,
      priorityActions,
    };
  }
  
  // Generate proactive summary
  private generateProactiveSummary(context: any): string {
    const parts: string[] = [];
    
    const criticalInsights = context.insights.filter((i: BusinessInsight) => i.priority === 'critical');
    if (criticalInsights.length > 0) {
      parts.push(`${criticalInsights.length} critical issue(s) require attention`);
    }
    
    if (context.predictions.length > 0) {
      parts.push(`${context.predictions.length} prediction(s) available`);
    }
    
    if (context.coachingRecommendations.length > 0) {
      parts.push(`${context.coachingRecommendations.length} coaching recommendation(s)`);
    }
    
    if (context.dailyEvaluation?.whatIsImproving?.length > 0) {
      parts.push(`${context.dailyEvaluation.whatIsImproving.length} area(s) improving`);
    }
    
    return parts.join('. ');
  }
}

// Singleton instance
let proactiveIntelligenceIntegrationInstance: ProactiveIntelligenceIntegration | null = null;

export function getProactiveIntelligenceIntegration(): ProactiveIntelligenceIntegration {
  if (!proactiveIntelligenceIntegrationInstance) {
    proactiveIntelligenceIntegrationInstance = new ProactiveIntelligenceIntegration();
  }
  return proactiveIntelligenceIntegrationInstance;
}
