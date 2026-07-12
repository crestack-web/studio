// MO Business Knowledge Graph - Structured Business Intelligence
// Maintains a continuously evolving knowledge graph of the business

export interface BusinessIdentity {
  name?: string;
  industry?: string;
  businessModel?: string;
  country?: string;
  city?: string;
  currency?: string;
  businessStage?: 'idea' | 'startup' | 'growing' | 'mature';
  registrationDate?: Date;
  taxSettings?: any;
  ownerPreferences?: any;
}

export interface FinancialNode {
  capital?: number;
  cash?: number;
  revenue?: number;
  profit?: number;
  expenses?: number;
  debts?: number;
  assets?: number;
  workingCapital?: number;
  monthlyBurn?: number;
  profitMargin?: number;
  revenueGrowthRate?: number;
  lastUpdated: Date;
}

export interface OperationsNode {
  products?: ProductNode[];
  inventory?: InventoryNode[];
  warehouses?: WarehouseNode[];
  suppliers?: SupplierNode[];
  customers?: CustomerNode[];
  employees?: EmployeeNode[];
  production?: ProductionNode[];
  lastUpdated: Date;
}

export interface ProductNode {
  id: string;
  name: string;
  category?: string;
  active: boolean;
  averagePrice?: number;
  averageCost?: number;
  margin?: number;
  salesVolume?: number;
  demandTrend?: 'increasing' | 'stable' | 'decreasing';
  lastSaleDate?: Date;
}

export interface InventoryNode {
  productId: string;
  quantity: number;
  value: number;
  turnoverRate?: number;
  lastRestockDate?: Date;
  status: 'optimal' | 'low' | 'overstock' | 'out_of_stock';
}

export interface WarehouseNode {
  id: string;
  name: string;
  location: string;
  capacity?: number;
  utilization?: number;
  active: boolean;
}

export interface SupplierNode {
  id: string;
  name: string;
  category?: string;
  active: boolean;
  averageDeliveryTime?: number;
  reliabilityScore?: number;
  lastOrderDate?: Date;
  totalOrders?: number;
}

export interface CustomerNode {
  id: string;
  name: string;
  type?: 'retail' | 'wholesale' | 'credit';
  active: boolean;
  totalPurchases?: number;
  averageOrderValue?: number;
  paymentReliability?: number;
  lastPurchaseDate?: Date;
  creditBalance?: number;
}

export interface EmployeeNode {
  id: string;
  name: string;
  role: string;
  active: boolean;
  hireDate?: Date;
  performanceScore?: number;
}

export interface ProductionNode {
  capacity?: number;
  utilization?: number;
  downtime?: number;
  yieldRate?: number;
  qualityRate?: number;
}

export interface StrategyNode {
  goals?: GoalNode[];
  expansionPlans?: ExpansionNode[];
  pricingStrategy?: PricingStrategyNode;
  marketingStrategy?: MarketingStrategyNode;
  fundingPlans?: FundingNode[];
  lastUpdated: Date;
}

export interface GoalNode {
  id: string;
  description: string;
  type: 'revenue' | 'growth' | 'efficiency' | 'expansion' | 'other';
  target?: number;
  current?: number;
  deadline?: Date;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
}

export interface ExpansionNode {
  id: string;
  description: string;
  type: 'location' | 'product' | 'market' | 'capacity';
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  targetDate?: Date;
  estimatedCost?: number;
}

export interface PricingStrategyNode {
  approach?: 'cost_plus' | 'value_based' | 'competitive' | 'dynamic';
  lastPriceChange?: Date;
  priceChangeHistory?: PriceChange[];
}

export interface PriceChange {
  date: Date;
  product: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  outcome?: string;
}

export interface MarketingStrategyNode {
  channels?: string[];
  budget?: number;
  lastCampaign?: string;
  campaignResults?: CampaignResult[];
}

export interface CampaignResult {
  name: string;
  date: Date;
  cost: number;
  revenue: number;
  roi: number;
}

export interface FundingNode {
  id: string;
  type: 'loan' | 'investment' | 'grant' | 'bootstrapped';
  amount?: number;
  status: 'seeking' | 'secured' | 'rejected' | 'completed';
  purpose?: string;
}

export interface RiskNode {
  operationalRisks?: Risk[];
  financialRisks?: Risk[];
  supplierRisks?: Risk[];
  customerRisks?: Risk[];
  marketRisks?: Risk[];
  lastUpdated: Date;
}

export interface Risk {
  id: string;
  description: string;
  category: 'operational' | 'financial' | 'supplier' | 'customer' | 'market';
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: number;
  impact: number;
  mitigation?: string;
  status: 'active' | 'mitigated' | 'resolved';
  identifiedDate: Date;
}

export interface BusinessKnowledgeGraph {
  identity: BusinessIdentity;
  financial: FinancialNode;
  operations: OperationsNode;
  strategy: StrategyNode;
  risks: RiskNode;
  lastUpdated: Date;
  version: number;
}

export class KnowledgeGraph {
  private graph: BusinessKnowledgeGraph;
  private businessId: string;
  
  constructor(businessId: string) {
    this.businessId = businessId;
    this.graph = this.initializeGraph();
  }
  
  private initializeGraph(): BusinessKnowledgeGraph {
    return {
      identity: {},
      financial: { lastUpdated: new Date() },
      operations: { lastUpdated: new Date() },
      strategy: { lastUpdated: new Date() },
      risks: { lastUpdated: new Date() },
      lastUpdated: new Date(),
      version: 1,
    };
  }
  
  // Update identity node
  updateIdentity(updates: Partial<BusinessIdentity>): void {
    this.graph.identity = { ...this.graph.identity, ...updates };
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Update financial node
  updateFinancial(updates: Partial<FinancialNode>): void {
    this.graph.financial = { ...this.graph.financial, ...updates, lastUpdated: new Date() };
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Update operations node
  updateOperations(updates: Partial<OperationsNode>): void {
    this.graph.operations = { ...this.graph.operations, ...updates, lastUpdated: new Date() };
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Update strategy node
  updateStrategy(updates: Partial<StrategyNode>): void {
    this.graph.strategy = { ...this.graph.strategy, ...updates, lastUpdated: new Date() };
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Update risks node
  updateRisks(updates: Partial<RiskNode>): void {
    this.graph.risks = { ...this.graph.risks, ...updates, lastUpdated: new Date() };
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Add product to operations
  addProduct(product: ProductNode): void {
    if (!this.graph.operations.products) {
      this.graph.operations.products = [];
    }
    
    const existingIndex = this.graph.operations.products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      this.graph.operations.products[existingIndex] = product;
    } else {
      this.graph.operations.products.push(product);
    }
    
    this.graph.operations.lastUpdated = new Date();
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Remove product from operations
  removeProduct(productId: string): void {
    if (!this.graph.operations.products) return;
    
    this.graph.operations.products = this.graph.operations.products.filter(p => p.id !== productId);
    this.graph.operations.lastUpdated = new Date();
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Add supplier to operations
  addSupplier(supplier: SupplierNode): void {
    if (!this.graph.operations.suppliers) {
      this.graph.operations.suppliers = [];
    }
    
    const existingIndex = this.graph.operations.suppliers.findIndex(s => s.id === supplier.id);
    if (existingIndex >= 0) {
      this.graph.operations.suppliers[existingIndex] = supplier;
    } else {
      this.graph.operations.suppliers.push(supplier);
    }
    
    this.graph.operations.lastUpdated = new Date();
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Remove supplier from operations
  removeSupplier(supplierId: string): void {
    if (!this.graph.operations.suppliers) return;
    
    this.graph.operations.suppliers = this.graph.operations.suppliers.filter(s => s.id !== supplierId);
    this.graph.operations.lastUpdated = new Date();
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Add customer to operations
  addCustomer(customer: CustomerNode): void {
    if (!this.graph.operations.customers) {
      this.graph.operations.customers = [];
    }
    
    const existingIndex = this.graph.operations.customers.findIndex(c => c.id === customer.id);
    if (existingIndex >= 0) {
      this.graph.operations.customers[existingIndex] = customer;
    } else {
      this.graph.operations.customers.push(customer);
    }
    
    this.graph.operations.lastUpdated = new Date();
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Add goal to strategy
  addGoal(goal: GoalNode): void {
    if (!this.graph.strategy.goals) {
      this.graph.strategy.goals = [];
    }
    
    const existingIndex = this.graph.strategy.goals.findIndex(g => g.id === goal.id);
    if (existingIndex >= 0) {
      this.graph.strategy.goals[existingIndex] = goal;
    } else {
      this.graph.strategy.goals.push(goal);
    }
    
    this.graph.strategy.lastUpdated = new Date();
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Add risk to risks
  addRisk(risk: Risk): void {
    const categoryKey = `${risk.category}Risks` as keyof RiskNode;
    if (!this.graph.risks[categoryKey]) {
      (this.graph.risks as any)[categoryKey] = [];
    }
    
    const risks = (this.graph.risks[categoryKey] as Risk[]) || [];
    const existingIndex = risks.findIndex(r => r.id === risk.id);
    if (existingIndex >= 0) {
      risks[existingIndex] = risk;
    } else {
      risks.push(risk);
    }
    
    (this.graph.risks as any)[categoryKey] = risks;
    
    this.graph.risks.lastUpdated = new Date();
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Remove risk
  removeRisk(riskId: string, category: string): void {
    const categoryKey = `${category}Risks` as keyof RiskNode;
    if (!this.graph.risks[categoryKey]) return;
    
    const risks = (this.graph.risks[categoryKey] as Risk[]) || [];
    (this.graph.risks as any)[categoryKey] = risks.filter(r => r.id !== riskId);
    
    this.graph.risks.lastUpdated = new Date();
    this.graph.lastUpdated = new Date();
    this.graph.version++;
  }
  
  // Get complete graph
  getGraph(): BusinessKnowledgeGraph {
    return { ...this.graph };
  }
  
  // Get specific node
  getNode<K extends keyof BusinessKnowledgeGraph>(node: K): BusinessKnowledgeGraph[K] {
    return this.graph[node];
  }
  
  // Get changes since specific version
  getChangesSince(version: number): Partial<BusinessKnowledgeGraph> {
    if (version >= this.graph.version) {
      return {};
    }
    
    // Return full graph for simplicity (could be optimized to return only changes)
    return this.getGraph();
  }
  
  // Extract facts from message
  extractFactsFromMessage(message: string): Partial<BusinessKnowledgeGraph> {
    const facts: Partial<BusinessKnowledgeGraph> = {};
    const lowerMessage = message.toLowerCase();
    
    // Extract identity facts
    if (lowerMessage.includes('four suppliers') || lowerMessage.includes('4 suppliers')) {
      if (!facts.operations) facts.operations = {} as OperationsNode;
      (facts.operations as OperationsNode).suppliers = [
        { id: 'temp', name: 'Supplier 1', active: true },
        { id: 'temp2', name: 'Supplier 2', active: true },
        { id: 'temp3', name: 'Supplier 3', active: true },
        { id: 'temp4', name: 'Supplier 4', active: true },
      ];
    }
    
    if (lowerMessage.includes('stopped selling')) {
      const productMatch = message.match(/stopped selling\s+(.+)/i);
      if (productMatch) {
        if (!facts.operations) facts.operations = {} as OperationsNode;
        if (!facts.operations.products) facts.operations.products = [];
        facts.operations.products.push({
          id: 'temp',
          name: productMatch[1].trim(),
          active: false,
        });
      }
    }
    
    if (lowerMessage.includes('second warehouse') || lowerMessage.includes('2 warehouses')) {
      if (!facts.identity) facts.identity = {};
      // Would need actual warehouse data
    }
    
    return facts;
  }
  
  // Apply facts to graph
  applyFacts(facts: Partial<BusinessKnowledgeGraph>): void {
    if (facts.identity) {
      this.updateIdentity(facts.identity);
    }
    if (facts.financial) {
      this.updateFinancial(facts.financial);
    }
    if (facts.operations) {
      this.updateOperations(facts.operations);
    }
    if (facts.strategy) {
      this.updateStrategy(facts.strategy);
    }
    if (facts.risks) {
      this.updateRisks(facts.risks);
    }
  }
  
  // Export graph
  export(): string {
    return JSON.stringify(this.graph, null, 2);
  }
  
  // Import graph
  import(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.graph = parsed;
    } catch (error) {
      console.error('Failed to import knowledge graph:', error);
    }
  }
  
  // Get graph statistics
  getStats(): Record<string, any> {
    return {
      version: this.graph.version,
      lastUpdated: this.graph.lastUpdated,
      productCount: this.graph.operations.products?.length || 0,
      supplierCount: this.graph.operations.suppliers?.length || 0,
      customerCount: this.graph.operations.customers?.length || 0,
      activeGoals: this.graph.strategy.goals?.filter(g => g.status === 'active').length || 0,
      activeRisks: this.countActiveRisks(),
    };
  }
  
  private countActiveRisks(): number {
    let count = 0;
    const riskCategories = ['operationalRisks', 'financialRisks', 'supplierRisks', 'customerRisks', 'marketRisks'];
    
    riskCategories.forEach(category => {
      const risks = this.graph.risks[category as keyof RiskNode] as Risk[];
      if (risks) {
        count += risks.filter(r => r.status === 'active').length;
      }
    });
    
    return count;
  }
}

// Singleton instances per business
const knowledgeGraphs: Map<string, KnowledgeGraph> = new Map();

export function getKnowledgeGraph(businessId: string): KnowledgeGraph {
  if (!knowledgeGraphs.has(businessId)) {
    knowledgeGraphs.set(businessId, new KnowledgeGraph(businessId));
  }
  return knowledgeGraphs.get(businessId)!;
}

export function clearKnowledgeGraph(businessId: string): void {
  knowledgeGraphs.delete(businessId);
}
