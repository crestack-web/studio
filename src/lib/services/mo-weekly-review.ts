// MO Weekly Business Review System - Executive-style summaries
// Automatically generate weekly summaries covering sales, profit, expenses, cash flow, inventory, customers, suppliers, risks, opportunities, and priorities

export interface WeeklyReview {
  weekStart: Date;
  weekEnd: Date;
  businessId: string;
  salesPerformance: SalesPerformance;
  profitTrends: ProfitTrends;
  expenseChanges: ExpenseChanges;
  cashFlowHealth: CashFlowHealth;
  inventoryMovement: InventoryMovement;
  customerActivity: CustomerActivity;
  supplierPerformance: SupplierPerformance;
  risks: Risk[];
  opportunities: Opportunity[];
  recommendedPriorities: string[];
  executiveSummary: string;
  confidence: number;
}

export interface SalesPerformance {
  totalSales: number;
  previousWeekSales: number;
  growthRate: number;
  topProducts: { name: string; amount: number; percentage: number }[];
  salesByDay: { day: string; amount: number }[];
  analysis: string;
}

export interface ProfitTrends {
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  previousWeekMargin: number;
  marginChange: number;
  analysis: string;
}

export interface ExpenseChanges {
  totalExpenses: number;
  previousWeekExpenses: number;
  changeRate: number;
  topExpenseCategories: { category: string; amount: number; percentage: number }[];
  analysis: string;
}

export interface CashFlowHealth {
  netCashFlow: number;
  cashInflow: number;
  cashOutflow: number;
  cashBalance: number;
  previousWeekBalance: number;
  analysis: string;
}

export interface InventoryMovement {
  totalInventoryValue: number;
  itemsSold: number;
  itemsRestocked: number;
  lowStockItems: number;
  overstockItems: number;
  analysis: string;
}

export interface CustomerActivity {
  newCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  averageOrderValue: number;
  overduePayments: number;
  analysis: string;
}

export interface SupplierPerformance {
  activeSuppliers: number;
  onTimeDeliveryRate: number;
  totalOrders: number;
  lateDeliveries: number;
  analysis: string;
}

export interface Risk {
  type: string;
  description: string;
  impact: string;
  likelihood: 'low' | 'medium' | 'high';
  severity: 'low' | 'medium' | 'high';
}

export interface Opportunity {
  type: string;
  description: string;
  potentialImpact: string;
  effort: 'low' | 'medium' | 'high';
}

export interface WeeklyContext {
  businessId: string;
  weekStart: Date;
  weekEnd: Date;
  businessData: {
    sales?: any[];
    expenses?: any[];
    inventory?: any[];
    cashFlow?: any[];
    customers?: any[];
    suppliers?: any[];
  };
  previousWeekData?: any;
  goals: any[];
}

export class WeeklyReviewEngine {
  
  // Generate weekly business review
  async generateWeeklyReview(context: WeeklyContext): Promise<WeeklyReview> {
    const salesPerformance = this.analyzeSalesPerformance(context);
    const profitTrends = this.analyzeProfitTrends(context);
    const expenseChanges = this.analyzeExpenseChanges(context);
    const cashFlowHealth = this.analyzeCashFlowHealth(context);
    const inventoryMovement = this.analyzeInventoryMovement(context);
    const customerActivity = this.analyzeCustomerActivity(context);
    const supplierPerformance = this.analyzeSupplierPerformance(context);
    
    const risks = this.identifyRisks(context, {
      salesPerformance,
      profitTrends,
      expenseChanges,
      cashFlowHealth,
      inventoryMovement,
      customerActivity,
      supplierPerformance,
    });
    
    const opportunities = this.identifyOpportunities(context, {
      salesPerformance,
      profitTrends,
      expenseChanges,
      inventoryMovement,
      customerActivity,
    });
    
    const recommendedPriorities = this.generateRecommendedPriorities(risks, opportunities, context.goals);
    
    const executiveSummary = this.generateExecutiveSummary({
      salesPerformance,
      profitTrends,
      expenseChanges,
      cashFlowHealth,
      inventoryMovement,
      customerActivity,
      supplierPerformance,
      risks,
      opportunities,
      recommendedPriorities,
    });
    
    const confidence = this.calculateOverallConfidence(context);
    
    return {
      weekStart: context.weekStart,
      weekEnd: context.weekEnd,
      businessId: context.businessId,
      salesPerformance,
      profitTrends,
      expenseChanges,
      cashFlowHealth,
      inventoryMovement,
      customerActivity,
      supplierPerformance,
      risks,
      opportunities,
      recommendedPriorities,
      executiveSummary,
      confidence,
    };
  }
  
  // Analyze sales performance
  private analyzeSalesPerformance(context: WeeklyContext): SalesPerformance {
    const sales = context.businessData.sales || [];
    const weekSales = this.filterByDateRange(sales, context.weekStart, context.weekEnd);
    
    const totalSales = weekSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    
    const previousWeekSales = context.previousWeekData?.sales
      ? this.filterByDateRange(context.previousWeekData.sales, this.getPreviousWeekStart(context.weekStart), context.weekStart)
          .reduce((sum, s) => sum + (s.amount || 0), 0)
      : 0;
    
    const growthRate = previousWeekSales > 0 ? (totalSales - previousWeekSales) / previousWeekSales : 0;
    
    // Top products
    const productSales = new Map<string, number>();
    weekSales.forEach(sale => {
      const product = sale.productName || 'Unknown';
      productSales.set(product, (productSales.get(product) || 0) + (sale.amount || 0));
    });
    
    const sortedProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalSales > 0 ? (amount / totalSales) * 100 : 0,
      }));
    
    // Sales by day
    const salesByDay = this.groupSalesByDay(weekSales, context.weekStart);
    
    const analysis = this.generateSalesAnalysis(totalSales, growthRate, sortedProducts);
    
    return {
      totalSales,
      previousWeekSales,
      growthRate,
      topProducts: sortedProducts,
      salesByDay,
      analysis,
    };
  }
  
  // Analyze profit trends
  private analyzeProfitTrends(context: WeeklyContext): ProfitTrends {
    const sales = context.businessData.sales || [];
    const expenses = context.businessData.expenses || [];
    
    const weekSales = this.filterByDateRange(sales, context.weekStart, context.weekEnd);
    const weekExpenses = this.filterByDateRange(expenses, context.weekStart, context.weekEnd);
    
    const revenue = weekSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalExpenses = weekExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const grossProfit = revenue - totalExpenses;
    const netProfit = grossProfit; // Simplified - would include other factors
    const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    
    const previousWeekMargin = context.previousWeekData?.profitMargin || profitMargin;
    const marginChange = profitMargin - previousWeekMargin;
    
    const analysis = this.generateProfitAnalysis(profitMargin, marginChange);
    
    return {
      grossProfit,
      netProfit,
      profitMargin,
      previousWeekMargin,
      marginChange,
      analysis,
    };
  }
  
  // Analyze expense changes
  private analyzeExpenseChanges(context: WeeklyContext): ExpenseChanges {
    const expenses = context.businessData.expenses || [];
    const weekExpenses = this.filterByDateRange(expenses, context.weekStart, context.weekEnd);
    
    const totalExpenses = weekExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const previousWeekExpenses = context.previousWeekData?.expenses
      ? this.filterByDateRange(context.previousWeekData.expenses, this.getPreviousWeekStart(context.weekStart), context.weekStart)
          .reduce((sum, e) => sum + (e.amount || 0), 0)
      : 0;
    
    const changeRate = previousWeekExpenses > 0 ? (totalExpenses - previousWeekExpenses) / previousWeekExpenses : 0;
    
    // Top expense categories
    const categoryExpenses = new Map<string, number>();
    weekExpenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categoryExpenses.set(category, (categoryExpenses.get(category) || 0) + (expense.amount || 0));
    });
    
    const sortedCategories = Array.from(categoryExpenses.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }));
    
    const analysis = this.generateExpenseAnalysis(totalExpenses, changeRate, sortedCategories);
    
    return {
      totalExpenses,
      previousWeekExpenses,
      changeRate,
      topExpenseCategories: sortedCategories,
      analysis,
    };
  }
  
  // Analyze cash flow health
  private analyzeCashFlowHealth(context: WeeklyContext): CashFlowHealth {
    const cashFlow = context.businessData.cashFlow || [];
    const weekCashFlow = this.filterByDateRange(cashFlow, context.weekStart, context.weekEnd);
    
    const cashInflow = weekCashFlow.filter(cf => cf.type === 'inflow').reduce((sum, cf) => sum + (cf.amount || 0), 0);
    const cashOutflow = weekCashFlow.filter(cf => cf.type === 'outflow').reduce((sum, cf) => sum + (cf.amount || 0), 0);
    const netCashFlow = cashInflow - cashOutflow;
    
    const cashBalance = context.previousWeekData?.cashBalance || 0;
    const previousWeekBalance = context.previousWeekData?.previousWeekBalance || cashBalance;
    
    const analysis = this.generateCashFlowAnalysis(netCashFlow, cashBalance);
    
    return {
      netCashFlow,
      cashInflow,
      cashOutflow,
      cashBalance,
      previousWeekBalance,
      analysis,
    };
  }
  
  // Analyze inventory movement
  private analyzeInventoryMovement(context: WeeklyContext): InventoryMovement {
    const inventory = context.businessData.inventory || [];
    
    const totalInventoryValue = inventory.reduce((sum, item) => {
      return sum + ((item.quantity || 0) * (item.cost || 0));
    }, 0);
    
    const itemsSold = context.businessData.sales?.length || 0;
    const itemsRestocked = context.businessData.inventory?.filter(i => i.recentlyRestocked).length || 0;
    
    const lowStockItems = inventory.filter(item => {
      const quantity = item.quantity || 0;
      const minStock = item.minStock || 10;
      return quantity <= minStock;
    }).length;
    
    const overstockItems = inventory.filter(item => {
      const quantity = item.quantity || 0;
      const maxStock = item.maxStock || 100;
      return quantity >= maxStock;
    }).length;
    
    const analysis = this.generateInventoryAnalysis(totalInventoryValue, lowStockItems, overstockItems);
    
    return {
      totalInventoryValue,
      itemsSold,
      itemsRestocked,
      lowStockItems,
      overstockItems,
      analysis,
    };
  }
  
  // Analyze customer activity
  private analyzeCustomerActivity(context: WeeklyContext): CustomerActivity {
    const customers = context.businessData.customers || [];
    const sales = context.businessData.sales || [];
    const weekSales = this.filterByDateRange(sales, context.weekStart, context.weekEnd);
    
    const newCustomers = customers.filter(c => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= context.weekStart && createdAt <= context.weekEnd;
    }).length;
    
    const activeCustomers = new Set(weekSales.map(s => s.customerId)).size;
    const totalRevenue = weekSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const averageOrderValue = activeCustomers > 0 ? totalRevenue / activeCustomers : 0;
    
    const overduePayments = customers.filter(c => {
      const paymentDue = new Date(c.paymentDue);
      const today = new Date();
      return paymentDue < today && !c.paid;
    }).length;
    
    const analysis = this.generateCustomerAnalysis(newCustomers, activeCustomers, averageOrderValue, overduePayments);
    
    return {
      newCustomers,
      activeCustomers,
      totalRevenue,
      averageOrderValue,
      overduePayments,
      analysis,
    };
  }
  
  // Analyze supplier performance
  private analyzeSupplierPerformance(context: WeeklyContext): SupplierPerformance {
    const suppliers = context.businessData.suppliers || [];
    
    const activeSuppliers = suppliers.length;
    const totalOrders = suppliers.reduce((sum, s) => sum + (s.ordersThisWeek || 0), 0);
    const lateDeliveries = suppliers.reduce((sum, s) => sum + (s.lateDeliveriesThisWeek || 0), 0);
    
    const onTimeDeliveryRate = totalOrders > 0 ? ((totalOrders - lateDeliveries) / totalOrders) * 100 : 100;
    
    const analysis = this.generateSupplierAnalysis(onTimeDeliveryRate, lateDeliveries);
    
    return {
      activeSuppliers,
      onTimeDeliveryRate,
      totalOrders,
      lateDeliveries,
      analysis,
    };
  }
  
  // Identify risks
  private identifyRisks(context: WeeklyContext, metrics: any): Risk[] {
    const risks: Risk[] = [];
    
    // Sales decline risk
    if (metrics.salesPerformance.growthRate < -0.1) {
      risks.push({
        type: 'Sales Decline',
        description: `Sales declined by ${(Math.abs(metrics.salesPerformance.growthRate) * 100).toFixed(0)}% this week`,
        impact: 'May indicate market issues or operational problems',
        likelihood: 'medium',
        severity: metrics.salesPerformance.growthRate < -0.2 ? 'high' : 'medium',
      });
    }
    
    // Cash flow risk
    if (metrics.cashFlowHealth.netCashFlow < 0) {
      risks.push({
        type: 'Cash Flow',
        description: 'Negative cash flow this week',
        impact: 'May affect ability to meet obligations',
        likelihood: 'high',
        severity: metrics.cashFlowHealth.cashBalance < 10000 ? 'high' : 'medium',
      });
    }
    
    // Inventory risk
    if (metrics.inventoryMovement.lowStockItems > 3) {
      risks.push({
        type: 'Inventory',
        description: `${metrics.inventoryMovement.lowStockItems} products at low stock`,
        impact: 'Risk of stockouts and lost sales',
        likelihood: 'medium',
        severity: 'medium',
      });
    }
    
    // Credit risk
    if (metrics.customerActivity.overduePayments > 0) {
      risks.push({
        type: 'Credit',
        description: `${metrics.customerActivity.overduePayments} customers with overdue payments`,
        impact: 'Affects cash flow and collection',
        likelihood: 'medium',
        severity: metrics.customerActivity.overduePayments > 5 ? 'high' : 'medium',
      });
    }
    
    return risks;
  }
  
  // Identify opportunities
  private identifyOpportunities(context: WeeklyContext, metrics: any): Opportunity[] {
    const opportunities: Opportunity[] = [];
    
    // Sales growth opportunity
    if (metrics.salesPerformance.growthRate > 0.15) {
      opportunities.push({
        type: 'Sales Growth',
        description: `Strong sales growth of ${(metrics.salesPerformance.growthRate * 100).toFixed(0)}%`,
        potentialImpact: 'Capitalize on successful strategies',
        effort: 'low',
      });
    }
    
    // Top product opportunity
    if (metrics.salesPerformance.topProducts.length > 0) {
      const topProduct = metrics.salesPerformance.topProducts[0];
      if (topProduct.percentage > 30) {
        opportunities.push({
          type: 'Product Focus',
          description: `${topProduct.name} accounts for ${topProduct.percentage.toFixed(0)}% of sales`,
          potentialImpact: 'Optimize inventory and marketing for top performer',
          effort: 'medium',
        });
      }
    }
    
    // Inventory optimization opportunity
    if (metrics.inventoryMovement.overstockItems > 0) {
      opportunities.push({
        type: 'Inventory Optimization',
        description: `${metrics.inventoryMovement.overstockItems} products overstocked`,
        potentialImpact: 'Free up capital through promotions or discounts',
        effort: 'medium',
      });
    }
    
    return opportunities;
  }
  
  // Generate recommended priorities
  private generateRecommendedPriorities(risks: Risk[], opportunities: Opportunity[], goals: any[]): string[] {
    const priorities: string[] = [];
    
    // Address critical risks first
    risks
      .filter(r => r.severity === 'high')
      .forEach(risk => {
        priorities.push(`Address: ${risk.type} - ${risk.description}`);
      });
    
    // Pursue high-impact opportunities
    opportunities
      .filter(o => o.effort === 'low')
      .forEach(opportunity => {
        priorities.push(`Pursue: ${opportunity.type} - ${opportunity.description}`);
      });
    
    // Address medium risks
    risks
      .filter(r => r.severity === 'medium')
      .forEach(risk => {
        priorities.push(`Monitor: ${risk.type} - ${risk.description}`);
      });
    
    // Progress toward goals
    goals
      .filter(g => !g.completed && g.priority === 'high')
      .slice(0, 2)
      .forEach(goal => {
        priorities.push(`Goal: ${goal.title}`);
      });
    
    return priorities.slice(0, 5); // Top 5 priorities
  }
  
  // Generate executive summary
  private generateExecutiveSummary(metrics: any): string {
    const parts: string[] = [];
    
    // Sales performance
    if (metrics.salesPerformance.growthRate > 0) {
      parts.push(`Sales grew by ${(metrics.salesPerformance.growthRate * 100).toFixed(0)}% to ₦${metrics.salesPerformance.totalSales.toLocaleString()}`);
    } else {
      parts.push(`Sales declined by ${(Math.abs(metrics.salesPerformance.growthRate) * 100).toFixed(0)}% to ₦${metrics.salesPerformance.totalSales.toLocaleString()}`);
    }
    
    // Profit margin
    parts.push(`Profit margin is ${metrics.profitTrends.profitMargin.toFixed(1)}%`);
    
    // Cash flow
    if (metrics.cashFlowHealth.netCashFlow >= 0) {
      parts.push(`Positive cash flow of ₦${metrics.cashFlowHealth.netCashFlow.toLocaleString()}`);
    } else {
      parts.push(`Negative cash flow of ₦${Math.abs(metrics.cashFlowHealth.netCashFlow).toLocaleString()}`);
    }
    
    // Risks and opportunities
    if (metrics.risks.length > 0) {
      parts.push(`${metrics.risks.length} risk(s) identified`);
    }
    
    if (metrics.opportunities.length > 0) {
      parts.push(`${metrics.opportunities.length} opportunity(ies) available`);
    }
    
    return parts.join('. ');
  }
  
  // Helper methods
  private filterByDateRange(items: any[], startDate: Date, endDate: Date): any[] {
    return items.filter(item => {
      const itemDate = new Date(item.date || item.createdAt || item.timestamp);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }
  
  private getPreviousWeekStart(weekStart: Date): Date {
    const date = new Date(weekStart);
    date.setDate(date.getDate() - 7);
    return date;
  }
  
  private groupSalesByDay(sales: any[], weekStart: Date): { day: string; amount: number }[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailySales = new Map<string, number>();
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.date || sale.createdAt);
      const dayName = days[saleDate.getDay()];
      dailySales.set(dayName, (dailySales.get(dayName) || 0) + (sale.amount || 0));
    });
    
    return Array.from(dailySales.entries()).map(([day, amount]) => ({ day, amount }));
  }
  
  private generateSalesAnalysis(totalSales: number, growthRate: number, topProducts: any[]): string {
    if (growthRate > 0.1) {
      return `Strong sales performance with ${(growthRate * 100).toFixed(0)}% growth. Top performer: ${topProducts[0]?.name || 'N/A'}`;
    } else if (growthRate < -0.1) {
      return `Sales declined by ${(Math.abs(growthRate) * 100).toFixed(0)}%. Investigate causes and consider corrective actions.`;
    }
    return 'Sales performance is stable. Continue monitoring trends.';
  }
  
  private generateProfitAnalysis(margin: number, change: number): string {
    if (change > 2) {
      return `Profit margin improved by ${change.toFixed(1)} percentage points. Good cost control or pricing effectiveness.`;
    } else if (change < -2) {
      return `Profit margin declined by ${Math.abs(change).toFixed(1)} percentage points. Review costs and pricing.`;
    }
    return 'Profit margin is stable. Continue monitoring efficiency.';
  }
  
  private generateExpenseAnalysis(totalExpenses: number, changeRate: number, categories: any[]): string {
    if (changeRate > 0.15) {
      return `Expenses increased by ${(changeRate * 100).toFixed(0)}%. Top category: ${categories[0]?.category || 'N/A'}`;
    } else if (changeRate < -0.1) {
      return `Expenses decreased by ${(Math.abs(changeRate) * 100).toFixed(0)}%. Good cost management.`;
    }
    return 'Expense levels are stable.';
  }
  
  private generateCashFlowAnalysis(netCashFlow: number, balance: number): string {
    if (netCashFlow < 0) {
      return `Negative cash flow of ₦${Math.abs(netCashFlow).toLocaleString()}. Current balance: ₦${balance.toLocaleString()}`;
    }
    return `Positive cash flow of ₦${netCashFlow.toLocaleString()}. Current balance: ₦${balance.toLocaleString()}`;
  }
  
  private generateInventoryAnalysis(value: number, lowStock: number, overstock: number): string {
    const parts: string[] = [];
    parts.push(`Total inventory value: ₦${value.toLocaleString()}`);
    if (lowStock > 0) parts.push(`${lowStock} items at low stock`);
    if (overstock > 0) parts.push(`${overstock} items overstocked`);
    return parts.join('. ');
  }
  
  private generateCustomerAnalysis(newCustomers: number, activeCustomers: number, avgOrder: number, overdue: number): string {
    const parts: string[] = [];
    if (newCustomers > 0) parts.push(`${newCustomers} new customer(s)`);
    parts.push(`${activeCustomers} active customer(s)`);
    parts.push(`Average order: ₦${avgOrder.toFixed(0)}`);
    if (overdue > 0) parts.push(`${overdue} overdue payment(s)`);
    return parts.join('. ');
  }
  
  private generateSupplierAnalysis(onTimeRate: number, lateDeliveries: number): string {
    if (onTimeRate < 80) {
      return `On-time delivery rate of ${onTimeRate.toFixed(0)}% is below target. ${lateDeliveries} late delivery(ies) this week.`;
    }
    return `On-time delivery rate of ${onTimeRate.toFixed(0)}% is good. Supplier performance is reliable.`;
  }
  
  private calculateOverallConfidence(context: WeeklyContext): number {
    let confidence = 0.7;
    
    // Higher confidence with more data
    const dataPoints = Object.values(context.businessData).filter(data => data && data.length > 0).length;
    confidence += dataPoints * 0.03;
    
    return Math.min(0.95, confidence);
  }
  
  // Format for display
  formatForDisplay(review: WeeklyReview): string {
    let response = `\n\n📊 WEEKLY BUSINESS REVIEW\n`;
    response += `${review.weekStart.toLocaleDateString()} - ${review.weekEnd.toLocaleDateString()}\n\n`;
    
    response += `📈 EXECUTIVE SUMMARY\n`;
    response += `${review.executiveSummary}\n\n`;
    
    response += `💰 SALES PERFORMANCE\n`;
    response += `Total: ₦${review.salesPerformance.totalSales.toLocaleString()}\n`;
    response += `Growth: ${(review.salesPerformance.growthRate * 100).toFixed(1)}%\n`;
    response += `${review.salesPerformance.analysis}\n\n`;
    
    response += `📊 PROFIT TRENDS\n`;
    response += `Gross Profit: ₦${review.profitTrends.grossProfit.toLocaleString()}\n`;
    response += `Margin: ${review.profitTrends.profitMargin.toFixed(1)}%\n`;
    response += `${review.profitTrends.analysis}\n\n`;
    
    response += `💸 EXPENSE CHANGES\n`;
    response += `Total: ₦${review.expenseChanges.totalExpenses.toLocaleString()}\n`;
    response += `Change: ${(review.expenseChanges.changeRate * 100).toFixed(1)}%\n`;
    response += `${review.expenseChanges.analysis}\n\n`;
    
    response += `💵 CASH FLOW HEALTH\n`;
    response += `Net: ₦${review.cashFlowHealth.netCashFlow.toLocaleString()}\n`;
    response += `Balance: ₦${review.cashFlowHealth.cashBalance.toLocaleString()}\n`;
    response += `${review.cashFlowHealth.analysis}\n\n`;
    
    if (review.risks.length > 0) {
      response += `⚠️ RISKS\n`;
      review.risks.forEach(risk => {
        response += `• ${risk.type}: ${risk.description} (${risk.severity})\n`;
      });
      response += '\n';
    }
    
    if (review.opportunities.length > 0) {
      response += `🎯 OPPORTUNITIES\n`;
      review.opportunities.forEach(opp => {
        response += `• ${opp.type}: ${opp.description}\n`;
      });
      response += '\n';
    }
    
    response += `📋 RECOMMENDED PRIORITIES\n`;
    review.recommendedPriorities.forEach((priority, index) => {
      response += `${index + 1}. ${priority}\n`;
    });
    
    response += `\n📊 Confidence: ${(review.confidence * 100).toFixed(0)}%\n`;
    
    return response;
  }
}

// Singleton instance
let weeklyReviewEngineInstance: WeeklyReviewEngine | null = null;

export function getWeeklyReviewEngine(): WeeklyReviewEngine {
  if (!weeklyReviewEngineInstance) {
    weeklyReviewEngineInstance = new WeeklyReviewEngine();
  }
  return weeklyReviewEngineInstance;
}
