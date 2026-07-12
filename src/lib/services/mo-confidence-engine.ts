// MO Confidence Engine - Track Confidence Scores
// Calculates confidence based on data amount, quality, consistency, and recency

export interface ConfidenceMetrics {
  dataPoints: number;
  dataQuality: number; // 0-1 based on completeness and accuracy
  consistency: number; // 0-1 based on variance
  recency: number; // 0-1 based on how recent the data is
  overallConfidence: number; // 0-1 weighted average
}

export interface ConfidenceContext {
  businessId: string;
  dataType: string;
  timeHorizon?: number; // days
}

export class ConfidenceEngine {
  
  // Calculate confidence from data array
  calculateConfidence(data: any[], context?: ConfidenceContext): ConfidenceMetrics {
    const dataPoints = data.length;
    const dataQuality = this.assessDataQuality(data);
    const consistency = this.assessConsistency(data);
    const recency = this.assessRecency(data, context?.timeHorizon || 30);
    
    // Weighted average: data amount (30%), quality (25%), consistency (25%), recency (20%)
    const overallConfidence = 
      (this.normalizeDataPoints(dataPoints) * 0.3) +
      (dataQuality * 0.25) +
      (consistency * 0.25) +
      (recency * 0.2);
    
    return {
      dataPoints,
      dataQuality,
      consistency,
      recency,
      overallConfidence,
    };
  }
  
  // Calculate confidence for a specific metric with historical data
  calculateMetricConfidence(
    currentValue: number,
    historicalValues: number[],
    context?: ConfidenceContext
  ): ConfidenceMetrics {
    const dataPoints = historicalValues.length;
    
    // Data quality: check for null/undefined values
    const validValues = historicalValues.filter(v => v !== null && v !== undefined && !isNaN(v));
    const dataQuality = validValues.length / historicalValues.length;
    
    // Consistency: calculate coefficient of variation
    const consistency = this.assessConsistency(historicalValues);
    
    // Recency: based on when the most recent value was recorded
    const recency = context?.timeHorizon ? 1.0 : 0.8; // Simplified for now
    
    const overallConfidence = 
      (this.normalizeDataPoints(dataPoints) * 0.3) +
      (dataQuality * 0.25) +
      (consistency * 0.25) +
      (recency * 0.2);
    
    return {
      dataPoints,
      dataQuality,
      consistency,
      recency,
      overallConfidence,
    };
  }
  
  // Assess data quality
  private assessDataQuality(data: any[]): number {
    if (data.length === 0) return 0;
    
    let qualityScore = 1.0;
    
    // Check for missing/null values
    const nullCount = data.filter(item => 
      item === null || 
      item === undefined || 
      (typeof item === 'object' && Object.values(item).some(v => v === null || v === undefined))
    ).length;
    
    qualityScore -= (nullCount / data.length) * 0.3;
    
    // Check for reasonable ranges (for numeric data)
    const numericData = data.filter(item => typeof item === 'number');
    if (numericData.length > 0) {
      const avg = numericData.reduce((a, b) => a + b, 0) / numericData.length;
      const outliers = numericData.filter(v => Math.abs(v - avg) > avg * 3).length;
      qualityScore -= (outliers / numericData.length) * 0.2;
    }
    
    return Math.max(0, Math.min(1, qualityScore));
  }
  
  // Assess consistency of data
  private assessConsistency(data: any[]): number {
    if (data.length < 2) return 0.5; // Neutral for insufficient data
    
    const numericData = data.filter(item => typeof item === 'number');
    
    if (numericData.length < 2) return 0.7; // Assume reasonable consistency for non-numeric
    
    // Calculate coefficient of variation
    const mean = numericData.reduce((a, b) => a + b, 0) / numericData.length;
    const variance = numericData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericData.length;
    const stdDev = Math.sqrt(variance);
    
    if (mean === 0) return 0.5;
    
    const cv = stdDev / Math.abs(mean);
    
    // Lower CV = higher consistency
    // CV < 0.2 = very consistent (1.0)
    // CV 0.2-0.5 = moderately consistent (0.7)
    // CV > 0.5 = inconsistent (0.3)
    
    if (cv < 0.2) return 1.0;
    if (cv < 0.5) return 0.7;
    return 0.3;
  }
  
  // Assess recency of data
  private assessRecency(data: any[], timeHorizon: number): number {
    if (data.length === 0) return 0;
    
    // Check if data has date fields
    const datedData = data.filter(item => 
      item.createdAt || 
      item.date || 
      item.timestamp || 
      (typeof item === 'object' && 'date' in item)
    );
    
    if (datedData.length === 0) return 0.5; // Neutral if no dates
    
    const now = Date.now();
    const horizonMs = timeHorizon * 24 * 60 * 60 * 1000;
    
    let recentCount = 0;
    datedData.forEach(item => {
      const date = new Date(item.createdAt || item.date || item.timestamp);
      const age = now - date.getTime();
      if (age <= horizonMs) {
        recentCount++;
      }
    });
    
    return recentCount / datedData.length;
  }
  
  // Normalize data points to 0-1 range
  private normalizeDataPoints(count: number): number {
    // 0 points = 0, 10+ points = 1.0
    return Math.min(count / 10, 1.0);
  }
  
  // Calculate confidence for a pattern
  calculatePatternConfidence(
    pattern: string,
    occurrences: number,
    totalObservations: number,
    timeSpan: number
  ): number {
    if (totalObservations === 0) return 0;
    
    const frequency = occurrences / totalObservations;
    const dataAmount = Math.min(occurrences / 5, 1.0); // 5+ occurrences = full confidence
    const timeScore = Math.min(timeSpan / 30, 1.0); // 30+ days = full confidence
    
    return (frequency * 0.4) + (dataAmount * 0.3) + (timeScore * 0.3);
  }
  
  // Calculate confidence for a recommendation
  calculateRecommendationConfidence(
    similarDecisions: number,
    successRate: number,
    dataRecency: number
  ): number {
    const decisionScore = Math.min(similarDecisions / 3, 1.0); // 3+ similar decisions = full confidence
    const successScore = successRate / 100;
    const recencyScore = Math.min(dataRecency / 90, 1.0); // 90 days = full confidence
    
    return (decisionScore * 0.4) + (successScore * 0.4) + (recencyScore * 0.2);
  }
  
  // Update confidence based on new data
  updateConfidence(
    currentConfidence: ConfidenceMetrics,
    newData: any[],
    context?: ConfidenceContext
  ): ConfidenceMetrics {
    const newMetrics = this.calculateConfidence(newData, context);
    
    // Weighted average of old and new confidence
    const weight = Math.min(newData.length / 10, 0.5); // More new data = more weight on new
    
    return {
      dataPoints: currentConfidence.dataPoints + newData.length,
      dataQuality: (currentConfidence.dataQuality * (1 - weight)) + (newMetrics.dataQuality * weight),
      consistency: (currentConfidence.consistency * (1 - weight)) + (newMetrics.consistency * weight),
      recency: newMetrics.recency, // Recency is based on latest data
      overallConfidence: (currentConfidence.overallConfidence * (1 - weight)) + (newMetrics.overallConfidence * weight),
    };
  }
  
  // Get confidence level description
  getConfidenceLevel(confidence: number): string {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.5) return 'Moderate';
    if (confidence >= 0.3) return 'Low';
    return 'Very Low';
  }
  
  // Format confidence for AI response
  formatForAIResponse(metrics: ConfidenceMetrics, label: string): string {
    const level = this.getConfidenceLevel(metrics.overallConfidence);
    
    return `${label}: ${level} confidence (${(metrics.overallConfidence * 100).toFixed(0)}%) - Based on ${metrics.dataPoints} data points`;
  }
  
  // Validate if confidence is sufficient for action
  isConfidenceSufficient(
    metrics: ConfidenceMetrics,
    threshold: number = 0.6
  ): { sufficient: boolean; reason: string } {
    if (metrics.overallConfidence >= threshold) {
      return { sufficient: true, reason: 'Confidence meets threshold' };
    }
    
    const reasons: string[] = [];
    
    if (metrics.dataPoints < 5) {
      reasons.push('insufficient data points');
    }
    if (metrics.dataQuality < 0.6) {
      reasons.push('low data quality');
    }
    if (metrics.consistency < 0.5) {
      reasons.push('high inconsistency');
    }
    if (metrics.recency < 0.5) {
      reasons.push('data is not recent');
    }
    
    return {
      sufficient: false,
      reason: reasons.join(', ') || 'confidence below threshold',
    };
  }
  
  // Aggregate confidence from multiple sources
  aggregateConfidence(metrics: ConfidenceMetrics[]): ConfidenceMetrics {
    if (metrics.length === 0) {
      return {
        dataPoints: 0,
        dataQuality: 0,
        consistency: 0,
        recency: 0,
        overallConfidence: 0,
      };
    }
    
    const totalDataPoints = metrics.reduce((sum, m) => sum + m.dataPoints, 0);
    const avgDataQuality = metrics.reduce((sum, m) => sum + m.dataQuality, 0) / metrics.length;
    const avgConsistency = metrics.reduce((sum, m) => sum + m.consistency, 0) / metrics.length;
    const avgRecency = metrics.reduce((sum, m) => sum + m.recency, 0) / metrics.length;
    const avgOverall = metrics.reduce((sum, m) => sum + m.overallConfidence, 0) / metrics.length;
    
    return {
      dataPoints: totalDataPoints,
      dataQuality: avgDataQuality,
      consistency: avgConsistency,
      recency: avgRecency,
      overallConfidence: avgOverall,
    };
  }
}

// Singleton instance
let confidenceEngineInstance: ConfidenceEngine | null = null;

export function getConfidenceEngine(): ConfidenceEngine {
  if (!confidenceEngineInstance) {
    confidenceEngineInstance = new ConfidenceEngine();
  }
  return confidenceEngineInstance;
}
