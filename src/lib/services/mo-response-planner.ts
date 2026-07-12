// MO Response Planner - Structured Response Format
// Constructs responses with Observation, Analysis, Calculation, Risk, Recommendation, Next Step

export interface ResponseSection {
  type: 'observation' | 'analysis' | 'calculation' | 'risk' | 'recommendation' | 'next_step';
  content: string;
  priority: 'high' | 'medium' | 'low';
  data?: any;
}

export interface PlannedResponse {
  sections: ResponseSection[];
  summary: string;
  tone: 'professional' | 'urgent' | 'cautious' | 'encouraging';
  estimatedLength: number;
  includesAction: boolean;
}

export interface ResponsePlanningContext {
  userMessage: string;
  intent: string;
  reasoning: any;
  calculations: any[];
  risks: any[];
  opportunities: any[];
  businessContext: any;
  suggestedAction?: string;
  busmoAction?: any;
}

export class ResponsePlanner {
  
  // Plan the response structure
  planResponse(context: ResponsePlanningContext): PlannedResponse {
    const sections: ResponseSection[] = [];
    
    // Always start with observation if relevant
    const observation = this.generateObservation(context);
    if (observation) {
      sections.push(observation);
    }
    
    // Add analysis
    const analysis = this.generateAnalysis(context);
    if (analysis) {
      sections.push(analysis);
    }
    
    // Add calculations if available
    if (context.calculations && context.calculations.length > 0) {
      const calculation = this.generateCalculation(context);
      if (calculation) {
        sections.push(calculation);
      }
    }
    
    // Add risks if critical
    const criticalRisks = context.risks?.filter((r: any) => r.severity === 'critical' || r.severity === 'high');
    if (criticalRisks && criticalRisks.length > 0) {
      const risk = this.generateRisk(context);
      if (risk) {
        sections.push(risk);
      }
    }
    
    // Add recommendation
    const recommendation = this.generateRecommendation(context);
    if (recommendation) {
      sections.push(recommendation);
    }
    
    // Add next step
    const nextStep = this.generateNextStep(context);
    if (nextStep) {
      sections.push(nextStep);
    }
    
    // Determine tone
    const tone = this.determineTone(context);
    
    // Generate summary
    const summary = this.generateSummary(sections, context);
    
    // Check if includes action
    const includesAction = !!context.busmoAction || !!context.suggestedAction;
    
    return {
      sections,
      summary,
      tone,
      estimatedLength: this.estimateLength(sections),
      includesAction,
    };
  }
  
  // Generate observation section
  private generateObservation(context: ResponsePlanningContext): ResponseSection | null {
    const { businessContext, reasoning } = context;
    
    let observation = '';
    
    // Business state observation
    if (businessContext?.stage) {
      observation += `Business at ${businessContext.stage} stage`;
      if (businessContext.industry) {
        observation += ` in ${businessContext.industry} industry`;
      }
    }
    
    // Contextual observation based on reasoning
    if (reasoning?.contextSummary) {
      if (observation) observation += '. ';
      observation += reasoning.contextSummary;
    }
    
    if (!observation) return null;
    
    return {
      type: 'observation',
      content: observation,
      priority: 'medium',
    };
  }
  
  // Generate analysis section
  private generateAnalysis(context: ResponsePlanningContext): ResponseSection | null {
    const { reasoning, intent, userMessage } = context;
    
    let analysis = '';
    
    // Intent-based analysis
    if (intent) {
      analysis += `You're looking to ${intent.replace(/_/g, ' ')}`;
    }
    
    // Add reasoning analysis
    if (reasoning?.actualGoal) {
      if (analysis) analysis += '. ';
      analysis += `The core goal is ${reasoning.actualGoal}`;
    }
    
    // Add implications
    if (reasoning?.nextNeeds && reasoning.nextNeeds.length > 0) {
      if (analysis) analysis += '. ';
      analysis += `This will require attention to: ${reasoning.nextNeeds.slice(0, 2).join(', ')}`;
    }
    
    if (!analysis) return null;
    
    return {
      type: 'analysis',
      content: analysis,
      priority: 'high',
    };
  }
  
  // Generate calculation section
  private generateCalculation(context: ResponsePlanningContext): ResponseSection | null {
    const { calculations } = context;
    
    if (!calculations || calculations.length === 0) return null;
    
    // Focus on the most important calculation
    const primaryCalc = calculations[0];
    
    let content = '';
    content += `${primaryCalc.type}: ${primaryCalc.result}`;
    
    if (primaryCalc.breakdown) {
      const keyBreakdown = Object.entries(primaryCalc.breakdown).slice(0, 2);
      content += `. Key factors: ${keyBreakdown.map(([k, v]) => `${k}=${v}`).join(', ')}`;
    }
    
    if (primaryCalc.implications && primaryCalc.implications.length > 0) {
      content += `. Implication: ${primaryCalc.implications[0]}`;
    }
    
    return {
      type: 'calculation',
      content,
      priority: 'high',
      data: primaryCalc,
    };
  }
  
  // Generate risk section
  private generateRisk(context: ResponsePlanningContext): ResponseSection | null {
    const { risks } = context;
    
    const criticalRisks = risks?.filter((r: any) => r.severity === 'critical' || r.severity === 'high');
    
    if (!criticalRisks || criticalRisks.length === 0) return null;
    
    const primaryRisk = criticalRisks[0];
    
    let content = '';
    content += `${primaryRisk.severity.toUpperCase()} risk: ${primaryRisk.description}`;
    
    if (primaryRisk.mitigation && primaryRisk.mitigation.length > 0) {
      content += `. Mitigation: ${primaryRisk.mitigation[0]}`;
    }
    
    return {
      type: 'risk',
      content,
      priority: 'high',
      data: primaryRisk,
    };
  }
  
  // Generate recommendation section
  private generateRecommendation(context: ResponsePlanningContext): ResponseSection | null {
    const { reasoning, suggestedAction, opportunities } = context;
    
    let recommendation = '';
    
    // Use reasoning recommendation if available
    if (reasoning?.recommendedAction) {
      recommendation = reasoning.recommendedAction;
    } 
    // Use suggested action if available
    else if (suggestedAction) {
      recommendation = suggestedAction;
    }
    // Use opportunity if available prioritized
    else if (opportunities && opportunities.length > 0) {
      const topOpportunity = opportunities[0];
      recommendation = topOpportunity.suggestedAction || topOpportunity.message;
    }
    
    if (!recommendation) return null;
    
    return {
      type: 'recommendation',
      content: recommendation,
      priority: 'high',
    };
  }
  
  // Generate next step section
  private generateNextStep(context: ResponsePlanningContext): ResponseSection | null {
    const { reasoning, busmoAction, businessContext } = context;
    
    let nextStep = '';
    
    // If there's a Busmo action, that's the next step
    if (busmoAction) {
      nextStep = `Execute: ${busmoAction.description}`;
      if (busmoAction.requiresConfirmation) {
        nextStep += ' (requires confirmation)';
      }
    }
    // Use reasoning next action
    else if (reasoning?.recommendedAction) {
      nextStep = reasoning.recommendedAction;
    }
    // Stage-specific next step
    else if (businessContext?.stage) {
      nextStep = this.getStageNextStep(businessContext.stage);
    }
    
    if (!nextStep) return null;
    
    return {
      type: 'next_step',
      content: nextStep,
      priority: 'high',
    };
  }
  
  // Get stage-specific next step
  private getStageNextStep(stage: string): string {
    switch (stage) {
      case 'idea':
        return 'Validate your business idea with potential customers';
      case 'startup':
        return 'Focus on generating your first sales';
      case 'growing':
        return 'Optimize operations and consider hiring';
      case 'mature':
        return 'Explore expansion opportunities';
      default:
        return 'Continue building your business';
    }
  }
  
  // Determine response tone
  private determineTone(context: ResponsePlanningContext): 'professional' | 'urgent' | 'cautious' | 'encouraging' {
    const { risks, businessContext } = context;
    
    // Check for critical risks
    const hasCriticalRisk = risks?.some((r: any) => r.severity === 'critical');
    if (hasCriticalRisk) return 'urgent';
    
    // Check for high risks
    const hasHighRisk = risks?.some((r: any) => r.severity === 'high');
    if (hasHighRisk) return 'cautious';
    
    // Check business stage
    if (businessContext?.stage === 'startup') return 'encouraging';
    
    return 'professional';
  }
  
  // Generate summary
  private generateSummary(sections: ResponseSection[], context: ResponsePlanningContext): string {
    if (sections.length === 0) return '';
    
    const observation = sections.find(s => s.type === 'observation');
    const analysis = sections.find(s => s.type === 'analysis');
    const recommendation = sections.find(s => s.type === 'recommendation');
    
    let summary = '';
    
    if (observation) {
      summary += observation.content;
    }
    
    if (analysis) {
      if (summary) summary += '. ';
      summary += analysis.content;
    }
    
    if (recommendation) {
      if (summary) summary += '. ';
      summary += `Recommended: ${recommendation.content}`;
    }
    
    return summary;
  }
  
  // Estimate response length
  private estimateLength(sections: ResponseSection[]): number {
    return sections.reduce((total, section) => total + section.content.length, 0);
  }
  
  // Format planned response for AI
  formatForAI(plannedResponse: PlannedResponse): string {
    let response = '';
    
    // Add tone indicator if not professional
    if (plannedResponse.tone !== 'professional') {
      const toneIndicator = {
        urgent: '⚠️ URGENT: ',
        cautious: '⚡ CAUTION: ',
        encouraging: '💡 NOTE: ',
      };
      response += toneIndicator[plannedResponse.tone] || '';
    }
    
    // Add sections in order
    plannedResponse.sections.forEach(section => {
      const sectionHeaders = {
        observation: '📊 Observation',
        analysis: '🔍 Analysis',
        calculation: '🧮 Calculation',
        risk: '⚠️ Risk',
        recommendation: '✅ Recommendation',
        next_step: '🎯 Next Step',
      };
      
      response += `\n${sectionHeaders[section.type]}:\n`;
      response += `${section.content}\n`;
    });
    
    return response;
  }
  
  // Format as concise response (for shorter interactions)
  formatConcise(plannedResponse: PlannedResponse): string {
    const recommendation = plannedResponse.sections.find(s => s.type === 'recommendation');
    const nextStep = plannedResponse.sections.find(s => s.type === 'next_step');
    const risk = plannedResponse.sections.find(s => s.type === 'risk');
    
    let response = '';
    
    if (risk && risk.priority === 'high') {
      response += `⚠️ ${risk.content}\n\n`;
    }
    
    if (recommendation) {
      response += recommendation.content;
    }
    
    if (nextStep) {
      if (response) response += '\n\n';
      response += `Next: ${nextStep.content}`;
    }
    
    return response;
  }
  
  // Validate response against principles
  validateResponse(plannedResponse: PlannedResponse, context: ResponsePlanningContext): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check for generic statements
    const genericPhrases = [
      'great initiative',
      'fantastic business',
      'excellent idea',
      'happy to help',
      'good luck',
    ];
    
    plannedResponse.sections.forEach(section => {
      const lowerContent = section.content.toLowerCase();
      genericPhrases.forEach(phrase => {
        if (lowerContent.includes(phrase)) {
          issues.push(`Generic phrase detected: "${phrase}"`);
        }
      });
    });
    
    // Check for repetition
    const contents = plannedResponse.sections.map(s => s.content.toLowerCase());
    const uniqueContents = new Set(contents);
    if (contents.length !== uniqueContents.size) {
      issues.push('Duplicate content detected in sections');
    }
    
    // Check if response moves business forward
    const hasRecommendation = plannedResponse.sections.some(s => s.type === 'recommendation');
    const hasNextStep = plannedResponse.sections.some(s => s.type === 'next_step');
    
    if (!hasRecommendation && !hasNextStep) {
      issues.push('Response lacks clear recommendation or next step');
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }
  
  // Apply principles to response
  applyPrinciples(plannedResponse: PlannedResponse): PlannedResponse {
    // Remove generic phrases
    const genericPhrases = [
      'great initiative',
      'fantastic business',
      'excellent idea',
      'happy to help',
      'good luck',
      'that\'s wonderful',
      'amazing',
    ];
    
    plannedResponse.sections.forEach(section => {
      let content = section.content;
      genericPhrases.forEach(phrase => {
        const regex = new RegExp(phrase, 'gi');
        content = content.replace(regex, '');
      });
      // Clean up double spaces
      content = content.replace(/\s+/g, ' ').trim();
      section.content = content;
    });
    
    // Remove empty sections
    plannedResponse.sections = plannedResponse.sections.filter(s => s.content.length > 0);
    
    // Ensure response has actionable content
    const hasActionable = plannedResponse.sections.some(
      s => s.type === 'recommendation' || s.type === 'next_step'
    );
    
    if (!hasActionable) {
      plannedResponse.sections.push({
        type: 'next_step',
        content: 'Continue with your current business activities',
        priority: 'low',
      });
    }
    
    return plannedResponse;
  }
}

// Singleton instance
let responsePlannerInstance: ResponsePlanner | null = null;

export function getResponsePlanner(): ResponsePlanner {
  if (!responsePlannerInstance) {
    responsePlannerInstance = new ResponsePlanner();
  }
  return responsePlannerInstance;
}
