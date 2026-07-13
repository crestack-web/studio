// MO Conversation Intelligence Engine - Master Integration
// Orchestrates all conversation intelligence components for natural, adaptive, mentor-like conversations

import { getConversationDirector, DirectorDecision, ConversationContext, ConversationMode } from './mo-conversation-director';
import { getConversationStateManager } from './mo-conversation-state';
import { getConversationRhythmEngine, RhythmContext, RhythmSuggestion } from './mo-conversation-rhythm';
import { getThinkingOutLoudEngine, ThinkingContext, ThoughtExpression } from './mo-thinking-out-loud';
import { getIntelligentUncertaintyEngine, UncertaintyContext, StatementClassification } from './mo-intelligent-uncertainty';
import { getDynamicResponseLengthEngine, LengthContext, LengthDecision } from './mo-dynamic-response-length';
import { getConversationMemoryEngine, MemoryContext } from './mo-conversation-memory';
import { getConversationPatternAvoidanceEngine, PatternContext, StructureSuggestion } from './mo-pattern-avoidance';
import { getBusinessMentorPersonalityEngine, PersonalityContext, PersonalityGuidance } from './mo-mentor-personality';
import { getConversationSelfReviewEngine, ReviewContext, ReviewResult } from './mo-conversation-self-review';
import { getMOIdentityProtection, BusinessDataContext, UserQuestion, IdentityProtectionResult } from './mo-identity-protection';

export interface ConversationIntelligenceInput {
  businessId: string;
  conversationId: string;
  userId?: string;
  userMessage: string;
  conversationHistory: any[];
  businessData: any;
  timestamp: Date;
}

export interface ConversationIntelligenceOutput {
  directorDecision: DirectorDecision;
  rhythmSuggestion: RhythmSuggestion;
  thinkingExpression: ThoughtExpression;
  lengthDecision: LengthDecision;
  structureSuggestion: StructureSuggestion;
  personalityGuidance: PersonalityGuidance;
  selfReviewResult: ReviewResult;
  memorySummary: any;
  systemPromptAdditions: string;
  confidence: number;
  identityProtectionResult: IdentityProtectionResult;
}

export class ConversationIntelligenceEngine {
  
  // Process user message through all conversation intelligence components
  async processMessage(input: ConversationIntelligenceInput): Promise<ConversationIntelligenceOutput> {
    // 0. IDENTITY PROTECTION - First priority: determine if this is about their business data
    const identityProtectionResult = this.runIdentityProtection(input);
    
    // 1. Conversation Director - Analyze user and decide strategy
    const directorDecision = this.runConversationDirector(input);
    
    // 2. Conversation State Management - Update and track mode
    this.updateConversationState(directorDecision, input);
    
    // 3. Conversation Memory - Extract and store facts
    this.updateConversationMemory(input);
    
    // 4. Conversation Rhythm - Determine natural pacing
    const rhythmSuggestion = this.runConversationRhythm(directorDecision, input);
    
    // 5. Thinking Out Loud - Decide if reasoning should be expressed
    const thinkingExpression = this.runThinkingOutLoud(directorDecision, input);
    
    // 6. Dynamic Response Length - Determine appropriate length
    const lengthDecision = this.runDynamicResponseLength(directorDecision, input);
    
    // 7. Pattern Avoidance - Vary structure naturally
    const structureSuggestion = this.runPatternAvoidance(directorDecision, input);
    
    // 8. Business Mentor Personality - Apply mentor principles
    const personalityGuidance = this.runMentorPersonality(directorDecision, input);
    
    // 9. Generate system prompt additions (includes identity protection prompts)
    const systemPromptAdditions = this.generateSystemPromptAdditions({
      directorDecision,
      rhythmSuggestion,
      thinkingExpression,
      lengthDecision,
      structureSuggestion,
      personalityGuidance,
      identityProtectionResult,
    });
    
    // 10. Self-review will be done after response generation
    
    const memorySummary = getConversationMemoryEngine().getSummary(this.createMemoryContext(input));
    
    const confidence = this.calculateOverallConfidence({
      directorDecision,
      rhythmSuggestion,
      thinkingExpression,
      lengthDecision,
      structureSuggestion,
      personalityGuidance,
    });
    
    return {
      directorDecision,
      rhythmSuggestion,
      thinkingExpression,
      lengthDecision,
      structureSuggestion,
      personalityGuidance,
      selfReviewResult: {
        passesReview: true,
        criteria: {
          answersRealQuestion: true,
          notTooLong: true,
          asksInsteadOfTells: true,
          notRepeating: true,
          simplerExplanation: true,
          helpingBusinessMoveForward: true,
          wouldMentorSayThis: true,
        },
        issues: [],
        suggestions: [],
        confidence: 0.8,
      },
      memorySummary,
      systemPromptAdditions,
      confidence,
      identityProtectionResult,
    };
  }
  
  // Review generated response
  reviewResponse(proposedResponse: string, input: ConversationIntelligenceOutput, originalInput: ConversationIntelligenceInput): ReviewResult {
    const memoryEngine = getConversationMemoryEngine();
    const memoryContext = this.createMemoryContext(originalInput);
    const memory = memoryEngine.getMemory(memoryContext);
    
    const reviewContext: ReviewContext = {
      userMessage: originalInput.userMessage,
      proposedResponse,
      conversationMode: input.directorDecision.strategy.mode,
      emotionalState: input.directorDecision.emotionalContext.currentState,
      goal: input.directorDecision.strategy.goal,
      targetLength: input.lengthDecision.targetWordCount,
      establishedFacts: memory.establishedFacts.map(f => f.content),
      previousResponses: originalInput.conversationHistory.map(h => h.content || '').slice(-3),
    };
    
    return getConversationSelfReviewEngine().reviewResponse(reviewContext);
  }
  
  // Run Conversation Director
  private runConversationDirector(input: ConversationIntelligenceInput): DirectorDecision {
    const context: ConversationContext = {
      businessId: input.businessId,
      conversationId: input.conversationId,
      userId: input.userId,
      timestamp: input.timestamp,
      conversationHistory: input.conversationHistory,
      businessData: input.businessData,
      previousDecisions: [], // Would be tracked in state
    };
    
    return getConversationDirector().analyze(input.userMessage, context);
  }
  
  // Update Conversation State
  private updateConversationState(directorDecision: DirectorDecision, input: ConversationIntelligenceInput): void {
    const stateManager = getConversationStateManager();
    
    // Initialize state if needed
    if (!stateManager.getCurrentState()) {
      stateManager.initializeState(directorDecision.strategy.mode, {
        userIntent: directorDecision.userUnderstanding.primaryIntent,
        emotionalState: directorDecision.emotionalContext.currentState,
        goal: directorDecision.strategy.goal,
        confidence: directorDecision.confidence,
      });
    } else {
      // Transition to new mode if different
      const currentMode = stateManager.getCurrentState()!.currentMode;
      if (currentMode !== directorDecision.strategy.mode) {
        stateManager.transitionTo(
          directorDecision.strategy.mode,
          `Mode change based on director decision: ${directorDecision.reasoning}`,
          {
            userIntent: directorDecision.userUnderstanding.primaryIntent,
            emotionalState: directorDecision.emotionalContext.currentState,
            goal: directorDecision.strategy.goal,
            confidence: directorDecision.confidence,
          }
        );
      }
    }
  }
  
  // Update Conversation Memory
  private updateConversationMemory(input: ConversationIntelligenceInput): void {
    const memoryEngine = getConversationMemoryEngine();
    const memoryContext = this.createMemoryContext(input);
    
    // Extract facts
    memoryEngine.extractFacts(input.userMessage, memoryContext);
    
    // Detect preferences
    memoryEngine.detectPreferences(input.userMessage, memoryContext);
    
    // Record flow event
    memoryEngine.recordFlowEvent({
      type: 'statement',
      content: input.userMessage,
      timestamp: input.timestamp,
      importance: 0.5,
    }, memoryContext);
  }
  
  // Run Identity Protection - First priority check
  private runIdentityProtection(input: ConversationIntelligenceInput): IdentityProtectionResult {
    const identityProtection = getMOIdentityProtection();
    
    // Assess business data context
    const businessContext: BusinessDataContext = {
      businessId: input.businessId,
      hasSalesData: input.businessData?.totalSales !== undefined,
      hasInventoryData: input.businessData?.totalInventoryValue !== undefined,
      hasCashFlowData: input.businessData?.netCashFlow !== undefined,
      hasCreditData: input.businessData?.customerCreditBalance !== undefined,
      hasExpenseData: input.businessData?.totalExpenses !== undefined,
      hasStaffData: input.businessData?.staffCount !== undefined,
      hasBankData: input.businessData?.totalBankBalance !== undefined,
      dataFreshness: 'recent', // Would be calculated from actual timestamps
      dataCompleteness: this.calculateDataCompleteness(input.businessData),
    };
    
    // Analyze question intent
    const question = identityProtection.analyzeQuestionIntent(input.userMessage, businessContext);
    
    // Determine data priority
    return identityProtection.determineDataPriority(question, businessContext);
  }
  
  // Calculate data completeness score (0-1)
  private calculateDataCompleteness(businessData: any): number {
    if (!businessData) return 0;
    
    const relevantFields = [
      'totalSales',
      'totalInventoryValue',
      'netCashFlow',
      'customerCreditBalance',
      'totalExpenses',
      'staffCount',
      'totalBankBalance',
    ];
    
    const presentFields = relevantFields.filter(field => businessData[field] !== undefined);
    return presentFields.length / relevantFields.length;
  }
  
  // Run Conversation Rhythm
  private runConversationRhythm(directorDecision: DirectorDecision, input: ConversationIntelligenceInput): RhythmSuggestion {
    const rhythmEngine = getConversationRhythmEngine();
    
    const context: RhythmContext = {
      conversationMode: directorDecision.strategy.mode,
      emotionalState: directorDecision.emotionalContext.currentState,
      goal: directorDecision.strategy.goal,
      previousElements: [], // Would be tracked
      responseLength: directorDecision.strategy.responseLength,
    };
    
    const suggestion = rhythmEngine.suggestPattern(context);
    rhythmEngine.recordPatternUsage(suggestion.pattern);
    
    return suggestion;
  }
  
  // Run Thinking Out Loud
  private runThinkingOutLoud(directorDecision: DirectorDecision, input: ConversationIntelligenceInput): ThoughtExpression {
    const thinkingEngine = getThinkingOutLoudEngine();
    
    const context: ThinkingContext = {
      conversationMode: directorDecision.strategy.mode,
      goal: directorDecision.strategy.goal,
      complexity: directorDecision.userUnderstanding.missingInformation.length > 0 ? 0.7 : 0.3,
      userUnderstanding: directorDecision.userUnderstanding.isDirectQuestion ? 0.6 : 0.4,
      hasAssumptions: directorDecision.userUnderstanding.assumptions.length > 0,
      emotionalState: directorDecision.emotionalContext.currentState,
    };
    
    return thinkingEngine.shouldExpressThinking(context);
  }
  
  // Run Dynamic Response Length
  private runDynamicResponseLength(directorDecision: DirectorDecision, input: ConversationIntelligenceInput): LengthDecision {
    const lengthEngine = getDynamicResponseLengthEngine();
    
    const context: LengthContext = {
      conversationMode: directorDecision.strategy.mode,
      emotionalState: directorDecision.emotionalContext.currentState,
      goal: directorDecision.strategy.goal,
      userIntent: directorDecision.userUnderstanding.primaryIntent,
      complexity: directorDecision.userUnderstanding.missingInformation.length > 0 ? 0.7 : 0.3,
      userUnderstanding: directorDecision.userUnderstanding.isDirectQuestion ? 0.6 : 0.4,
      urgency: directorDecision.emotionalContext.currentState === 'urgent' ? 0.9 : 0.3,
      previousLength: 'medium', // Would be tracked
      messageLength: input.userMessage.length,
    };
    
    return lengthEngine.determineLength(context);
  }
  
  // Run Pattern Avoidance
  private runPatternAvoidance(directorDecision: DirectorDecision, input: ConversationIntelligenceInput): StructureSuggestion {
    const patternEngine = getConversationPatternAvoidanceEngine();
    
    const context: PatternContext = {
      conversationMode: directorDecision.strategy.mode,
      emotionalState: directorDecision.emotionalContext.currentState,
      goal: directorDecision.strategy.goal,
      recentStructures: [], // Would be tracked
      totalResponses: input.conversationHistory.length,
    };
    
    const suggestion = patternEngine.suggestStructure(context);
    patternEngine.recordStructureUsage(suggestion.structure);
    
    return suggestion;
  }
  
  // Run Mentor Personality
  private runMentorPersonality(directorDecision: DirectorDecision, input: ConversationIntelligenceInput): PersonalityGuidance {
    const personalityEngine = getBusinessMentorPersonalityEngine();
    
    const context: PersonalityContext = {
      conversationMode: directorDecision.strategy.mode,
      emotionalState: directorDecision.emotionalContext.currentState,
      userConfidence: directorDecision.emotionalContext.confidence,
      hasAssumptions: directorDecision.userUnderstanding.assumptions.length > 0,
      complexity: directorDecision.userUnderstanding.missingInformation.length > 0 ? 0.7 : 0.3,
      isDecisionPoint: directorDecision.strategy.goal === 'decide' || directorDecision.strategy.goal === 'take_action',
    };
    
    return personalityEngine.getGuidance(context);
  }
  
  // Create Memory Context
  private createMemoryContext(input: ConversationIntelligenceInput): MemoryContext {
    return {
      businessId: input.businessId,
      conversationId: input.conversationId,
      currentMessage: input.userMessage,
      timestamp: input.timestamp,
    };
  }
  
  // Generate system prompt additions
  private generateSystemPromptAdditions(components: {
    directorDecision: DirectorDecision;
    rhythmSuggestion: RhythmSuggestion;
    thinkingExpression: ThoughtExpression;
    lengthDecision: LengthDecision;
    structureSuggestion: StructureSuggestion;
    personalityGuidance: PersonalityGuidance;
    identityProtectionResult: IdentityProtectionResult;
  }): string {
    const additions: string[] = [];
    
    // IDENTITY PROTECTION - First priority
    if (components.identityProtectionResult.systemPromptAdditions) {
      additions.push(components.identityProtectionResult.systemPromptAdditions);
    }
    
    // Conversation Mode and Goal
    additions.push(`\n\n## CONVERSATION INTELLIGENCE`);
    additions.push(`**Mode:** ${components.directorDecision.strategy.mode}`);
    additions.push(`**Goal:** ${components.directorDecision.strategy.goal}`);
    additions.push(`**Emotional State:** ${components.directorDecision.emotionalContext.currentState}`);
    
    // Response Structure
    additions.push(`\n**Response Structure:** ${components.structureSuggestion.structure}`);
    additions.push(`**Rhythm Pattern:** ${components.rhythmSuggestion.pattern.description}`);
    additions.push(`**Target Length:** ${components.lengthDecision.targetWordCount} words (${components.lengthDecision.selectedLength})`);
    
    // Thinking Out Loud
    if (components.thinkingExpression.shouldExpress) {
      additions.push(`\n**Thinking Out Loud:** Yes - use "${components.thinkingExpression.template}" when appropriate`);
    }
    
    // Mentor Personality
    additions.push(`\n**Mentor Principles:**`);
    components.personalityGuidance.principlesToApply.forEach(principle => {
      additions.push(`- ${principle.description}`);
    });
    
    additions.push(`\n**Tone:** ${components.personalityGuidance.toneGuidance}`);
    
    // Behaviors
    if (components.personalityGuidance.behaviorsToEmphasize.length > 0) {
      additions.push(`\n**Emphasize:** ${components.personalityGuidance.behaviorsToEmphasize.slice(0, 3).join(', ')}`);
    }
    
    return additions.join('\n');
  }
  
  // Calculate overall confidence
  private calculateOverallConfidence(components: {
    directorDecision: DirectorDecision;
    rhythmSuggestion: RhythmSuggestion;
    thinkingExpression: ThoughtExpression;
    lengthDecision: LengthDecision;
    structureSuggestion: StructureSuggestion;
    personalityGuidance: PersonalityGuidance;
  }): number {
    const confidences = [
      components.directorDecision.confidence,
      components.rhythmSuggestion.confidence,
      components.thinkingExpression.confidence,
      components.lengthDecision.confidence,
      components.structureSuggestion.confidence,
      components.personalityGuidance.confidence,
    ];
    
    const sum = confidences.reduce((a, b) => a + b, 0);
    return sum / confidences.length;
  }
  
  // Format for AI response
  formatForAIResponse(output: ConversationIntelligenceOutput): string {
    let response = '';
    
    response += getConversationDirector().formatForAIResponse(output.directorDecision);
    response += getConversationStateManager().formatForAIResponse();
    response += getConversationRhythmEngine().formatForAIResponse(output.rhythmSuggestion);
    response += getThinkingOutLoudEngine().formatForAIResponse(output.thinkingExpression);
    response += getDynamicResponseLengthEngine().formatForAIResponse(output.lengthDecision);
    response += getConversationPatternAvoidanceEngine().formatForAIResponse(output.structureSuggestion);
    response += getBusinessMentorPersonalityEngine().formatForAIResponse(output.personalityGuidance);
    response += getConversationMemoryEngine().formatForAIResponse(this.createMemoryContext({
      businessId: '',
      conversationId: '',
      userMessage: '',
      conversationHistory: [],
      businessData: {},
      timestamp: new Date(),
    }));
    
    response += `\n\n🎯 OVERALL CONFIDENCE: ${(output.confidence * 100).toFixed(0)}%\n`;
    
    return response;
  }
  
  // Clear conversation state
  clearConversation(businessId: string, conversationId: string): void {
    const memoryEngine = getConversationMemoryEngine();
    memoryEngine.clearMemory({
      businessId,
      conversationId,
      currentMessage: '',
      timestamp: new Date(),
    });
    
    const stateManager = getConversationStateManager();
    stateManager.resetState();
  }
}

// Singleton instance
let conversationIntelligenceEngineInstance: ConversationIntelligenceEngine | null = null;

export function getConversationIntelligenceEngine(): ConversationIntelligenceEngine {
  if (!conversationIntelligenceEngineInstance) {
    conversationIntelligenceEngineInstance = new ConversationIntelligenceEngine();
  }
  return conversationIntelligenceEngineInstance;
}
