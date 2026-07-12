// MO Dynamic Response Length System - Choose length intentionally
// Response length should match user needs, not model capabilities

export type ResponseLength = 'short' | 'medium' | 'long';

export interface LengthContext {
  conversationMode: string;
  emotionalState: string;
  goal: string;
  userIntent: string;
  complexity: number; // 0-1
  userUnderstanding: number; // 0-1
  urgency: number; // 0-1
  previousLength: ResponseLength;
  messageLength: number; // characters
}

export interface LengthDecision {
  selectedLength: ResponseLength;
  targetWordCount: number;
  reasoning: string;
  confidence: number;
}

export class DynamicResponseLengthEngine {
  private lengthGuidelines: Record<ResponseLength, { min: number; max: number; description: string }>;
  
  constructor() {
    this.lengthGuidelines = {
      short: {
        min: 10,
        max: 50,
        description: 'Simple confirmation, follow-up question, or brief explanation',
      },
      medium: {
        min: 50,
        max: 150,
        description: 'Balanced response with explanation and recommendation',
      },
      long: {
        min: 150,
        max: 400,
        description: 'Detailed analysis, step-by-step explanation, or comprehensive plan',
      },
    };
  }
  
  // Determine appropriate response length
  determineLength(context: LengthContext): LengthDecision {
    const scores = this.calculateLengthScores(context);
    const selectedLength = this.selectLength(scores);
    const targetWordCount = this.getTargetWordCount(selectedLength, context);
    const reasoning = this.explainDecision(selectedLength, context, scores);
    const confidence = this.calculateConfidence(scores, selectedLength);
    
    return {
      selectedLength,
      targetWordCount,
      reasoning,
      confidence,
    };
  }
  
  // Calculate scores for each length option
  private calculateLengthScores(context: LengthContext): Record<ResponseLength, number> {
    const scores: Record<ResponseLength, number> = {
      short: 0.5,
      medium: 0.5,
      long: 0.5,
    };
    
    // Emotional state adjustments
    if (context.emotionalState === 'frustrated' || context.emotionalState === 'urgent') {
      scores.short += 0.4;
      scores.medium -= 0.2;
      scores.long -= 0.2;
    }
    
    if (context.emotionalState === 'overwhelmed') {
      scores.short += 0.3;
      scores.medium += 0.1;
      scores.long -= 0.4;
    }
    
    if (context.emotionalState === 'confused') {
      scores.medium += 0.2;
      scores.long += 0.1;
      scores.short -= 0.3;
    }
    
    // Conversation mode adjustments
    if (context.conversationMode === 'action') {
      scores.short += 0.4;
      scores.medium -= 0.2;
      scores.long -= 0.2;
    }
    
    if (context.conversationMode === 'teaching' || context.conversationMode === 'reasoning') {
      scores.long += 0.3;
      scores.medium += 0.1;
      scores.short -= 0.4;
    }
    
    if (context.conversationMode === 'planning') {
      scores.long += 0.2;
      scores.medium += 0.2;
      scores.short -= 0.4;
    }
    
    if (context.conversationMode === 'discovery' || context.conversationMode === 'clarification') {
      scores.medium += 0.2;
      scores.short += 0.1;
      scores.long -= 0.3;
    }
    
    // Goal adjustments
    if (context.goal === 'discover' || context.goal === 'clarify') {
      scores.medium += 0.2;
      scores.short += 0.1;
    }
    
    if (context.goal === 'teach' || context.goal === 'reason') {
      scores.long += 0.3;
      scores.medium += 0.1;
    }
    
    if (context.goal === 'take_action') {
      scores.short += 0.3;
      scores.medium += 0.1;
    }
    
    // Complexity adjustments
    if (context.complexity > 0.7) {
      scores.long += 0.3;
      scores.medium += 0.1;
      scores.short -= 0.4;
    }
    
    if (context.complexity < 0.3) {
      scores.short += 0.2;
      scores.medium += 0.1;
    }
    
    // User understanding adjustments
    if (context.userUnderstanding < 0.5) {
      scores.long += 0.2;
      scores.medium += 0.2;
      scores.short -= 0.4;
    }
    
    if (context.userUnderstanding > 0.8) {
      scores.short += 0.2;
      scores.medium += 0.1;
    }
    
    // Urgency adjustments
    if (context.urgency > 0.7) {
      scores.short += 0.4;
      scores.medium -= 0.2;
      scores.long -= 0.2;
    }
    
    // Message length adjustments
    if (context.messageLength < 50) {
      scores.short += 0.2;
      scores.medium += 0.1;
    }
    
    if (context.messageLength > 200) {
      scores.long += 0.2;
      scores.medium += 0.1;
    }
    
    // Avoid repetition of previous length
    if (context.previousLength === 'short') {
      scores.short -= 0.1;
      scores.medium += 0.05;
    }
    
    if (context.previousLength === 'long') {
      scores.long -= 0.1;
      scores.medium += 0.05;
    }
    
    // Normalize scores
    const total = scores.short + scores.medium + scores.long;
    scores.short /= total;
    scores.medium /= total;
    scores.long /= total;
    
    return scores;
  }
  
  // Select length based on scores
  private selectLength(scores: Record<ResponseLength, number>): ResponseLength {
    let maxScore = 0;
    let selectedLength: ResponseLength = 'medium';
    
    Object.entries(scores).forEach(([length, score]) => {
      if (score > maxScore) {
        maxScore = score;
        selectedLength = length as ResponseLength;
      }
    });
    
    return selectedLength;
  }
  
  // Get target word count for selected length
  private getTargetWordCount(length: ResponseLength, context: LengthContext): number {
    const guideline = this.lengthGuidelines[length];
    
    // Adjust based on context
    let target = (guideline.min + guideline.max) / 2;
    
    if (context.complexity > 0.7) {
      target *= 1.2;
    }
    
    if (context.urgency > 0.7) {
      target *= 0.7;
    }
    
    if (context.userUnderstanding < 0.5) {
      target *= 1.1;
    }
    
    // Ensure within bounds
    return Math.max(guideline.min, Math.min(guideline.max, Math.round(target)));
  }
  
  // Explain the length decision
  private explainDecision(length: ResponseLength, context: LengthContext, scores: Record<ResponseLength, number>): string {
    const reasons: string[] = [];
    
    reasons.push(`Selected ${length} response`);
    
    if (context.emotionalState === 'frustrated' || context.emotionalState === 'urgent') {
      reasons.push('Shortened due to emotional state');
    }
    
    if (context.conversationMode === 'action') {
      reasons.push('Action mode favors brevity');
    }
    
    if (context.conversationMode === 'teaching' || context.conversationMode === 'reasoning') {
      reasons.push('Teaching/reasoning requires detail');
    }
    
    if (context.complexity > 0.7) {
      reasons.push('High complexity requires longer response');
    }
    
    if (context.urgency > 0.7) {
      reasons.push('High urgency requires brevity');
    }
    
    if (context.userUnderstanding < 0.5) {
      reasons.push('Low understanding requires more explanation');
    }
    
    reasons.push(`Target word count: ${this.getTargetWordCount(length, context)}`);
    
    return reasons.join('. ');
  }
  
  // Calculate confidence in length decision
  private calculateConfidence(scores: Record<ResponseLength, number>, selectedLength: ResponseLength): number {
    const selectedScore = scores[selectedLength];
    const secondHighest = this.getSecondHighestScore(scores, selectedLength);
    
    // Confidence based on how much higher the selected score is than the second highest
    const margin = selectedScore - secondHighest;
    const confidence = 0.5 + margin * 2;
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }
  
  // Get second highest score
  private getSecondHighestScore(scores: Record<ResponseLength, number>, exclude: ResponseLength): number {
    const sorted = Object.entries(scores)
      .filter(([length]) => length !== exclude)
      .map(([, score]) => score)
      .sort((a, b) => b - a);
    
    return sorted[0] || 0;
  }
  
  // Check if response is within target length
  checkLength(response: string, targetWordCount: number): {
    actualWordCount: number;
    isWithinTarget: boolean;
    deviation: number;
    suggestion: string;
  } {
    const actualWordCount = response.split(/\s+/).length;
    const deviation = (actualWordCount - targetWordCount) / targetWordCount;
    const isWithinTarget = Math.abs(deviation) <= 0.2;
    
    let suggestion = '';
    if (!isWithinTarget) {
      if (deviation > 0) {
        suggestion = `Response is ${Math.round(deviation * 100)}% longer than target. Consider condensing.`;
      } else {
        suggestion = `Response is ${Math.round(Math.abs(deviation) * 100)}% shorter than target. Consider expanding.`;
      }
    }
    
    return {
      actualWordCount,
      isWithinTarget,
      deviation,
      suggestion,
    };
  }
  
  // Get length guidelines
  getGuidelines(): Record<ResponseLength, { min: number; max: number; description: string }> {
    return this.lengthGuidelines;
  }
  
  // Format for AI response
  formatForAIResponse(decision: LengthDecision): string {
    let response = '\n\n📏 RESPONSE LENGTH:\n';
    response += `Selected Length: ${decision.selectedLength}\n`;
    response += `Target Word Count: ${decision.targetWordCount}\n`;
    response += `Guideline: ${this.lengthGuidelines[decision.selectedLength].description}\n`;
    response += `Reasoning: ${decision.reasoning}\n`;
    response += `Confidence: ${(decision.confidence * 100).toFixed(0)}%\n`;
    
    return response;
  }
}

// Singleton instance
let dynamicResponseLengthEngineInstance: DynamicResponseLengthEngine | null = null;

export function getDynamicResponseLengthEngine(): DynamicResponseLengthEngine {
  if (!dynamicResponseLengthEngineInstance) {
    dynamicResponseLengthEngineInstance = new DynamicResponseLengthEngine();
  }
  return dynamicResponseLengthEngineInstance;
}
