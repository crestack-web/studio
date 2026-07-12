// MO Predictive Intelligence - Forecasting for inventory, cash flow, demand, etc.
// As business history grows, MO should begin forecasting with confidence based on available evidence

export type PredictionType = 
  | 'inventory_shortage'
  | 'cash_flow_shortage'
  | 'seasonal_demand'
  | 'supplier_reliability'
  | 'customer_payment_behavior'
  | 'revenue_trend'
  | 'expense_trend'
  | 'business_growth';

export interface Prediction {
  id: string;
  type: PredictionType;
  title: string;
  description: string;
  predictedValue: number;
  currentValue: number;
  timeframe: string;
  confidence: number; // 0-1
  factors: string[];
  recommendations: string[];
  timestamp: Date;
  isForecast: boolean;
}

export interface PredictionContext {
  businessId: string;
  businessData: {
    sales?: any[];
    expenses?: any[];
    inventory?: any[];
    cashFlow?: any[];
    customers?: any[];
    suppliers?: any[];
  };
  historicalData: {
    sales?: any[];
    expenses?: any[];
    inventory?: any[];
    cashFlow?: any[];
  };
  knowledgeGraph: any;
}

export class PredictiveIntelligenceEngine {
  
  // Generate all predictions
  async generatePredictions(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    
    // Inventory shortage predictions
    if (context.businessData.inventory && context.historicalData.sales) {
      const inventoryPredictions = await this.predictInventoryShortages(context);
      predictions.push(...inventoryPredictions);
    }
    
    // Cash flow predictions
    if (context.businessData.cashFlow && context.historicalData.cashFlow) {
      const cashFlowPredictions = await this.predictCashFlow(context);
      predictions.push(...cashFlowPredictions);
    }
    
    // Demand predictions
    if (context.historicalData.sales) {
      const demandPredictions = await this.predictDemand(context);
      predictions.push(...demandPredictions);
    }
    
    // Revenue trend predictions
    if (context.historicalData.sales) {
      const revenuePredictions = await this.predictRevenueTrend(context);
      predictions.push(...revenuePredictions);
    }
    
    // Expense trend predictions
    if (context.historicalData.expenses) {
      const expensePredictions = await this.predictExpenseTrend(context);
      predictions.push(...expensePredictions);
    }
    
    // Customer payment behavior
    if (context.businessData.customers && context.historicalData.sales) {
      const paymentPredictions = await this.predictCustomerPayments(context);
      predictions.push(...paymentPredictions);
    }
    
    return predictions;
  }
  
  // Predict inventory shortages
  private async predictInventoryShortages(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const inventory = context.businessData.inventory || [];
    const sales = context.historicalData.sales || [];
    
    if (sales.length < 7) {
      return predictions; // Need historical data
    }
    
    // Calculate average daily sales for each product
    const productSalesRate = new Map<string, number>();
    const recentSales = sales.slice(-30); // Last 30 days
    
    recentSales.forEach(sale => {
      const product = sale.productName || 'Unknown';
      productSalesRate.set(product, (productSalesRate.get(product) || 0) + (sale.quantity || 1));
    });
    
    // Convert to daily rate
    productSalesRate.forEach((total, product) => {
      productSalesRate.set(product, total / 30);
    });
    
    // Predict shortages for each inventory item
    inventory.forEach(item => {
      const productName = item.name;
      const currentQuantity = item.quantity || 0;
      const salesRate = productSalesRate.get(productName) || 0;
      
      if (salesRate > 0 && currentQuantity > 0) {
        const daysUntilEmpty = Math.floor(currentQuantity / salesRate);
        
        if (daysUntilEmpty <= 7) {
          predictions.push({
            id: this.generateId(),
            type: 'inventory_shortage',
            title: `Inventory Shortage: ${productName}`,
            description: `${productName} will run out in approximately ${daysUntilEmpty} day(s) at current sales rate`,
            predictedValue: 0,
            currentValue: currentQuantity,
            timeframe: `${daysUntilEmpty} days`,
            confidence: this.calculateConfidence(sales.length, 30),
            factors: [
              `Current stock: ${currentQuantity} units`,
              `Daily sales rate: ${salesRate.toFixed(1)} units/day`,
              `Based on ${recentSales.length} recent sales records`,
            ],
            recommendations: [
              'Consider placing a reorder soon',
              'Review lead time for this product',
              'Adjust safety stock levels if shortages are frequent',
            ],
            timestamp: new Date(),
            isForecast: true,
          });
        }
      }
    });
    
    return predictions;
  }
  
  // Predict cash flow shortages
  private async predictCashFlow(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const cashFlow = context.businessData.cashFlow || [];
    const historicalCashFlow = context.historicalData.cashFlow || [];
    
    if (historicalCashFlow.length < 14) {
      return predictions;
    }
    
    // Calculate average daily cash flow
    const recentCashFlow = historicalCashFlow.slice(-30);
    const netCashFlow = recentCashFlow.reduce((sum, cf) => {
      const amount = cf.type === 'inflow' ? (cf.amount || 0) : -(cf.amount || 0);
      return sum + amount;
    }, 0);
    
    const averageDailyCashFlow = netCashFlow / 30;
    const currentBalance = cashFlow.reduce((sum, cf) => {
      const amount = cf.type === 'inflow' ? (cf.amount || 0) : -(cf.amount || 0);
      return sum + amount;
    }, 0);
    
    // Predict when cash will run out if negative
    if (averageDailyCashFlow < 0) {
      const daysUntilZero = Math.floor(currentBalance / Math.abs(averageDailyCashFlow));
      
      if (daysUntilZero <= 30) {
        predictions.push({
          id: this.generateId(),
          type: 'cash_flow_shortage',
          title: 'Cash Flow Shortage Warning',
          description: `At current burn rate, cash balance will reach zero in approximately ${daysUntilZero} day(s)`,
          predictedValue: 0,
          currentValue: currentBalance,
          timeframe: `${daysUntilZero} days`,
          confidence: this.calculateConfidence(historicalCashFlow.length, 30),
          factors: [
            `Current balance: ₦${currentBalance.toLocaleString()}`,
            `Daily burn rate: ₦${Math.abs(averageDailyCashFlow).toLocaleString()}`,
            `Based on ${recentCashFlow.length} recent cash flow records`,
          ],
          recommendations: [
            'Review and reduce non-essential expenses',
            'Accelerate accounts receivable collection',
            'Consider short-term financing if needed',
            'Delay non-critical expenditures',
          ],
          timestamp: new Date(),
          isForecast: true,
        });
      }
    }
    
    return predictions;
  }
  
  // Predict seasonal demand
  private async predictDemand(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const sales = context.historicalData.sales || [];
    
    if (sales.length < 90) {
      return predictions; // Need 3 months of data
    }
    
    // Group sales by week
    const weeklySales = this.groupSalesByWeek(sales);
    
    if (weeklySales.length < 12) {
      return predictions; // Need at least 12 weeks
    }
    
    // Calculate week-over-week growth
    const growthRates: number[] = [];
    for (let i = 1; i < weeklySales.length; i++) {
      const growth = (weeklySales[i] - weeklySales[i - 1]) / weeklySales[i - 1];
      growthRates.push(growth);
    }
    
    // Detect seasonal patterns (simplified)
    const avgGrowth = growthRates.reduce((sum, g) => sum + g, 0) / growthRates.length;
    const recentGrowth = growthRates.slice(-4).reduce((sum, g) => sum + g, 0) / 4;
    
    // If recent growth is significantly different from average, flag as seasonal
    if (Math.abs(recentGrowth - avgGrowth) > 0.2) {
      const trend = recentGrowth > avgGrowth ? 'increasing' : 'decreasing';
      
      predictions.push({
        id: this.generateId(),
        type: 'seasonal_demand',
        title: `Seasonal Demand Pattern: ${trend.charAt(0).toUpperCase() + trend.slice(1)}`,
        description: `Demand is ${trend} compared to historical average. Recent growth: ${(recentGrowth * 100).toFixed(1)}%, Average: ${(avgGrowth * 100).toFixed(1)}%`,
        predictedValue: recentGrowth,
        currentValue: avgGrowth,
        timeframe: 'Current quarter',
        confidence: this.calculateConfidence(sales.length, 90),
        factors: [
          `Recent 4-week growth: ${(recentGrowth * 100).toFixed(1)}%`,
          `Historical average growth: ${(avgGrowth * 100).toFixed(1)}%`,
          `Based on ${sales.length} sales records`,
        ],
        recommendations: trend === 'increasing' ? [
          'Ensure sufficient inventory to meet increased demand',
          'Consider temporary staffing if needed',
          'Review pricing strategy for optimal revenue',
        ] : [
          'Review marketing and sales strategies',
          'Consider promotions to stimulate demand',
          'Optimize inventory levels to reduce carrying costs',
        ],
        timestamp: new Date(),
        isForecast: true,
      });
    }
    
    return predictions;
  }
  
  // Predict revenue trend
  private async predictRevenueTrend(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const sales = context.historicalData.sales || [];
    
    if (sales.length < 30) {
      return predictions;
    }
    
    // Calculate monthly revenue
    const monthlyRevenue = this.groupSalesByMonth(sales);
    
    if (monthlyRevenue.length < 3) {
      return predictions;
    }
    
    // Calculate trend
    const recentRevenue = monthlyRevenue.slice(-3);
    const trend = this.calculateLinearTrend(recentRevenue);
    
    // Predict next month's revenue
    const nextMonthPrediction = recentRevenue[recentRevenue.length - 1] + trend;
    
    predictions.push({
      id: this.generateId(),
      type: 'revenue_trend',
      title: 'Revenue Trend Forecast',
      description: `Based on current trend, next month's revenue is projected to be ₦${nextMonthPrediction.toLocaleString()}`,
      predictedValue: nextMonthPrediction,
      currentValue: recentRevenue[recentRevenue.length - 1],
      timeframe: 'Next month',
      confidence: this.calculateConfidence(sales.length, 60),
      factors: [
        `Current monthly revenue: ₦${recentRevenue[recentRevenue.length - 1].toLocaleString()}`,
        `Monthly trend: ₦${trend.toLocaleString()}`,
        `Based on ${sales.length} sales records`,
      ],
      recommendations: trend > 0 ? [
        'Plan for growth with adequate inventory and staffing',
        'Consider investment opportunities',
        'Monitor for sustainable growth',
      ] : [
        'Review cost structure and efficiency',
        'Develop strategies to reverse declining trend',
        'Focus on customer retention and acquisition',
      ],
      timestamp: new Date(),
      isForecast: true,
    });
    
    return predictions;
  }
  
  // Predict expense trend
  private async predictExpenseTrend(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const expenses = context.historicalData.expenses || [];
    
    if (expenses.length < 30) {
      return predictions;
    }
    
    // Calculate monthly expenses
    const monthlyExpenses = this.groupExpensesByMonth(expenses);
    
    if (monthlyExpenses.length < 3) {
      return predictions;
    }
    
    // Calculate trend
    const recentExpenses = monthlyExpenses.slice(-3);
    const trend = this.calculateLinearTrend(recentExpenses);
    
    // Predict next month's expenses
    const nextMonthPrediction = recentExpenses[recentExpenses.length - 1] + trend;
    
    predictions.push({
      id: this.generateId(),
      type: 'expense_trend',
      title: 'Expense Trend Forecast',
      description: `Based on current trend, next month's expenses are projected to be ₦${nextMonthPrediction.toLocaleString()}`,
      predictedValue: nextMonthPrediction,
      currentValue: recentExpenses[recentExpenses.length - 1],
      timeframe: 'Next month',
      confidence: this.calculateConfidence(expenses.length, 60),
      factors: [
        `Current monthly expenses: ₦${recentExpenses[recentExpenses.length - 1].toLocaleString()}`,
        `Monthly trend: ₦${trend.toLocaleString()}`,
        `Based on ${expenses.length} expense records`,
      ],
      recommendations: trend > 0 ? [
        'Review expense categories for optimization',
        'Negotiate with suppliers for better terms',
        'Implement cost control measures',
      ] : [
        'Maintain current cost management practices',
        'Look for additional efficiency opportunities',
      ],
      timestamp: new Date(),
      isForecast: true,
    });
    
    return predictions;
  }
  
  // Predict customer payment behavior
  private async predictCustomerPayments(context: PredictionContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const customers = context.businessData.customers || [];
    const sales = context.historicalData.sales || [];
    
    if (customers.length === 0 || sales.length < 30) {
      return predictions;
    }
    
    // Calculate average payment delay
    const paymentDelays: number[] = [];
    sales.forEach(sale => {
      if (sale.paymentDate && sale.date) {
        const delay = (new Date(sale.paymentDate).getTime() - new Date(sale.date).getTime()) / (1000 * 60 * 60 * 24);
        paymentDelays.push(delay);
      }
    });
    
    if (paymentDelays.length < 10) {
      return predictions;
    }
    
    const avgDelay = paymentDelays.reduce((sum, d) => sum + d, 0) / paymentDelays.length;
    const recentDelay = paymentDelays.slice(-10).reduce((sum, d) => sum + d, 0) / 10;
    
    // If payment delays are increasing
    if (recentDelay > avgDelay * 1.2) {
      predictions.push({
        id: this.generateId(),
        type: 'customer_payment_behavior',
        title: 'Payment Delay Trend Warning',
        description: `Average payment delay has increased from ${avgDelay.toFixed(0)} to ${recentDelay.toFixed(0)} days`,
        predictedValue: recentDelay,
        currentValue: avgDelay,
        timeframe: 'Current month',
        confidence: this.calculateConfidence(paymentDelays.length, 20),
        factors: [
          `Historical average delay: ${avgDelay.toFixed(0)} days`,
          `Recent average delay: ${recentDelay.toFixed(0)} days`,
          `Based on ${paymentDelays.length} payment records`,
        ],
        recommendations: [
          'Review credit policies and terms',
          'Follow up on overdue payments proactively',
          'Consider stricter credit for slow-paying customers',
          'Implement early payment incentives',
        ],
        timestamp: new Date(),
        isForecast: true,
      });
    }
    
    return predictions;
  }
  
  // Helper methods
  private groupSalesByWeek(sales: any[]): number[] {
    const weeklySales: Map<number, number> = new Map();
    
    sales.forEach(sale => {
      const date = new Date(sale.date || sale.createdAt);
      const weekNumber = this.getWeekNumber(date);
      const amount = sale.amount || 0;
      weeklySales.set(weekNumber, (weeklySales.get(weekNumber) || 0) + amount);
    });
    
    return Array.from(weeklySales.values());
  }
  
  private groupSalesByMonth(sales: any[]): number[] {
    const monthlySales: Map<string, number> = new Map();
    
    sales.forEach(sale => {
      const date = new Date(sale.date || sale.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const amount = sale.amount || 0;
      monthlySales.set(monthKey, (monthlySales.get(monthKey) || 0) + amount);
    });
    
    return Array.from(monthlySales.values());
  }
  
  private groupExpensesByMonth(expenses: any[]): number[] {
    const monthlyExpenses: Map<string, number> = new Map();
    
    expenses.forEach(expense => {
      const date = new Date(expense.date || expense.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const amount = expense.amount || 0;
      monthlyExpenses.set(monthKey, (monthlyExpenses.get(monthKey) || 0) + amount);
    });
    
    return Array.from(monthlyExpenses.values());
  }
  
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
  
  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
  
  private calculateConfidence(dataPoints: number, required: number): number {
    if (dataPoints >= required * 2) return 0.9;
    if (dataPoints >= required) return 0.8;
    if (dataPoints >= required * 0.7) return 0.6;
    if (dataPoints >= required * 0.5) return 0.4;
    return 0.3;
  }
  
  private generateId(): string {
    return `prediction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Format predictions for display
  formatForDisplay(predictions: Prediction[]): string {
    if (predictions.length === 0) {
      return '\n\n🔮 PREDICTIVE INTELLIGENCE: Insufficient data for reliable predictions\n';
    }
    
    let response = '\n\n🔮 PREDICTIVE INTELLIGENCE\n\n';
    
    predictions.forEach(prediction => {
      response += `**${prediction.title}**\n`;
      response += `${prediction.description}\n`;
      response += `Timeframe: ${prediction.timeframe}\n`;
      response += `Confidence: ${(prediction.confidence * 100).toFixed(0)}%\n`;
      
      if (prediction.recommendations.length > 0) {
        response += `Recommendations:\n`;
        prediction.recommendations.forEach(rec => {
          response += `• ${rec}\n`;
        });
      }
      
      response += '\n';
    });
    
    return response;
  }
}

// Singleton instance
let predictiveIntelligenceEngineInstance: PredictiveIntelligenceEngine | null = null;

export function getPredictiveIntelligenceEngine(): PredictiveIntelligenceEngine {
  if (!predictiveIntelligenceEngineInstance) {
    predictiveIntelligenceEngineInstance = new PredictiveIntelligenceEngine();
  }
  return predictiveIntelligenceEngineInstance;
}
