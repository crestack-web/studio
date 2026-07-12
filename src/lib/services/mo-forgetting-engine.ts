// MO Forgetting Engine - Remove/Archive Outdated Information
// Manages memory lifecycle while preserving important historical decisions

export interface ForgettingRule {
  id: string;
  category: 'suppliers' | 'products' | 'customers' | 'risks' | 'goals' | 'insights' | 'patterns';
  condition: string;
  action: 'remove' | 'archive' | 'degrade';
  retentionPeriod: number; // days
  importanceThreshold: number; // 0-1
}

export interface ForgettingContext {
  businessId: string;
  currentDate: Date;
  preserveImportantDecisions: boolean;
}

export interface ForgettingResult {
  itemsRemoved: number;
  itemsArchived: number;
  itemsDegraded: number;
  importantDecisionsPreserved: number;
  summary: string;
}

export class ForgettingEngine {
  private rules: ForgettingRule[] = [];
  
  constructor() {
    this.initializeDefaultRules();
  }
  
  // Initialize default forgetting rules
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'inactive-suppliers',
        category: 'suppliers',
        condition: 'inactive for 180 days',
        action: 'archive',
        retentionPeriod: 180,
        importanceThreshold: 0.3,
      },
      {
        id: 'discontinued-products',
        category: 'products',
        condition: 'discontinued for 365 days',
        action: 'archive',
        retentionPeriod: 365,
        importanceThreshold: 0.2,
      },
      {
        id: 'inactive-customers',
        category: 'customers',
        condition: 'no purchases for 365 days',
        action: 'degrade',
        retentionPeriod: 365,
        importanceThreshold: 0.4,
      },
      {
        id: 'resolved-risks',
        category: 'risks',
        condition: 'resolved for 90 days',
        action: 'archive',
        retentionPeriod: 90,
        importanceThreshold: 0.5,
      },
      {
        id: 'completed-goals',
        category: 'goals',
        condition: 'completed for 180 days',
        action: 'archive',
        retentionPeriod: 180,
        importanceThreshold: 0.6,
      },
      {
        id: 'old-insights',
        category: 'insights',
        condition: 'older than 90 days with low confidence',
        action: 'degrade',
        retentionPeriod: 90,
        importanceThreshold: 0.3,
      },
      {
        id: 'stale-patterns',
        category: 'patterns',
        condition: 'not confirmed for 60 days',
        action: 'degrade',
        retentionPeriod: 60,
        importanceThreshold: 0.4,
      },
    ];
  }
  
  // Add custom forgetting rule
  addRule(rule: ForgettingRule): void {
    this.rules.push(rule);
  }
  
  // Remove forgetting rule
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }
  
  // Apply forgetting to knowledge graph
  applyForgetting(graph: any, context: ForgettingContext): ForgettingResult {
    let itemsRemoved = 0;
    let itemsArchived = 0;
    let itemsDegraded = 0;
    let importantDecisionsPreserved = 0;
    
    // Apply rules to each category
    this.rules.forEach(rule => {
      const result = this.applyRule(rule, graph, context);
      itemsRemoved += result.removed;
      itemsArchived += result.archived;
      itemsDegraded += result.degraded;
      importantDecisionsPreserved += result.preserved;
    });
    
    const summary = this.generateSummary(itemsRemoved, itemsArchived, itemsDegraded, importantDecisionsPreserved);
    
    return {
      itemsRemoved,
      itemsArchived,
      itemsDegraded,
      importantDecisionsPreserved,
      summary,
    };
  }
  
  // Apply a single forgetting rule
  private applyRule(rule: ForgettingRule, graph: any, context: ForgettingContext): {
    removed: number;
    archived: number;
    degraded: number;
    preserved: number;
  } {
    let removed = 0;
    let archived = 0;
    let degraded = 0;
    let preserved = 0;
    
    const cutoffDate = new Date(context.currentDate);
    cutoffDate.setDate(cutoffDate.getDate() - rule.retentionPeriod);
    
    switch (rule.category) {
      case 'suppliers':
        const suppliers = graph.operations?.suppliers || [];
        suppliers.forEach((supplier: any) => {
          if (this.shouldApplyRule(supplier, rule, cutoffDate, context)) {
            if (supplier.importance >= rule.importanceThreshold) {
              preserved++;
            } else if (rule.action === 'remove') {
              removed++;
            } else if (rule.action === 'archive') {
              supplier.archived = true;
              supplier.archivedDate = context.currentDate;
              archived++;
            } else if (rule.action === 'degrade') {
              supplier.confidence = Math.max(0, (supplier.confidence || 1) * 0.7);
              degraded++;
            }
          }
        });
        break;
        
      case 'products':
        const products = graph.operations?.products || [];
        products.forEach((product: any) => {
          if (this.shouldApplyRule(product, rule, cutoffDate, context)) {
            if (product.importance >= rule.importanceThreshold) {
              preserved++;
            } else if (rule.action === 'remove') {
              removed++;
            } else if (rule.action === 'archive') {
              product.archived = true;
              product.archivedDate = context.currentDate;
              archived++;
            } else if (rule.action === 'degrade') {
              product.confidence = Math.max(0, (product.confidence || 1) * 0.7);
              degraded++;
            }
          }
        });
        break;
        
      case 'customers':
        const customers = graph.operations?.customers || [];
        customers.forEach((customer: any) => {
          if (this.shouldApplyRule(customer, rule, cutoffDate, context)) {
            if (customer.importance >= rule.importanceThreshold) {
              preserved++;
            } else if (rule.action === 'remove') {
              removed++;
            } else if (rule.action === 'archive') {
              customer.archived = true;
              customer.archivedDate = context.currentDate;
              archived++;
            } else if (rule.action === 'degrade') {
              customer.confidence = Math.max(0, (customer.confidence || 1) * 0.7);
              degraded++;
            }
          }
        });
        break;
        
      case 'risks':
        const risks = graph.risks || {};
        Object.keys(risks).forEach(category => {
          const categoryRisks = risks[category] || [];
          categoryRisks.forEach((risk: any) => {
            if (this.shouldApplyRule(risk, rule, cutoffDate, context)) {
              if (risk.importance >= rule.importanceThreshold) {
                preserved++;
              } else if (rule.action === 'remove') {
                removed++;
              } else if (rule.action === 'archive') {
                risk.archived = true;
                risk.archivedDate = context.currentDate;
                archived++;
              } else if (rule.action === 'degrade') {
                risk.confidence = Math.max(0, (risk.confidence || 1) * 0.7);
                degraded++;
              }
            }
          });
        });
        break;
        
      case 'goals':
        const goals = graph.strategy?.goals || [];
        goals.forEach((goal: any) => {
          if (this.shouldApplyRule(goal, rule, cutoffDate, context)) {
            if (goal.importance >= rule.importanceThreshold) {
              preserved++;
            } else if (rule.action === 'remove') {
              removed++;
            } else if (rule.action === 'archive') {
              goal.archived = true;
              goal.archivedDate = context.currentDate;
              archived++;
            } else if (rule.action === 'degrade') {
              goal.confidence = Math.max(0, (goal.confidence || 1) * 0.7);
              degraded++;
            }
          }
        });
        break;
    }
    
    return { removed, archived, degraded, preserved };
  }
  
  // Check if rule should be applied to an item
  private shouldApplyRule(item: any, rule: ForgettingRule, cutoffDate: Date, context: ForgettingContext): boolean {
    if (!item) return false;
    
    const itemDate = item.lastUpdated || item.createdAt || item.date || item.identifiedDate;
    if (!itemDate) return false;
    
    const date = new Date(itemDate);
    return date < cutoffDate;
  }
  
  // Generate summary of forgetting results
  private generateSummary(removed: number, archived: number, degraded: number, preserved: number): string {
    const total = removed + archived + degraded + preserved;
    if (total === 0) {
      return 'No items required forgetting actions.';
    }
    
    let summary = `Processed ${total} items: `;
    if (removed > 0) summary += `${removed} removed, `;
    if (archived > 0) summary += `${archived} archived, `;
    if (degraded > 0) summary += `${degraded} degraded, `;
    if (preserved > 0) summary += `${preserved} preserved (important)`;
    
    return summary.replace(/, $/, '');
  }
  
  // Get items eligible for forgetting
  getEligibleItems(graph: any, context: ForgettingContext): {
    category: string;
    items: any[];
    rule: ForgettingRule;
  }[] {
    const eligible: {
      category: string;
      items: any[];
      rule: ForgettingRule;
    }[] = [];
    
    this.rules.forEach(rule => {
      const cutoffDate = new Date(context.currentDate);
      cutoffDate.setDate(cutoffDate.getDate() - rule.retentionPeriod);
      
      const items = this.getItemsByCategory(graph, rule.category);
      const eligibleItems = items.filter(item => 
        this.shouldApplyRule(item, rule, cutoffDate, context) &&
        (item.importance || 0) < rule.importanceThreshold
      );
      
      if (eligibleItems.length > 0) {
        eligible.push({
          category: rule.category,
          items: eligibleItems,
          rule,
        });
      }
    });
    
    return eligible;
  }
  
  // Get items by category
  private getItemsByCategory(graph: any, category: string): any[] {
    switch (category) {
      case 'suppliers':
        return graph.operations?.suppliers || [];
      case 'products':
        return graph.operations?.products || [];
      case 'customers':
        return graph.operations?.customers || [];
      case 'risks':
        const risks = graph.risks || {};
        return Object.values(risks).flat() || [];
      case 'goals':
        return graph.strategy?.goals || [];
      default:
        return [];
    }
  }
  
  // Manually mark item as important (prevents forgetting)
  markAsImportant(graph: any, category: string, itemId: string, importance: number): void {
    const items = this.getItemsByCategory(graph, category);
    const item = items.find(i => i.id === itemId);
    if (item) {
      item.importance = Math.min(1, Math.max(0, importance));
      item.importantMarked = true;
      item.importantMarkedDate = new Date();
    }
  }
  
  // Get forgetting statistics
  getStatistics(graph: any, context: ForgettingContext): {
    totalItems: number;
    eligibleForRemoval: number;
    eligibleForArchival: number;
    eligibleForDegradation: number;
    protectedItems: number;
  } {
    const eligible = this.getEligibleItems(graph, context);
    
    let eligibleForRemoval = 0;
    let eligibleForArchival = 0;
    let eligibleForDegradation = 0;
    let totalItems = 0;
    let protectedItems = 0;
    
    eligible.forEach(({ items, rule }) => {
      totalItems += items.length;
      if (rule.action === 'remove') eligibleForRemoval += items.length;
      if (rule.action === 'archive') eligibleForArchival += items.length;
      if (rule.action === 'degrade') eligibleForDegradation += items.length;
    });
    
    // Count protected items
    this.rules.forEach(rule => {
      const items = this.getItemsByCategory(graph, rule.category);
      items.forEach(item => {
        if ((item.importance || 0) >= rule.importanceThreshold) {
          protectedItems++;
        }
      });
    });
    
    return {
      totalItems,
      eligibleForRemoval,
      eligibleForArchival,
      eligibleForDegradation,
      protectedItems,
    };
  }
  
  // Format forgetting results for AI response
  formatForAIResponse(result: ForgettingResult): string {
    let response = '\n\n🗑️ MEMORY CLEANUP:\n';
    response += result.summary + '\n';
    
    if (result.importantDecisionsPreserved > 0) {
      response += `\n✅ ${result.importantDecisionsPreserved} important items preserved from forgetting.\n`;
    }
    
    return response;
  }
  
  // Export forgetting rules
  exportRules(): string {
    return JSON.stringify(this.rules, null, 2);
  }
  
  // Import forgetting rules
  importRules(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.rules = parsed;
    } catch (error) {
      console.error('Failed to import forgetting rules:', error);
    }
  }
  
  // Reset to default rules
  resetRules(): void {
    this.initializeDefaultRules();
  }
}

// Singleton instance
let forgettingEngineInstance: ForgettingEngine | null = null;

export function getForgettingEngine(): ForgettingEngine {
  if (!forgettingEngineInstance) {
    forgettingEngineInstance = new ForgettingEngine();
  }
  return forgettingEngineInstance;
}
