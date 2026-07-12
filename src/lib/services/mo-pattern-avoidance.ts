// MO Conversation Pattern Avoidance System - Vary structure naturally
// Avoid predictable patterns like always praise → explain → recommend → question

export type ResponseStructure = 
  | 'question_first'
  | 'observation_first'
  | 'challenge_first'
  | 'analysis_first'
  | 'action_first'
  | 'acknowledgment_first'
  | 'recommendation_first'
  | 'reflection_first';

export interface PatternContext {
  conversationMode: string;
  emotionalState: string;
  goal: string;
  recentStructures: ResponseStructure[];
  totalResponses: number;
}

export interface StructureSuggestion {
  structure: ResponseStructure;
  description: string;
  reasoning: string;
  confidence: number;
}

export class ConversationPatternAvoidanceEngine {
  private structures: Record<ResponseStructure, { description: string; useCase: string }>;
  private recentPatterns: ResponseStructure[] = [];
  
  constructor() {
    this.structures = this.initializeStructures();
  }
  
  // Initialize response structures
  private initializeStructures(): Record<ResponseStructure, { description: string; useCase: string }> {
    return {
      question_first: {
        description: 'Start with a question to engage or clarify',
        useCase: 'Discovery mode, when information is needed',
      },
      observation_first: {
        description: 'Start with an observation about the situation',
        useCase: 'Reasoning mode, when analyzing data',
      },
      challenge_first: {
        description: 'Start with a respectful challenge to assumptions',
        useCase: 'Challenge mode, when protecting from poor decisions',
      },
      analysis_first: {
        description: 'Start with analysis or breakdown',
        useCase: 'Teaching mode, when building understanding',
      },
      action_first: {
        description: 'Start with the action or recommendation',
        useCase: 'Action mode, when executing tasks',
      },
      acknowledgment_first: {
        description: 'Start with acknowledgment of what user said',
        useCase: 'Celebration mode, when recognizing success',
      },
      recommendation_first: {
        description: 'Start with the primary recommendation',
        useCase: 'Planning mode, when decision is needed',
      },
      reflection_first: {
        description: 'Start with reflection on implications',
        useCase: 'Reasoning mode, when considering consequences',
      },
    };
  }
  
  // Suggest appropriate structure based on context
  suggestStructure(context: PatternContext): StructureSuggestion {
    const candidates = this.getEligibleStructures(context);
    
    // Score candidates based on context and pattern avoidance
    const scored = candidates.map(structure => ({
      structure,
      score: this.scoreStructure(structure, context),
    }));
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    
    // Select best structure avoiding repetition
    const selected = this.selectWithAvoidance(scored, context);
    
    return {
      structure: selected.structure,
      description: this.structures[selected.structure].description,
      reasoning: this.explainSelection(selected.structure, context),
      confidence: selected.score,
    };
  }
  
  // Get eligible structures for context
  private getEligibleStructures(context: PatternContext): ResponseStructure[] {
    const eligible: ResponseStructure[] = [];
    
    // Mode-specific structures
    const modeStructures: Record<string, ResponseStructure[]> = {
      discovery: ['question_first', 'observation_first', 'reflection_first'],
      clarification: ['question_first', 'observation_first'],
      reasoning: ['observation_first', 'analysis_first', 'reflection_first', 'challenge_first'],
      teaching: ['analysis_first', 'question_first', 'observation_first'],
      planning: ['recommendation_first', 'observation_first', 'analysis_first'],
      action: ['action_first', 'acknowledgment_first'],
      celebration: ['acknowledgment_first', 'reflection_first', 'observation_first'],
      challenge: ['challenge_first', 'observation_first', 'analysis_first'],
    };
    
    const modeSpecific = modeStructures[context.conversationMode] || [];
    
    // Add mode-specific structures
    modeSpecific.forEach(s => {
      if (!eligible.includes(s)) {
        eligible.push(s);
      }
    });
    
    // Add some variety with other structures
    Object.keys(this.structures).forEach(structure => {
      if (!eligible.includes(structure as ResponseStructure) && eligible.length < 5) {
        eligible.push(structure as ResponseStructure);
      }
    });
    
    return eligible;
  }
  
  // Score structure based on context fit and pattern avoidance
  private scoreStructure(structure: ResponseStructure, context: PatternContext): number {
    let score = 0.5;
    
    // Base score from context fit
    const modeStructures: Record<string, ResponseStructure[]> = {
      discovery: ['question_first', 'observation_first', 'reflection_first'],
      clarification: ['question_first', 'observation_first'],
      reasoning: ['observation_first', 'analysis_first', 'reflection_first', 'challenge_first'],
      teaching: ['analysis_first', 'question_first', 'observation_first'],
      planning: ['recommendation_first', 'observation_first', 'analysis_first'],
      action: ['action_first', 'acknowledgment_first'],
      celebration: ['acknowledgment_first', 'reflection_first', 'observation_first'],
      challenge: ['challenge_first', 'observation_first', 'analysis_first'],
    };
    
    const modeSpecific = modeStructures[context.conversationMode] || [];
    if (modeSpecific.includes(structure)) {
      score += 0.3;
    }
    
    // Emotional state adjustments
    if (context.emotionalState === 'frustrated' || context.emotionalState === 'urgent') {
      if (structure === 'action_first' || structure === 'recommendation_first') {
        score += 0.2;
      }
      if (structure === 'question_first' || structure === 'analysis_first') {
        score -= 0.1;
      }
    }
    
    if (context.emotionalState === 'confused') {
      if (structure === 'question_first' || structure === 'observation_first') {
        score += 0.2;
      }
    }
    
    if (context.emotionalState === 'celebrating') {
      if (structure === 'acknowledgment_first') {
        score += 0.3;
      }
    }
    
    // Pattern avoidance - penalize recent use
    const recentCount = context.recentStructures.filter(s => s === structure).length;
    score -= recentCount * 0.15;
    
    // Penalize if same structure used in last 2 responses
    if (context.recentStructures.length >= 2 && 
        context.recentStructures.slice(-2).includes(structure)) {
      score -= 0.2;
    }
    
    // Bonus for variety - if this structure hasn't been used recently
    const lastIndex = context.recentStructures.lastIndexOf(structure);
    if (lastIndex === -1 || lastIndex >= 4) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  // Select structure with pattern avoidance
  private selectWithAvoidance(
    scored: { structure: ResponseStructure; score: number }[],
    context: PatternContext
  ): { structure: ResponseStructure; score: number } {
    const topChoice = scored[0];
    
    // Check if top choice was recently used
    const recentCount = context.recentStructures.filter(s => s === topChoice.structure).length;
    
    if (recentCount >= 2 && scored.length > 1) {
      // Try second choice
      const secondChoice = scored[1];
      const secondRecentCount = context.recentStructures.filter(s => s === secondChoice.structure).length;
      
      if (secondRecentCount < recentCount) {
        return secondChoice;
      }
    }
    
    return topChoice;
  }
  
  // Explain structure selection
  private explainSelection(structure: ResponseStructure, context: PatternContext): string {
    const reasons: string[] = [];
    
    reasons.push(`Selected ${structure} structure`);
    reasons.push(this.structures[structure].useCase);
    
    // Check for pattern avoidance
    const recentCount = context.recentStructures.filter(s => s === structure).length;
    if (recentCount === 0) {
      reasons.push('Not recently used - adds variety');
    } else if (recentCount >= 2) {
      reasons.push('Recently used but still best fit for context');
    }
    
    // Check mode alignment
    const modeStructures: Record<string, ResponseStructure[]> = {
      discovery: ['question_first', 'observation_first', 'reflection_first'],
      clarification: ['question_first', 'observation_first'],
      reasoning: ['observation_first', 'analysis_first', 'reflection_first', 'challenge_first'],
      teaching: ['analysis_first', 'question_first', 'observation_first'],
      planning: ['recommendation_first', 'observation_first', 'analysis_first'],
      action: ['action_first', 'acknowledgment_first'],
      celebration: ['acknowledgment_first', 'reflection_first', 'observation_first'],
      challenge: ['challenge_first', 'observation_first', 'analysis_first'],
    };
    
    if (modeStructures[context.conversationMode]?.includes(structure)) {
      reasons.push('Aligns with current conversation mode');
    }
    
    return reasons.join('. ');
  }
  
  // Record structure usage
  recordStructureUsage(structure: ResponseStructure): void {
    this.recentPatterns.push(structure);
    // Keep only last 10 structures
    if (this.recentPatterns.length > 10) {
      this.recentPatterns.shift();
    }
  }
  
  // Get pattern statistics
  getStatistics(): {
    totalResponses: number;
    structureUsage: Record<ResponseStructure, number>;
    mostUsedStructure: ResponseStructure | null;
    varietyScore: number; // 0-1, higher is more varied
  } {
    const structureUsage: Record<ResponseStructure, number> = {
      question_first: 0,
      observation_first: 0,
      challenge_first: 0,
      analysis_first: 0,
      action_first: 0,
      acknowledgment_first: 0,
      recommendation_first: 0,
      reflection_first: 0,
    };
    
    this.recentPatterns.forEach(structure => {
      structureUsage[structure]++;
    });
    
    let mostUsedStructure: ResponseStructure | null = null;
    let maxCount = 0;
    
    Object.entries(structureUsage).forEach(([structure, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsedStructure = structure as ResponseStructure;
      }
    });
    
    // Calculate variety score (entropy-based)
    const total = this.recentPatterns.length;
    let varietyScore = 0;
    
    if (total > 0) {
      Object.values(structureUsage).forEach(count => {
        const probability = count / total;
        if (probability > 0) {
          varietyScore -= probability * Math.log2(probability);
        }
      });
      
      // Normalize by max entropy (log2 of number of structures)
      const maxEntropy = Math.log2(Object.keys(this.structures).length);
      varietyScore = varietyScore / maxEntropy;
    }
    
    return {
      totalResponses: this.recentPatterns.length,
      structureUsage,
      mostUsedStructure,
      varietyScore,
    };
  }
  
  // Check if patterns are becoming repetitive
  isBecomingRepetitive(threshold: number = 0.3): boolean {
    const stats = this.getStatistics();
    return stats.varietyScore < threshold;
  }
  
  // Suggest structure change if repetitive
  suggestVariety(context: PatternContext): StructureSuggestion | null {
    const stats = this.getStatistics();
    
    if (stats.varietyScore >= 0.4) {
      return null; // Good variety already
    }
    
    // Find least used structure that fits context
    const eligible =this.getEligibleStructures(context);
    const usage = stats.structureUsage;
    
    const sorted = eligible.sort((a, b) => (usage[a] || 0) - (usage[b] || 0));
    
    if (sorted.length > 0) {
      const suggested = sorted[0];
      return {
        structure: suggested,
        description: this.structures[suggested].description,
        reasoning: 'Low variety detected - suggesting underused structure',
        confidence: 0.7,
      };
    }
    
    return null;
  }
  
  // Reset pattern history
  resetHistory(): void {
    this.recentPatterns = [];
  }
  
  // Format for AI response
  formatForAIResponse(suggestion: StructureSuggestion): string {
    let response = '\n\n🔄 PATTERN AVOIDANCE:\n';
    response += `Structure: ${suggestion.structure}\n`;
    response += `Description: ${suggestion.description}\n`;
    response += `Reasoning: ${suggestion.reasoning}\n`;
    response += `Confidence: ${(suggestion.confidence * 100).toFixed(0)}%\n`;
    
    const stats = this.getStatistics();
    if (stats.totalResponses > 0) {
      response += `\nVariety Score: ${(stats.varietyScore * 100).toFixed(0)}%\n`;
      response += `Most Used: ${stats.mostUsedStructure || 'None'}\n`;
    }
    
    return response;
  }
  
  // Get all structures
  getAllStructures(): Record<ResponseStructure, { description: string; useCase: string }> {
    return this.structures;
  }
}

// Singleton instance
let conversationPatternAvoidanceEngineInstance: ConversationPatternAvoidanceEngine | null = null;

export function getConversationPatternAvoidanceEngine(): ConversationPatternAvoidanceEngine {
  if (!conversationPatternAvoidanceEngineInstance) {
    conversationPatternAvoidanceEngineInstance = new ConversationPatternAvoidanceEngine();
  }
  return conversationPatternAvoidanceEngineInstance;
}
