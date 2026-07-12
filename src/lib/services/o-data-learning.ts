// MO Data Learning Engine - Learn from Busmo Data
// Extracts knowledge from all Busmo modules: sales, inventory, cash flow, expenses, invoices, suppliers, customers, etc.

import { getKnowledgeGraph, BusinessKnowledgeGraph } from './mo-knowledge-graph';
import { getPatternDetectionEngine, DetectedPatterns } from './mo-pattern-detection';
import { getInsightEngine, Insight } from './mo-insight-engine';
import { getConfidenceEngine, ConfidenceMetrics } from './mo-confidence-engine';

export interface LearningContext {
  businessId: string;
  userId?: string;
  timestamp: Date;
}

export interface DataLearningResult {
  knowledgeUpdated: boolean;
  factsLearned: string[];
  patternsDetected: DetectedPatterns;
  insightsGenerated: Insight[];
  confidenceScores: Record<string, ConfidenceMetrics>;
  graphChanges: Partial<BusinessKnowledgeGraph>;
  learningSummary: string;
}

export class DataLearningEngine {
  
  // Learn from sales data
  learnFromSales(sales: any[], context: LearningContext): Partial<DataLearningResult> {
    const knowledgeGraph = getKnowledgeGraph(context.businessId);
    const confidenceEngine = getConfidenceEngine();
    
    const factsLearned: string[] = [];
    const graphChanges: Partial<BusinessKnowledgeGraph> = {};
    
    if (sales.length === 0) {
      return { factsLearned, graphChanges };
    }
    
    // Calculate sales metrics
    const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0);
    const avgOrderValue = totalRevenue / sales.length;
    const salesByProduct = this.groupSalesByProduct(sales);
    const salesByCustomer = this.groupSalesByCustomer(sales);
    
    // Update financial node
    graphChanges.financial = {
      revenue: totalRevenue,
      lastUpdated: new Date(),
    } as any;
    
    factsLearned.push(`Total revenue: ₦${totalRevenue.toLocaleString()}`);
    factsLearned.push(`Average order value: ₦${avgOrderValue.toFixed(0)}`);
    
    // Update products in operations node
    const products = Object.entries(salesByProduct).map(([productId, productSales]) => ({
      id: productId,
      name: productSales[0]?.productName || 'Unknown',
      salesVolume: productSales.length,
      averagePrice: productSales.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0) / productSales.length,
      lastSaleDate: new Date(Math.max(...productSales.map((s: any) => new Date(s.createdAt || s.date).getTime()))),
    }));
    
    graphChanges.operations = {
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        active: true,
        averagePrice: p.averagePrice,
        salesVolume: p.salesVolume,
        lastSaleDate: p.lastSaleDate,
      })),
      lastUpdated: new Date(),
    } as any;
    
    factsLearned.push(`${products.length} products sold`);
    
    // Update customers in operations node
    const customers = Object.entries(salesByCustomer).map(([customerId, customerSales]) => ({
      id: customerId,
      name: customerSales[0]?.customerName || 'Unknown',
      totalPurchases: customerSales.length,
      averageOrderValue: customerSales.reduce((sum: number, s: any) => sum + (s.totalRevenue || 0), 0) / customerSales.length,
      lastPurchaseDate: new Date(Math.max(...customerSales.map((s: any) => new Date(s.createdAt || s.date).getTime()))),
    }));
    
    if (!graphChanges.operations) graphChanges.operations = {} as any;
    (graphChanges.operations as any).customers = customers.map(c => ({
      id: c.id,
      name: c.name,
      active: true,
      totalPurchases: c.totalPurchases,
      averageOrderValue: c.averageOrderValue,
      lastPurchaseDate: c.lastPurchaseDate,
    }));
    
    factsLearned.push(`${customers.length} customers made purchases`);
    
    // Calculate confidence
    const salesConfidence = confidenceEngine.calculateConfidence(sales, {
      businessId: context.businessId,
      dataType: 'sales',
    });
    
    // Apply changes to knowledge graph
    knowledgeGraph.applyFacts(graphChanges);
    
    return {
      factsLearned,
      graphChanges,
      confidenceScores: { sales: salesConfidence },
    };
  }
  
  // Learn from inventory data
  learnFromInventory(products: any[], context: LearningContext): Partial<DataLearningResult> {
    const knowledgeGraph = getKnowledgeGraph(context.businessId);
    const confidenceEngine = getConfidenceEngine();
    
    const factsLearned: string[] = [];
    const graphChanges: Partial<BusinessKnowledgeGraph> = {};
    
    if (products.length === 0) {
      return { factsLearned, graphChanges };
    }
    
    const totalStock = products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0);
    const totalValue = products.reduce((sum: number, p: any) => sum + ((p.stock || 0) * (p.price || 0)), 0);
    const activeProducts = products.filter((p: any) => p.active !== false);
    
    graphChanges.operations = {
      products: activeProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        active: p.active !== false,
        averagePrice: p.price,
        stock: p.stock,
      })),
      lastUpdated: new Date(),
    } as any;
    
    graphChanges.financial = {
      assets: totalValue,
      lastUpdated: new Date(),
    } as any;
    
    factsLearned.push(`${activeProducts.length} active products`);
    factsLearned.push(`Total stock: ${totalStock} units`);
    factsLearned.push(`Inventory value: ₦${totalValue.toLocaleString()}`);
    
    const inventoryConfidence = confidenceEngine.calculateConfidence(products, {
      businessId: context.businessId,
      dataType: 'inventory',
    });
    
    knowledgeGraph.applyFacts(graphChanges);
    
    return {
      factsLearned,
      graphChanges,
      confidenceScores: { inventory: inventoryConfidence },
    };
  }
  
  // Learn from cash flow data
  learnFromCashFlow(cashFlow: any[], context: LearningContext): Partial<DataLearningResult> {
    const knowledgeGraph = getKnowledgeGraph(context.businessId);
    const confidenceEngine = getConfidenceEngine();
    
    const factsLearned: string[] = [];
    const graphChanges: Partial<BusinessKnowledgeGraph> = {};
    
    if (cashFlow.length === 0) {
      return { factsLearned, graphChanges };
    }
    
    const totalMoneyIn = cashFlow.reduce((sum: number, cf: any) => sum + (cf.moneyIn || 0), 0);
    const totalMoneyOut = cashFlow.reduce((sum: number, cf: any) => sum + (cf.moneyOut || 0), 0);
    const netCashFlow = totalMoneyIn - totalMoneyOut;
    const avgDailyFlow = netCashFlow / cashFlow.length;
    
    graphChanges.financial = {
      cash: netCashFlow,
      lastUpdated: new Date(),
    } as any;
    
    factsLearned.push(`Total money in: ₦${totalMoneyIn.toLocaleString()}`);
    factsLearned.push(`Total money out: ₦${totalMoneyOut.toLocaleString()}`);
    factsLearned.push(`Net cash flow: ₦${netCashFlow.toLocaleString()}`);
    factsLearned.push(`Average daily flow: ₦${avgDailyFlow.toFixed(0)}`);
    
    const cashFlowConfidence = confidenceEngine.calculateConfidence(cashFlow, {
      businessId: context.businessId,
      dataType: 'cash_flow',
    });
    
    knowledgeGraph.applyFacts(graphChanges);
    
    return {
      factsLearned,
      graphChanges,
      confidenceScores: { cashFlow: cashFlowConfidence },
    };
  }
  
  // Learn from expenses data
  learnFromExpenses(expenses: any[], context: LearningContext): Partial<DataLearningResult> {
    const knowledgeGraph = getKnowledgeGraph(context.businessId);
    const confidenceEngine = getConfidenceEngine();
    
    const factsLearned: string[] = [];
    const graphChanges: Partial<BusinessKnowledgeGraph> = {};
    
    if (expenses.length === 0) {
      return { factsLearned, graphChanges };
    }
    
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    const expensesByCategory = this.groupExpensesByCategory(expenses);
    
    graphChanges.financial = {
      expenses: totalExpenses,
      lastUpdated: new Date(),
    } as any;
    
    factsLearned.push(`Total expenses: ₦${totalExpenses.toLocaleString()}`);
    
    Object.entries(expensesByCategory).forEach(([category, categoryExpenses]) => {
      const categoryTotal = categoryExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      factsLearned.push(`${category} expenses: ₦${categoryTotal.toLocaleString()}`);
    });
    
    const expensesConfidence = confidenceEngine.calculateConfidence(expenses, {
      businessId: context.businessId,
      dataType: 'expenses',
    });
    
    knowledgeGraph.applyFacts(graphChanges);
    
    return {
      factsLearned,
      graphChanges,
      confidenceScores: { expenses: expensesConfidence },
    };
  }
  
  // Learn from suppliers data
  learnFromSuppliers(suppliers: any[], context: LearningContext): Partial<DataLearningResult> {
    const knowledgeGraph = getKnowledgeGraph(context.businessId);
    const confidenceEngine = getConfidenceEngine();
    
    const factsLearned: string[] = [];
    const graphChanges: Partial<BusinessKnowledgeGraph> = {};
    
    if (suppliers.length === 0) {
      return { factsLearned, graphChanges };
    }
    
    const activeSuppliers = suppliers.filter((s: any) => s.active !== false);
    
    graphChanges.operations = {
      suppliers: activeSuppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        active: s.active !== false,
        category: s.category,
      })),
      lastUpdated: new Date(),
    } as any;
    
    factsLearned.push(`${activeSuppliers.length} active suppliers`);
    
    const suppliersConfidence = confidenceEngine.calculateConfidence(suppliers, {
      businessId: context.businessId,
      dataType: 'suppliers',
    });
    
    knowledgeGraph.applyFacts(graphChanges);
    
    return {
      factsLearned,
      graphChanges,
      confidenceScores: { suppliers: suppliersConfidence },
    };
  }
  
  // Learn from customers data
  learnFromCustomers(customers: any[], context: LearningContext): Partial<DataLearningResult> {
    const knowledgeGraph = getKnowledgeGraph(context.businessId);
    const confidenceEngine = getConfidenceEngine();
    
    const factsLearned: string[] = [];
    const graphChanges: Partial<BusinessKnowledgeGraph> = {};
    
    if (customers.length === 0) {
      return { factsLearned, graphChanges };
    }
    
    const activeCustomers = customers.filter((c: any) => c.active !== false);
    const totalCreditBalance = customers.reduce((sum: number, c: any) => sum + (c.currentBalance || 0), 0);
    
    graphChanges.operations = {
      customers: activeCustomers.map((c: any) => ({
        id: c.id,
        name: c.name,
        active: c.active !== false,
        type: c.type || 'retail',
        creditBalance: c.currentBalance,
      })),
      lastUpdated: new Date(),
    } as any;
    
    factsLearned.push(`${activeCustomers.length} active customers`);
    factsLearned.push(`Total credit balance: ₦${totalCreditBalance.toLocaleString()}`);
    
    const customersConfidence = confidenceEngine.calculateConfidence(customers, {
      businessId: context.businessId,
      dataType: 'customers',
    });
    
    knowledgeGraph.applyFacts(graphChanges);
    
    return {
      factsLearned,
      graphChanges,
      confidenceScores: { customers: customersConfidence },
    };
  }
  
  // Comprehensive learning from all Busmo data
  learnFromAllData(businessData: any, context: LearningContext): DataLearningResult {
    const patternDetectionEngine = getPatternDetectionEngine();
    const insightEngine = getInsightEngine();
    
    const allFactsLearned: string[] = [];
    const allGraphChanges: Partial<BusinessKnowledgeGraph> = {};
    const allConfidenceScores: Record<string, ConfidenceMetrics> = {};
    
    // Learn from each data source
    if (businessData.sales) {
      const salesResult = this.learnFromSales(businessData.sales, context);
      if (salesResult.factsLearned) allFactsLearned.push(...salesResult.factsLearned);
      if (salesResult.graphChanges) Object.assign(allGraphChanges, salesResult.graphChanges);
      if (salesResult.confidenceScores) Object.assign(allConfidenceScores, salesResult.confidenceScores);
    }
    
    if (businessData.products) {
      const inventoryResult = this.learnFromInventory(businessData.products, context);
      if (inventoryResult.factsLearned) allFactsLearned.push(...inventoryResult.factsLearned);
      if (inventoryResult.graphChanges) Object.assign(allGraphChanges, inventoryResult.graphChanges);
      if (inventoryResult.confidenceScores) Object.assign(allConfidenceScores, inventoryResult.confidenceScores);
    }
    
    if (businessData.cashFlow) {
      const cashFlowResult = this.learnFromCashFlow(businessData.cashFlow, context);
      if (cashFlowResult.factsLearned) allFactsLearned.push(...cashFlowResult.factsLearned);
      if (cashFlowResult.graphChanges) Object.assign(allGraphChanges, cashFlowResult.graphChanges);
      if (cashFlowResult.confidenceScores) Object.assign(allConfidenceScores, cashFlowResult.confidenceScores);
    }
    
    if (businessData.expenses) {
      const expensesResult = this.learnFromExpenses(businessData.expenses, context);
      if (expensesResult.factsLearned) allFactsLearned.push(...expensesResult.factsLearned);
      if (expensesResult.graphChanges) Object.assign(allGraphChanges, expensesResult.graphChanges);
      if (expensesResult.confidenceScores) Object.assign(allConfidenceScores, expensesResult.confidenceScores);
    }
    
    if (businessData.suppliers) {
      const suppliersResult = this.learnFromSuppliers(businessData.suppliers, context);
      if (suppliersResult.factsLearned) allFactsLearned.push(...suppliersResult.factsLearned);
      if (suppliersResult.graphChanges) Object.assign(allGraphChanges, suppliersResult.graphChanges);
      if (suppliersResult.confidenceScores) Object.assign(allConfidenceScores, suppliersResult.confidenceScores);
    }
    
    if (businessData.customers) {
      const customersResult = this.learnFromCustomers(businessData.customers, context);
      if (customersResult.factsLearned) allFactsLearned.push(...customersResult.factsLearned);
      if (customersResult.graphChanges) Object.assign(allGraphChanges, customersResult.graphChanges);
      if (customersResult.confidenceScores) Object.assign(allConfidenceScores, customersResult.confidenceScores);
    }
    
    // Detect patterns
    const patterns = patternDetectionEngine.analyzePatterns(businessData);
    
    // Generate insights
    const insights = insightEngine.generateInsights(patterns);
    
    // Generate learning summary
    const learningSummary = this.generateLearningSummary(allFactsLearned, patterns, insights);
    
    return {
      knowledgeUpdated: allFactsLearned.length > 0,
      factsLearned: allFactsLearned,
      patternsDetected: patterns,
      insightsGenerated: insights,
      confidenceScores: allConfidenceScores,
      graphChanges: allGraphChanges,
      learningSummary,
    };
  }
  
  // Generate learning summary
  private generateLearningSummary(
    facts: string[],
    patterns: DetectedPatterns,
    insights: Insight[]
  ): string {
    let summary = `Learned ${facts.length} new facts from business data. `;
    
    const patternCount = 
      patterns.sales.length +
      patterns.expenses.length +
      patterns.customerBehavior.length +
      patterns.inventory.length +
      patterns.supplierPerformance.length;
    
    if (patternCount > 0) {
      summary += `Detected ${patternCount} patterns. `;
    }
    
    if (insights.length > 0) {
      summary += `Generated ${insights.length} actionable insights. `;
    }
    
    return summary;
  }
  
  // Helper: Group sales by product
  private groupSalesByProduct(sales: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    sales.forEach(sale => {
      const items = sale.items || [];
      items.forEach((item: any) => {
        const productId = item.productId || 'unknown';
        if (!grouped[productId]) grouped[productId] = [];
        grouped[productId].push({ ...item, sale });
      });
    });
    return grouped;
  }
  
  // Helper: Group sales by customer
  private groupSalesByCustomer(sales: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    sales.forEach(sale => {
      const customerId = sale.customerId || 'unknown';
      if (!grouped[customerId]) grouped[customerId] = [];
      grouped[customerId].push(sale);
    });
    return grouped;
  }
  
  // Helper: Group expenses by category
  private groupExpensesByCategory(expenses: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    expenses.forEach(expense => {
      const category = expense.category || 'uncategorized';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(expense);
    });
    return grouped;
  }
  
  // Format learning results for AI response
  formatForAIResponse(result: DataLearningResult): string {
    let response = '\n\n🧠 DATA LEARNING SUMMARY:\n';
    response += result.learningSummary + '\n';
    
    if (result.factsLearned.length > 0) {
      response += '\n📊 Facts Learned:\n';
      result.factsLearned.slice(0, 5).forEach(fact => {
        response += `• ${fact}\n`;
      });
    }
    
    if (Object.keys(result.confidenceScores).length > 0) {
      response += '\n📈 Confidence Scores:\n';
      Object.entries(result.confidenceScores).forEach(([source, metrics]) => {
        response += `• ${source}: ${(metrics.overallConfidence * 100).toFixed(0)}% (${metrics.dataPoints} data points)\n`;
      });
    }
    
    return response;
  }
}

// Singleton instance
let dataLearningEngineInstance: DataLearningEngine | null = null;

export function getDataLearningEngine(): DataLearningEngine {
  if (!dataLearningEngineInstance) {
    dataLearningEngineInstance = new DataLearningEngine();
  }
  return dataLearningEngineInstance;
}
