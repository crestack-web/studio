// MO Risk Engine - Comprehensive Risk Assessment
// Identifies and assesses business risks with mitigation strategies

export type RiskCategory =
  | 'cash_flow'
  | 'inventory'
  | 'supplier'
  | 'pricing'
  | 'debt'
  | 'operational'
  | 'customer'
  | 'regulatory'
  | 'market'
  | 'strategic';

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Risk {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  description: string;
  likelihood: number; // 0-1
  impact: number; // 0-1
  riskScore: number; // likelihood * impact
  indicators: string[];
  mitigation: string[];
  timeframe: string;
  monitored: boolean;
}

export interface RiskAssessmentContext {
  businessProfile: any;
  businessData: any;
  financialData: any;
  operationalData: any;
  marketConditions?: any;
}

export class RiskEngine {
  
  // Comprehensive risk assessment
  assessRisks(context: RiskAssessmentContext): Risk[] {
    const risks: Risk[] = [];
    
    // Cash flow risks
    risks.push(...this.assessCashFlowRisks(context));
    
    // Inventory risks
    risks.push(...this.assessInventoryRisks(context));
    
    // Supplier risks
    risks.push(...this.assessSupplierRisks(context));
    
    // Pricing risks
    risks.push(...this.assessPricingRisks(context));
    
    // Debt risks
    risks.push(...this.assessDebtRisks(context));
    
    // Operational risks
    risks.push(...this.assessOperationalRisks(context));
    
    // Customer risks
    risks.push(...this.assessCustomerRisks(context));
    
    // Market risks
    risks.push(...this.assessMarketRisks(context));
    
    // Strategic risks
    risks.push(...this.assessStrategicRisks(context));
    
    // Sort by risk score
    risks.sort((a, b) => b.riskScore - a.riskScore);
    
    return risks;
  }
  
  // Assess cash flow risks
  private assessCashFlowRisks(context: RiskAssessmentContext): Risk[] {
    const risks: Risk[] = [];
    const { businessProfile, financialData } = context;
    
    const cashAvailable = businessProfile?.cashAvailable || 0;
    const monthlyExpenses = businessProfile?.expectedExpenses || 0;
    const monthlyRevenue = businessProfile?.expectedIncome || 0;
    
    // Low cash reserves
    if (cashAvailable < 50000) {
      risks.push({
        id: 'cash_low_reserves',
        category: 'cash_flow',
        severity: cashAvailable < 20000 ? 'critical' : 'high',
        description: 'Low cash reserves limit ability to handle unexpected expenses or opportunities',
        likelihood: 0.7,
        impact: cashAvailable < 20000 ? 0.9 : 0.7,
        riskScore: 0.63,
        indicators: [
          `Cash available: ₦${cashAvailable.toLocaleString()}`,
          'Less than ₦50,000 in reserves',
        ],
        mitigation: [
          'Build emergency fund to 3-6 months of expenses',
          'Accelerate accounts receivable collection',
          'Negotiate extended payment terms with suppliers',
          'Consider short-term financing for working capital',
        ],
        timeframe: 'Immediate',
        monitored: true,
      });
    }
    
    // Cash burn rate
    if (monthlyExpenses > monthlyRevenue) {
      const burnRate = monthlyExpenses - monthlyRevenue;
      const runway = cashAvailable / burnRate;
      
      risks.push({
        id: 'cash_negative_burn',
        category: 'cash_flow',
        severity: runway < 2 ? 'critical' : runway < 4 ? 'high' : 'medium',
        description: `Burning ₦${burnRate.toLocaleString()} per month with ${runway.toFixed(1)} months runway`,
        likelihood: 0.8,
        impact: runway < 2 ? 0.95 : runway < 4 ? 0.8 : 0.6,
        riskScore: 0.76,
        indicators: [
          `Monthly burn: ₦${burnRate.toLocaleString()}`,
          `Runway: ${runway.toFixed(1)} months`,
          'Expenses exceed revenue',
        ],
        mitigation: [
          'Immediately reduce non-essential expenses',
          'Accelerate revenue generation activities',
          'Secure additional funding or credit line',
          'Delay non-critical expenditures',
        ],
        timeframe: 'Immediate',
        monitored: true,
      });
    }
    
    // Seasonal cash flow
    if (businessProfile?.industry === 'retail' || businessProfile?.industry === 'restaurant') {
      risks.push({
        id: 'cash_seasonal',
        category: 'cash_flow',
        severity: 'medium',
        description: 'Seasonal business may cause cash flow fluctuations',
        likelihood: 0.6,
        impact: 0.5,
        riskScore: 0.3,
        indicators: [
          'Industry prone to seasonal variations',
          'Potential off-season cash shortfalls',
        ],
        mitigation: [
          'Build cash reserves during peak seasons',
          'Secure seasonal credit facilities',
          'Diversify revenue streams across seasons',
          'Plan expenses around seasonal cash flow patterns',
        ],
        timeframe: 'Seasonal',
        monitored: true,
      });
    }
    
    return risks;
  }
  
  // Assess inventory risks
  private assessInventoryRisks(context: RiskAssessmentContext): Risk[] {
    const risks: Risk[] = [];
    const { businessData } = context;
    
    if (!businessData?.products) return risks;
    
    const products = businessData.products;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let deadStockCount = 0;
    let totalInventoryValue = 0;
    
    products.forEach((product: any) => {
      const stock = product.stock || 0;
      const threshold = product.lowStockThreshold || 10;
      const value = (product.costPrice || 0) * stock;
      totalInventoryValue += value;
      
      if (stock === 0) outOfStockCount++;
      else if (stock <= threshold) lowStockCount++;
      
      // Check for dead stock
      const lastSaleDate = product.lastSaleDate?.toDate ? product.lastSaleDate.toDate() : new Date(product.lastSaleDate);
      const daysSinceSale = Math.floor((Date.now() - lastSaleDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceSale > 60 && stock > 0) deadStockCount++;
    });
    
    // Out of stock risk
    if (outOfStockCount > 0) {
      risks.push({
        id: 'inventory_out_of_stock',
        category: 'inventory',
        severity: outOfStockCount > products.length * 0.2 ? 'high' : 'medium',
        description: `${outOfStockCount} products out of stock causing lost sales`,
        likelihood: 0.8,
        impact: 0.7,
        riskScore: 0.56,
        indicators: [
          `${outOfStockCount} products out of stock`,
          `${((outOfStockCount / products.length) * 100).toFixed(1)}% of catalog unavailable`,
        ],
        mitigation: [
          'Implement automated reorder points',
          'Increase safety stock levels for fast movers',
          'Diversify suppliers to reduce lead time risk',
          'Improve demand forecasting accuracy',
        ],
        timeframe: 'Immediate',
        monitored: true,
      });
    }
    
    // Dead stock risk
    if (deadStockCount > 0) {
      risks.push({
        id: 'inventory_dead_stock',
        category: 'inventory',
        severity: deadStockCount > products.length * 0.3 ? 'high' : 'medium',
        description: `${deadStockCount} products haven't sold in 60+ days, capital tied up`,
        likelihood: 0.6,
        impact: 0.6,
        riskScore: 0.36,
        indicators: [
          `${deadStockCount} products with no sales in 60+ days`,
          'Capital tied up in non-moving inventory',
        ],
        mitigation: [
          'Run clearance promotions to move dead stock',
          'Bundle slow movers with fast movers',
          'Review product mix and discontinue poor performers',
          'Improve inventory forecasting',
        ],
        timeframe: 'Short-term',
        monitored: true,
      });
    }
    
    // Overstock risk
    if (totalInventoryValue > 500000) {
      risks.push({
        id: 'inventory_overstock',
        category: 'inventory',
        severity: 'medium',
        description: `₦${totalInventoryValue.toLocaleString()} tied up in inventory`,
        likelihood: 0.5,
        impact: 0.5,
        riskScore: 0.25,
        indicators: [
          `Inventory value: ₦${totalInventoryValue.toLocaleString()}`,
          'High capital tied in inventory',
        ],
        mitigation: [
          'Implement just-in-time inventory where possible',
          'Optimize reorder quantities',
          'Improve inventory turnover',
          'Consider consignment arrangements with suppliers',
        ],
        timeframe: 'Medium-term',
        monitored: true,
      });
    }
    
    return risks;
  }
  
  // Assess supplier risks
  private assessSupplierRisks(context: RiskAssessmentContext): Risk[] {
    const risks: Risk[] = [];
    const { businessData, businessProfile } = context;
    
    if (!businessData?.suppliers) return risks;
    
    const suppliers = businessData.suppliers;
    
    // Single supplier dependency
    if (suppliers.length < 2 && businessProfile?.products && businessProfile.products.length > 5) {
      risks.push({
        id: 'supplier_dependency',
        category: 'supplier',
        severity: 'high',
        description: 'Single supplier dependency creates supply chain vulnerability',
        likelihood: 0.7,
        impact: 0.8,
        riskScore: 0.56,
        indicators: [
          'Only 1 supplier for multiple products',
          'No backup suppliers identified',
          'Single point of failure risk',
        ],
        mitigation: [
          'Identify and qualify backup suppliers',
          'Diversify supplier base across multiple vendors',
          'Maintain safety stock for critical items',
          'Negotiate supply agreements with multiple sources',
        ],
        timeframe: 'Short-term',
        monitored: true,
      });
    }
    
    // Supplier concentration risk
    if (suppliers.length > 0) {
      const topSupplierShare = 0.4; // Assume 40% from top supplier (would need actual data)
      if (topSupplierShare > 0.5) {
        risks.push({
          id: 'supplier_concentration',
          category: 'supplier',
          severity: 'medium',
          description: 'High concentration with single supplier increases risk',
          likelihood: 0.5,
          impact: 0.6,
          riskScore: 0.3,
          indicators: [
            'Top supplier accounts for >50% of supplies',
            'Concentration risk in supply chain',
          ],
          mitigation: [
            'Reduce dependency on top supplier',
            'Develop relationships with alternative suppliers',
            'Implement supplier diversification strategy',
          ],
          timeframe: 'Medium-term',
          monitored: true,
        });
      }
    }
    
    return risks;
  }
  
  // Assess pricing risks
  private assessPricingRisks(context: RiskAssessmentContext): Risk[] {
    const risks: Risk[] = [];
    const { businessProfile, businessData } = context;
    
    if (!businessData?.products) return risks;
    
    const products = businessData.products;
    let lowMarginCount = 0;
    
    products.forEach((product: any) => {
      const cost = product.costPrice || 0;
      const price = product.sellingPrice || 0;
      if (price > 0) {
        const margin = ((price - cost) / price) * 100;
        if (margin < 20) lowMarginCount++;
      }
    });
    
    // Low margin risk
    if (lowMarginCount > products.length * 0.3) {
      risks.push({
        id: 'pricing_low_margin',
        category: 'pricing',
        severity: 'medium',
        description: `${lowMarginCount} products have margins below 20%`,
        likelihood: 0.6,
        impact: 0.6,
        riskScore: 0.36,
        indicators: [
          `${lowMarginCount} products with <20% margin`,
          `${((lowMarginCount / products.length) * 100).toFixed(1)}% of catalog low margin`,
        ],
        mitigation: [
          'Review pricing strategy for low-margin items',
          'Negotiate better supplier costs',
          'Consider discontinuing very low-margin products',
          'Bundle low-margin items with high-margin items',
        ],
        timeframe: 'Short-term',
        monitored: true,
      });
    }
    
    // Competitive pricing pressure
    if (businessProfile?.industry === 'retail') {
      risks.push({
        id: 'pricing_competition',
        category: 'pricing',
        severity: 'medium',
        description: 'Competitive pricing pressure may impact margins',
        likelihood: 0.7,
        impact: 0.5,
        riskScore: 0.35,
        indicators: [
          'Retail industry highly competitive',
          'Price sensitivity in market',
        ],
        mitigation: [
          'Differentiate on value, not just price',
          'Implement dynamic pricing based on demand',
          'Focus on customer service and experience',
          'Create loyalty programs to reduce price sensitivity',
        ],
        timeframe: 'Ongoing',
        monitored: true,
      });
    }
    
    return risks;
  }
  
  // Assess debt risks
  private assessDebtRisks(context: RiskAssessmentContext): Risk[] {
    const risks: Risk[] = [];
    const { businessProfile } = context;
    
    const outstandingDebt = businessProfile?.liabilities || 0;
    const cashAvailable = businessProfile?.cashAvailable || 0;
    
    // High debt relative to cash
    if (outstandingDebt > 0 && cashAvailable > 0) {
      const debtToCashRatio = outstandingDebt / cashAvailable;
      
      if (debtToCashRatio > 3) {
        risks.push({
          id: 'debt_high_ratio',
          category: 'debt',
          severity: 'high',
          description: `Debt to cash ratio of ${debtToCashRatio.toFixed(1)}x indicates high leverage`,
          likelihood: 0.6,
          impact: 0.8,
          riskScore: 0.48,
          indicators: [
            `Debt: ₦${outstandingDebt.toLocaleString()}`,
            `Cash: ₦${cashAvailable.toLocaleString()}`,
            `Ratio: ${debtToCashRatio.toFixed(1)}x`,
          ],
          mitigation: [
            'Prioritize debt repayment',
            'Improve cash flow generation',
            'Consider debt restructuring',
            'Avoid taking on additional debt',
          ],
          timeframe: 'Short-term',
          monitored: true,
        });
      }
    }
    
    return risks;
  }
  
  // Assess operational risks
  private assessOperationalRisks(context: RiskAssessmentContext): Risk[] {
    const risks: Risk[] = [];
    const { businessProfile } = context;
    
    // Staff dependency risk
    if (businessProfile?.staffCount && businessProfile.staffCount > 0 && businessProfile.staffCount < 3) {
      risks.push({
        id: 'operational_staff_dependency',
        category: 'operational',
        severity: 'medium',
        description: 'Small team creates operational dependency risk',
        likelihood: 0.5,
        impact: 0.6,
        riskScore: 0.3,
        indicators: [
          `Staff count: ${businessProfile.staffCount}`,
          'Key person dependency risk',
        ],
        mitigation: [
          'Cross-train staff on multiple functions',
          'Document standard operating procedures',
          'Develop backup plans for key roles',
          'Consider hiring additional staff as business grows',
        ],
        timeframe: 'Medium-term',
        monitored: true,
      });
    }
    
    // Capacity constraints
    if (businessProfile?.industry === 'manufacturing' || businessProfile?.industry === 'plastic recycling') {
      risks.push({
        id: 'operational_capacity',
        category: 'operational',
        severity: 'medium',
        description: 'Production capacity may limit growth',
        likelihood: 0.6,
        impact: 0.5,
        riskScore: 0.3,
        indicators: [
          'Manufacturing/recycling operations',
          'Capacity constraints possible',
        ],
        mitigation: [
          'Monitor capacity utilization regularly',
          'Plan capacity expansion ahead of demand',
          'Optimize production processes for efficiency',
          'Consider outsourcing during peak periods',
        ],
        timeframe: 'Medium-term',
        monitored: true,
      });
    }
    
    return risks;
  }
  
  // Assess customer risks
  private assessCustomerRisks(context: RiskAssessmentContext): Risk[] {
    const risks: Risk[] = [];
    const { businessData } = context;
    
    if (!businessData?.customers) return risks;
    
    const customers = businessData.customers;
    let totalCreditBalance = 0;
    let overdueCount = 0;
    
    customers.forEach((customer: any) => {
      totalCreditBalance += customer.currentBalance || 0;
      
      if (customer.currentBalance > 0) {
        const lastPayment = customer.lastPaymentDate?.toDate ? customer.lastPaymentDate.toDate() : new Date(customer.lastPaymentDate);
        const daysSincePayment = Math.floor((Date.now() - lastPayment.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSincePayment > 30) overdueCount++;
      }
    });
    
    // Credit risk
    if (totalCreditBalance > 100000) {
      risks.push({
        id: 'customer_credit',
        category: 'customer',
        severity: totalCreditBalance > 300000 ? 'high' : 'medium',
        description: `₦${totalCreditBalance.toLocaleString()} in outstanding customer credit`,
        likelihood: 0.7,
        impact: 0.7,
        riskScore: 0.49,
        indicators: [
          `Outstanding credit: ₦${totalCreditBalance.toLocaleString()}`,
          `${overdueCount} customers with overdue payments`,
        ],
        mitigation: [
          'Implement stricter credit policies',
          'Send regular payment reminders',
          'Offer early payment discounts',
          'Consider factoring receivables for cash flow',
        ],
        timeframe: 'Immediate',
        monitored: true,
      });
    }
    
    // Customer concentration risk
    if (customers.length > 0) {
      // Would need actual sales data to calculate concentration
      risks.push({
        id: 'customer_concentration',
        category: 'customer',
        severity: 'low',
        description: 'Monitor customer concentration risk',
        likelihood: 0.4,
        impact: 0.5,
        riskScore: 0.2,
        indicators: [
          'Customer base concentration',
          'Dependency on key customers',
        ],
        mitigation: [
          'Diversify customer base',
          'Develop relationships with new customers',
          'Reduce dependency on largest customers',
        ],
        timeframe: 'Ongoing',
        monitored: true,
      });
    }
    
    return risks;
  }
  
  // Assess market risks
  private assessMarketRisks(context: RiskAssessmentContext): Risk[] {
    const risks: Risk[] = [];
    const { businessProfile } = context;
    
    // Market competition
    risks.push({
      id: 'market_competition',
      category: 'market',
      severity: 'medium',
      description: 'Competitive market environment',
      likelihood: 0.7,
      impact: 0.5,
      riskScore: 0.35,
      indicators: [
        'Competitive business environment',
        'Market saturation possible',
      ],
      mitigation: [
        'Differentiate products/services',
        'Focus on customer experience',
        'Monitor competitor activities',
        'Build strong brand loyalty',
      ],
      timeframe: 'Ongoing',
      monitored: true,
    });
    
    // Economic conditions
    risks.push({
      id: 'market_economic',
      category: 'market',
      severity: 'medium',
      description: 'Economic conditions may impact business',
      likelihood: 0.5,
      impact: 0.6,
      riskScore: 0.3,
      indicators: [
        'General economic uncertainty',
        'Inflation and currency fluctuations',
      ],
      mitigation: [
        'Maintain healthy cash reserves',
        'Diversify revenue streams',
        'Build flexible cost structure',
        'Monitor economic indicators',
      ],
      timeframe: 'Ongoing',
      monitored: true,
    });
    
    return risks;
  }
  
  // Assess strategic risks
  private assessStrategicRisks(context: RiskAssessmentContext): Risk[] {
    const risks: Risk[] = [];
    const { businessProfile } = context;
    
    // Lack of strategic planning
    if (!businessProfile?.goals || businessProfile.goals.length === 0) {
      risks.push({
        id: 'strategic_planning',
        category: 'strategic',
        severity: 'medium',
        description: 'No clear business goals defined',
        likelihood: 0.6,
        impact: 0.5,
        riskScore: 0.3,
        indicators: [
          'No documented business goals',
          'Lack of strategic direction',
        ],
        mitigation: [
          'Define clear short-term and long-term goals',
          'Create actionable business plan',
          'Regularly review and adjust strategy',
          'Align operations with strategic objectives',
        ],
        timeframe: 'Short-term',
        monitored: true,
      });
    }
    
    return risks;
  }
  
  // Get critical risks (severity: critical or high)
  getCriticalRisks(risks: Risk[]): Risk[] {
    return risks.filter(r => r.severity === 'critical' || r.severity === 'high');
  }
  
  // Format risks for AI response
  formatForAIResponse(risks: Risk[]): string {
    if (risks.length === 0) return '';
    
    const criticalRisks = this.getCriticalRisks(risks);
    
    let response = '\n\n⚠️ RISK ASSESSMENT:\n';
    
    if (criticalRisks.length > 0) {
      response += '\n🚨 CRITICAL/HIGH RISKS:\n';
      criticalRisks.forEach(risk => {
        response += `${risk.severity.toUpperCase()}: ${risk.description}\n`;
        response += `  • Mitigation: ${risk.mitigation[0]}\n`;
      });
    }
    
    response += '\nALL RISKS:\n';
    risks.slice(0, 5).forEach(risk => {
      const icon = risk.severity === 'critical' ? '🚨' : risk.severity === 'high' ? '⚠️' : risk.severity === 'medium' ? '⚡' : '📊';
      response += `${icon} [${risk.severity.toUpperCase()}] ${risk.category}: ${risk.description}\n`;
      if (risk.mitigation.length > 0) {
        response += `  → Mitigation: ${risk.mitigation[0]}\n`;
      }
    });
    
    return response;
  }
}

// Singleton instance
let riskEngineInstance: RiskEngine | null = null;

export function getRiskEngine(): RiskEngine {
  if (!riskEngineInstance) {
    riskEngineInstance = new RiskEngine();
  }
  return riskEngineInstance;
}
