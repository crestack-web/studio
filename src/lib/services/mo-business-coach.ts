// MO Business Coach System - Long-term personalized coaching recommendations
// MO should become a long-term business coach with personalized recommendations grounded in business history

export interface CoachingRecommendation {
  id: string;
  type: 'achievement' | 'improvement' | 'warning' | 'opportunity' | 'milestone';
  title: string;
  message: string;
  context: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  acknowledged: boolean;
  actionTaken?: string;
}

export interface CoachingContext {
  businessId: string;
  businessData: any;
  goals: any[];
  history: {
    dailyEvaluations: any[];
    weeklyReviews: any[];
    insights: any[];
  };
  knowledgeGraph: any;
  conversationHistory: any[];
}

export class BusinessCoachEngine {
  
  // Generate coaching recommendations based on business history
  async generateRecommendations(context: CoachingContext): Promise<CoachingRecommendation[]> {
    const recommendations: CoachingRecommendation[] = [];
    
    // Check for postponed tasks
    const postponedRecommendations = this.checkPostponedTasks(context);
    recommendations.push(...postponedRecommendations);
    
    // Check for goal achievements
    const achievementRecommendations = this.checkGoalAchievements(context);
    recommendations.push(...achievementRecommendations);
    
    // Check for expansion readiness
    const expansionRecommendations = this.checkExpansionReadiness(context);
    recommendations.push(...expansionRecommendations);
    
    // Check for operational improvements
    const operationalRecommendations = this.checkOperationalImprovements(context);
    recommendations.push(...operationalRecommendations);
    
    // Check for financial health
    const financialRecommendations = this.checkFinancialHealth(context);
    recommendations.push(...financialRecommendations);
    
    // Check for growth opportunities
    const growthRecommendations = this.checkGrowthOpportunities(context);
    recommendations.push(...growthRecommendations);
    
    return recommendations;
  }
  
  // Check for postponed tasks
  private checkPostponedTasks(context: CoachingContext): CoachingRecommendation[] {
    const recommendations: CoachingRecommendation[] = [];
    
    // Check for inventory reconciliation
    const recentInsights = context.history.insights.slice(-30);
    const inventoryInsights = recentInsights.filter(i => 
      i.source === 'inventory' && i.type === 'warning'
    );
    
    if (inventoryInsights.length >= 3) {
      const daysSinceFirst = this.getDaysBetween(new Date(inventoryInsights[0].timestamp), new Date());
      
      if (daysSinceFirst >= 21) {
        recommendations.push({
          id: this.generateId(),
          type: 'improvement',
          title: 'Inventory Reconciliation Overdue',
          message: `I noticed you've been postponing inventory reconciliation for ${Math.floor(daysSinceFirst / 7)} weeks. This could affect your stock accuracy and lead to stockouts or overstocking.`,
          context: 'Inventory issues have been flagged consistently for the past few weeks',
          impact: 'Accurate inventory is critical for purchasing decisions and customer satisfaction',
          priority: 'high',
          timestamp: new Date(),
          acknowledged: false,
        });
      }
    }
    
    // Check for overdue customer follow-ups
    const customerInsights = recentInsights.filter(i => 
      i.source === 'customers' && i.type === 'warning'
    );
    
    if (customerInsights.length >= 2) {
      recommendations.push({
        id: this.generateId(),
        type: 'improvement',
        title: 'Customer Follow-up Needed',
        message: 'Customer payment issues have been recurring. Following up proactively can improve cash flow and customer relationships.',
        context: 'Multiple customers have overdue payments or payment delays',
        impact: 'Timely follow-ups improve collection rates and maintain healthy cash flow',
        priority: 'medium',
        timestamp: new Date(),
        acknowledged: false,
      });
    }
    
    return recommendations;
  }
  
  // Check for goal achievements
  private checkGoalAchievements(context: CoachingContext): CoachingRecommendation[] {
    const recommendations: CoachingRecommendation[] = [];
    
    if (!context.goals || context.goals.length === 0) {
      return recommendations;
    }
    
    const activeGoals = context.goals.filter(g => !g.completed);
    
    activeGoals.forEach(goal => {
      const progress = this.calculateGoalProgress(goal, context);
      
      if (progress >= 1) {
        recommendations.push({
          id: this.generateId(),
          type: 'achievement',
          title: `Goal Achieved: ${goal.title}`,
          message: `Congratulations! You've achieved your goal: ${goal.title}. This is a significant milestone for your business.`,
          context: `Target: ${goal.target}, Current: ${this.getCurrentValue(goal, context)}`,
          impact: 'Achieving goals demonstrates effective business management and creates momentum for growth',
          priority: 'high',
          timestamp: new Date(),
          acknowledged: false,
        });
      } else if (progress >= 0.8) {
        recommendations.push({
          id: this.generateId(),
          type: 'milestone',
          title: `Near Goal: ${goal.title}`,
          message: `You're very close to achieving your goal: ${goal.title}. Keep up the momentum!`,
          context: `${(progress * 100).toFixed(0)}% complete`,
          impact: 'Final push needed to reach your target',
          priority: 'medium',
          timestamp: new Date(),
          acknowledged: false,
        });
      } else if (progress < 0.3 && this.getDaysSinceGoalStart(goal) > 30) {
        recommendations.push({
          id: this.generateId(),
          type: 'improvement',
          title: `Goal Behind Schedule: ${goal.title}`,
          message: `Your goal "${goal.title}" is behind schedule. Consider adjusting your strategy or timeline.`,
          context: `${(progress * 100).toFixed(0)}% complete after ${this.getDaysSinceGoalStart(goal)} days`,
          impact: 'Addressing goals behind schedule prevents them from becoming abandoned',
          priority: 'medium',
          timestamp: new Date(),
          acknowledged: false,
        });
      }
    });
    
    return recommendations;
  }
  
  // Check for expansion readiness
  private checkExpansionReadiness(context: CoachingContext): CoachingRecommendation[] {
    const recommendations: CoachingRecommendation[] = [];
    
    // Check for expansion goals
    const expansionGoal = context.goals?.find(g => 
      g.title?.toLowerCase().includes('expand') || 
      g.title?.toLowerCase().includes('new location') ||
      g.title?.toLowerCase().includes('branch')
    );
    
    if (expansionGoal && !expansionGoal.completed) {
      // Check cash flow health
      const recentCashFlow = context.businessData.cashFlow?.slice(-30) || [];
      const netCashFlow = recentCashFlow.reduce((sum: number, cf: any) => {
        const amount = cf.type === 'inflow' ? (cf.amount || 0) : -(cf.amount || 0);
        return sum + amount;
      }, 0);
      
      const cashBalance = context.businessData.cashBalance || 0;
      
      if (netCashFlow < 0 || cashBalance < 50000) {
        recommendations.push({
          id: this.generateId(),
          type: 'warning',
          title: 'Expansion May Need Cash Flow Review',
          message: `Your expansion goal is progressing well, but current cash flow may not support opening another location yet. Consider strengthening cash position before expanding.`,
          context: `Net cash flow: ₦${netCashFlow.toLocaleString()}, Balance: ₦${cashBalance.toLocaleString()}`,
          impact: 'Expansion requires sufficient capital for setup and initial operations',
          priority: 'high',
          timestamp: new Date(),
          acknowledged: false,
        });
      }
    }
    
    return recommendations;
  }
  
  // Check for operational improvements
  private checkOperationalImprovements(context: CoachingContext): CoachingRecommendation[] {
    const recommendations: CoachingRecommendation[] = [];
    
    // Check for supplier reliability issues
    const suppliers = context.businessData.suppliers || [];
    const unreliableSuppliers = suppliers.filter((s: any) => (s.onTimeDeliveryRate || 1) < 0.8);
    
    if (unreliableSuppliers.length > 0 && unreliableSuppliers.length / suppliers.length > 0.3) {
      recommendations.push({
        id: this.generateId(),
        type: 'improvement',
        title: 'Supplier Performance Review Needed',
        message: `${unreliableSuppliers.length} of your suppliers have below 80% on-time delivery. Consider diversifying suppliers or addressing performance issues.`,
        context: `${unreliableSuppliers.length} unreliable suppliers out of ${suppliers.length} total`,
        impact: 'Reliable suppliers are critical for consistent operations and customer satisfaction',
        priority: 'medium',
        timestamp: new Date(),
        acknowledged: false,
      });
    }
    
    // Check for inventory optimization
    const inventory = context.businessData.inventory || [];
    const overstockItems = inventory.filter((i: any) => {
      const quantity = i.quantity || 0;
      const maxStock = i.maxStock || 100;
      return quantity >= maxStock;
    });
    
    if (overstockItems.length > 3) {
      recommendations.push({
        id: this.generateId(),
        type: 'opportunity',
        title: 'Inventory Optimization Opportunity',
        message: `${overstockItems.length} products are overstocked. Consider running promotions or discounts to free up capital.`,
        context: 'Excess inventory ties up capital and may lead to waste',
        impact: 'Optimizing inventory levels improves cash flow and reduces waste',
        priority: 'medium',
        timestamp: new Date(),
        acknowledged: false,
      });
    }
    
    return recommendations;
  }
  
  // Check for financial health
  private checkFinancialHealth(context: CoachingContext): CoachingRecommendation[] {
    const recommendations: CoachingRecommendation[] = [];
    
    // Check profit margin trends
    const weeklyReviews = context.history.weeklyReviews.slice(-4);
    if (weeklyReviews.length >= 2) {
      const recentMargin = weeklyReviews[weeklyReviews.length - 1]?.profitTrends?.profitMargin || 0;
      const previousMargin = weeklyReviews[0]?.profitTrends?.profitMargin || recentMargin;
      
      if (recentMargin < previousMargin - 5) {
        recommendations.push({
          id: this.generateId(),
          type: 'warning',
          title: 'Profit Margin Declining',
          message: `Your profit margin has declined by ${(previousMargin - recentMargin).toFixed(1)} percentage points over the past few weeks. Review costs and pricing.`,
          context: `Current margin: ${recentMargin.toFixed(1)}%, Previous: ${previousMargin.toFixed(1)}%`,
          impact: 'Declining margins reduce profitability and business sustainability',
          priority: 'high',
          timestamp: new Date(),
          acknowledged: false,
        });
      }
    }
    
    // Check for expense growth vs revenue growth
    const recentSales = context.businessData.sales?.slice(-30) || [];
    const recentExpenses = context.businessData.expenses?.slice(-30) || [];
    
    if (recentSales.length > 0 && recentExpenses.length > 0) {
      const salesGrowth = this.calculateGrowthRate(recentSales.slice(-15), recentSales.slice(-30));
      const expenseGrowth = this.calculateGrowthRate(recentExpenses.slice(-15), recentExpenses.slice(-30));
      
      if (expenseGrowth > salesGrowth + 0.1) {
        recommendations.push({
          id: this.generateId(),
          type: 'warning',
          title: 'Expenses Growing Faster Than Revenue',
          message: `Your expenses are growing ${(expenseGrowth * 100).toFixed(0)}% while revenue is growing ${(salesGrowth * 100).toFixed(0)}%. This trend is unsustainable.`,
          context: 'Expense growth outpacing revenue growth',
          impact: 'Unsustainable expense growth erodes profitability',
          priority: 'high',
          timestamp: new Date(),
          acknowledged: false,
        });
      }
    }
    
    return recommendations;
  }
  
  // Check for growth opportunities
  private checkGrowthOpportunities(context: CoachingContext): CoachingRecommendation[] {
    const recommendations: CoachingRecommendation[] = [];
    
    // Check for strong product performance
    const sales = context.businessData.sales?.slice(-30) || [];
    if (sales.length > 0) {
      const productSales = new Map<string, number>();
      sales.forEach((s: any) => {
        const product = s.productName || 'Unknown';
        productSales.set(product, (productSales.get(product) || 0) + (s.amount || 0));
      });
      
      const totalSales = Array.from(productSales.values()).reduce((sum, val) => sum + val, 0);
      const sortedProducts = Array.from(productSales.entries()).sort((a, b) => b[1] - a[1]);
      
      if (sortedProducts.length > 0) {
        const topProduct = sortedProducts[0];
        const topProductShare = topProduct[1] / totalSales;
        
        if (topProductShare > 0.4 && topProductShare < 0.6) {
          recommendations.push({
            id: this.generateId(),
            type: 'opportunity',
            title: 'Top Product Growth Opportunity',
            message: `${topProduct[0]} is performing well (${(topProductShare * 100).toFixed(0)}% of sales). Consider increasing inventory or marketing for this product.`,
            context: `Top product accounts for ${(topProductShare * 100).toFixed(0)}% of sales`,
            impact: 'Focusing on successful products can accelerate growth',
            priority: 'medium',
            timestamp: new Date(),
            acknowledged: false,
          });
        }
      }
    }
    
    // Check for customer acquisition opportunities
    const customers = context.businessData.customers || [];
    const newCustomers = customers.filter((c: any) => {
      const createdAt = new Date(c.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt >= thirtyDaysAgo;
    });
    
    if (newCustomers.length > 5) {
      recommendations.push({
        id: this.generateId(),
        type: 'opportunity',
        title: 'Strong Customer Acquisition',
        message: `You've acquired ${newCustomers.length} new customers in the past month. Consider retention strategies to maximize customer lifetime value.`,
        context: `${newCustomers.length} new customers in the last 30 days`,
        impact: 'Customer retention is more cost-effective than acquisition',
        priority: 'medium',
        timestamp: new Date(),
        acknowledged: false,
      });
    }
    
    return recommendations;
  }
  
  // Helper methods
  private calculateGoalProgress(goal: any, context: CoachingContext): number {
    if (!goal) return 0;
    
    const current = this.getCurrentValue(goal, context);
    const target = goal.target || 1;
    
    if (target === 0) return 0;
    return Math.min(1, current / target);
  }
  
  private getCurrentValue(goal: any, context: CoachingContext): number {
    // This would need to be implemented based on goal type
    // For now, return a placeholder
    return goal.current || 0;
  }
  
  private getDaysSinceGoalStart(goal: any): number {
    if (!goal.startDate) return 0;
    const startDate = new Date(goal.startDate);
    const today = new Date();
    return Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  private getDaysBetween(date1: Date, date2: Date): number {
    return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  private calculateGrowthRate(recent: any[], previous: any[]): number {
    const recentTotal = recent.reduce((sum, item) => sum + (item.amount || 0), 0);
    const previousTotal = previous.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    if (previousTotal === 0) return 0;
    return (recentTotal - previousTotal) / previousTotal;
  }
  
  private generateId(): string {
    return `coach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Format recommendations for display
  formatForDisplay(recommendations: CoachingRecommendation[]): string {
    if (recommendations.length === 0) {
      return '\n\n🎓 BUSINESS COACH: No new coaching recommendations at this time\n';
    }
    
    let response = '\n\n🎓 BUSINESS COACH RECOMMENDATIONS\n\n';
    
    recommendations.forEach(rec => {
      const icon = this.getIconForType(rec.type);
      response += `${icon} ${rec.title}\n`;
      response += `${rec.message}\n`;
      response += `Context: ${rec.context}\n`;
      response += `Impact: ${rec.impact}\n`;
      response += `Priority: ${rec.priority}\n\n`;
    });
    
    return response;
  }
  
  private getIconForType(type: string): string {
    const icons: Record<string, string> = {
      achievement: '🏆',
      improvement: '📈',
      warning: '⚠️',
      opportunity: '🎯',
      milestone: '📍',
    };
    return icons[type] || '💡';
  }
}

// Singleton instance
let businessCoachEngineInstance: BusinessCoachEngine | null = null;

export function getBusinessCoachEngine(): BusinessCoachEngine {
  if (!businessCoachEngineInstance) {
    businessCoachEngineInstance = new BusinessCoachEngine();
  }
  return businessCoachEngineInstance;
}
