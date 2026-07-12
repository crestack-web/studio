// MO Proactive Insights - Automatic Business Intelligence
// Automatically notices things and provides proactive insights

export interface BusinessInsight {
  type: 'opportunity' | 'risk' | 'observation' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  category: string;
  message: string;
  actionable: boolean;
  suggestedAction?: string;
  impact?: string;
}

export interface BusinessData {
  sales?: any[];
  products?: any[];
  expenses?: any[];
  customers?: any[];
  suppliers?: any[];
  inventory?: any[];
  cashFlow?: any[];
}

export class ProactiveInsightsEngine {
  
  // Generate insights from business data
  generateInsights(businessData: BusinessData, businessProfile: any): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    
    // Sales insights
    if (businessData.sales && businessData.sales.length > 0) {
      insights.push(...this.analyzeSales(businessData.sales, businessProfile));
    }
    
    // Inventory insights
    if (businessData.products && businessData.products.length > 0) {
      insights.push(...this.analyzeInventory(businessData.products, businessProfile));
    }
    
    // Expense insights
    if (businessData.expenses && businessData.expenses.length > 0) {
      insights.push(...this.analyzeExpenses(businessData.expenses, businessProfile));
    }
    
    // Customer insights
    if (businessData.customers && businessData.customers.length > 0) {
      insights.push(...this.analyzeCustomers(businessData.customers, businessProfile));
    }
    
    // Supplier insights
    if (businessData.suppliers && businessData.suppliers.length > 0) {
      insights.push(...this.analyzeSuppliers(businessData.suppliers, businessProfile));
    }
    
    // Cash flow insights
    if (businessData.cashFlow && businessData.cashFlow.length > 0) {
      insights.push(...this.analyzeCashFlow(businessData.cashFlow, businessProfile));
    }
    
    // General business insights
    insights.push(...this.analyzeGeneralBusiness(businessProfile));
    
    // Sort by priority
    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
  
  // Analyze sales data
  private analyzeSales(sales: any[], profile: any): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    
    // Calculate sales trend
    if (sales.length >= 2) {
      const recentSales = sales.slice(-7); // Last 7 sales
      const totalRecent = recentSales.reduce((sum, sale) => sum + (sale.totalRevenue || 0), 0);
      const avgRecent = totalRecent / recentSales.length;
      
      const olderSales = sales.slice(0, -7);
      if (olderSales.length > 0) {
        const totalOlder = olderSales.reduce((sum, sale) => sum + (sale.totalRevenue || 0), 0);
        const avgOlder = totalOlder / olderSales.length;
        
        const trend = ((avgRecent - avgOlder) / avgOlder) * 100;
        
        if (trend > 20) {
          insights.push({
            type: 'opportunity',
            priority: 'high',
            category: 'Sales',
            message: `Sales trend is up ${trend.toFixed(1)}%. Consider capitalizing on this momentum.`,
            actionable: true,
            suggestedAction: 'Increase inventory for high-performing products',
            impact: 'Could increase revenue by 10-15%',
          });
        } else if (trend < -20) {
          insights.push({
            type: 'risk',
            priority: 'high',
            category: 'Sales',
            message: `Sales trend is down ${Math.abs(trend).toFixed(1)}%. Immediate attention needed.`,
            actionable: true,
            suggestedAction: 'Review pricing, marketing, and product mix',
            impact: 'Prevents further revenue decline',
          });
        }
      }
    }
    
    // Check for declining sales
    const lastSale = sales[sales.length - 1];
    const saleDate = lastSale?.createdAt?.toDate ? lastSale.createdAt.toDate() : new Date(lastSale?.createdAt);
    const daysSinceLastSale = Math.floor((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastSale > 7) {
      insights.push({
        type: 'risk',
        priority: 'high',
        category: 'Sales',
        message: `No sales recorded in ${daysSinceLastSale} days. This is concerning.`,
        actionable: true,
        suggestedAction: 'Review marketing efforts and customer engagement',
        impact: 'Critical for cash flow',
      });
    }
    
    return insights;
  }
  
  // Analyze inventory
  private analyzeInventory(products: any[], profile: any): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let deadStockCount = 0;
    
    products.forEach(product => {
      const stock = product.stock || 0;
      const threshold = product.lowStockThreshold || 10;
      
      if (stock === 0) outOfStockCount++;
      else if (stock <= threshold) lowStockCount++;
      
      // Check for dead stock (no sales in 30 days)
      const lastSaleDate = product.lastSaleDate?.toDate ? product.lastSaleDate.toDate() : new Date(product.lastSaleDate);
      const daysSinceSale = Math.floor((Date.now() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceSale > 30 && stock > 0) deadStockCount++;
    });
    
    if (outOfStockCount > 0) {
      insights.push({
        type: 'risk',
        priority: 'high',
        category: 'Inventory',
        message: `${outOfStockCount} products are out of stock. Lost sales opportunity.`,
        actionable: true,
        suggestedAction: 'Reorder out-of-stock items immediately',
        impact: 'Prevents lost revenue',
      });
    }
    
    if (lowStockCount > products.length * 0.3) {
      insights.push({
        type: 'risk',
        priority: 'medium',
        category: 'Inventory',
        message: `${lowStockCount} products are running low. Proactive reordering needed.`,
        actionable: true,
        suggestedAction: 'Review reorder points and place orders',
        impact: 'Prevents stockouts',
      });
    }
    
    if (deadStockCount > 0) {
      insights.push({
        type: 'opportunity',
        priority: 'medium',
        category: 'Inventory',
        message: `${deadStockCount} products haven't sold in 30 days. Consider clearance.`,
        actionable: true,
        suggestedAction: 'Run promotion or discount to clear dead stock',
        impact: 'Frees up capital for fast-moving items',
      });
    }
    
    // Check if suppliers are recorded
    if (products.length > 0 && (!profile.suppliers || profile.suppliers.length === 0)) {
      insights.push({
        type: 'observation',
        priority: 'medium',
        category: 'Inventory',
        message: 'You have inventory but no suppliers recorded.',
        actionable: true,
        suggestedAction: 'Add suppliers for your products',
        impact: 'Enables better inventory management',
      });
    }
    
    return insights;
  }
  
  // Analyze expenses
  private analyzeExpenses(expenses: any[], profile: any): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    
    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    // Check for unusual expense patterns
    if (expenses.length >= 2) {
      const recentExpenses = expenses.slice(-5);
      const avgRecent = recentExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) / recentExpenses.length;
      
      const olderExpenses = expenses.slice(0, -5);
      if (olderExpenses.length > 0) {
        const avgOlder = olderExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) / olderExpenses.length;
        
        if (avgRecent > avgOlder * 1.5) {
          insights.push({
            type: 'risk',
            priority: 'medium',
            category: 'Expenses',
            message: 'Recent expenses are 50% higher than average. Review spending.',
            actionable: true,
            suggestedAction: 'Review recent expenses and identify cost reduction opportunities',
            impact: 'Improves profit margins',
          });
        }
      }
    }
    
    // Check expense categories
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(exp => {
      const category = exp.category || 'uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + (exp.amount || 0);
    });
    
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      const percentage = (topCategory[1] / totalExpenses) * 100;
      if (percentage > 50) {
        insights.push({
          type: 'observation',
          priority: 'low',
          category: 'Expenses',
          message: `${topCategory[0]} accounts for ${percentage.toFixed(1)}% of expenses.`,
          actionable: true,
          suggestedAction: 'Review if this category can be optimized',
          impact: 'Potential cost savings',
        });
      }
    }
    
    return insights;
  }
  
  // Analyze customers
  private analyzeCustomers(customers: any[], profile: any): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    
    let creditBalanceTotal = 0;
    let overdueCount = 0;
    
    customers.forEach(customer => {
      creditBalanceTotal += customer.currentBalance || 0;
      
      if (customer.currentBalance > 0) {
        const lastPayment = customer.lastPaymentDate?.toDate ? customer.lastPaymentDate.toDate() : new Date(customer.lastPaymentDate);
        const daysSincePayment = Math.floor((Date.now() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSincePayment > 30) overdueCount++;
      }
    });
    
    if (creditBalanceTotal > 50000) {
      insights.push({
        type: 'risk',
        priority: 'high',
        category: 'Customers',
        message: `₦${creditBalanceTotal.toLocaleString()} in outstanding customer credit.`,
        actionable: true,
        suggestedAction: 'Follow up on overdue payments',
        impact: 'Critical for cash flow',
      });
    }
    
    if (overdueCount > 0) {
      insights.push({
        type: 'risk',
        priority: 'high',
        category: 'Customers',
        message: `${overdueCount} customers have overdue payments.`,
        actionable: true,
        suggestedAction: 'Send payment reminders and consider credit policy review',
        impact: 'Reduces bad debt risk',
      });
    }
    
    return insights;
  }
  
  // Analyze suppliers
  private analyzeSuppliers(suppliers: any[], profile: any): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    
    // Check supplier diversity
    if (suppliers.length < 2 && profile.products && profile.products.length > 5) {
      insights.push({
        type: 'risk',
        priority: 'medium',
        category: 'Suppliers',
        message: 'Limited supplier diversity. Single point of failure risk.',
        actionable: true,
        suggestedAction: 'Identify backup suppliers for critical products',
        impact: 'Reduces supply chain risk',
      });
    }
    
    return insights;
  }
  
  // Analyze cash flow
  private analyzeCashFlow(cashFlow: any[], profile: any): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    
    let totalMoneyIn = 0;
    let totalMoneyOut = 0;
    
    cashFlow.forEach(cf => {
      totalMoneyIn += cf.moneyIn || 0;
      totalMoneyOut += cf.moneyOut || 0;
    });
    
    const netCashFlow = totalMoneyIn - totalMoneyOut;
    
    if (netCashFlow < 0) {
      insights.push({
        type: 'risk',
        priority: 'high',
        category: 'Cash Flow',
        message: `Negative cash flow: ₦${Math.abs(netCashFlow).toLocaleString()}.`,
        actionable: true,
        suggestedAction: 'Review expenses and accelerate collections',
        impact: 'Critical for business survival',
      });
    } else if (netCashFlow > 0 && netCashFlow < 20000) {
      insights.push({
        type: 'observation',
        priority: 'low',
        category: 'Cash Flow',
        message: 'Positive but low cash flow. Build buffer.',
        actionable: true,
        suggestedAction: 'Aim for higher positive cash flow',
        impact: 'Builds financial resilience',
      });
    }
    
    return insights;
  }
  
  // Analyze general business state
  private analyzeGeneralBusiness(profile: any): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    
    // Check business stage alignment
    const detectedStage = this.detectBusinessStage(profile);
    if (profile.stage && profile.stage !== detectedStage) {
      insights.push({
        type: 'observation',
        priority: 'low',
        category: 'Business Stage',
        message: `Business may have progressed to ${detectedStage} stage.`,
        actionable: true,
        suggestedAction: 'Update business stage for tailored advice',
        impact: 'Improves recommendation relevance',
      });
    }
    
    // Check for missing critical information
    const missingInfo = [];
    if (!profile.industry) missingInfo.push('industry');
    if (!profile.location) missingInfo.push('location');
    if (profile.openingCapital === undefined) missingInfo.push('capital');
    
    if (missingInfo.length > 0) {
      insights.push({
        type: 'observation',
        priority: 'low',
        category: 'Business Profile',
        message: `Missing business information: ${missingInfo.join(', ')}.`,
        actionable: true,
        suggestedAction: 'Provide missing information for better insights',
        impact: 'Improves advice accuracy',
      });
    }
    
    return insights;
  }
  
  // Detect business stage
  private detectBusinessStage(profile: any): string {
    const hasSales = profile.expectedIncome && profile.expectedIncome > 0;
    const hasStaff = profile.staffCount && profile.staffCount > 0;
    const hasMultipleProducts = profile.products && profile.products.length > 1;
    
    if (!hasSales) return 'idea';
    if (hasSales && !hasStaff) return 'startup';
    if (hasSales && hasStaff && !hasMultipleProducts) return 'growing';
    return 'mature';
  }
  
  // Format insights for AI response
  formatForAIResponse(insights: BusinessInsight[]): string {
    if (insights.length === 0) return '';
    
    let response = '\n\n🔍 PROACTIVE INSIGHTS:\n';
    
    insights.forEach((insight, index) => {
      const icon = insight.type === 'risk' ? '⚠️' : insight.type === 'opportunity' ? '💡' : insight.type === 'recommendation' ? '✅' : '📊';
      response += `\n${icon} [${insight.priority.toUpperCase()}] ${insight.category}: ${insight.message}\n`;
      
      if (insight.suggestedAction) {
        response += `  → Action: ${insight.suggestedAction}\n`;
      }
      
      if (insight.impact) {
        response += `  → Impact: ${insight.impact}\n`;
      }
    });
    
    return response;
  }
}

// Singleton instance
let proactiveInsightsEngineInstance: ProactiveInsightsEngine | null = null;

export function getProactiveInsightsEngine(): ProactiveInsightsEngine {
  if (!proactiveInsightsEngineInstance) {
    proactiveInsightsEngineInstance = new ProactiveInsightsEngine();
  }
  return proactiveInsightsEngineInstance;
}
