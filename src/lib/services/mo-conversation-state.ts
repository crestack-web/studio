// MO Conversation State Management - Manage conversation modes and transitions
// Handles automatic transitions between Discovery, Clarification, Reasoning, Teaching, Planning, Action, Celebration, Challenge modes

import { ConversationMode, ConversationGoal, EmotionalState } from './mo-conversation-director';

export type { ConversationMode, ConversationGoal, EmotionalState };

export interface ConversationState {
  currentMode: ConversationMode;
  previousMode: ConversationMode | null;
  modeHistory: ConversationMode[];
  modeStartTime: Date;
  modeDuration: number; // seconds
  transitionCount: number;
  context: {
    userIntent: string;
    emotionalState: EmotionalState;
    goal: ConversationGoal;
    confidence: number;
  };
}

export interface ModeTransition {
  from: ConversationMode;
  to: ConversationMode;
  reason: string;
  timestamp: Date;
  confidence: number;
}

export interface StateTransitionRules {
  [key: string]: {
    allowedTransitions: ConversationMode[];
    transitionConditions: string[];
  };
}

export class ConversationStateManager {
  private currentState: ConversationState | null = null;
  private transitionHistory: ModeTransition[] = [];
  private rules: StateTransitionRules;
  
  constructor() {
    this.rules = this.initializeTransitionRules();
  }
  
  // Initialize transition rules for each mode
  private initializeTransitionRules(): StateTransitionRules {
    return {
      discovery: {
        allowedTransitions: ['clarification', 'reasoning', 'teaching', 'planning', 'action'],
        transitionConditions: [
          'User provides sufficient information',
          'User asks direct question',
          'User expresses confusion',
          'User requests explanation',
        ],
      },
      clarification: {
        allowedTransitions: ['discovery', 'reasoning', 'teaching', 'planning', 'action'],
        transitionConditions: [
          'Ambiguity resolved',
          'More information needed',
          'User asks follow-up question',
          'User ready for next step',
        ],
      },
      reasoning: {
        allowedTransitions: ['discovery', 'clarification', 'teaching', 'planning', 'challenge', 'action'],
        transitionConditions: [
          'Analysis complete',
          'New information needed',
          'User requests explanation',
          'Decision ready',
          'Assumption needs challenge',
        ],
      },
      teaching: {
        allowedTransitions: ['discovery', 'reasoning', 'planning', 'action'],
        transitionConditions: [
          'Understanding confirmed',
          'User asks practical question',
          'User ready to apply',
          'User requests deeper analysis',
        ],
      },
      planning: {
        allowedTransitions: ['discovery', 'reasoning', 'action', 'challenge'],
        transitionConditions: [
          'Plan accepted',
          'More details needed',
          'Ready to execute',
          'Plan needs reconsideration',
        ],
      },
      action: {
        allowedTransitions: ['discovery', 'reasoning', 'celebration', 'planning'],
        transitionConditions: [
          'Action complete',
          'New information needed',
          'Success achieved',
          'Next action needed',
        ],
      },
      celebration: {
        allowedTransitions: ['discovery', 'reasoning', 'planning', 'action'],
        transitionConditions: [
          'Celebration complete',
          'User asks new question',
          'Ready for next steps',
          'User wants to continue',
        ],
      },
      challenge: {
        allowedTransitions: ['reasoning', 'planning', 'teaching', 'discovery'],
        transitionConditions: [
          'User accepts challenge',
          'User provides counter-evidence',
          'User requests explanation',
          'New information needed',
        ],
      },
    };
  }
  
  // Initialize conversation state
  initializeState(initialMode: ConversationMode, context: ConversationState['context']): ConversationState {
    this.currentState = {
      currentMode: initialMode,
      previousMode: null,
      modeHistory: [initialMode],
      modeStartTime: new Date(),
      modeDuration: 0,
      transitionCount: 0,
      context,
    };
    
    return this.currentState;
  }
  
  // Get current state
  getCurrentState(): ConversationState | null {
    return this.currentState;
  }
  
  // Check if transition is allowed
  isTransitionAllowed(from: ConversationMode, to: ConversationMode): boolean {
    return this.rules[from]?.allowedTransitions.includes(to) || false;
  }
  
  // Get allowed transitions for current mode
  getAllowedTransitions(mode: ConversationMode): ConversationMode[] {
    return this.rules[mode]?.allowedTransitions || [];
  }
  
  // Get transition conditions
  getTransitionConditions(from: ConversationMode, to: ConversationMode): string[] {
    const rule = this.rules[from];
    if (!rule) return [];
    
    const toIndex = rule.allowedTransitions.indexOf(to);
    if (toIndex === -1) return [];
    
    return [rule.transitionConditions[toIndex] || ''];
  }
  
  // Transition to new mode
  transitionTo(
    newMode: ConversationMode,
    reason: string,
    newContext?: Partial<ConversationState['context']>
  ): ModeTransition | null {
    if (!this.currentState) {
      return null;
    }
    
    const from = this.currentState.currentMode;
    
    // Check if transition is allowed
    if (!this.isTransitionAllowed(from, newMode)) {
      console.warn(`Transition from ${from} to ${newMode} is not allowed`);
      return null;
    }
    
    // Calculate mode duration
    const modeDuration = (Date.now() - this.currentState.modeStartTime.getTime()) / 1000;
    
    // Create transition record
    const transition: ModeTransition = {
      from,
      to: newMode,
      reason,
      timestamp: new Date(),
      confidence: this.calculateTransitionConfidence(from, newMode, reason),
    };
    
    // Update state
    this.currentState = {
      currentMode: newMode,
      previousMode: from,
      modeHistory: [...this.currentState.modeHistory, newMode],
      modeStartTime: new Date(),
      modeDuration,
      transitionCount: this.currentState.transitionCount + 1,
      context: {
        ...this.currentState.context,
        ...newContext,
      },
    };
    
    // Record transition
    this.transitionHistory.push(transition);
    
    return transition;
  }
  
  // Calculate confidence in transition
  private calculateTransitionConfidence(from: ConversationMode, to: ConversationMode, reason: string): number {
    let confidence = 0.7;
    
    // Higher confidence for natural transitions
    const naturalTransitions: Record<string, ConversationMode[]> = {
      discovery: ['clarification', 'reasoning'],
      clarification: ['reasoning', 'teaching'],
      reasoning: ['planning', 'teaching', 'challenge'],
      teaching: ['planning', 'action'],
      planning: ['action'],
      action: ['celebration', 'reasoning'],
      celebration: ['planning', 'reasoning'],
      challenge: ['reasoning', 'planning'],
    };
    
    if (naturalTransitions[from]?.includes(to)) {
      confidence += 0.15;
    }
    
    // Lower confidence for rapid transitions
    if (this.currentState && this.currentState.modeDuration < 5) {
      confidence -= 0.1;
    }
    
    // Higher confidence if reason is clear
    if (reason.length > 20) {
      confidence += 0.1;
    }
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }
  
  // Get transition history
  getTransitionHistory(): ModeTransition[] {
    return this.transitionHistory;
  }
  
  // Get mode statistics
  getModeStatistics(): {
    totalTransitions: number;
    modeUsageCount: Record<ConversationMode, number>;
    averageModeDuration: Record<ConversationMode, number>;
    mostCommonTransition: { from: ConversationMode; to: ConversationMode; count: number } | null;
  } {
    const modeUsageCount: Record<ConversationMode, number> = {
      discovery: 0,
      clarification: 0,
      reasoning: 0,
      teaching: 0,
      planning: 0,
      action: 0,
      celebration: 0,
      challenge: 0,
    };
    
    const modeDurations: Record<ConversationMode, number[]> = {
      discovery: [],
      clarification: [],
      reasoning: [],
      teaching: [],
      planning: [],
      action: [],
      celebration: [],
      challenge: [],
    };
    
    // Count mode usage from history
    this.transitionHistory.forEach(transition => {
      modeUsageCount[transition.to]++;
    });
    
    // Collect durations from current state
    if (this.currentState) {
      modeUsageCount[this.currentState.currentMode]++;
      modeDurations[this.currentState.currentMode].push(this.currentState.modeDuration);
    }
    
    // Calculate average durations
    const averageModeDuration: Record<ConversationMode, number> = {
      discovery: 0,
      clarification: 0,
      reasoning: 0,
      teaching: 0,
      planning: 0,
      action: 0,
      celebration: 0,
      challenge: 0,
    };
    Object.keys(modeDurations).forEach(mode => {
      const durations = modeDurations[mode as ConversationMode];
      if (durations.length > 0) {
        averageModeDuration[mode as ConversationMode] = 
          durations.reduce((sum, d) => sum + d, 0) / durations.length;
      }
    });
    
    // Find most common transition
    const transitionCounts: Record<string, number> = {};
    this.transitionHistory.forEach(t => {
      const key = `${t.from}→${t.to}`;
      transitionCounts[key] = (transitionCounts[key] || 0) + 1;
    });
    
    let mostCommonTransition: { from: ConversationMode; to: ConversationMode; count: number } | null = null;
    let maxCount = 0;
    
    Object.entries(transitionCounts).forEach(([key, count]) => {
      if (count > maxCount) {
        maxCount = count;
        const [from, to] = key.split('→') as [ConversationMode, ConversationMode];
        mostCommonTransition = { from, to, count };
      }
    });
    
    return {
      totalTransitions: this.transitionHistory.length,
      modeUsageCount,
      averageModeDuration,
      mostCommonTransition,
    };
  }
  
  // Check if mode has been used too frequently
  isModeOverused(mode: ConversationMode, threshold: number = 3): boolean {
    const recentTransitions = this.transitionHistory.slice(-threshold);
    const modeCount = recentTransitions.filter(t => t.to === mode).length;
    return modeCount >= threshold;
  }
  
  // Suggest alternative mode to avoid repetition
  suggestAlternativeMode(currentMode: ConversationMode): ConversationMode | null {
    const allowed = this.getAllowedTransitions(currentMode);
    const recentModes = this.transitionHistory.slice(-3).map(t => t.to);
    
    // Find allowed mode not recently used
    for (const mode of allowed) {
      if (!recentModes.includes(mode)) {
        return mode;
      }
    }
    
    return null;
  }
  
  // Reset state
  resetState(): void {
    this.currentState = null;
    this.transitionHistory = [];
  }
  
  // Export state for analysis
  exportState(): {
    currentState: ConversationState | null;
    transitionHistory: ModeTransition[];
    statistics: {
      totalTransitions: number;
      modeUsageCount: Record<ConversationMode, number>;
      averageModeDuration: Record<ConversationMode, number>;
      mostCommonTransition: { from: ConversationMode; to: ConversationMode; count: number } | null;
    };
  } {
    return {
      currentState: this.currentState,
      transitionHistory: this.transitionHistory,
      statistics: this.getModeStatistics(),
    };
  }
  
  // Format state for AI response
  formatForAIResponse(): string {
    if (!this.currentState) {
      return '\n\n🔄 CONVERSATION STATE: Not initialized\n';
    }
    
    let response = '\n\n🔄 CONVERSATION STATE:\n';
    response += `Current Mode: ${this.currentState.currentMode}\n`;
    response += `Previous Mode: ${this.currentState.previousMode || 'None'}\n`;
    response += `Mode Duration: ${this.currentState.modeDuration.toFixed(1)}s\n`;
    response += `Total Transitions: ${this.currentState.transitionCount}\n`;
    response += `Emotional State: ${this.currentState.context.emotionalState}\n`;
    response += `Current Goal: ${this.currentState.context.goal}\n`;
    
    const stats = this.getModeStatistics();
    if (stats.totalTransitions > 0) {
      response += `\nMode Usage: `;
      Object.entries(stats.modeUsageCount).forEach(([mode, count]) => {
        if (count > 0) {
          response += `${mode}(${count}) `;
        }
      });
      response += '\n';
    }
    
    return response;
  }
}

// Singleton instance
let conversationStateManagerInstance: ConversationStateManager | null = null;

export function getConversationStateManager(): ConversationStateManager {
  if (!conversationStateManagerInstance) {
    conversationStateManagerInstance = new ConversationStateManager();
  }
  return conversationStateManagerInstance;
}
