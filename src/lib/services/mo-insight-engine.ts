// MO Insight Engine - Convert Patterns into Actionable Insights
// Transforms detected patterns into actionable business insights with explanations

import { DetectedPatterns, SalesPattern, ExpensePattern, CustomerBehaviorPattern, InventoryPattern, CashFlowPattern, SupplierPerformancePattern } from './mo-pattern-detection';

export interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'observation' | 'recommendation';
  category: 'sales' | 'expenses' | 'inventory' | 'cash_flow' | 'customers' | 'suppliers' | 'operations' | 'strategy';
  observation: string;
  insight: string;
  recommendation: string;
  explanation: string;
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionability: 'immediate' | 'short_term' | 'long_term' | 'informational';
  dataPoints: number;
  createdAt: Date;
}

export interface InsightContext {
  businessId: string;
  businessStage?: string;
  industry?: string;
}

export class InsightEngine {
  
  // Generate insights from detected patterns
  generateInsights(patterns: DetectedPatterns, context?: InsightContext): Insight[] {
    const insights: Insight[] = [];
    
    // Sales insights
    insights.push(...this.generateSalesInsights(patterns.sales, context));
    
    // Expense insights
    insights.push(...this.generateExpenseInsights(patterns.expenses, context));
    
    // Customer behavior insights
    insights.push(...this.generateCustomerInsights(patterns.customerBehavior, context));
    
    // Inventory insights
    insights.push(...this.generateInventoryInsights(patterns.inventory, context));
    
    // Cash flow insights
    insights.push(...this.generateCashFlowInsights(patterns.cashFlow, context));
    
    // Supplier performance insights
    insights.push(...this.generateSupplierInsights(patterns.supplierPerformance, context));
    
    // Seasonality insights
    insights.push(...this.generateSeasonalityInsights(patterns.seasonality, context));
    
    return insights.sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority));
  }
  
  // Generate sales insights
  private generateSalesInsights(salesPatterns: SalesPattern[], context?: InsightContext): Insight[] {
    const insights: Insight[] = [];
    
    salesPatterns.forEach(pattern => {
      if (pattern.confidence < 0.5) return;
      
      if (pattern.trend === 'increasing' && pattern.growthRate > 15) {
        insights.push({
          id: this.generateId(),
          type: 'opportunity',
          category: 'sales',
          observation: `Sales are increasing by ${pattern.growthRate.toFixed(1)}% ${pattern.period}`,
          insight: 'Strong sales growth indicates market demand and effective strategy',
          recommendation: 'Consider scaling operations to meet increased demand while maintaining quality',
          explanation: `The ${pattern.growthRate.toFixed(1)}% growth rate over ${pattern.period} suggests your business is gaining traction. This is an opportunity to expand capacity, optimize inventory, or invest in marketing to sustain momentum.`,
          confidence: pattern.confidence,
          priority: pattern.growthRate > 30 ? 'high' : 'medium',
          actionability: 'short_term',
          dataPoints: pattern.dataPoints,
          createdAt: new Date(),
        });
      }
      
      if (pattern.trend === 'decreasing' && Math.abs(pattern.growthRate) > 10) {
        insights.push({
          id: this.generateId(),
          type: 'risk',
          category: 'sales',
          observation: `Sales are decreasing by ${Math.abs(pattern.growthRate).toFixed(1)}% ${pattern.period}`,
          insight: 'Declining sales indicate market challenges or operational issues',
          recommendation: 'Investigate root causes: market conditions, competition, pricing, product quality, or customer satisfaction',
          explanation: `The ${Math.abs(pattern.growthRate).toFixed(1)}% decline over ${pattern.period} requires immediate attention. Common causes include increased competition, market saturation, pricing issues, or changes in customer preferences.`,
          confidence: pattern.confidence,
          priority: Math.abs(pattern.growthRate) > 25 ? 'critical' : 'high',
          actionability: 'immediate',
          dataPoints: pattern.dataPoints,
          createdAt: new Date(),
        });
      }
      
      if (pattern.trend === 'volatile') {
        insights.push({
          id: this.generateId(),
          type: 'risk',
          category: 'sales',
          observation: `Sales are highly volatile ${pattern.period}`,
          insight: 'Sales volatility indicates inconsistent demand or operational instability',
          recommendation: 'Analyze seasonal patterns, customer segments, and operational factors to stabilize sales',
          explanation: `High volatility in sales makes forecasting difficult and cash flow unpredictable. This could be due to seasonal factors, inconsistent marketing, or operational issues affecting product availability.`,
          confidence: pattern.confidence,
          priority: 'medium',
          actionability: 'short_term',
          dataPoints: pattern.dataPoints,
          createdAt: new Date(),
        });
      }
    });
    
    return insights;
  }
  
  // Generate expense insights
  private generateExpenseInsights(expensePatterns: ExpensePattern[], context?: InsightContext): Insight[] {
    const insights: Insight[] = [];
    
    expensePatterns.forEach(pattern => {
      if (pattern.confidence < 0.5) return;
      
      if (pattern.trend === 'increasing' && pattern.growthRate > 10) {
        insights.push({
          id: this.generateId(),
          type: 'risk',
          category: 'expenses',
          observation: `${pattern.category} expenses are increasing by ${pattern.growthRate.toFixed(1)}%`,
          insight: 'Rising expenses in this category may impact profitability',
          recommendation: 'Review ${pattern.category} expenses for optimization opportunities: negotiate with suppliers, improve efficiency, or eliminate waste',
          explanation: `The ${pattern.growthRate.toFixed(1)}% increase in ${pattern.category} expenses, if not matched by revenue growth, will reduce margins. Common causes include supplier price increases, inefficiencies, or unnecessary spending.`,
          confidence: pattern.confidence,
          priority: pattern.growthRate > 20 ? 'high' : 'medium',
          actionability: 'short_term',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
      
      if (pattern.trend === 'decreasing' && Math.abs(pattern.growthRate) > 10) {
        insights.push({
          id: this.generateId(),
          type: 'opportunity',
          category: 'expenses',
          observation: `${pattern.category} expenses are decreasing by ${Math.abs(pattern.growthRate).toFixed(1)}%`,
          insight: 'Cost reduction in this category improves profitability',
          recommendation: 'Document the cost reduction strategies and apply them to other expense categories',
          explanation: `The ${Math.abs(pattern.growthRate).toFixed(1)}% decrease in ${pattern.category} expenses is positive for margins. Understanding what drove this reduction can help replicate success in other areas.`,
          confidence: pattern.confidence,
          priority: 'medium',
          actionability: 'informational',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
    });
    
    return insights;
  }
  
  // Generate customer behavior insights
  private generateCustomerInsights(customerPatterns: CustomerBehaviorPattern[], context?: InsightContext): Insight[] {
    const insights: Insight[] = [];
    
    customerPatterns.forEach(pattern => {
      if (pattern.confidence < 0.5) return;
      
      if (pattern.pattern === 'late_payer') {
        insights.push({
          id: this.generateId(),
          type: 'risk',
          category: 'customers',
          observation: `${pattern.customerName} has late payment pattern`,
          insight: 'Late payments from this customer create cash flow strain',
          recommendation: 'Implement stricter credit terms, request upfront payment, or reduce credit limit for this customer',
          explanation: `Late payments disrupt cash flow and increase bad debt risk. ${pattern.customerName}'s payment pattern requires action to protect your business cash position.`,
          confidence: pattern.confidence,
          priority: 'high',
          actionability: 'immediate',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
      
      if (pattern.pattern === 'frequent_buyer') {
        insights.push({
          id: this.generateId(),
          type: 'opportunity',
          category: 'customers',
          observation: `${pattern.customerName} is a frequent buyer`,
          insight: 'This customer shows strong loyalty and purchasing frequency',
          recommendation: 'Consider loyalty rewards, volume discounts, or exclusive offers to strengthen relationship and increase lifetime value',
          explanation: `${pattern.customerName}'s frequent purchases indicate satisfaction and loyalty. Investing in this relationship can increase customer lifetime value and provide stable revenue.`,
          confidence: pattern.confidence,
          priority: 'medium',
          actionability: 'short_term',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
      
      if (pattern.pattern === 'declining') {
        insights.push({
          id: this.generateId(),
          type: 'risk',
          category: 'customers',
          observation: `${pattern.customerName} shows declining purchase pattern`,
          insight: 'This customer may be at risk of churn',
          recommendation: 'Reach out to understand concerns, offer incentives, or address service issues',
          explanation: `Declining purchase frequency often precedes customer churn. Proactive engagement can identify issues and potentially retain the customer.`,
          confidence: pattern.confidence,
          priority: 'medium',
          actionability: 'immediate',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
    });
    
    return insights;
  }
  
  // Generate inventory insights
  private generateInventoryInsights(inventoryPatterns: InventoryPattern[], context?: InsightContext): Insight[] {
    const insights: Insight[] = [];
    
    inventoryPatterns.forEach(pattern => {
      if (pattern.confidence < 0.5) return;
      
      if (pattern.pattern === 'slow_moving' || pattern.pattern === 'declining_demand') {
        insights.push({
          id: this.generateId(),
          type: 'risk',
          category: 'inventory',
          observation: `${pattern.productName} has ${pattern.pattern === 'slow_moving' ? 'slow' : 'declining'} demand (turnover: ${pattern.turnoverRate.toFixed(2)})`,
          insight: 'This product is tying up capital with low sales velocity',
          recommendation: 'Reduce future purchase quantities, consider discounts to clear stock, or discontinue if margins are low',
          explanation: `A turnover rate of ${pattern.turnoverRate.toFixed(2)} indicates capital is tied up in slow-moving inventory. This increases holding costs and reduces cash available for higher-performing products.`,
          confidence: pattern.confidence,
          priority: 'medium',
          actionability: 'short_term',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
      
      if (pattern.pattern === 'fast_moving') {
        insights.push({
          id: this.generateId(),
          type: 'opportunity',
          category: 'inventory',
          observation: `${pattern.productName} is fast-moving (turnover: ${pattern.turnoverRate.toFixed(2)})`,
          insight: 'This product has strong demand and high sales velocity',
          recommendation: 'Ensure adequate stock levels to prevent stockouts, consider expanding similar product lines',
          explanation: `High turnover rate of ${pattern.turnoverRate.toFixed(2)} indicates strong demand. Stockouts on fast-moving items result in lost revenue and customer dissatisfaction.`,
          confidence: pattern.confidence,
          priority: 'high',
          actionability: 'immediate',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
      
      if (pattern.pattern === 'increasing_demand') {
        insights.push({
          id: this.generateId(),
          type: 'opportunity',
          category: 'inventory',
          observation: `${pattern.productName} shows increasing demand trend`,
          insight: 'Demand for this product is growing over time',
          recommendation: 'Increase purchase quantities to meet growing demand, consider supplier capacity and lead times',
          explanation: `Increasing demand trend suggests market acceptance and growth potential. Ensuring adequate inventory will capture this opportunity and prevent stockouts.`,
          confidence: pattern.confidence,
          priority: 'high',
          actionability: 'short_term',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
    });
    
    return insights;
  }
  
  // Generate cash flow insights
  private generateCashFlowInsights(cashFlowPattern: CashFlowPattern, context?: InsightContext): Insight[] {
    const insights: Insight[] = [];
    
    if (cashFlowPattern.confidence < 0.5) return insights;
    
    if (cashFlowPattern.pattern === 'tight' || cashFlowPattern.pattern === 'declining') {
      insights.push({
        id: this.generateId(),
        type: 'risk',
        category: 'cash_flow',
        observation: `Cash flow is ${cashFlowPattern.pattern} (avg daily: ₦${cashFlowPattern.averageDailyFlow.toFixed(0)})`,
        insight: 'Cash flow constraints limit operational flexibility and growth',
        recommendation: 'Improve cash collection, delay non-essential payments, secure working capital financing, or reduce inventory holding',
        explanation: `Tight or declining cash flow with average daily flow of ₦${cashFlowPattern.averageDailyFlow.toFixed(0)} creates operational risk. Immediate action is needed to improve cash position through collection acceleration, expense management, or financing.`,
        confidence: cashFlowPattern.confidence,
        priority: 'critical',
        actionability: 'immediate',
        dataPoints: 0,
        createdAt: new Date(),
      });
    }
    
    if (cashFlowPattern.pattern === 'volatile') {
      insights.push({
        id: this.generateId(),
        type: 'risk',
        category: 'cash_flow',
        observation: `Cash flow is highly volatile (volatility: ${(cashFlowPattern.volatility * 100).toFixed(0)}%)`,
        insight: 'Cash flow unpredictability makes planning difficult and increases risk',
        recommendation: 'Build cash reserves, smooth payment terms, improve forecasting, and diversify revenue streams',
        explanation: `High volatility of ${(cashFlowPattern.volatility * 100).toFixed(0)}% makes cash flow unpredictable. This increases the risk of insolvency during low periods and makes planning difficult.`,
        confidence: cashFlowPattern.confidence,
        priority: 'high',
        actionability: 'short_term',
        dataPoints: 0,
        createdAt: new Date(),
      });
    }
    
    if (cashFlowPattern.pattern === 'healthy') {
      insights.push({
        id: this.generateId(),
        type: 'opportunity',
        category: 'cash_flow',
        observation: `Cash flow is healthy and stable`,
        insight: 'Strong cash position provides operational flexibility and growth capacity',
        recommendation: 'Consider strategic investments, expansion opportunities, or debt reduction while maintaining healthy reserves',
        explanation: `Healthy cash flow with low volatility provides a strong foundation for growth. This is an opportunity to invest in expansion, reduce debt, or build reserves for future opportunities.`,
        confidence: cashFlowPattern.confidence,
        priority: 'medium',
        actionability: 'long_term',
        dataPoints: 0,
        createdAt: new Date(),
      });
    }
    
    return insights;
  }
  
  // Generate supplier performance insights
  private generateSupplierInsights(supplierPatterns: SupplierPerformancePattern[], context?: InsightContext): Insight[] {
    const insights: Insight[] = [];
    
    supplierPatterns.forEach(pattern => {
      if (pattern.confidence < 0.5) return;
      
      if (pattern.pattern === 'unreliable') {
        insights.push({
          id: this.generateId(),
          type: 'risk',
          category: 'suppliers',
          observation: `${pattern.supplierName} shows unreliable performance (avg delivery: ${pattern.deliveryTime.toFixed(0)} days)`,
          insight: 'Unreliable supplier creates operational disruptions and inventory risks',
          recommendation: 'Develop backup suppliers, improve communication, or replace with more reliable partners',
          explanation: `${pattern.supplierName}'s unreliable delivery with ${pattern.deliveryTime.toFixed(0)} days average creates stockout risks and operational disruptions. Diversifying suppliers reduces dependency.`,
          confidence: pattern.confidence,
          priority: 'high',
          actionability: 'short_term',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
      
      if (pattern.pattern === 'reliable') {
        insights.push({
          id: this.generateId(),
          type: 'opportunity',
          category: 'suppliers',
          observation: `${pattern.supplierName} is reliable (avg delivery: ${pattern.deliveryTime.toFixed(0)} days, reliability: ${(pattern.reliabilityScore * 100).toFixed(0)}%)`,
          insight: 'This supplier provides consistent and dependable service',
          recommendation: 'Strengthen relationship through volume commitments, strategic partnerships, or preferred supplier status',
          explanation: `${pattern.supplierName}'s reliability with ${pattern.deliveryTime.toFixed(0)} days delivery and ${(pattern.reliabilityScore * 100).toFixed(0)}% reliability score is valuable. Strengthening this relationship can secure better terms and priority service.`,
          confidence: pattern.confidence,
          priority: 'medium',
          actionability: 'informational',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
      
      if (pattern.pattern === 'declining') {
        insights.push({
          id: this.generateId(),
          type: 'risk',
          category: 'suppliers',
          observation: `${pattern.supplierName} performance is declining`,
          insight: 'Declining supplier performance may indicate quality or financial issues',
          recommendation: 'Investigate root cause, increase quality checks, and identify alternative suppliers',
          explanation: `Declining performance from ${pattern.supplierName} may signal quality issues, financial problems, or capacity constraints. Proactive supplier diversification reduces risk.`,
          confidence: pattern.confidence,
          priority: 'high',
          actionability: 'immediate',
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
    });
    
    return insights;
  }
  
  // Generate seasonality insights
  private generateSeasonalityInsights(seasonalityPatterns: any[], context?: InsightContext): Insight[] {
    const insights: Insight[] = [];
    
    seasonalityPatterns.forEach(pattern => {
      if (pattern.confidence < 0.6) return;
      
      insights.push({
        id: this.generateId(),
        type: 'observation',
        category: 'sales',
        observation: `Seasonal pattern detected: ${pattern.peakPeriod} is peak, ${pattern.lowPeriod} is low`,
        insight: 'Business shows clear seasonal demand variation',
        recommendation: 'Plan inventory and staffing around peak periods, build cash reserves during peak for low periods',
        explanation: pattern.description,
        confidence: pattern.confidence,
        priority: 'medium',
        actionability: 'long_term',
        dataPoints: 0,
        createdAt: new Date(),
      });
    });
    
    return insights;
  }
  
  // Get insights by priority
  getInsightsByPriority(insights: Insight[], priority: Insight['priority']): Insight[] {
    return insights.filter(i => i.priority === priority);
  }
  
  // Get insights by category
  getInsightsByCategory(insights: Insight[], category: Insight['category']): Insight[] {
    return insights.filter(i => i.category === category);
  }
  
  // Get insights by type
  getInsightsByType(insights: Insight[], type: Insight['type']): Insight[] {
    return insights.filter(i => i.type === type);
  }
  
  // Get actionable insights
  getActionableInsights(insights: Insight[]): Insight[] {
    return insights.filter(i => i.actionability !== 'informational');
  }
  
  // Format insights for AI response
  formatForAIResponse(insights: Insight[], limit: number = 10): string {
    if (insights.length === 0) {
      return '\n\nNo significant insights detected at this time.';
    }
    
    const topInsights = insights.slice(0, limit);
    let response = '\n\n💡 KEY INSIGHTS:\n';
    
    // Group by type
    const byType = {
      critical: insights.filter(i => i.priority === 'critical'),
      high: insights.filter(i => i.priority === 'high'),
      medium: insights.filter(i => i.priority === 'medium'),
      low: insights.filter(i => i.priority === 'low'),
    };
    
    if (byType.critical.length > 0) {
      response += '\n🚨 CRITICAL:\n';
      byType.critical.slice(0, 3).forEach(insight => {
        response += `• ${insight.observation}\n`;
        response += `  ${insight.recommendation}\n`;
      });
    }
    
    if (byType.high.length > 0) {
      response += '\n⚠️ HIGH PRIORITY:\n';
      byType.high.slice(0, 3).forEach(insight => {
        response += `• ${insight.observation}\n`;
        response += `  ${insight.recommendation}\n`;
      });
    }
    
    if (byType.medium.length > 0) {
      response += '\n📊 MEDIUM PRIORITY:\n';
      byType.medium.slice(0, 2).forEach(insight => {
        response += `• ${insight.observation}\n`;
        response += `  ${insight.recommendation}\n`;
      });
    }
    
    return response;
  }
  
  // Generate summary of insights
  generateSummary(insights: Insight[]): string {
    const critical = insights.filter(i => i.priority === 'critical').length;
    const high = insights.filter(i => i.priority === 'high').length;
    const opportunities = insights.filter(i => i.type === 'opportunity').length;
    const risks = insights.filter(i => i.type === 'risk').length;
    
    return `Detected ${insights.length} insights: ${critical} critical, ${high} high priority. ${opportunities} opportunities, ${risks} risks identified.`;
  }
  
  private getPriorityScore(priority: Insight['priority']): number {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority];
  }
  
  private generateId(): string {
    return `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let insightEngineInstance: InsightEngine | null = null;

export function getInsightEngine(): InsightEngine {
  if (!insightEngineInstance) {
    insightEngineInstance = new InsightEngine();
  }
  return insightEngineInstance;
}
