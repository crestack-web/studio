// MO Conversation Director - Central Decision-Making for Conversations
// Every user message passes through the director before response generation

export type EmotionalState = 
  | 'curious'
  | 'confused'
  | 'excited'
  | 'frustrated'
  | 'overwhelmed'
  | 'confident'
  | 'unsure'
  | 'celebrating'
  | 'urgent'
  | 'neutral';

export type ConversationGoal = 
  | 'discover'
  | 'clarify'
  | 'reason'
  | 'teach'
  | 'challenge'
  | 'coach'
  | 'encourage'
  | 'decide'
  | 'take_action'
  | 'celebrate'
  | 'troubleshoot';

export type ConversationMode = 
  | 'discovery'
  | 'clarification'
  | 'reasoning'
  | 'teaching'
  | 'planning'
  | 'action'
  | 'celebration'
  | 'challenge';

export interface UserUnderstanding {
  primaryIntent: string;
  problemBeingSolved: string;
  isDirectQuestion: boolean;
  assumptions: string[];
  missingInformation: string[];
}

export interface EmotionalContext {
  currentState: EmotionalState;
  confidence: number; // 0-1
  indicators: string[];
  adaptationStrategy: string;
}

export interface ConversationStrategy {
  mode: ConversationMode;
  goal: ConversationGoal;
  approach: string;
  responseStructure: string[];
  shouldThinkOutLoud: boolean;
  uncertaintyLevel: 'high' | 'medium' | 'low';
  responseLength: 'short' | 'medium' | 'long';
}

export interface DirectorDecision {
  userUnderstanding: UserUnderstanding;
  emotionalContext: EmotionalContext;
  strategy: ConversationStrategy;
  reasoning: string;
  confidence: number;
}

export interface ConversationContext {
  businessId: string;
  conversationId?: string;
  userId?: string;
  conversationHistory: any[];
  businessData: any;
  previousDecisions: DirectorDecision[];
  timestamp: Date;
}

export class ConversationDirector {
  
  // Analyze user message and make conversation decisions
  analyze(message: string, context: ConversationContext): DirectorDecision {
    const userUnderstanding = this.understandUser(message, context);
    const emotionalContext = this.understandEmotion(message, context, userUnderstanding);
    const strategy = this.chooseStrategy(message, userUnderstanding, emotionalContext, context);
    const reasoning = this.explainReasoning(userUnderstanding, emotionalContext, strategy);
    
    return {
      userUnderstanding,
      emotionalContext,
      strategy,
      reasoning,
      confidence: this.calculateConfidence(userUnderstanding, emotionalContext, strategy),
    };
  }
  
  // Understand what the user is trying to achieve
  private understandUser(message: string, context: ConversationContext): UserUnderstanding {
    const lowerMessage = message.toLowerCase();
    
    // Detect primary intent
    let primaryIntent = 'general_inquiry';
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      primaryIntent = 'seek_help';
    } else if (lowerMessage.includes('what') || lowerMessage.includes('tell me')) {
      primaryIntent = 'information_request';
    } else if (lowerMessage.includes('should') || lowerMessage.includes('recommend')) {
      primaryIntent = 'seek_recommendation';
    } else if (lowerMessage.includes('why') || lowerMessage.includes('explain')) {
      primaryIntent = 'understanding_request';
    } else if (lowerMessage.includes('sold') || lowerMessage.includes('bought') || lowerMessage.includes('record')) {
      primaryIntent = 'record_transaction';
    } else if (lowerMessage.includes('add') || lowerMessage.includes('create')) {
      primaryIntent = 'create_entity';
    } else if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('stuck')) {
      primaryIntent = 'troubleshoot_problem';
    } else if (lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('success')) {
      primaryIntent = 'share_success';
    }
    
    // Identify problem being solved
    const problemBeingSolved = this.identifyProblem(message, primaryIntent);
    
    // Check if direct question
    const isDirectQuestion = message.includes('?') || 
                             lowerMessage.startsWith('what') || 
                             lowerMessage.startsWith('how') ||
                             lowerMessage.startsWith('why') ||
                             lowerMessage.startsWith('when') ||
                             lowerMessage.startsWith('where') ||
                             lowerMessage.startsWith('who') ||
                             lowerMessage.startsWith('which') ||
                             lowerMessage.startsWith('can') ||
                             lowerMessage.startsWith('should') ||
                             lowerMessage.startsWith('do');
    
    // Identify assumptions
    const assumptions = this.identifyAssumptions(message, context);
    
    // Identify missing information
    const missingInformation = this.identifyMissingInformation(message, primaryIntent, context);
    
    return {
      primaryIntent,
      problemBeingSolved,
      isDirectQuestion,
      assumptions,
      missingInformation,
    };
  }
  
  // Identify the problem the user is solving
  private identifyProblem(message: string, intent: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (intent === 'record_transaction') {
      return 'Recording business transaction';
    } else if (intent === 'create_entity') {
      return 'Creating business entity (product, supplier, etc.)';
    } else if (intent === 'troubleshoot_problem') {
      if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
        return 'Inventory management issue';
      } else if (lowerMessage.includes('cash') || lowerMessage.includes('money')) {
        return 'Cash flow problem';
      } else if (lowerMessage.includes('profit') || lowerMessage.includes('loss')) {
        return 'Profitability concern';
      } else if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
        return 'Customer-related issue';
      } else {
        return 'General business problem';
      }
    } else if (intent === 'seek_recommendation') {
      return 'Making a business decision';
    } else if (intent === 'share_success') {
      return 'Sharing business achievement';
    } else {
      return 'General business inquiry';
    }
  }
  
  // Identify assumptions the user is making
  private identifyAssumptions(message: string, context: ConversationContext): string[] {
    const assumptions: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Check for price assumptions
    if (lowerMessage.includes('expensive') || lowerMessage.includes('cheap')) {
      assumptions.push('User has price expectations');
    }
    
    // Check for time assumptions
    if (lowerMessage.includes('soon') || lowerMessage.includes('quickly') || lowerMessage.includes('immediately')) {
      assumptions.push('User expects quick results');
    }
    
    // Check for market assumptions
    if (lowerMessage.includes('everyone') || lowerMessage.includes('nobody') || lowerMessage.includes('always')) {
      assumptions.push('User may be generalizing');
    }
    
    // Check for competitor assumptions
    if (lowerMessage.includes('better than') || lowerMessage.includes('worse than')) {
      assumptions.push('User is making comparisons');
    }
    
    return assumptions;
  }
  
  // Identify missing information needed for good response
  private identifyMissingInformation(message: string, intent: string, context: ConversationContext): string[] {
    const missing: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    if (intent === 'record_transaction') {
      if (!lowerMessage.includes('sold') && !lowerMessage.includes('bought')) {
        missing.push('Transaction type (sale/purchase)');
      }
      if (!lowerMessage.includes('₦') && !/\d+/.test(message)) {
        missing.push('Amount or price');
      }
    }
    
    if (intent === 'create_entity') {
      if (lowerMessage.includes('product') && !lowerMessage.includes('price')) {
        missing.push('Product price');
      }
    }
    
    if (intent === 'troubleshoot_problem') {
      if (!lowerMessage.includes('because') && !lowerMessage.includes('due to') && message.length < 50) {
        missing.push('Problem details or context');

      }
    }
    
    return missing;
  }
  
  // Understand emotional state of user
  private understandEmotion(message: string, context: ConversationContext, userUnderstanding: UserUnderstanding): EmotionalContext {
    const lowerMessage = message.toLowerCase();
    const indicators: string[] = [];
    let currentState: EmotionalState = 'neutral';
    let confidence = 0.7;
    
    // Detect emotional indicators
    if (lowerMessage.includes('confused') || lowerMessage.includes('don\'t understand') || lowerMessage.includes('unclear')) {
      currentState = 'confused';
      indicators.push('explicit confusion');
      confidence = 0.85;
    } else if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes('problem')) {
      currentState = 'unsure';
      indicators.push('seeking help');
      confidence = 0.75;
    } else if (lowerMessage.includes('excited') || lowerMessage.includes('great') || lowerMessage.includes('amazing')) {
      currentState = 'excited';
      indicators.push('positive emotion');
      confidence = 0.8;
    } else if (lowerMessage.includes('frustrated') || lowerMessage.includes('annoying') || lowerMessage.includes('difficult')) {
      currentState = 'frustrated';
      indicators.push('negative emotion');
      confidence = 0.85;
    } else if (lowerMessage.includes('overwhelmed') || lowerMessage.includes('too much') || lowerMessage.includes('can\'t handle')) {
      currentState = 'overwhelmed';
      indicators.push('overwhelmed');
      confidence = 0.9;
    } else if (lowerMessage.includes('confident') || lowerMessage.includes('sure') || lowerMessage.includes('certain')) {
      currentState = 'confident';
      indicators.push('expressed confidence');
      confidence = 0.75;
    } else if (lowerMessage.includes('good') || lowerMessage.includes('success') || lowerMessage.includes('achieved')) {
      currentState = 'celebrating';
      indicators.push('celebrating success');
      confidence = 0.85;
    } else if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('immediately')) {
      currentState = 'urgent';
      indicators.push('urgency');
      confidence = 0.8;
    } else if (lowerMessage.includes('?') && lowerMessage.length < 30) {
      currentState = 'curious';
      indicators.push('short question');
      confidence = 0.65;
    }
    
    // Check for exclamation marks (excitement or urgency)
    const exclamationCount = (message.match(/!/g) || []).length;
    if (exclamationCount >= 2) {
      if (currentState === 'neutral') {
        currentState = 'excited';
        indicators.push('multiple exclamations');
      }
      confidence = Math.max(confidence, 0.75);
    }
    
    // Check for question marks (confusion or curiosity)
    const questionCount = (message.match(/\?/g) || []).length;
    if (questionCount >= 2) {
      if (currentState === 'neutral') {
        currentState = 'confused';
        indicators.push('multiple questions');
      }
      confidence = Math.max(confidence, 0.8);
    }
    
    // Determine adaptation strategy
    const adaptationStrategy = this.getAdaptationStrategy(currentState, userUnderstanding);
    
    return {
      currentState,
      confidence,
      indicators,
      adaptationStrategy,
    };
  }
  
  // Get adaptation strategy based on emotional state
  private getAdaptationStrategy(emotionalState: EmotionalState, userUnderstanding: UserUnderstanding): string {
    switch (emotionalState) {
      case 'confused':
        return 'Be patient, break down complex ideas, ask clarifying questions gently';
      case 'frustrated':
        return 'Acknowledge frustration, focus on solutions, avoid lengthy explanations';
      case 'overwhelmed':
        return 'Simplify, prioritize one thing at a time, be reassuring';
      case 'celebrating':
        return 'Acknowledge achievement naturally, then shift to next steps';
      case 'urgent':
        return 'Be direct, focus on immediate action, skip unnecessary details';
      case 'excited':
        return 'Match energy, channel enthusiasm toward productive action';
      case 'unsure':
        return 'Be supportive, provide clear guidance, build confidence';
      case 'confident':
        return 'Respect their knowledge, challenge assumptions when needed, collaborate';
      case 'curious':
        return 'Provide information, encourage exploration, share insights';
      default:
        return 'Be balanced, thoughtful, and helpful';
    }
  }
  
  // Choose conversation strategy based on understanding and emotion
  private chooseStrategy(
    message: string,
    userUnderstanding: UserUnderstanding,
    emotionalContext: EmotionalContext,
    context: ConversationContext
  ): ConversationStrategy {
    const mode = this.selectMode(userUnderstanding, emotionalContext);
    const goal = this.selectGoal(userUnderstanding, emotionalContext, mode);
    const approach = this.selectApproach(mode, emotionalContext);
    const responseStructure = this.selectResponseStructure(mode, goal, emotionalContext);
    const shouldThinkOutLoud = this.shouldThinkOutLoud(mode, goal, userUnderstanding);
    const uncertaintyLevel = this.assessUncertainty(userUnderstanding, context);
    const responseLength = this.selectResponseLength(mode, goal, emotionalContext);
    
    return {
      mode,
      goal,
      approach,
      responseStructure,
      shouldThinkOutLoud,
      uncertaintyLevel,
      responseLength,
    };
  }
  
  // Select conversation mode
  private selectMode(userUnderstanding: UserUnderstanding, emotionalContext: EmotionalContext): ConversationMode {
    // Celebration mode takes priority
    if (emotionalContext.currentState === 'celebrating') {
      return 'celebration';
    }
    
    // Challenge mode when user seems confident but making assumptions
    if (emotionalContext.currentState === 'confident' && userUnderstanding.assumptions.length > 0) {
      return 'challenge';
    }
    
    // Action mode for transaction recording
    if (userUnderstanding.primaryIntent === 'record_transaction' || 
        userUnderstanding.primaryIntent === 'create_entity') {
      return 'action';
    }
    
    // Troubleshoot mode for problems
    if (userUnderstanding.primaryIntent === 'troubleshoot_problem') {
      return 'reasoning';
    }
    
    // Discovery mode when missing information
    if (userUnderstanding.missingInformation.length > 0) {
      return 'discovery';
    }
    
    // Clarification mode for confused users
    if (emotionalContext.currentState === 'confused') {
      return 'clarification';
    }
    
    // Teaching mode for understanding requests
    if (userUnderstanding.primaryIntent === 'understanding_request') {
      return 'teaching';
    }
    
    // Planning mode for recommendations
    if (userUnderstanding.primaryIntent === 'seek_recommendation') {
      return 'planning';
    }
    
    // Default to reasoning for general inquiries
    return 'reasoning';
  }
  
  // Select conversation goal
  private selectGoal(
    userUnderstanding: UserUnderstanding,
    emotionalContext: EmotionalContext,
    mode: ConversationMode
  ): ConversationGoal {
    switch (mode) {
      case 'discovery':
        return 'discover';
      case 'clarification':
        return 'clarify';
      case 'reasoning':
        return 'reason';
      case 'teaching':
        return 'teach';
      case 'planning':
        return 'decide';
      case 'action':
        return 'take_action';
      case 'celebration':
        return 'celebrate';
      case 'challenge':
        return 'challenge';
      default:
        return 'reason';
    }
  }
  
  // Select approach based on mode and emotion
  private selectApproach(mode: ConversationMode, emotionalContext: EmotionalContext): string {
    const approaches: Record<ConversationMode, string> = {
      discovery: 'Ask short, thoughtful questions. Listen more than speak.',
      clarification: 'Ask only missing questions. Be direct and helpful.',
      reasoning: 'Think through the problem step by step. Connect ideas.',
      teaching: 'Use examples and analogies. Build understanding gradually.',
      planning: 'Break down into manageable actions. Prioritize next steps.',
      action: 'Execute available functions. Perform actions, don\'t just describe.',
      celebration: 'Acknowledge achievement naturally. Shift focus to next milestone.',
      challenge: 'Respectfully disagree. Question assumptions with evidence.',
    };
    
    let approach = approaches[mode];
    
    // Adjust based on emotional state
    if (emotionalContext.currentState === 'frustrated') {
      approach = 'Be direct and solution-focused. Keep it brief.';
    } else if (emotionalContext.currentState === 'overwhelmed') {
      approach = 'Simplify everything. One thing at a time.';
    } else if (emotionalContext.currentState === 'urgent') {
      approach = 'Immediate action. Skip unnecessary details.';
    }
    
    return approach;
  }
  
  // Select response structure
  private selectResponseStructure(
    mode: ConversationMode,
    goal: ConversationGoal,
    emotionalContext: EmotionalContext
  ): string[] {
    const structures: Record<ConversationMode, string[]> = {
      discovery: ['question', 'observation', 'question'],
      clarification: ['direct_answer', 'clarifying_question'],
      reasoning: ['observation', 'analysis', 'conclusion', 'recommendation'],
      teaching: ['concept', 'example', 'application'],
      planning: ['current_situation', 'options', 'recommended_action', 'next_steps'],
      action: ['confirmation', 'action_taken', 'result'],
      celebration: ['acknowledgment', 'reflection', 'next_focus'],
      challenge: ['observation', 'alternative_view', 'evidence', 'recommendation'],
    };
    
    let structure = structures[mode];
    
    // Adjust for emotional state
    if (emotionalContext.currentState === 'frustrated') {
      structure = ['direct_answer', 'solution'];
    } else if (emotionalContext.currentState === 'urgent') {
      structure = ['action', 'result'];
    }
    
    return structure;
  }
  
  // Decide whether to think out loud
  private shouldThinkOutLoud(mode: ConversationMode, goal: ConversationGoal, userUnderstanding: UserUnderstanding): boolean {
    // Think out loud in reasoning and challenge modes
    if (mode === 'reasoning' || mode === 'challenge') {
      return true;
    }
    
    // Think out loud when user is seeking understanding
    if (goal === 'teach' || userUnderstanding.primaryIntent === 'understanding_request') {
      return true;
    }
    
    // Think out loud when there are assumptions to address
    if (userUnderstanding.assumptions.length > 0) {
      return true;
    }
    
    return false;
  }
  
  // Assess uncertainty level
  private assessUncertainty(userUnderstanding: UserUnderstanding, context: ConversationContext): 'high' | 'medium' | 'low' {
    // High uncertainty when missing information
    if (userUnderstanding.missingInformation.length > 1) {
      return 'high';
    }
    
    // High uncertainty when many assumptions
    if (userUnderstanding.assumptions.length > 2) {
      return 'high';
    }
    
    // Medium uncertainty for complex problems
    if (userUnderstanding.problemBeingSolved === 'General business problem') {
      return 'medium';
    }
    
    // Low uncertainty for direct actions
    if (userUnderstanding.primaryIntent === 'record_transaction' && 
        userUnderstanding.missingInformation.length === 0) {
      return 'low';
    }
    
    return 'medium';
  }
  
  // Select response length
  private selectResponseLength(
    mode: ConversationMode,
    goal: ConversationGoal,
    emotionalContext: EmotionalContext
  ): 'short' | 'medium' | 'long' {
    // Short for frustrated or urgent users
    if (emotionalContext.currentState === 'frustrated' || 
        emotionalContext.currentState === 'urgent') {
      return 'short';
    }
    
    // Short for action mode
    if (mode === 'action') {
      return 'short';
    }
    
    // Long for teaching and reasoning modes
    if (mode === 'teaching' || mode === 'reasoning') {
      return 'long';
    }
    
    // Medium for planning
    if (mode === 'planning') {
      return 'medium';
    }
    
    return 'medium';
  }
  
  // Explain the reasoning behind the decision
  private explainReasoning(
    userUnderstanding: UserUnderstanding,
    emotionalContext: EmotionalContext,
    strategy: ConversationStrategy
  ): string {
    const parts: string[] = [];
    
    parts.push(`User intent: ${userUnderstanding.primaryIntent}`);
    parts.push(`Emotional state: ${emotionalContext.currentState} (${(emotionalContext.confidence * 100).toFixed(0)}% confidence)`);
    parts.push(`Selected mode: ${strategy.mode}`);
    parts.push(`Primary goal: ${strategy.goal}`);
    parts.push(`Response length: ${strategy.responseLength}`);
    
    if (strategy.shouldThinkOutLoud) {
      parts.push('Will think out loud to show reasoning');
    }
    
    if (userUnderstanding.missingInformation.length > 0) {
      parts.push(`Missing info: ${userUnderstanding.missingInformation.join(', ')}`);
    }
    
    if (userUnderstanding.assumptions.length > 0) {
      parts.push(`Assumptions detected: ${userUnderstanding.assumptions.join(', ')}`);
    }
    
    return parts.join('. ');
  }
  
  // Calculate confidence in the decision
  private calculateConfidence(
    userUnderstanding: UserUnderstanding,
    emotionalContext: EmotionalContext,
    strategy: ConversationStrategy
  ): number {
    let confidence = 0.7;
    
    // Higher confidence when emotional detection is clear
    confidence = Math.max(confidence, emotionalContext.confidence * 0.8);
    
    // Lower confidence when missing information
    confidence -= userUnderstanding.missingInformation.length * 0.1;
    
    // Lower confidence when many assumptions
    confidence -= userUnderstanding.assumptions.length * 0.05;
    
    // Higher confidence for clear intents
    if (userUnderstanding.primaryIntent === 'record_transaction' || 
        userUnderstanding.primaryIntent === 'create_entity') {
      confidence += 0.15;
    }
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }
  
  // Format decision for AI response
  formatForAIResponse(decision: DirectorDecision): string {
    let response = '\n\n🎯 CONVERSATION DIRECTOR DECISION:\n';
    response += decision.reasoning + '\n';
    response += `\nStrategy: ${decision.strategy.approach}\n`;
    response += `Structure: ${decision.strategy.responseStructure.join(' → ')}\n`;
    response += `Uncertainty: ${decision.strategy.uncertaintyLevel}\n`;
    response += `Decision confidence: ${(decision.confidence * 100).toFixed(0)}%\n`;
    
    return response;
  }
}

// Singleton instance
let conversationDirectorInstance: ConversationDirector | null = null;

export function getConversationDirector(): ConversationDirector {
  if (!conversationDirectorInstance) {
    conversationDirectorInstance = new ConversationDirector();
  }
  return conversationDirectorInstance;
}
