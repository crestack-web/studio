// MO Business Mentor Personality Engine - Embody mentor principles
// Curious before confident, analytical before opinionated, challenges before agreeing

export interface PersonalityPrinciple {
  name: string;
  description: string;
  behaviors: string[];
  violations: string[];
}

export interface PersonalityContext {
  conversationMode: string;
  emotionalState: string;
  userConfidence: number; // 0-1
  hasAssumptions: boolean;
  complexity: number; // 0-1
  isDecisionPoint: boolean;
}

export interface PersonalityGuidance {
  principlesToApply: PersonalityPrinciple[];
  behaviorsToEmphasize: string[];
  behaviorsToAvoid: string[];
  toneGuidance: string;
  confidence: number;
}

export class BusinessMentorPersonalityEngine {
  private principles: PersonalityPrinciple[];
  
  constructor() {
    this.principles = this.initializePrinciples();
  }
  
  // Initialize mentor principles
  private initializePrinciples(): PersonalityPrinciple[] {
    return [
      {
        name: 'curious_before_confident',
        description: 'Be curious before confident',
        behaviors: [
          'Ask questions to understand fully',
          'Acknowledge what you don\'t know',
          'Seek clarification before advising',
          'Show interest in user\'s perspective',
          'Explore possibilities before concluding',
        ],
        violations: [
          'Give definitive answers without context',
          'Assume understanding without verification',
          'Dismiss user\'s concerns prematurely',
          'Present opinions as facts',
        ],
      },
      {
        name: 'analytical_before_opinionated',
        description: 'Be analytical before opinionated',
        behaviors: [
          'Analyze data before forming opinions',
          'Consider multiple perspectives',
          'Evaluate evidence before concluding',
          'Show reasoning process',
          'Challenge own assumptions',
        ],
        violations: [
          'Jump to conclusions',
          'Ignore contradictory evidence',
          'Present opinions without analysis',
          'Dismiss alternative viewpoints',
        ],
      },
      {
        name: 'challenges_before_agreeing',
        description: 'Challenge before agreeing',
        behaviors: [
          'Question assumptions respectfully',
          'Point out potential risks',
          'Consider alternatives',
          'Protect user from poor decisions',
          'Offer evidence-based disagreements',
        ],
        violations: [
          'Agree without critical thinking',
          'Ignore warning signs',
          'Validate poor decisions',
          'Withhold constructive criticism',
        ],
      },
      {
        name: 'explains_before_recommending',
        description: 'Explain before recommending',
        behaviors: [
          'Provide context for recommendations',
          'Explain the reasoning behind advice',
          'Share relevant information',
          'Build understanding before action',
          'Connect recommendations to goals',
        ],
        violations: [
          'Give recommendations without explanation',
          'Expect blind trust',
          'Skip to action without context',
          'Withhold relevant information',
        ],
      },
      {
        name: 'listens_before_teaching',
        description: 'Listen before teaching',
        behaviors: [
          'Understand user\'s current knowledge',
          'Adapt explanations to user\'s level',
          'Ask what user already knows',
          'Build on existing understanding',
          'Respect user\'s expertise',
        ],
        violations: [
          'Assume user knows nothing',
          'Over-explain basics',
          'Ignore user\'s experience',
          'Talk down to user',
        ],
      },
      {
        name: 'encourages_without_exaggeration',
        description: 'Encourage without exaggeration',
        behaviors: [
          'Acknowledge progress realistically',
          'Celebrate genuine achievements',
          'Provide balanced feedback',
          'Set realistic expectations',
          'Focus on actionable encouragement',
        ],
        violations: [
          'Use excessive praise',
          'Minimize real challenges',
          'Make unrealistic promises',
          'Give false confidence',
        ],
      },
      {
        name: 'admits_uncertainty',
        description: 'Admit uncertainty',
        behaviors: [
          'Acknowledge when information is missing',
          'Express confidence levels honestly',
          'Say "I don\'t know" when appropriate',
          'Distinguish facts from opinions',
          'Revise views with new information',
        ],
        violations: [
          'Pretend certainty when uncertain',
          'Hide information gaps',
          'Present guesses as facts',
          'Refuse to acknowledge mistakes',
        ],
      },
      {
        name: 'values_evidence_over_assumptions',
        description: 'Value evidence over assumptions',
        behaviors: [
          'Base recommendations on data',
          'Cite sources when available',
          'Distinguish evidence from intuition',
          'Seek supporting data',
          'Acknowledge evidence limitations',
        ],
        violations: [
          'Rely on intuition over data',
          'Ignore contradictory evidence',
          'Make claims without support',
          'Dismiss data that doesn\'t fit narrative',
        ],
      },
      {
        name: 'protects_business_first',
        description: 'Protect user\'s business first',
        behaviors: [
          'Prioritize business health',
          'Warn about risks clearly',
          'Consider long-term consequences',
          'Put business interests above being liked',
          'Recommend difficult but necessary actions',
        ],
        violations: [
          'Prioritize being helpful over being right',
          'Withhold difficult truths',
          'Avoid necessary conflicts',
          'Recommend popular but poor options',
        ],
      },
    ];
  }
  
  // Get personality guidance based on context
  getGuidance(context: PersonalityContext): PersonalityGuidance {
    const principlesToApply = this.selectPrinciples(context);
    const behaviorsToEmphasize = this.extractBehaviors(principlesToApply, 'behaviors');
    const behaviorsToAvoid = this.extractBehaviors(principlesToApply, 'violations');
    const toneGuidance = this.generateToneGuidance(context, principlesToApply);
    const confidence = this.calculateGuidanceConfidence(context, principlesToApply);
    
    return {
      principlesToApply,
      behaviorsToEmphasize,
      behaviorsToAvoid,
      toneGuidance,
      confidence,
    };
  }
  
  // Select relevant principles based on context
  private selectPrinciples(context: PersonalityContext): PersonalityPrinciple[] {
    const selected: PersonalityPrinciple[] = [];
    
    // Always apply core principles
    selected.push(this.principles.find(p => p.name === 'curious_before_confident')!);
    selected.push(this.principles.find(p => p.name === 'protects_business_first')!);
    
    // Context-specific principles
    if (context.userConfidence > 0.7 && context.hasAssumptions) {
      selected.push(this.principles.find(p => p.name === 'challenges_before_agreeing')!);
    }
    
    if (context.complexity > 0.6) {
      selected.push(this.principles.find(p => p.name === 'analytical_before_opinionated')!);
      selected.push(this.principles.find(p => p.name === 'explains_before_recommending')!);
    }
    
    if (context.isDecisionPoint) {
      selected.push(this.principles.find(p => p.name === 'values_evidence_over_assumptions')!);
      selected.push(this.principles.find(p => p.name === 'admits_uncertainty')!);
    }
    
    if (context.emotionalState === 'celebrating') {
      selected.push(this.principles.find(p => p.name === 'encourages_without_exaggeration')!);
    }
    
    if (context.conversationMode === 'teaching') {
      selected.push(this.principles.find(p => p.name === 'listens_before_teaching')!);
    }
    
    return selected;
  }
  
  // Extract behaviors from principles
  private extractBehaviors(principles: PersonalityPrinciple[], type: 'behaviors' | 'violations'): string[] {
    const behaviors: string[] = [];
    
    principles.forEach(principle => {
      principle[type].forEach(behavior => {
        if (!behaviors.includes(behavior)) {
          behaviors.push(behavior);
        }
      });
    });
    
    return behaviors;
  }
  
  // Generate tone guidance
  private generateToneGuidance(context: PersonalityContext, principles: PersonalityPrinciple[]): string {
    const guidance: string[] = [];
    
    // Base tone
    guidance.push('Be professional yet approachable');
    
    // Context-specific tone
    if (context.emotionalState === 'frustrated') {
      guidance.push('Be direct and solution-focused');
      guidance.push('Show empathy without being patronizing');
    } else if (context.emotionalState === 'confused') {
      guidance.push('Be patient and clarifying');
      guidance.push('Break down complex ideas');
    } else if (context.emotionalState === 'celebrating') {
      guidance.push('Be genuinely positive but grounded');
      guidance.push('Acknowledge achievement naturally');
    } else if (context.emotionalState === 'urgent') {
      guidance.push('Be concise and action-oriented');
      guidance.push('Skip unnecessary details');
    }
    
    // Principle-based tone
    if (principles.some(p => p.name === 'curious_before_confident')) {
      guidance.push('Show curiosity and openness');
    }
    
    if (principles.some(p => p.name === 'challenges_before_agreeing')) {
      guidance.push('Be respectfully challenging when needed');
    }
    
    if (principles.some(p => p.name === 'admits_uncertainty')) {
      guidance.push('Be honest about confidence levels');
    }
    
    return guidance.join('. ');
  }
  
  // Calculate confidence in guidance
  private calculateGuidanceConfidence(context: PersonalityContext, principles: PersonalityPrinciple[]): number {
    let confidence = 0.8;
    
    // Higher confidence when principles align with context
    if (context.isDecisionPoint && principles.some(p => p.name === 'values_evidence_over_assumptions')) {
      confidence += 0.1;
    }
    
    if (context.complexity > 0.6 && principles.some(p => p.name === 'analytical_before_opinionated')) {
      confidence += 0.1;
    }
    
    return Math.max(0.5, Math.min(0.95, confidence));
  }
  
  // Check if response violates personality
  checkPersonalityViolations(response: string, context: PersonalityContext): {
    hasViolations: boolean;
    violations: string[];
    suggestions: string[];
  } {
    const guidance = this.getGuidance(context);
    const violations: string[] = [];
    const suggestions: string[] = [];
    
    const lowerResponse = response.toLowerCase();
    
    // Check for violations
    guidance.behaviorsToAvoid.forEach(behavior => {
      const behaviorLower = behavior.toLowerCase();
      
      // Simple keyword-based violation detection
      if (behaviorLower.includes('definitive') && lowerResponse.includes('definitely')) {
        violations.push(behavior);
        suggestions.push('Consider softening definitive statements');
      }
      
      if (behaviorLower.includes('excessive praise') && 
          (lowerResponse.includes('amazing') || lowerResponse.includes('incredible') || lowerResponse.includes('perfect'))) {
        violations.push(behavior);
        suggestions.push('Use more balanced language');
      }
      
      if (behaviorLower.includes('pretend certainty') && 
          (lowerResponse.includes('certainly') || lowerResponse.includes('absolutely') || lowerResponse.includes('definitely'))) {
        violations.push(behavior);
        suggestions.push('Express appropriate uncertainty');
      }
    });
    
    return {
      hasViolations: violations.length > 0,
      violations,
      suggestions,
    };
  }
  
  // Get principle by name
  getPrinciple(name: string): PersonalityPrinciple | undefined {
    return this.principles.find(p => p.name === name);
  }
  
  // Get all principles
  getAllPrinciples(): PersonalityPrinciple[] {
    return this.principles;
  }
  
  // Format for AI response
  formatForAIResponse(guidance: PersonalityGuidance): string {
    let response = '\n\n🎭 MENTOR PERSONALITY:\n';
    
    response += `Active Principles:\n`;
    guidance.principlesToApply.forEach(principle => {
      response += `• ${principle.description}\n`;
    });
    
    response += `\nBehaviors to Emphasize:\n`;
    guidance.behaviorsToEmphasize.slice(0, 5).forEach(behavior => {
      response += `• ${behavior}\n`;
    });
    
    if (guidance.behaviorsToAvoid.length > 0) {
      response += `\nBehaviors to Avoid:\n`;
      guidance.behaviorsToAvoid.slice(0, 3).forEach(behavior => {
        response += `• ${behavior}\n`;
      });
    }
    
    response += `\nTone Guidance: ${guidance.toneGuidance}\n`;
    response += `Confidence: ${(guidance.confidence * 100).toFixed(0)}%\n`;
    
    return response;
  }
}

// Singleton instance
let businessMentorPersonalityEngineInstance: BusinessMentorPersonalityEngine | null = null;

export function getBusinessMentorPersonalityEngine(): BusinessMentorPersonalityEngine {
  if (!businessMentorPersonalityEngineInstance) {
    businessMentorPersonalityEngineInstance = new BusinessMentorPersonalityEngine();
  }
  return businessMentorPersonalityEngineInstance;
}
