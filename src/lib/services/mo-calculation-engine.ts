// MO Calculation Engine - Automatic Financial Analysis
// Automatically calculates when users mention money, price, capital, profit, inventory, quantity, time, margins

export interface FinancialCalculation {
  type: string;
  description: string;
  result: number;
  breakdown?: Record<string, number>;
  implications?: string[];
  risks?: string[];
}

export interface CalculationContext {
  capital?: number;
  expenses?: number;
  revenue?: number;
  profit?: number;
  margin?: number;
  inventoryValue?: number;
  quantity?: number;
  price?: number;
  cost?: number;
  time?: number; // in days
}

export class CalculationEngine {
  
  // Extract financial numbers from message
  extractFinancialData(message: string): CalculationContext {
    const context: CalculationContext = {};
    
    // Extract currency amounts (₦, $, etc.)
    const currencyPattern = /[₦$]\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g;
    const matches = message.match(currencyPattern);
    
    if (matches) {
      const amounts = matches.map(m => parseFloat(m.replace(/[₦$,]/g, '')));
      
      // Try to identify what each amount represents based on context
      if (message.toLowerCase().includes('capital') || message.toLowerCase().includes('budget') || message.toLowerCase().includes('invest')) {
        context.capital = amounts[0];
      } else if (message.toLowerCase().includes('cost') || message.toLowerCase().includes('expense') || message.toLowerCase().includes('spend')) {
        context.expenses = amounts[0];
      } else if (message.toLowerCase().includes('price') || message.toLowerCase().includes('sell')) {
        context.price = amounts[0];
      } else if (message.toLowerCase().includes('buy') || message.toLowerCase().includes('purchase')) {
        context.cost = amounts[0];
      }
      
      // If no specific context found, use first as capital
      if (!context.capital && !context.expenses && !context.price && !context.cost) {
        context.capital = amounts[0];
      }
    }
    
    // Extract quantities
    const quantityPattern = /(\d+)\s*(?:tons?|kg|kilograms?|pieces?|items?|units?|bottles?|boxes?)/gi;
    const quantityMatch = message.match(quantityPattern);
    if (quantityMatch) {
      context.quantity = parseFloat(quantityMatch[0].match(/\d+/)![0]);
    }
    
    // Extract time periods
    const timePattern = /(\d+)\s*(?:days?|weeks?|months?|years?)/gi;
    const timeMatch = message.match(timePattern);
    if (timeMatch) {
      const timeValue = parseFloat(timeMatch[0].match(/\d+/)![0]);
      const timeUnit = timeMatch[0].toLowerCase();
      
      if (timeUnit.includes('day')) {
        context.time = timeValue;
      } else if (timeUnit.includes('week')) {
        context.time = timeValue * 7;
      } else if (timeUnit.includes('month')) {
        context.time = timeValue * 30;
      } else if (timeUnit.includes('year')) {
        context.time = timeValue * 365;
      }
    }
    
    return context;
  }
  
  // Calculate profit margin
  calculateMargin(price: number, cost: number): FinancialCalculation {
    const margin = ((price - cost) / price) * 100;
    
    return {
      type: 'margin',
      description: 'Profit Margin',
      result: margin,
      breakdown: {
        price,
        cost,
        profit: price - cost,
        marginPercentage: margin,
      },
      implications: margin > 30 
        ? ['Healthy margin for retail business', 'Room for discounts and promotions']
        : margin > 15
        ? ['Moderate margin', 'Monitor costs closely']
        : ['Low margin', 'High volume needed for profitability'],
      risks: margin < 15 
        ? ['Vulnerable to cost increases', 'Limited pricing flexibility']
        : [],
    };
  }
  
  // Calculate break-even point
  calculateBreakEven(fixedCosts: number, variableCostPerUnit: number, pricePerUnit: number): FinancialCalculation {
    const contributionMargin = pricePerUnit - variableCostPerUnit;
    const breakEvenUnits = fixedCosts / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * pricePerUnit;
    
    return {
      type: 'break-even',
      description: 'Break-Even Analysis',
      result: breakEvenUnits,
      breakdown: {
        fixedCosts,
        variableCostPerUnit,
        pricePerUnit,
        contributionMargin,
        breakEvenUnits,
        breakEvenRevenue,
      },
      implications: [
        `Need to sell ${Math.ceil(breakEvenUnits)} units to break even`,
        `Revenue target: ₦${breakEvenRevenue.toLocaleString()}`,
      ],
      risks: breakEvenUnits > 1000 
        ? ['High break-even point requires significant sales volume']
        : [],
    };
  }
  
  // Calculate cash runway
  calculateCashRunway(cashAvailable: number, monthlyBurn: number): FinancialCalculation {
    const runwayMonths = cashAvailable / monthlyBurn;
    
    return {
      type: 'cash-runway',
      description: 'Cash Runway',
      result: runwayMonths,
      breakdown: {
        cashAvailable,
        monthlyBurn,
        runwayMonths,
        runwayDays: runwayMonths * 30,
      },
      implications: runwayMonths > 12 
        ? ['Healthy cash position', 'Time to focus on growth']
        : runwayMonths > 6
        ? ['Moderate cash position', 'Monitor cash flow closely']
        : ['Low cash position', 'Focus on immediate revenue generation'],
      risks: runwayMonths < 3 
        ? ['Critical cash situation', 'Immediate action required']
        : runwayMonths < 6
        ? ['Cash flow risk', 'Reduce expenses or increase revenue']
        : [],
    };
  }
  
  // Calculate inventory turnover
  calculateInventoryTurnover(costOfGoodsSold: number, averageInventory: number): FinancialCalculation {
    const turnover = costOfGoodsSold / averageInventory;
    const daysToSell = 365 / turnover;
    
    return {
      type: 'inventory-turnover',
      description: 'Inventory Turnover',
      result: turnover,
      breakdown: {
        costOfGoodsSold,
        averageInventory,
        turnover,
        daysToSell,
      },
      implications: turnover > 12 
        ? ['Fast inventory movement', 'Good cash flow']
        : turnover > 6
        ? ['Moderate inventory movement', 'Optimize stock levels']
        : ['Slow inventory movement', 'Risk of dead stock'],
      risks: turnover < 4 
        ? ['Dead stock risk', 'Capital tied up in inventory']
        : [],
    };
  }
  
  // Calculate ROI
  calculateROI(investment: number, returnAmount: number): FinancialCalculation {
    const roi = ((returnAmount - investment) / investment) * 100;
    
    return {
      type: 'roi',
      description: 'Return on Investment',
      result: roi,
      breakdown: {
        investment,
        returnAmount,
        profit: returnAmount - investment,
        roiPercentage: roi,
      },
      implications: roi > 50 
        ? ['Excellent investment opportunity']
        : roi > 20
        ? ['Good investment opportunity']
        : roi > 0
        ? ['Positive return']
        : ['Negative return'],
      risks: roi < 0 
        ? ['Investment losing money']
        : roi < 10
        ? ['Low return, consider alternatives']
        : [],
    };
  }
  
  // Calculate production cost breakdown
  calculateProductionCostBreakdown(rawMaterials: number, labor: number, overhead: number, quantity: number): FinancialCalculation {
    const totalCost = rawMaterials + labor + overhead;
    const costPerUnit = totalCost / quantity;
    
    return {
      type: 'production-cost',
      description: 'Production Cost Breakdown',
      result: costPerUnit,
      breakdown: {
        rawMaterials,
        labor,
        overhead,
        totalCost,
        quantity,
        costPerUnit,
        rawMaterialPercentage: (rawMaterials / totalCost) * 100,
        laborPercentage: (labor / totalCost) * 100,
        overheadPercentage: (overhead / totalCost) * 100,
      },
      implications: [
        `Cost per unit: ₦${costPerUnit.toFixed(2)}`,
        `Raw materials: ${((rawMaterials / totalCost) * 100).toFixed(1)}% of total cost`,
      ],
      risks: (rawMaterials / totalCost) > 0.7 
        ? ['High material cost dependency', 'Vulnerable to price fluctuations']
        : [],
    };
  }
  
  // Analyze pricing strategy
  analyzePricingStrategy(cost: number, currentPrice: number, competitorPrice: number): FinancialCalculation {
    const currentMargin = ((currentPrice - cost) / currentPrice) * 100;
    const competitorMargin = ((competitorPrice - cost) / competitorPrice) * 100;
    const priceDifference = ((currentPrice - competitorPrice) / competitorPrice) * 100;
    
    return {
      type: 'pricing-strategy',
      description: 'Pricing Strategy Analysis',
      result: currentMargin,
      breakdown: {
        cost,
        currentPrice,
        competitorPrice,
        currentMargin,
        competitorMargin,
        priceDifference,
      },
      implications: priceDifference > 20 
        ? ['Premium pricing strategy', 'Must justify with quality/service']
        : priceDifference < -20
        ? ['Discount pricing strategy', 'High volume required']
        : ['Competitive pricing strategy'],
      risks: currentMargin < competitorMargin 
        ? ['Lower margin than competitor', 'Consider cost reduction or price increase']
        : [],
    };
  }
  
  // Generate calculation insights from message
  generateInsights(message: string, businessContext: CalculationContext): FinancialCalculation[] {
    const insights: FinancialCalculation[] = [];
    const extractedData = this.extractFinancialData(message);
    const combinedContext = { ...businessContext, ...extractedData };
    
    // Margin calculation if price and cost available
    if (combinedContext.price && combinedContext.cost) {
      insights.push(this.calculateMargin(combinedContext.price, combinedContext.cost));
    }
    
    // Cash runway if capital and burn rate available
    if (combinedContext.capital && combinedContext.expenses) {
      insights.push(this.calculateCashRunway(combinedContext.capital, combinedContext.expenses));
    }
    
    // ROI if investment and return mentioned
    if (combinedContext.capital && combinedContext.revenue) {
      insights.push(this.calculateROI(combinedContext.capital, combinedContext.revenue));
    }
    
    return insights;
  }
  
  // Format calculation results for AI response
  formatForAIResponse(calculations: FinancialCalculation[]): string {
    if (calculations.length === 0) return '';
    
    let response = '\n\n📊 FINANCIAL ANALYSIS:\n';
    
    calculations.forEach(calc => {
      response += `\n${calc.description}:\n`;
      response += `- Result: ${typeof calc.result === 'number' ? calc.result.toFixed(2) : calc.result}\n`;
      
      if (calc.breakdown) {
        response += '- Breakdown:\n';
        Object.entries(calc.breakdown).forEach(([key, value]) => {
          response += `  • ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}\n`;
        });
      }
      
      if (calc.implications && calc.implications.length > 0) {
        response += '- Implications:\n';
        calc.implications.forEach(imp => {
          response += `  • ${imp}\n`;
        });
      }
      
      if (calc.risks && calc.risks.length > 0) {
        response += '- ⚠️ Risks:\n';
        calc.risks.forEach(risk => {
          response += `  • ${risk}\n`;
        });
      }
    });
    
    return response;
  }
}

// Singleton instance
let calculationEngineInstance: CalculationEngine | null = null;

export function getCalculationEngine(): CalculationEngine {
  if (!calculationEngineInstance) {
    calculationEngineInstance = new CalculationEngine();
  }
  return calculationEngineInstance;
}
