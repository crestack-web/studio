// MO Daily Business Awareness System - Automated daily evaluation of business state
// Every day, MO should internally evaluate: What changed? What needs attention? What is improving? What is getting worse?

import { getProactiveIntelligenceEngine, MonitoringContext, BusinessInsight } from './mo-proactive-intelligence';

export interface DailyEvaluation {
  date: Date;
  businessId: string;
  whatChanged: string[];
  whatNeedsAttention: string[];
  whatIsImproving: string[];
  whatIsGettingWorse: string[];
  whatOwnerShouldKnowImmediately: string[];
  whatCanWait: string[];
  mostValuableAction: string;
  insights: BusinessInsight[];
  confidence: number;
}

export interface DailyContext {
  businessId: string;
  businessData: any;
  previousEvaluation?: DailyEvaluation;
  knowledgeGraph: any;
  goals: any[];
}

export class DailyBusinessAwarenessEngine {
  
  // Perform daily business evaluation
  async evaluateDaily(context: DailyContext): Promise<DailyEvaluation> {
    // Get proactive insights
    const monitoringContext: MonitoringContext = {
      businessId: context.businessId,
      businessData: context.businessData,
      previousInsights: context.previousEvaluation?.insights || [],
      knowledgeGraph: context.knowledgeGraph,
      timestamp: new Date(),
    };
    
    const proactiveResult = await getProactiveIntelligenceEngine().analyzeBusiness(monitoringContext);
    
    // Analyze changes
    const whatChanged = this.analyzeChanges(context, proactiveResult.insights);
    
    // Determine what needs attention
    const whatNeedsAttention = this.determineAttention(proactiveResult.insights);
    
    // Identify improvements
    const whatIsImproving = this.identifyImprovements(context, proactiveResult.insights);
    
    // Identify worsening conditions
    const whatIsGettingWorse = this.identifyWorsening(context, proactiveResult.insights);
    
    // Determine immediate notifications
    const whatOwnerShouldKnowImmediately = this.determineImmediateNotifications(proactiveResult.insights);
    
    // Determine what can wait
    const whatCanWait = this.determineWhatCanWait(proactiveResult.insights);
    
    // Determine most valuable action
    const mostValuableAction = this.determineMostValuableAction(proactiveResult.insights, context);
    
    return {
      date: new Date(),
      businessId: context.businessId,
      whatChanged,
      whatNeedsAttention,
      whatIsImproving,
      whatIsGettingWorse,
      whatOwnerShouldKnowImmediately,
      whatCanWait,
      mostValuableAction,
      insights: proactiveResult.insights,
      confidence: proactiveResult.confidence,
    };
  }
  
  // Analyze what changed since yesterday
  private analyzeChanges(context: DailyContext, insights: BusinessInsight[]): string[] {
    const changes: string[] = [];
    
    if (!context.previousEvaluation) {
      changes.push('First evaluation - establishing baseline');
      return changes;
    }
    
    // Compare with previous insights
    const previousInsightTypes = new Set(context.previousEvaluation.insights.map(i => i.type));
    const currentInsightTypes = new Set(insights.map(i => i.type));
    
    // New insight types
    currentInsightTypes.forEach(type => {
      if (!previousInsightTypes.has(type)) {
        changes.push(`New ${type} detected`);
      }
    });
    
    // Resolved insight types
    previousInsightTypes.forEach(type => {
      if (!currentInsightTypes.has(type)) {
        changes.push(`${type} resolved`);
      }
    });
    
    // Check for significant metric changes
    if (context.businessData.sales && context.previousEvaluation) {
      const currentSales = context.businessData.sales.slice(-1)[0]?.amount || 0;
      // Would need to compare with previous day's sales
    }
    
    return changes;
  }
  
  // Determine what needs attention
  private determineAttention(insights: BusinessInsight[]): string[] {
    return insights
      .filter(insight => insight.priority === 'critical' || insight.priority === 'high')
      .map(insight => insight.title);
  }
  
  // Identify improvements
  private identifyImprovements(context: DailyContext, insights: BusinessInsight[]): string[] {
    const improvements: string[] = [];
    
    // Look for achievement insights
    insights
      .filter(insight => insight.type === 'achievement')
      .forEach(insight => {
        improvements.push(insight.title);
      });
    
    // Look for resolved risks from previous evaluation
    if (context.previousEvaluation) {
      const previousRisks = new Set(
        context.previousEvaluation.insights
          .filter(i => i.type === 'risk')
          .map(i => i.title)
      );
      
      const currentRisks = new Set(
        insights.filter(i => i.type === 'risk').map(i => i.title)
      );
      
      previousRisks.forEach(risk => {
        if (!currentRisks.has(risk)) {
          improvements.push(`Risk resolved: ${risk}`);
        }
      });
    }
    
    return improvements;
  }
  
  // Identify worsening conditions
  private identifyWorsening(context: DailyContext, insights: BusinessInsight[]): string[] {
    const worsening: string[] = [];
    
    // Look for new risks
    insights
      .filter(insight => insight.type === 'risk' || insight.type === 'warning')
      .forEach(insight => {
        worsening.push(insight.title);
      });
    
    // Look for opportunities that were missed
    if (context.previousEvaluation) {
      const previousOpportunities = new Set(
        context.previousEvaluation.insights
          .filter(i => i.type === 'opportunity')
          .map(i => i.title)
      );
      
      const currentOpportunities = new Set(
        insights.filter(i => i.type === 'opportunity').map(i => i.title)
      );
      
      previousOpportunities.forEach(opportunity => {
        if (!currentOpportunities.has(opportunity)) {
          worsening.push(`Opportunity missed: ${opportunity}`);
        }
      });
    }
    
    return worsening;
  }
  
  // Determine what the owner should know immediately
  private determineImmediateNotifications(insights: BusinessInsight[]): string[] {
    return insights
      .filter(insight => insight.priority === 'critical')
      .map(insight => `${insight.title}: ${insight.description}`);
  }
  
  // Determine what can wait
  private determineWhatCanWait(insights: BusinessInsight[]): string[] {
    return insights
      .filter(insight => insight.priority === 'low' || insight.priority === 'medium')
      .map(insight => insight.title);
  }
  
  // Determine the most valuable action for today
  private determineMostValuableAction(insights: BusinessInsight[], context: DailyContext): string {
    // Prioritize critical insights
    const criticalInsights = insights.filter(i => i.priority === 'critical');
    if (criticalInsights.length > 0) {
      return `Address critical issue: ${criticalInsights[0].title}`;
    }
    
    // Then high priority insights
    const highInsights = insights.filter(i => i.priority === 'high');
    if (highInsights.length > 0) {
      return `Address high priority: ${highInsights[0].title}`;
    }
    
    // Then opportunities
    const opportunityInsights = insights.filter(i => i.type === 'opportunity');
    if (opportunityInsights.length > 0) {
      return `Pursue opportunity: ${opportunityInsights[0].title}`;
    }
    
    // Check against goals
    if (context.goals && context.goals.length > 0) {
      const activeGoal = context.goals.find(g => !g.completed);
      if (activeGoal) {
        return `Progress toward goal: ${activeGoal.title}`;
      }
    }
    
    return 'Continue monitoring business operations';
  }
  
  // Format daily evaluation for display
  formatForDisplay(evaluation: DailyEvaluation): string {
    let response = `\n\n📅 DAILY BUSINESS AWARENESS - ${evaluation.date.toLocaleDateString()}\n`;
    
    response += `\n🔄 What Changed:\n`;
    evaluation.whatChanged.forEach(change => {
      response += `• ${change}\n`;
    });
    
    if (evaluation.whatNeedsAttention.length > 0) {
      response += `\n⚠️ Needs Attention:\n`;
      evaluation.whatNeedsAttention.forEach(item => {
        response += `• ${item}\n`;
      });
    }
    
    if (evaluation.whatIsImproving.length > 0) {
      response += `\n✅ Improving:\n`;
      evaluation.whatIsImproving.forEach(item => {
        response += `• ${item}\n`;
      });
    }
    
    if (evaluation.whatIsGettingWorse.length > 0) {
      response += `\n📉 Getting Worse:\n`;
      evaluation.whatIsGettingWorse.forEach(item => {
        response += `• ${item}\n`;
      });
    }
    
    if (evaluation.whatOwnerShouldKnowImmediately.length > 0) {
      response += `\n🚨 Know Immediately:\n`;
      evaluation.whatOwnerShouldKnowImmediately.forEach(item => {
        response += `• ${item}\n`;
      });
    }
    
    if (evaluation.whatCanWait.length > 0) {
      response += `\n⏳ Can Wait:\n`;
      evaluation.whatCanWait.forEach(item => {
        response += `• ${item}\n`;
      });
    }
    
    response += `\n🎯 Most Valuable Action Today:\n`;
    response += `${evaluation.mostValuableAction}\n`;
    
    response += `\n📊 Confidence: ${(evaluation.confidence * 100).toFixed(0)}%\n`;
    
    return response;
  }
  
  // Generate summary for notification
  generateNotificationSummary(evaluation: DailyEvaluation): string {
    const parts: string[] = [];
    
    if (evaluation.whatOwnerShouldKnowImmediately.length > 0) {
      parts.push(`${evaluation.whatOwnerShouldKnowImmediately.length} critical item(s) need immediate attention`);
    }
    
    if (evaluation.whatNeedsAttention.length > 0) {
      parts.push(`${evaluation.whatNeedsAttention.length} item(s) need attention`);
    }
    
    if (evaluation.whatIsImproving.length > 0) {
      parts.push(`${evaluation.whatIsImproving.length} area(s) improving`);
    }
    
    if (evaluation.whatIsGettingWorse.length > 0) {
      parts.push(`${evaluation.whatIsGettingWorse.length} area(s) worsening`);
    }
    
    parts.push(`Most valuable action: ${evaluation.mostValuableAction}`);
    
    return parts.join('. ');
  }
}

// Singleton instance
let dailyBusinessAwarenessEngineInstance: DailyBusinessAwarenessEngine | null = null;

export function getDailyBusinessAwarenessEngine(): DailyBusinessAwarenessEngine {
  if (!dailyBusinessAwarenessEngineInstance) {
    dailyBusinessAwarenessEngineInstance = new DailyBusinessAwarenessEngine();
  }
  return dailyBusinessAwarenessEngineInstance;
}
