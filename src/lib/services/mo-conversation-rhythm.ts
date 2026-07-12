// MO Conversation Rhythm Engine - Natural pacing and structure
// Alternates between observation, reflection, question, recommendation to create natural conversation flow

export type RhythmElement = 'observation' | 'reflection' | 'question' | 'recommendation' | 'acknowledgment' | 'challenge' | 'analysis' | 'conclusion' | 'concept' | 'example' | 'application' | 'options' | 'next_steps' | 'action_taken' | 'result' | 'next_focus' | 'evidence';

export interface RhythmPattern {
  elements: RhythmElement[];
  description: string;
  useCase: string;
}

export interface RhythmContext {
  conversationMode: string;
  emotionalState: string;
  goal: string;
  previousElements: RhythmElement[];
  responseLength: 'short' | 'medium' | 'long';
}

export interface RhythmSuggestion {
  pattern: RhythmPattern;
  explanation: string;
  confidence: number;
}

export class ConversationRhythmEngine {
  private patterns: RhythmPattern[];
  private recentPatterns: string[] = [];
  
  constructor() {
    this.patterns = this.initializePatterns();
  }
  
  // Initialize rhythm patterns
  private initializePatterns(): RhythmPattern[] {
    return [
      {
        elements: ['observation', 'reflection', 'question'],
        description: 'Observe → Reflect → Question',
        useCase: 'Discovery mode, gathering information',
      },
      {
        elements: ['question', 'observation', 'recommendation'],
        description: 'Question → Observe → Recommend',
        useCase: 'Clarification mode, direct answers',
      },
      {
        elements: ['observation', 'analysis', 'conclusion', 'recommendation'],
        description: 'Observe → Analyze → Conclude → Recommend',
        useCase: 'Reasoning mode, problem-solving',
      },
      {
        elements: ['acknowledgment', 'concept', 'example', 'application'],
        description: 'Acknowledge → Concept → Example → Apply',
        useCase: 'Teaching mode, building understanding',
      },
      {
        elements: ['observation', 'options', 'recommendation', 'next_steps'],
        description: 'Observe → Options → Recommend → Next Steps',
        useCase: 'Planning mode, decision-making',
      },
      {
        elements: ['acknowledgment', 'action_taken', 'result'],
        description: 'Acknowledge → Act → Result',
        useCase: 'Action mode, executing tasks',
      },
      {
        elements: ['acknowledgment', 'reflection', 'next_focus'],
        description: 'Acknowledge → Reflect → Next Focus',
        useCase: 'Celebration mode, recognizing success',
      },
      {
        elements: ['observation', 'challenge', 'evidence', 'recommendation'],
        description: 'Observe → Challenge → Evidence → Recommend',
        useCase: 'Challenge mode, protecting from poor decisions',
      },
      {
        elements: ['observation', 'question'],
        description: 'Observe → Question',
        useCase: 'Short responses, quick interactions',
      },
      {
        elements: ['reflection', 'recommendation'],
        description: 'Reflect → Recommend',
        useCase: 'Direct guidance, confident situations',
      },
      {
        elements: ['question', 'reflection', 'question'],
        description: 'Question → Reflect → Question',
        useCase: 'Deep exploration, understanding user needs',
      },
      {
        elements: ['observation', 'reflection', 'question', 'recommendation'],
        description: 'Observe → Reflect → Question → Recommend',
        useCase: 'Balanced response, thorough but not overwhelming',
      },
    ];
  }
  
  // Get appropriate rhythm pattern based on context
  suggestPattern(context: RhythmContext): RhythmSuggestion {
    const candidates = this.patterns.filter(pattern => 
      this.isPatternSuitable(pattern, context)
    );
    
    if (candidates.length === 0) {
      // Default to balanced pattern
      const defaultPattern = this.patterns.find(p => 
        p.description === 'Observe → Reflect → Question → Recommend'
      );
      return {
        pattern: defaultPattern || this.patterns[0],
        explanation: 'Using default balanced pattern',
        confidence: 0.5,
      };
    }
    
    // Score candidates based on context
    const scored = candidates.map(candidate => ({
      pattern: candidate,
      score: this.scorePattern(candidate, context),
    }));
    
    // Sort by score
    scored.sort((a, b) => b.score - a.score);
    
    // Check for pattern repetition
    const selected = this.avoidRepetition(scored);
    
    return {
      pattern: selected.pattern,
      explanation: this.explainSelection(selected.pattern, context),
      confidence: selected.score,
    };
  }
  
  // Check if pattern is suitable for context
  private isPatternSuitable(pattern: RhythmPattern, context: RhythmContext): boolean {
    // Filter by response length
    if (context.responseLength === 'short' && pattern.elements.length > 3) {
      return false;
    }
    
    if (context.responseLength === 'long' && pattern.elements.length < 3) {
      return false;
    }
    
    // Filter by conversation mode
    const modePatterns: Record<string, string[]> = {
      discovery: ['Observe → Reflect → Question', 'Question → Reflect → Question'],
      clarification: ['Question → Observe → Recommend', 'Observe → Question'],
      reasoning: ['Observe → Analyze → Conclude → Recommend', 'Observe → Reflect → Question → Recommend'],
      teaching: ['Acknowledge → Concept → Example → Apply'],
      planning: ['Observe → Options → Recommend → Next Steps'],
      action: ['Acknowledge → Act → Result', 'Observe → Question'],
      celebration: ['Acknowledge → Reflect → Next Focus'],
      challenge: ['Observe → Challenge → Evidence → Recommend'],
    };
    
    const suitableForMode = modePatterns[context.conversationMode] || [];
    if (suitableForMode.length > 0 && !suitableForMode.includes(pattern.description)) {
      // Allow some flexibility, but prefer mode-specific patterns
      return pattern.elements.length <= 4;
    }
    
    return true;
  }
  
  // Score pattern based on context fit
  private scorePattern(pattern: RhythmPattern, context: RhythmContext): number {
    let score = 0.5;
    
    // Bonus for mode-specific patterns
    const modePatterns: Record<string, string[]> = {
      discovery: ['Observe → Reflect → Question', 'Question → Reflect → Question'],
      clarification: ['Question → Observe → Recommend', 'Observe → Question'],
      reasoning: ['Observe → Analyze → Conclude → Recommend', 'Observe → Reflect → Question → Recommend'],
      teaching: ['Acknowledge → Concept → Example → Apply'],
      planning: ['Observe → Options → Recommend → Next Steps'],
      action: ['Acknowledge → Act → Result', 'Observe → Question'],
      celebration: ['Acknowledge → Reflect → Next Focus'],
      challenge: ['Observe → Challenge → Evidence → Recommend'],
    };
    
    const suitableForMode = modePatterns[context.conversationMode] || [];
    if (suitableForMode.includes(pattern.description)) {
      score += 0.3;
    }
    
    // Bonus for appropriate length
    if (context.responseLength === 'short' && pattern.elements.length <= 2) {
      score += 0.2;
    } else if (context.responseLength === 'medium' && pattern.elements.length === 3) {
      score += 0.2;
    } else if (context.responseLength === 'long' && pattern.elements.length >= 4) {
      score += 0.2;
    }
    
    // Penalty for emotional state mismatch
    if (context.emotionalState === 'frustrated' && pattern.elements.length > 3) {
      score -= 0.2;
    }
    
    if (context.emotionalState === 'urgent' && pattern.elements.length > 2) {
      score -= 0.2;
    }
    
    // Penalty for recent pattern repetition
    const recentCount = this.recentPatterns.filter(p => p === pattern.description).length;
    score -= recentCount * 0.1;
    
    return Math.max(0, Math.min(1, score));
  }
  
  // Avoid pattern repetition
  private avoidRepetition(scored: { pattern: RhythmPattern; score: number }[]): { pattern: RhythmPattern; score: number } {
    const topChoice = scored[0];
    const recentCount = this.recentPatterns.filter(p => p === topChoice.pattern.description).length;
    
    // If top choice was used recently, consider second choice
    if (recentCount >= 2 && scored.length > 1) {
      const secondChoice = scored[1];
      const secondRecentCount = this.recentPatterns.filter(p => p === secondChoice.pattern.description).length;
      
      if (secondRecentCount < recentCount) {
        return secondChoice;
      }
    }
    
    return topChoice;
  }
  
  // Explain pattern selection
  private explainSelection(pattern: RhythmPattern, context: RhythmContext): string {
    const reasons: string[] = [];
    
    reasons.push(`Selected for ${context.conversationMode} mode`);
    
    if (pattern.elements.length <= 2) {
      reasons.push('Short pattern for concise response');
    } else if (pattern.elements.length >= 4) {
      reasons.push('Comprehensive pattern for thorough response');
    }
    
    if (context.emotionalState === 'frustrated' || context.emotionalState === 'urgent') {
      reasons.push('Adjusted for emotional state');
    }
    
    return reasons.join('. ');
  }
  
  // Record pattern usage
  recordPatternUsage(pattern: RhythmPattern): void {
    this.recentPatterns.push(pattern.description);
    // Keep only last 5 patterns
    if (this.recentPatterns.length > 5) {
      this.recentPatterns.shift();
    }
  }
  
  // Get rhythm statistics
  getStatistics(): {
    totalPatterns: number;
    patternUsage: Record<string, number>;
    mostUsedPattern: string | null;
  } {
    const patternUsage: Record<string, number> = {};
    
    this.recentPatterns.forEach(pattern => {
      patternUsage[pattern] = (patternUsage[pattern] || 0) + 1;
    });
    
    let mostUsedPattern: string | null = null;
    let maxCount = 0;
    
    Object.entries(patternUsage).forEach(([pattern, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsedPattern = pattern;
      }
    });
    
    return {
      totalPatterns: this.recentPatterns.length,
      patternUsage,
      mostUsedPattern,
    };
  }
  
  // Reset rhythm history
  resetHistory(): void {
    this.recentPatterns = [];
  }
  
  // Format rhythm for AI response
  formatForAIResponse(suggestion: RhythmSuggestion): string {
    let response = '\n\n🎵 CONVERSATION RHYTHM:\n';
    response += `Pattern: ${suggestion.pattern.description}\n`;
    response += `Elements: ${suggestion.pattern.elements.join(' → ')}\n`;
    response += `Use Case: ${suggestion.pattern.useCase}\n`;
    response += `Explanation: ${suggestion.explanation}\n`;
    response += `Confidence: ${(suggestion.confidence * 100).toFixed(0)}%\n`;
    
    return response;
  }
  
  // Get all available patterns
  getAllPatterns(): RhythmPattern[] {
    return this.patterns;
  }
  
  // Add custom pattern
  addCustomPattern(pattern: RhythmPattern): void {
    this.patterns.push(pattern);
  }
}

// Singleton instance
let conversationRhythmEngineInstance: ConversationRhythmEngine | null = null;

export function getConversationRhythmEngine(): ConversationRhythmEngine {
  if (!conversationRhythmEngineInstance) {
    conversationRhythmEngineInstance = new ConversationRhythmEngine();
  }
  return conversationRhythmEngineInstance;
}
