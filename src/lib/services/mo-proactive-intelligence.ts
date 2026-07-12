// MO Proactive Intelligence Engine - Continuous monitoring and proactive insights
// MO should not wait for business owners to discover problems. MO should discover them first.

export type InsightType = 
  | 'risk'
  | 'opportunity'
  | 'warning'
  | 'recommendation'
  | 'achievement'
  | 'trend'
  | 'anomaly'
  | 'prediction';

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

export type DataSource = 
  | 'sales'
  | 'expenses'
  | 'inventory'
  | 'cash_flow'
  | 'customers'
  | 'suppliers'
  | 'credit'
  | 'production'
  | 'warehouses'
  | 'staff'
  | 'reports'
  | 'conversations'
  | 'goals';

export interface BusinessInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  source: DataSource;
  title: string;
  description: string;
  impact: string;
  confidence: number; // 0-1
  evidence: string[];
  timestamp: Date;
  acknowledged: boolean;
  actionTaken?: string;
  relatedInsights: string[];
}

export interface MonitoringContext {
  businessId: string;
  businessData: {
    sales?: any[];
    expenses?: any[];
    inventory?: any[];
    cashFlow?: any[];
    customers?: any[];
    suppliers?: any[];
    credit?: any[];
    production?: any[];
    warehouses?: any[];
    staff?: any[];
    reports?: any[];
    conversations?: any[];
    goals?: any[];
  };
  previousInsights: BusinessInsight[];
  knowledgeGraph: any;
  timestamp: Date;
}

export interface ProactiveAnalysisResult {
  insights: BusinessInsight[];
  summary: string;
  priorityActions: string[];
  confidence: number;
}

export class ProactiveIntelligenceEngine {
  
  // Analyze all business data sources for proactive insights
  async analyzeBusiness(context: MonitoringContext): Promise<ProactiveAnalysisResult> {
    const insights: BusinessInsight[] = [];
    
    // Analyze each data source
    if (context.businessData.sales) {
      const salesInsights = await this.analyzeSales(context.businessData.sales, context);
      insights.push(...salesInsights);
    }
    
    if (context.businessData.inventory) {
      const inventoryInsights = await this.analyzeInventory(context.businessData.inventory, context);
      insights.push(...inventoryInsights);
    }
    
    if (context.businessData.cashFlow) {
      const cashFlowInsights = await this.analyzeCashFlow(context.businessData.cashFlow, context);
      insights.push(...cashFlowInsights);
    }
    
    if (context.businessData.customers) {
      const customerInsights = await this.analyzeCustomers(context.businessData.customers, context);
      insights.push(...customerInsights);
    }
    
    if (context.businessData.suppliers) {
      const supplierInsights = await this.analyzeSuppliers(context.businessData.suppliers, context);
      insights.push(...supplierInsights);
    }
    
    if (context.businessData.expenses) {
      const expenseInsights = await this.analyzeExpenses(context.businessData.expenses, context);
      insights.push(...expenseInsights);
    }
    
    if (context.businessData.credit) {
      const creditInsights = await this.analyzeCredit(context.businessData.credit, context);
      insights.push(...creditInsights);
    }
    
    // Prioritize insights
    const prioritizedInsights = this.prioritizeInsights(insights);
    
    // Generate summary
    const summary = this.generateSummary(prioritizedInsights, context);
    
    // Extract priority actions
    const priorityActions = this.extractPriorityActions(prioritizedInsights);
    
    return {
      insights: prioritizedInsights,
      summary,
      priorityActions,
      confidence: this.calculateOverallConfidence(prioritizedInsights),
    };
  }
  
  // Analyze sales data for insights
  private async analyzeSales(sales: any[], context: MonitoringContext): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];
    
    if (sales.length < 2) {
      return insights; // Need historical data
    }
    
    // Calculate trends
    const recentSales = sales.slice(-7); // Last 7 days
    const previousSales = sales.slice(-14, -7); // Previous 7 days
    
    const recentTotal = recentSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const previousTotal = previousSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    
    const growthRate = (recentTotal - previousTotal) / previousTotal;
    
    // Declining sales trend
    if (growthRate < -0.15) {
      insights.push({
        id: this.generateId(),
        type: 'warning',
        priority: 'high',
        source: 'sales',
        title: 'Sales Decline Detected',
        description: `Sales have declined by ${(Math.abs(growthRate) * 100).toFixed(0)}% compared to the previous week.`,
        impact: 'This trend may indicate market changes, competition, or operational issues.',
        confidence: 0.8,
        evidence: [`Recent 7-day sales: ₦${recentTotal.toLocaleString()}`, `Previous 7-day sales: ₦${previousTotal.toLocaleString()}`],
        timestamp: new Date(),
        acknowledged: false,
        relatedInsights: [],
      });
    }
    
    // Strong sales growth
    if (growthRate > 0.25) {
      insights.push({
        id: this.generateId(),
        type: 'achievement',
        priority: 'medium',
        source: 'sales',
        title: 'Strong Sales Growth',
        description: `Sales have increased by ${(growthRate * 100).toFixed(0)}% compared to the previous week.`,
        impact: 'This growth may indicate successful strategies or market opportunities.',
        confidence: 0.85,
        evidence: [`Recent 7-day sales: ₦${recentTotal.toLocaleString()}`, `Previous 7-day sales: ₦${previousTotal.toLocaleString()}`],
        timestamp: new Date(),
        acknowledged: false,
        relatedInsights: [],
      });
    }
    
    // Top performing products
    const productSales = new Map<string, number>();
    recentSales.forEach(sale => {
      const product = sale.productName || 'Unknown';
      productSales.set(product, (productSales.get(product) || 0) + (sale.amount || 0));
    });
    
    const sortedProducts = Array.from(productSales.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedProducts.length > 0) {
      const topProduct = sortedProducts[0];
      const topProductShare = topProduct[1] / recentTotal;
      
      if (topProductShare > 0.5) {
        insights.push({
          id: this.generateId(),
          type: 'risk',
          priority: 'medium',
          source: 'sales',
          title: 'High Product Concentration',
          description: `${topProduct[0]} accounts for ${(topProductShare * 100).toFixed(0)}% of recent sales.`,
          impact: 'High concentration creates dependency risk. Consider diversifying product offerings.',
          confidence: 0.75,
          evidence: [`Top product: ${topProduct[0]} (₦${topProduct[1].toLocaleString()})`, `Total sales: ₦${recentTotal.toLocaleString()}`],
          timestamp: new Date(),
          acknowledged: false,
          relatedInsights: [],
        });
      }
    }
    
    return insights;
  }
  
  // Analyze inventory data for insights
  private async analyzeInventory(inventory: any[], context: MonitoringContext): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];
    
    if (!inventory || inventory.length === 0) {
      return insights;
    }
    
    // Check for low stock items
    const lowStockItems = inventory.filter(item => {
      const quantity = item.quantity || 0;
      const minStock = item.minStock || 10;
      return quantity <= minStock;
    });
    
    if (lowStockItems.length > 0) {
      insights.push({
        id: this.generateId(),
        type: 'warning',
        priority: lowStockItems.length > 5 ? 'high' : 'medium',
        source: 'inventory',
        title: 'Low Stock Alert',
        description: `${lowStockItems.length} product(s) are at or below minimum stock level.`,
        impact: 'Stockouts may lead to lost sales and customer dissatisfaction.',
        confidence: 0.9,
        evidence: lowStockItems.slice(0, 5).map(item => 
          `${item.name}: ${item.quantity} units (min: ${item.minStock})`
        ),
        timestamp: new Date(),
        acknowledged: false,
        relatedInsights: [],
      });
    }
    
    // Check for overstock items
    const overstockItems = inventory.filter(item => {
      const quantity = item.quantity || 0;
      const maxStock = item.maxStock || 100;
      return quantity >= maxStock;
    });
    
    if (overstockItems.length > 0) {
      insights.push({
        id: this.generateId(),
        type: 'opportunity',
        priority: 'medium',
        source: 'inventory',
        title: 'Overstock Detected',
        description: `${overstockItems.length} product(s) exceed maximum stock level.`,
        impact: 'Excess inventory ties up capital and may lead to waste. Consider promotions or discounts.',
        confidence: 0.8,
        evidence: overstockItems.slice(0, 5).map(item => 
          `${item.name}: ${item.quantity} units (max: ${item.maxStock})`
        ),
        timestamp: new Date(),
        acknowledged: false,
        relatedInsights: [],
      });
    }
    
    return insights;
  }
  
  // Analyze cash flow data for insights
  private async analyzeCashFlow(cashFlow: any[], context: MonitoringContext): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];
    
    if (cashFlow.length < 2) {
      return insights;
    }
    
    // Calculate cash flow trend
    const recentCashFlow = cashFlow.slice(-7);
    const previousCashFlow = cashFlow.slice(-14, -7);
    
    const recentInflow = recentCashFlow.filter(cf => cf.type === 'inflow').reduce((sum, cf) => sum + (cf.amount || 0), 0);
    const recentOutflow = recentCashFlow.filter(cf => cf.type === 'outflow').reduce((sum, cf) => sum + (cf.amount || 0), 0);
    const recentNet = recentInflow - recentOutflow;
    
    const previousInflow = previousCashFlow.filter(cf => cf.type === 'inflow').reduce((sum, cf) => sum + (cf.amount || 0), 0);
    const previousOutflow = previousCashFlow.filter(cf => cf.type === 'outflow').reduce((sum, cf) => sum + (cf.amount || 0), 0);
    const previousNet = previousInflow - previousOutflow;
    
    // Negative cash flow trend
    if (recentNet < 0 && previousNet > 0) {
      insights.push({
        id: this.generateId(),
        type: 'risk',
        priority: 'critical',
        source: 'cash_flow',
        title: 'Negative Cash Flow',
        description: 'Cash flow has turned negative in the recent period.',
        impact: 'Negative cash flow may indicate liquidity problems. Review expenses and collections urgently.',
        confidence: 0.85,
        evidence: [
          `Recent net cash flow: ₦${recentNet.toLocaleString()}`,
          `Previous net cash flow: ₦${previousNet.toLocaleString()}`,
          `Recent inflow: ₦${recentInflow.toLocaleString()}`,
          `Recent outflow: ₦${recentOutflow.toLocaleString()}`,
        ],
        timestamp: new Date(),
        acknowledged: false,
        relatedInsights: [],
      });
    }
    
    // Declining cash flow
    if (recentNet < previousNet * 0.7) {
      insights.push({
        id: this.generateId(),
        type: 'warning',
        priority: 'high',
        source: 'cash_flow',
        title: 'Cash Flow Decline',
        description: `Cash flow has declined by ${((1 - recentNet / previousNet) * 100).toFixed(0)}% compared to previous period.`,
        impact: 'Declining cash flow may indicate operational issues or changing business conditions.',
        confidence: 0.75,
        evidence: [
          `Recent net cash flow: ₦${recentNet.toLocaleString()}`,
          `Previous net cash flow: ₦${previousNet.toLocaleString()}`,
        ],
        timestamp: new Date(),
        acknowledged: false,
        relatedInsights: [],
      });
    }
    
    return insights;
  }
  
  // Analyze customer data for insights
  private async analyzeCustomers(customers: any[], context: MonitoringContext): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];
    
    if (!customers || customers.length === 0) {
      return insights;
    }
    
    // Check for overdue payments
    const overdueCustomers = customers.filter(customer => {
      const paymentDue = customer.paymentDue || new Date();
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - paymentDue.getTime()) / (1000 * 60 * 60 * 24));
      return daysOverdue > 7;
    });
    
    if (overdueCustomers.length > 0) {
      insights.push({
        id: this.generateId(),
        type: 'warning',
        priority: overdueCustomers.length > 3 ? 'high' : 'medium',
        source: 'customers',
        title: 'Overdue Payments Detected',
        description: `${overdueCustomers.length} customer(s) have overdue payments beyond 7 days.`,
        impact: 'Overdue payments affect cash flow. Consider follow-up actions.',
        confidence: 0.9,
        evidence: overdueCustomers.slice(0, 5).map(customer => 
          `${customer.name}: ₦${customer.amountDue?.toLocaleString() || '0'} overdue`
        ),
        timestamp: new Date(),
        acknowledged: false,
        relatedInsights: [],
      });
    }
    
    // Check for customer churn risk (decreased activity)
    // This would require historical activity data
    
    return insights;
  }
  
  // Analyze supplier data for insights
  private async analyzeSuppliers(suppliers: any[], context: MonitoringContext): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];
    
    if (!suppliers || suppliers.length === 0) {
      return insights;
    }
    
    // Check for supplier reliability issues
    const unreliableSuppliers = suppliers.filter(supplier => {
      const onTimeDelivery = supplier.onTimeDeliveryRate || 1;
      return onTimeDelivery < 0.8;
    });
    
    if (unreliableSuppliers.length > 0) {
      insights.push({
        id: this.generateId(),
        type: 'risk',
        priority: 'medium',
        source: 'suppliers',
        title: 'Supplier Reliability Concerns',
        description: `${unreliableSuppliers.length} supplier(s) have on-time delivery rates below 80%.`,
        impact: 'Unreliable suppliers may cause stockouts and operational disruptions.',
        confidence: 0.8,
        evidence: unreliableSuppliers.slice(0, 5).map(supplier => 
          `${supplier.name}: ${(supplier.onTimeDeliveryRate * 100).toFixed(0)}% on-time delivery`
        ),
        timestamp: new Date(),
        acknowledged: false,
        relatedInsights: [],
      });
    }
    
    return insights;
  }
  
  // Analyze expense data for insights
  private async analyzeExpenses(expenses: any[], context: MonitoringContext): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];
    
    if (expenses.length < 2) {
      return insights;
    }
    
    // Calculate expense trend
    const recentExpenses = expenses.slice(-7);
    const previousExpenses = expenses.slice(-14, -7);
    
    const recentTotal = recentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const previousTotal = previousExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const growthRate = (recentTotal - previousTotal) / previousTotal;
    
    // Rising expenses
    if (growthRate > 0.2) {
      insights.push({
        id: this.generateId(),
        type: 'warning',
        priority: 'high',
        source: 'expenses',
        title: 'Rising Expenses',
        description: `Expenses have increased by ${(growthRate * 100).toFixed(0)}% compared to the previous week.`,
        impact: 'Rising expenses may impact profitability. Review expense categories for optimization opportunities.',
        confidence: 0.8,
        evidence: [
          `Recent expenses: ₦${recentTotal.toLocaleString()}`,
          `Previous expenses: ₦${previousTotal.toLocaleString()}`,
        ],
        timestamp: new Date(),
        acknowledged: false,
        relatedInsights: [],
      });
    }
    
    return insights;
  }
  
  // Analyze credit data for insights
  private async analyzeCredit(credit: any[], context: MonitoringContext): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];
    
    if (!credit || credit.length === 0) {
      return insights;
    }
    
    // Check for high credit exposure
    const highCreditCustomers = credit.filter(c => {
      const creditUsed = c.creditUsed || 0;
      const creditLimit = c.creditLimit || 0;
      return creditLimit > 0 && (creditUsed / creditLimit) > 0.8;
    });
    
    if (highCreditCustomers.length > 0) {
      insights.push({
        id: this.generateId(),
        type: 'risk',
        priority: 'medium',
        source: 'credit',
        title: 'High Credit Utilization',
        description: `${highCreditCustomers.length} customer(s) are using more than 80% of their credit limit.`,
        impact: 'High credit utilization increases risk. Consider reviewing credit policies.',
        confidence: 0.8,
        evidence: highCreditCustomers.slice(0, 5).map(c => 
          `${c.customerName}: ${(c.creditUsed / c.creditLimit * 100).toFixed(0)}% utilized`
        ),
        timestamp: new Date(),
        acknowledged: false,
        relatedInsights: [],
      });
    }
    
    return insights;
  }
  
  // Prioritize insights based on impact and urgency
  private prioritizeInsights(insights: BusinessInsight[]): BusinessInsight[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    return insights.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // Within same priority, sort by confidence
      return b.confidence - a.confidence;
    });
  }
  
  // Generate summary of insights
  private generateSummary(insights: BusinessInsight[], context: MonitoringContext): string {
    if (insights.length === 0) {
      return 'Business operations are stable. No significant issues detected.';
    }
    
    const criticalCount = insights.filter(i => i.priority === 'critical').length;
    const highCount = insights.filter(i => i.priority === 'high').length;
    const riskCount = insights.filter(i => i.type === 'risk').length;
    const opportunityCount = insights.filter(i => i.type === 'opportunity').length;
    
    const parts: string[] = [];
    
    if (criticalCount > 0) {
      parts.push(`${criticalCount} critical issue(s) require immediate attention`);
    }
    
    if (highCount > 0) {
      parts.push(`${highCount} high-priority item(s) should be addressed soon`);
    }
    
    if (riskCount > 0) {
      parts.push(`${riskCount} risk(s) identified`);
    }
    
    if (opportunityCount > 0) {
      parts.push(`${opportunityCount} opportunity(ies) for improvement`);
    }
    
    return parts.join('. ');
  }
  
  // Extract priority actions from insights
  private extractPriorityActions(insights: BusinessInsight[]): string[] {
    const actions: string[] = [];
    
    insights.slice(0, 5).forEach(insight => {
      if (insight.priority === 'critical' || insight.priority === 'high') {
        actions.push(insight.impact);
      }
    });
    
    return actions;
  }
  
  // Calculate overall confidence in analysis
  private calculateOverallConfidence(insights: BusinessInsight[]): number {
    if (insights.length === 0) {
      return 0.5;
    }
    
    const totalConfidence = insights.reduce((sum, insight) => sum + insight.confidence, 0);
    return totalConfidence / insights.length;
  }
  
  // Generate unique ID
  private generateId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let proactiveIntelligenceEngineInstance: ProactiveIntelligenceEngine | null = null;

export function getProactiveIntelligenceEngine(): ProactiveIntelligenceEngine {
  if (!proactiveIntelligenceEngineInstance) {
    proactiveIntelligenceEngineInstance = new ProactiveIntelligenceEngine();
  }
  return proactiveIntelligenceEngineInstance;
}
