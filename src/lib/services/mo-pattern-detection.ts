// MO Pattern Detection Engine - Automatic Trend Analysis
// Continuously analyzes business data to discover patterns

export interface SalesPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'seasonal';
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  growthRate: number;
  confidence: number;
  description: string;
  dataPoints: number;
  period: string;
}

export interface ExpensePattern {
  category: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  growthRate: number;
  confidence: number;
  description: string;
}

export interface CustomerBehaviorPattern {
  customerId: string;
  customerName: string;
  pattern: 'frequent_buyer' | 'seasonal_buyer' | 'declining' | 'growing' | 'late_payer' | 'early_payer' | 'regular_buyer';
  description: string;
  confidence: number;
}

export interface InventoryPattern {
  productId: string;
  productName: string;
  pattern: 'fast_moving' | 'slow_moving' | 'seasonal' | 'declining_demand' | 'increasing_demand' | 'stable';
  turnoverRate: number;
  description: string;
  confidence: number;
}

export interface CashFlowPattern {
  pattern: 'healthy' | 'tight' | 'volatile' | 'seasonal' | 'declining' | 'stable';
  description: string;
  confidence: number;
  averageDailyFlow: number;
  volatility: number;
}

export interface SupplierPerformancePattern {
  supplierId: string;
  supplierName: string;
  pattern: 'reliable' | 'unreliable' | 'improving' | 'declining' | 'expensive' | 'competitive' | 'unknown' | 'stable';
  deliveryTime: number;
  reliabilityScore: number;
  description: string;
  confidence: number;
}

export interface SeasonalityPattern {
  type: 'sales' | 'expenses' | 'inventory' | 'cash_flow';
  peakPeriod: string;
  lowPeriod: string;
  description: string;
  confidence: number;
}

export interface DetectedPatterns {
  sales: SalesPattern[];
  expenses: ExpensePattern[];
  customerBehavior: CustomerBehaviorPattern[];
  inventory: InventoryPattern[];
  cashFlow: CashFlowPattern;
  supplierPerformance: SupplierPerformancePattern[];
  seasonality: SeasonalityPattern[];
  lastAnalyzed: Date;
}

export class PatternDetectionEngine {
  
  // Analyze all patterns from business data
  analyzePatterns(businessData: any): DetectedPatterns {
    const patterns: DetectedPatterns = {
      sales: this.analyzeSalesPatterns(businessData.sales || []),
      expenses: this.analyzeExpensePatterns(businessData.expenses || []),
      customerBehavior: this.analyzeCustomerBehaviorPatterns(businessData.customers || [], businessData.sales || []),
      inventory: this.analyzeInventoryPatterns(businessData.products || [], businessData.sales || []),
      cashFlow: this.analyzeCashFlowPatterns(businessData.cashFlow || []),
      supplierPerformance: this.analyzeSupplierPerformancePatterns(businessData.suppliers || [], businessData.expenses || []),
      seasonality: this.analyzeSeasonalityPatterns(businessData.sales || []),
      lastAnalyzed: new Date(),
    };
    
    return patterns;
  }
  
  // Analyze sales patterns
  private analyzeSalesPatterns(sales: any[]): SalesPattern[] {
    const patterns: SalesPattern[] = [];
    
    if (sales.length < 3) return patterns;
    
    // Group by date
    const salesByDate = this.groupByDate(sales);
    const dates = Object.keys(salesByDate).sort();
    
    // Calculate daily trend
    if (dates.length >= 7) {
      const dailyTrend = this.calculateTrend(
        dates.map(date => salesByDate[date].reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0))
      );
      
      patterns.push({
        type: 'daily',
        trend: dailyTrend.trend,
        growthRate: dailyTrend.growthRate,
        confidence: this.calculateConfidence(dates.length, 30),
        description: this.generateSalesTrendDescription(dailyTrend, 'daily'),
        dataPoints: dates.length,
        period: 'last 7+ days',
      });
    }
    
    // Calculate weekly trend
    if (dates.length >= 14) {
      const weeklyData = this.groupByWeek(salesByDate);
      const weeklyTrend = this.calculateTrend(
        Object.values(weeklyData).map((week: any) => 
          week.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0)
        )
      );
      
      patterns.push({
        type: 'weekly',
        trend: weeklyTrend.trend,
        growthRate: weeklyTrend.growthRate,
        confidence: this.calculateConfidence(Object.keys(weeklyData).length, 12),
        description: this.generateSalesTrendDescription(weeklyTrend, 'weekly'),
        dataPoints: Object.keys(weeklyData).length,
        period: 'last 2+ weeks',
      });
    }
    
    // Check for specific day patterns
    const dayPatterns = this.analyzeDayOfWeekPatterns(salesByDate);
    if (dayPatterns) {
      patterns.push({
        type: 'daily',
        trend: 'stable',
        growthRate: 0,
        confidence: dayPatterns.confidence,
        description: dayPatterns.description,
        dataPoints: dates.length,
        period: 'day-of-week pattern',
      });
    }
    
    return patterns;
  }
  
  // Analyze expense patterns
  private analyzeExpensePatterns(expenses: any[]): ExpensePattern[] {
    const patterns: ExpensePattern[] = [];
    
    if (expenses.length < 3) return patterns;
    
    // Group by category
    const expensesByCategory = this.groupByCategory(expenses);
    
    Object.entries(expensesByCategory).forEach(([category, categoryExpenses]) => {
      if (categoryExpenses.length < 2) return;
      
      const amounts = categoryExpenses.map((e: any) => e.amount || 0);
      const trend = this.calculateTrend(amounts);
      
      patterns.push({
        category,
        trend: trend.trend,
        growthRate: trend.growthRate,
        confidence: this.calculateConfidence(categoryExpenses.length, 5),
        description: this.generateExpenseTrendDescription(category, trend),
      });
    });
    
    return patterns;
  }
  
  // Analyze customer behavior patterns
  private analyzeCustomerBehaviorPatterns(customers: any[], sales: any[]): CustomerBehaviorPattern[] {
    const patterns: CustomerBehaviorPattern[] = [];
    
    if (customers.length === 0) return patterns;
    
    // Group sales by customer
    const salesByCustomer = this.groupSalesByCustomer(sales);
    
    customers.forEach(customer => {
      const customerSales = salesByCustomer[customer.id] || [];
      
      if (customerSales.length === 0) return;
      
      const totalPurchases = customerSales.length;
      const totalSpent = customerSales.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0);
      const averageOrderValue = totalSpent / totalPurchases;
      
      // Analyze purchase frequency
      const daysBetweenPurchases = this.calculateDaysBetweenPurchases(customerSales);
      const avgDaysBetween = daysBetweenPurchases.length > 0 
        ? daysBetweenPurchases.reduce((a, b) => a + b, 0) / daysBetweenPurchases.length 
        : 0;
      
      // Determine pattern
      let pattern: CustomerBehaviorPattern['pattern'];
      let description = '';
      
      if (avgDaysBetween > 0 && avgDaysBetween <= 7) {
        pattern = 'frequent_buyer';
        description = `Purchases frequently (avg ${avgDaysBetween.toFixed(1)} days between orders)`;
      } else if (avgDaysBetween > 30) {
        pattern = 'seasonal_buyer';
        description = `Purchases seasonally (avg ${avgDaysBetween.toFixed(1)} days between orders)`;
      } else {
        pattern = 'regular_buyer';
        description = `Regular purchasing pattern (avg ${avgDaysBetween.toFixed(1)} days between orders)`;
      }
      
      // Check payment reliability
      if (customer.type === 'credit' && customer.currentBalance > 0) {
        const lastPayment = customer.lastPaymentDate ? new Date(customer.lastPaymentDate) : new Date();
        const daysSincePayment = (Date.now() - lastPayment.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSincePayment > 30) {
          pattern = 'late_payer';
          description = `Late payment pattern (${daysSincePayment.toFixed(0)} days since last payment)`;
        }
      }
      
      patterns.push({
        customerId: customer.id,
        customerName: customer.name,
        pattern,
        description,
        confidence: this.calculateConfidence(totalPurchases, 5),
      });
    });
    
    return patterns;
  }
  
  // Analyze inventory patterns
  private analyzeInventoryPatterns(products: any[], sales: any[]): InventoryPattern[] {
    const patterns: InventoryPattern[] = [];
    
    if (products.length === 0) return patterns;
    
    // Group sales by product
    const salesByProduct = this.groupSalesByProduct(sales);
    
    products.forEach(product => {
      const productSales = salesByProduct[product.id] || [];
      const stock = product.stock || 0;
      
      // Calculate turnover rate
      const totalSold = productSales.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);
      const daysWithData = productSales.length > 0 ? 30 : 1; // Assume 30 days if we have sales
      const turnoverRate = totalSold / (daysWithData * (stock || 1));
      
      // Determine pattern
      let pattern: InventoryPattern['pattern'];
      let description = '';
      
      if (turnoverRate > 0.5) {
        pattern = 'fast_moving';
        description = `Fast-moving product (turnover rate: ${turnoverRate.toFixed(2)})`;
      } else if (turnoverRate < 0.1 && stock > 0) {
        pattern = 'slow_moving';
        description = `Slow-moving product (turnover rate: ${turnoverRate.toFixed(2)})`;
      } else if (totalSold === 0 && stock > 0) {
        pattern = 'declining_demand';
        description = 'No sales recorded, declining demand';
      } else {
        pattern = 'stable';
        description = `Stable inventory movement (turnover rate: ${turnoverRate.toFixed(2)})`;
      }
      
      // Check for declining demand trend
      if (productSales.length >= 3) {
        const recentSales = productSales.slice(-5);
        const olderSales = productSales.slice(0, -5);
        
        if (olderSales.length > 0) {
          const recentAvg = recentSales.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) / recentSales.length;
          const olderAvg = olderSales.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) / olderSales.length;
          
          if (recentAvg < olderAvg * 0.7) {
            pattern = 'declining_demand';
            description = `Declining demand trend (recent: ${recentAvg.toFixed(1)}, older: ${olderAvg.toFixed(1)})`;
          } else if (recentAvg > olderAvg * 1.3) {
            pattern = 'increasing_demand';
            description = `Increasing demand trend (recent: ${recentAvg.toFixed(1)}, older: ${olderAvg.toFixed(1)})`;
          }
        }
      }
      
      patterns.push({
        productId: product.id,
        productName: product.name,
        pattern,
        turnoverRate,
        description,
        confidence: this.calculateConfidence(productSales.length, 5),
      });
    });
    
    return patterns;
  }
  
  // Analyze cash flow patterns
  private analyzeCashFlowPatterns(cashFlow: any[]): CashFlowPattern {
    const defaultPattern: CashFlowPattern = {
      pattern: 'stable',
      description: 'Insufficient data for cash flow analysis',
      confidence: 0,
      averageDailyFlow: 0,
      volatility: 0,
    };
    
    if (cashFlow.length < 5) return defaultPattern;
    
    const moneyIn = cashFlow.map((cf: any) => cf.moneyIn || 0);
    const moneyOut = cashFlow.map((cf: any) => cf.moneyOut || 0);
    const netFlow = moneyIn.map((inAmount: number, i: number) => inAmount - moneyOut[i]);
    
    const avgDailyFlow = netFlow.reduce((a, b) => a + b, 0) / netFlow.length;
    const volatility = this.calculateVolatility(netFlow);
    
    let pattern: CashFlowPattern['pattern'];
    let description = '';
    
    if (avgDailyFlow < 0 && volatility > 0.5) {
      pattern = 'tight';
      description = 'Tight cash flow with high volatility';
    } else if (avgDailyFlow < 0) {
      pattern = 'declining';
      description = 'Negative cash flow trend';
    } else if (volatility > 0.7) {
      pattern = 'volatile';
      description = 'High cash flow volatility';
    } else if (avgDailyFlow > 0 && volatility < 0.3) {
      pattern = 'healthy';
      description = 'Healthy, stable cash flow';
    } else {
      pattern = 'stable';
      description = 'Stable cash flow pattern';
    }
    
    return {
      pattern,
      description,
      confidence: this.calculateConfidence(cashFlow.length, 10),
      averageDailyFlow: avgDailyFlow,
      volatility,
    };
  }
  
  // Analyze supplier performance patterns
  private analyzeSupplierPerformancePatterns(suppliers: any[], expenses: any[]): SupplierPerformancePattern[] {
    const patterns: SupplierPerformancePattern[] = [];
    
    if (suppliers.length === 0) return patterns;
    
    // Group expenses by supplier
    const expensesBySupplier = this.groupExpensesBySupplier(expenses);
    
    suppliers.forEach(supplier => {
      const supplierExpenses = expensesBySupplier[supplier.id] || [];
      
      if (supplierExpenses.length === 0) {
        patterns.push({
          supplierId: supplier.id,
          supplierName: supplier.name,
          pattern: 'unknown',
          deliveryTime: 0,
          reliabilityScore: 0,
          description: 'No transaction data available',
          confidence: 0,
        });
        return;
      }
      
      // Calculate reliability based on expense consistency
      const expenseDates = supplierExpenses.map((e: any) => new Date(e.createdAt || e.date));
      const daysBetweenOrders = this.calculateDaysBetweenPurchases(
        supplierExpenses.map((e: any) => ({ createdAt: e.createdAt || e.date }))
      );
      
      const avgDaysBetween = daysBetweenOrders.length > 0 
        ? daysBetweenOrders.reduce((a, b) => a + b, 0) / daysBetweenOrders.length 
        : 0;
      
      // Determine pattern
      let pattern: SupplierPerformancePattern['pattern'];
      let description = '';
      let reliabilityScore = 0.5;
      
      if (avgDaysBetween > 0 && avgDaysBetween <= 7) {
        pattern = 'reliable';
        reliabilityScore = 0.8;
        description = `Reliable supplier (avg ${avgDaysBetween.toFixed(1)} days between orders)`;
      } else if (avgDaysBetween > 21) {
        pattern = 'unreliable';
        reliabilityScore = 0.3;
        description = `Inconsistent ordering (avg ${avgDaysBetween.toFixed(1)} days between orders)`;
      } else {
        pattern = 'stable';
        reliabilityScore = 0.6;
        description = `Stable supplier relationship (avg ${avgDaysBetween.toFixed(1)} days between orders)`;
      }
      
      patterns.push({
        supplierId: supplier.id,
        supplierName: supplier.name,
        pattern,
        deliveryTime: avgDaysBetween,
        reliabilityScore,
        description,
        confidence: this.calculateConfidence(supplierExpenses.length, 5),
      });
    });
    
    return patterns;
  }
  
  // Analyze seasonality patterns
  private analyzeSeasonalityPatterns(sales: any[]): SeasonalityPattern[] {
    const patterns: SeasonalityPattern[] = [];
    
    if (sales.length < 30) return patterns;
    
    // Group by day of week
    const salesByDayOfWeek = this.groupSalesByDayOfWeek(sales);
    const dayOfWeekTotals = Object.entries(salesByDayOfWeek).map(([day, daySales]) => ({
      day,
      total: daySales.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0),
      count: daySales.length,
    }));
    
    // Find peak and low days
    const sortedByTotal = dayOfWeekTotals.sort((a, b) => b.total - a.total);
    const peakDay = sortedByTotal[0];
    const lowDay = sortedByTotal[sortedByTotal.length - 1];
    
    if (peakDay.total > lowDay.total * 2) {
      patterns.push({
        type: 'sales',
        peakPeriod: peakDay.day,
        lowPeriod: lowDay.day,
        description: `Sales peak on ${peakDay.day} (${(peakDay.total / lowDay.total).toFixed(1)}x higher than ${lowDay.day})`,
        confidence: this.calculateConfidence(sales.length, 50),
      });
    }
    
    // Group by month
    const salesByMonth = this.groupSalesByMonth(sales);
    const monthTotals = Object.entries(salesByMonth).map(([month, monthSales]) => ({
      month,
      total: monthSales.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0),
      count: monthSales.length,
    }));
    
    if (monthTotals.length >= 3) {
      const sortedMonths = monthTotals.sort((a, b) => b.total - a.total);
      const peakMonth = sortedMonths[0];
      const lowMonth = sortedMonths[sortedMonths.length - 1];
      
      if (peakMonth.total > lowMonth.total * 1.5) {
        patterns.push({
          type: 'sales',
          peakPeriod: peakMonth.month,
          lowPeriod: lowMonth.month,
          description: `Sales peak in ${peakMonth.month} (${(peakMonth.total / lowMonth.total).toFixed(1)}x higher than ${lowMonth.month})`,
          confidence: this.calculateConfidence(sales.length, 100),
        });
      }
    }
    
    return patterns;
  }
  
  // Helper methods
  private groupByDate(sales: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    sales.forEach(sale => {
      const date = new Date(sale.createdAt || sale.date).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(sale);
    });
    return grouped;
  }
  
  private groupByWeek(salesByDate: Record<string, any[]>): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    Object.entries(salesByDate).forEach(([date, sales]) => {
      const weekNumber = this.getWeekNumber(new Date(date));
      const key = `week-${weekNumber}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(...sales);
    });
    return grouped;
  }
  
  private groupByCategory(expenses: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    expenses.forEach(expense => {
      const category = expense.category || 'uncategorized';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(expense);
    });
    return grouped;
  }
  
  private groupSalesByCustomer(sales: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    sales.forEach(sale => {
      const customerId = sale.customerId || 'unknown';
      if (!grouped[customerId]) grouped[customerId] = [];
      grouped[customerId].push(sale);
    });
    return grouped;
  }
  
  private groupSalesByProduct(sales: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    sales.forEach(sale => {
      const items = sale.items || [];
      items.forEach((item: any) => {
        const productId = item.productId || 'unknown';
        if (!grouped[productId]) grouped[productId] = [];
        grouped[productId].push({ ...item, saleDate: sale.createdAt });
      });
    });
    return grouped;
  }
  
  private groupExpensesBySupplier(expenses: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    expenses.forEach(expense => {
      const supplierId = expense.supplierId || 'unknown';
      if (!grouped[supplierId]) grouped[supplierId] = [];
      grouped[supplierId].push(expense);
    });
    return grouped;
  }
  
  private groupSalesByDayOfWeek(sales: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {
      'Sunday': [],
      'Monday': [],
      'Tuesday': [],
      'Wednesday': [],
      'Thursday': [],
      'Friday': [],
      'Saturday': [],
    };
    
    sales.forEach(sale => {
      const day = new Date(sale.createdAt || sale.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (grouped[day]) grouped[day].push(sale);
    });
    
    return grouped;
  }
  
  private groupSalesByMonth(sales: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    sales.forEach(sale => {
      const month = new Date(sale.createdAt || sale.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(sale);
    });
    return grouped;
  }
  
  private calculateTrend(values: number[]): { trend: 'increasing' | 'decreasing' | 'stable' | 'volatile'; growthRate: number } {
    if (values.length < 2) {
      return { trend: 'stable', growthRate: 0 };
    }
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (firstAvg === 0) {
      return { trend: 'stable', growthRate: 0 };
    }
    
    const growthRate = ((secondAvg - firstAvg) / firstAvg) * 100;
    const volatility = this.calculateVolatility(values);
    
    if (volatility > 0.5) {
      return { trend: 'volatile', growthRate };
    } else if (growthRate > 10) {
      return { trend: 'increasing', growthRate };
    } else if (growthRate < -10) {
      return { trend: 'decreasing', growthRate };
    } else {
      return { trend: 'stable', growthRate };
    }
  }
  
  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? stdDev / mean : 0;
  }
  
  private calculateConfidence(dataPoints: number, minRequired: number): number {
    return Math.min(dataPoints / minRequired, 1);
  }
  
  private calculateDaysBetweenPurchases(purchases: any[]): number[] {
    const daysBetween: number[] = [];
    
    for (let i = 1; i < purchases.length; i++) {
      const date1 = new Date(purchases[i - 1].createdAt || purchases[i - 1].date);
      const date2 = new Date(purchases[i].createdAt || purchases[i].date);
      const days = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
      daysBetween.push(days);
    }
    
    return daysBetween;
  }
  
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
  
  private analyzeDayOfWeekPatterns(salesByDate: Record<string, any[]>): { description: string; confidence: number } | null {
    const dayOfWeekTotals = this.groupSalesByDayOfWeek(
      Object.values(salesByDate).flat()
    );
    
    const dayTotals = Object.entries(dayOfWeekTotals).map(([day, sales]) => ({
      day,
      total: sales.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0),
    }));
    
    const sorted = dayTotals.sort((a, b) => b.total - a.total);
    const peak = sorted[0];
    const lowest = sorted[sorted.length - 1];
    
    if (peak.total > lowest.total * 2) {
      return {
        description: `${peak.day} has highest sales (${(peak.total / lowest.total).toFixed(1)}x higher than ${lowest.day})`,
        confidence: 0.7,
      };
    }
    
    return null;
  }
  
  private generateSalesTrendDescription(trend: any, period: string): string {
    if (trend.trend === 'increasing') {
      return `${period.charAt(0).toUpperCase() + period.slice(1)} sales increasing by ${trend.growthRate.toFixed(1)}%`;
    } else if (trend.trend === 'decreasing') {
      return `${period.charAt(0).toUpperCase() + period.slice(1)} sales decreasing by ${Math.abs(trend.growthRate).toFixed(1)}%`;
    } else if (trend.trend === 'volatile') {
      return `${period.charAt(0).toUpperCase() + period.slice(1)} sales highly volatile`;
    } else {
      return `${period.charAt(0).toUpperCase() + period.slice(1)} sales stable`;
    }
  }
  
  private generateExpenseTrendDescription(category: string, trend: any): string {
    if (trend.trend === 'increasing') {
      return `${category} expenses increasing by ${trend.growthRate.toFixed(1)}%`;
    } else if (trend.trend === 'decreasing') {
      return `${category} expenses decreasing by ${Math.abs(trend.growthRate).toFixed(1)}%`;
    } else {
      return `${category} expenses stable`;
    }
  }
  
  // Format patterns for AI response
  formatForAIResponse(patterns: DetectedPatterns): string {
    let response = '\n\n📊 DETECTED PATTERNS:\n';
    
    if (patterns.sales.length > 0) {
      response += '\nSales Patterns:\n';
      patterns.sales.forEach(pattern => {
        response += `• ${pattern.description} (${pattern.trend}, confidence: ${(pattern.confidence * 100).toFixed(0)}%)\n`;
      });
    }
    
    if (patterns.expenses.length > 0) {
      response += '\nExpense Patterns:\n';
      patterns.expenses.slice(0, 3).forEach(pattern => {
        response += `• ${pattern.description}\n`;
      });
    }
    
    if (patterns.customerBehavior.length > 0) {
      response += '\nCustomer Behavior:\n';
      patterns.customerBehavior.slice(0, 3).forEach(pattern => {
        response += `• ${pattern.customerName}: ${pattern.description}\n`;
      });
    }
    
    if (patterns.inventory.length > 0) {
      response += '\nInventory Patterns:\n';
      patterns.inventory.slice(0, 3).forEach(pattern => {
        response += `• ${pattern.productName}: ${pattern.description}\n`;
      });
    }
    
    if (patterns.cashFlow.confidence > 0.3) {
      response += `\nCash Flow: ${patterns.cashFlow.description} (confidence: ${(patterns.cashFlow.confidence * 100).toFixed(0)}%)\n`;
    }
    
    if (patterns.supplierPerformance.length > 0) {
      response += '\nSupplier Performance:\n';
      patterns.supplierPerformance.slice(0, 3).forEach(pattern => {
        response += `• ${pattern.supplierName}: ${pattern.description}\n`;
      });
    }
    
    if (patterns.seasonality.length > 0) {
      response += '\nSeasonality:\n';
      patterns.seasonality.forEach(pattern => {
        response += `• ${pattern.description}\n`;
      });
    }
    
    return response;
  }
}

// Singleton instance
let patternDetectionEngineInstance: PatternDetectionEngine | null = null;

export function getPatternDetectionEngine(): PatternDetectionEngine {
  if (!patternDetectionEngineInstance) {
    patternDetectionEngineInstance = new PatternDetectionEngine();
  }
  return patternDetectionEngineInstance;
}
