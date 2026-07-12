// MO Intelligent Uncertainty Engine - Differentiate facts, assumptions, estimates, predictions
// Avoids pretending certainty and matches confidence to available evidence

export type StatementType = 'fact' | 'assumption' | 'estimate' | 'prediction' | 'opinion';

export interface UncertaintyContext {
  dataAvailability: number; // 0-1
  dataQuality: number; // 0-1
  dataRecency: number; // 0-1
  hasDirectEvidence: boolean;
  isHistoricalData: boolean;
  isUserProvided: boolean;
  complexity: number; // 0-1
}

export interface StatementClassification {
  type: StatementType;
  confidence: number; // 0-1
  qualifiers: string[];
  reasoning: string;
}

export interface UncertaintyExpression {
  shouldQualify: boolean;
  qualifier: string;
  placement: 'prefix' | 'suffix' | 'inline';
  confidence: number;
}

export class IntelligentUncertaintyEngine {
  
  // Classify a statement based on context
  classifyStatement(statement: string, context: UncertaintyContext): StatementClassification {
    const type = this.determineStatementType(statement, context);
    const confidence = this.calculateConfidence(type, context);
    const qualifiers = this.generateQualifiers(type, confidence, context);
    const reasoning = this.explainClassification(type, confidence, context);
    
    return {
      type,
      confidence,
      qualifiers,
      reasoning,
    };
  }
  
  // Determine statement type
  private determineStatementType(statement: string, context: UncertaintyContext): StatementType {
    const lowerStatement = statement.toLowerCase();
    
    // Facts: directly observable, user-provided, or from reliable historical data
    if (context.hasDirectEvidence && context.isHistoricalData && context.dataQuality > 0.8) {
      return 'fact';
    }
    
    if (context.isUserProvided && lowerStatement.includes('sold') || lowerStatement.includes('bought')) {
      return 'fact';
    }
    
    // Predictions: about the future
    if (lowerStatement.includes('will') || lowerStatement.includes('going to') || lowerStatement.includes('expected') || lowerStatement.includes('forecast')) {
      return 'prediction';
    }
    
    // Estimates: numerical approximations
    if (lowerStatement.includes('approximately') || lowerStatement.includes('around') || lowerStatement.includes('about') || lowerStatement.includes('roughly')) {
      return 'estimate';
    }
    
    // Assumptions: stated or implied conditions
    if (lowerStatement.includes('if') || lowerStatement.includes('assuming') || lowerStatement.includes('based on')) {
      return 'assumption';
    }
    
    // Opinions: subjective judgments
    if (lowerStatement.includes('should') || lowerStatement.includes('recommend') || lowerStatement.includes('suggest') || lowerStatement.includes('think')) {
      return 'opinion';
    }
    
    // Default based on data availability
    if (context.dataAvailability > 0.8 && context.dataQuality > 0.7) {
      return 'fact';
    } else if (context.dataAvailability > 0.5) {
      return 'estimate';
    } else {
      return 'assumption';
    }
  }
  
  // Calculate confidence based on type and context
  private calculateConfidence(type: StatementType, context: UncertaintyContext): number {
    let confidence = 0.5;
    
    // Base confidence by type
    const typeBaseConfidence: Record<StatementType, number> = {
      fact: 0.9,
      estimate: 0.6,
      assumption: 0.4,
      prediction: 0.5,
      opinion: 0.7,
    };
    
    confidence = typeBaseConfidence[type];
    
    // Adjust based on data availability
    confidence *= (0.5 + context.dataAvailability * 0.5);
    
    // Adjust based on data quality
    confidence *= (0.5 + context.dataQuality * 0.5);
    
    // Adjust based on data recency
    confidence *= (0.7 + context.dataRecency * 0.3);
    
    // Boost for direct evidence
    if (context.hasDirectEvidence) {
      confidence += 0.1;
    }
    
    // Reduce for high complexity
    if (context.complexity > 0.7) {
      confidence -= 0.1;
    }
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }
  
  // Generate appropriate qualifiers
  private generateQualifiers(type: StatementType, confidence: number, context: UncertaintyContext): string[] {
    const qualifiers: string[] = [];
    
    // Type-specific qualifiers
    if (type === 'assumption') {
      qualifiers.push('Based on what you\'ve shared');
      qualifiers.push('If this assumption is correct');
      qualifiers.push('This depends on');
    }
    
    if (type === 'estimate') {
      qualifiers.push('Approximately');
      qualifiers.push('Roughly');
      qualifiers.push('Around');
      qualifiers.push('Based on available data');
    }
    
    if (type === 'prediction') {
      qualifiers.push('My projection suggests');
      qualifiers.push('Based on current trends');
      qualifiers.push('If patterns continue');
      qualifiers.push('This could change with new information');
    }
    
    if (type === 'opinion') {
      qualifiers.push('I recommend');
      qualifiers.push('My assessment is');
      qualifiers.push('From what I can see');
    }
    
    // Confidence-based qualifiers
    if (confidence < 0.5) {
      qualifiers.push('I may be missing something');
      qualifiers.push('This is my current understanding');
      qualifiers.push('This could change with more information');
    } else if (confidence < 0.7) {
      qualifiers.push('Based on available information');
      qualifiers.push('This is my best estimate');
    }
    
    // Context-specific qualifiers
    if (context.dataAvailability < 0.5) {
      qualifiers.push('With limited data');
      qualifiers.push('This is preliminary');
    }
    
    if (context.dataRecency < 0.5) {
      qualifiers.push('Based on older data');
      qualifiers.push('This may not reflect current situation');
    }
    
    return qualifiers;
  }
  
  // Explain classification reasoning
  private explainClassification(type: StatementType, confidence: number, context: UncertaintyContext): string {
    const parts: string[] = [];
    
    parts.push(`Classified as ${type}`);
    parts.push(`Confidence: ${(confidence * 100).toFixed(0)}%`);
    
    if (context.dataAvailability < 0.5) {
      parts.push('Limited data availability reduces confidence');
    }
    
    if (context.dataQuality < 0.7) {
      parts.push('Data quality concerns affect certainty');
    }
    
    if (context.dataRecency < 0.5) {
      parts.push('Data recency impacts reliability');
    }
    
    if (!context.hasDirectEvidence && type === 'fact') {
      parts.push('Lack of direct evidence prevents fact classification');
    }
    
    return parts.join('. ');
  }
  
  // Determine if statement should be qualified
  shouldQualifyStatement(classification: StatementClassification): UncertaintyExpression {
    const shouldQualify = classification.confidence < 0.8 || 
                          classification.type === 'assumption' || 
                          classification.type === 'prediction';
    
    if (!shouldQualify) {
      return {
        shouldQualify: false,
        qualifier: '',
        placement: 'prefix',
        confidence: classification.confidence,
      };
    }
    
    const qualifier = this.selectQualifier(classification);
    const placement = this.selectPlacement(classification.type);
    
    return {
      shouldQualify: true,
      qualifier,
      placement,
      confidence: classification.confidence,
    };
  }
  
  // Select appropriate qualifier
  private selectQualifier(classification: StatementClassification): string {
    const { type, confidence, qualifiers } = classification;
    
    // Use type-specific qualifier first
    if (type === 'assumption') {
      return 'Based on what you\'ve shared';
    }
    
    if (type === 'prediction') {
      return 'Based on current trends';
    }
    
    if (type === 'estimate') {
      return 'Approximately';
    }
    
    // Use confidence-based qualifier
    if (confidence < 0.5) {
      return 'This is my current understanding, but it could change with more information';
    }
    
    if (confidence < 0.7) {
      return 'Based on available information';
    }
    
    // Default to first available qualifier
    return qualifiers[0] || 'Based on available data';
  }
  
  // Select qualifier placement
  private selectPlacement(type: StatementType): 'prefix' | 'suffix' | 'inline' {
    if (type === 'assumption' || type === 'prediction') {
      return 'prefix';
    }
    
    if (type === 'estimate') {
      return 'inline';
    }
    
    return 'prefix';
  }
  
  // Apply qualifier to statement
  applyQualifier(statement: string, expression: UncertaintyExpression): string {
    if (!expression.shouldQualify) {
      return statement;
    }
    
    switch (expression.placement) {
      case 'prefix':
        return `${expression.qualifier}, ${statement.charAt(0).toLowerCase() + statement.slice(1)}`;
      case 'suffix':
        return `${statement}, ${expression.qualifier}`;
      case 'inline':
        return statement.replace(/(\d+)/, `${expression.qualifier} $1`);
      default:
        return statement;
    }
  }
  
  // Batch classify multiple statements
  batchClassify(statements: string[], context: UncertaintyContext): StatementClassification[] {
    return statements.map(statement => this.classifyStatement(statement, context));
  }
  
  // Get uncertainty statistics
  getStatistics(classifications: StatementClassification[]): {
    total: number;
    byType: Record<StatementType, number>;
    averageConfidence: number;
    lowConfidenceCount: number;
  } {
    const byType: Record<StatementType, number> = {
      fact: 0,
      assumption: 0,
      estimate: 0,
      prediction: 0,
      opinion: 0,
    };
    
    let totalConfidence = 0;
    let lowConfidenceCount = 0;
    
    classifications.forEach(c => {
      byType[c.type]++;
      totalConfidence += c.confidence;
      if (c.confidence < 0.6) {
        lowConfidenceCount++;
      }
    });
    
    return {
      total: classifications.length,
      byType,
      averageConfidence: classifications.length > 0 ? totalConfidence / classifications.length : 0,
      lowConfidenceCount,
    };
  }
  
  // Format for AI response
  formatForAIResponse(classification: StatementClassification): string {
    let response = '\n\n🎲 UNCERTAINTY ANALYSIS:\n';
    response += `Type: ${classification.type}\n`;
    response += `Confidence: ${(classification.confidence * 100).toFixed(0)}%\n`;
    response += `Reasoning: ${classification.reasoning}\n`;
    
    if (classification.qualifiers.length > 0) {
      response += `Available qualifiers: ${classification.qualifiers.slice(0, 3).join(', ')}\n`;
    }
    
    const expression = this.shouldQualifyStatement(classification);
    if (expression.shouldQualify) {
      response += `Should qualify: Yes (${expression.placement}: "${expression.qualifier}")\n`;
    } else {
      response += `Should qualify: No (high confidence)\n`;
    }
    
    return response;
  }
}

// Singleton instance
let intelligentUncertaintyEngineInstance: IntelligentUncertaintyEngine | null = null;

export function getIntelligentUncertaintyEngine(): IntelligentUncertaintyEngine {
  if (!intelligentUncertaintyEngineInstance) {
    intelligentUncertaintyEngineInstance = new IntelligentUncertaintyEngine();
  }
  return intelligentUncertaintyEngineInstance;
}
