// MO Response Planner - Structured Response Format
// Constructs responses with Observation, Analysis, Calculation, Risk, Recommendation, Next Step

export interface ResponseSection {
  type: 'observation' | 'analysis' | 'calculation' | 'risk' | 'recommendation' | 'next_step' | 'data_insight' | 'data_card'; // NEW: Added data card type
  content: string;
  priority: 'high' | 'medium' | 'low';
  data?: any;
}

export interface PlannedResponse {
  sections: ResponseSection[];
  summary: string;
  tone: 'professional' | 'urgent' | 'cautious' | 'encouraging';
  estimatedLength: number;
  includesAction: boolean;
}

export interface ResponsePlanningContext {
  userMessage: string;
  intent: string;
  reasoning: any;
  calculations: any[];
  risks: any[];
  opportunities: any[];
  businessContext: any;
  suggestedAction?: string;
  busmoAction?: any;
  businessData?: any; // NEW: Include business data for analysis
}

export class ResponsePlanner {
  
  // Plan the response structure
  planResponse(context: ResponsePlanningContext): PlannedResponse {
    const sections: ResponseSection[] = [];
    
    // NEW: Generate data card section first if relevant
    const dataCard = this.generateDataCard(context);
    if (dataCard) {
      sections.push(dataCard);
    }
    // Otherwise generate data insight section
    else {
      const dataInsight = this.generateDataInsight(context);
      if (dataInsight) {
        sections.push(dataInsight);
      }
    }
    
    // Add observation if relevant
    const observation = this.generateObservation(context);
    if (observation) {
      sections.push(observation);
    }
    
    // Add analysis
    const analysis = this.generateAnalysis(context);
    if (analysis) {
      sections.push(analysis);
    }
    
    // Add calculations if available
    if (context.calculations && context.calculations.length > 0) {
      const calculation = this.generateCalculation(context);
      if (calculation) {
        sections.push(calculation);
      }
    }
    
    // Add risks if critical
    const criticalRisks = context.risks?.filter((r: any) => r.severity === 'critical' || r.severity === 'high');
    if (criticalRisks && criticalRisks.length > 0) {
      const risk = this.generateRisk(context);
      if (risk) {
        sections.push(risk);
      }
    }
    
    // Add recommendation
    const recommendation = this.generateRecommendation(context);
    if (recommendation) {
      sections.push(recommendation);
    }
    
    // Add next step
    const nextStep = this.generateNextStep(context);
    if (nextStep) {
      sections.push(nextStep);
    }
    
    // Determine tone
    const tone = this.determineTone(context);
    
    // Generate summary
    const summary = this.generateSummary(sections, context);
    
    // Check if includes action
    const includesAction = !!context.busmoAction || !!context.suggestedAction;
    
    return {
      sections,
      summary,
      tone,
      estimatedLength: this.estimateLength(sections),
      includesAction,
    };
  }
  
  // NEW: Generate data card section for concise business data presentation
  private generateDataCard(context: ResponsePlanningContext): ResponseSection | null {
    const { businessData, reasoning } = context;
    
    if (!businessData || !reasoning?.relevantDataPoints) {
      return null;
    }
    
    const lowerMessage = context.userMessage.toLowerCase();
    
    // Sales data card
    if (reasoning.relevantDataPoints.includes('sales_data') && businessData.sales) {
      const totalSales = businessData.sales.reduce((sum: number, sale: any) => 
        sum + (parseFloat(sale.totalRevenue) || parseFloat(sale.total) || parseFloat(sale.amount) || 0), 0
      );
      
      const todaySales = businessData.sales.filter((sale: any) => {
        const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
        return saleDate.toDateString() === new Date().toDateString();
      })
      .reduce((sum: number, sale: any) => 
        sum + (parseFloat(sale.totalRevenue) || parseFloat(sale.total) || parseFloat(sale.amount) || 0), 0
      );
      
      // Calculate profit if available
      const totalProfit = businessData.sales.reduce((sum: number, sale: any) => 
        sum + (parseFloat(sale.profit) || 0), 0
      );
      
      const todayProfit = businessData.sales.filter((sale: any) => {
        const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
        return saleDate.toDateString() === new Date().toDateString();
      })
      .reduce((sum: number, sale: any) => 
        sum + (parseFloat(sale.profit) || 0), 0
      );
      
      // Only create data card if user is asking about sales
      if (/analyze.*sales|sales.*performance|how are sales|sales.*doing|sales.*today|sales.*overview/i.test(lowerMessage)) {
        const content = `📊 **SALES DASHBOARD**
        
**Today:** ₦${todaySales.toLocaleString()}
**Total:** ₦${totalSales.toLocaleString()}
**Profit:** ₦${totalProfit.toLocaleString()}
**Today's Profit:** ₦${todayProfit.toLocaleString()}
**Orders:** ${businessData.sales.length}
**Avg Order:** ₦${businessData.sales.length > 0 ? (totalSales / businessData.sales.length).toLocaleString() : '0'}`;

        return {
          type: 'data_card',
          content,
          priority: 'high',
        };
      }
    }
    
    // Inventory data card
    if (reasoning.relevantDataPoints.includes('inventory_data') && businessData.products) {
      if (/analyze.*inventory|inventory.*performance|how is inventory|inventory.*doing|inventory.*overview/i.test(lowerMessage)) {
        const lowStockCount = businessData.products.filter((p: any) => p.stockLevel < p.reorderLevel).length;
        const outOfStockCount = businessData.products.filter((p: any) => p.stockLevel === 0).length;
        
        const content = `📦 **INVENTORY DASHBOARD**
        
**Products:** ${businessData.products.length}
**Low Stock:** ${lowStockCount}
**Out of Stock:** ${outOfStockCount}
**Categories:** ${businessData.products.slice(0, 3).map((p: any) => p.category).filter(Boolean).join(', ') || 'Not categorized'}`;
        
        return {
          type: 'data_card',
          content,
          priority: 'high',
        };
      }
    }
    
    // Expense data card
    if (reasoning.relevantDataPoints.includes('expense_data') && businessData.expenses) {
      if (/analyze.*expenses|expenses.*performance|how are expenses|expenses.*doing|expenses.*overview/i.test(lowerMessage)) {
        const totalExpenses = businessData.expenses.reduce((sum: number, expense: any) => 
          sum + (parseFloat(expense.amount) || 0), 0
        );
        
        const todayExpenses = businessData.expenses.filter((expense: any) => {
          const expenseDate = expense.createdAt?.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
          return expenseDate.toDateString() === new Date().toDateString();
        })
        .reduce((sum: number, expense: any) => 
          sum + (parseFloat(expense.amount) || 0), 0
        );
        
        const content = `💸 **EXPENSES DASHBOARD**
        
**Today:** ₦${todayExpenses.toLocaleString()}
**Total:** ₦${totalExpenses.toLocaleString()}
**Categories:** ${businessData.expenses.slice(0, 2).map((e: any) => e.category).join(', ') || 'Not yet categorized'}`;
        
        return {
          type: 'data_card',
          content,
          priority: 'high',
        };
      }
    }
    
    // Cash flow data card
    if (reasoning.relevantDataPoints.includes('cash_flow_data') && businessData.cashFlow) {
      if (/analyze.*cash|cash.*performance|how is cash|cash.*doing|cash.*overview/i.test(lowerMessage)) {
        const cashAvailable = businessData.cashFlow.find((cf: any) => cf.type === 'available')?.amount || 0;
        const cashInHand = businessData.cashFlow.find((cf: any) => cf.type === 'in_hand')?.amount || 0;
        
        const content = `💵 **CASH FLOW DASHBOARD**
        
**Cash Available:** ₦${cashAvailable.toLocaleString()}
**Cash In Hand:** ₦${cashInHand.toLocaleString()}
**Transactions:** ${businessData.cashFlow.length}`;
        
        return {
          type: 'data_card',
          content,
          priority: 'high',
        };
      }
    }
    
    // Customer data card
    if (reasoning.relevantDataPoints.includes('customer_data') && businessData.customers) {
      if (/analyze.*customers|customers.*performance|how are customers|customers.*doing|customers.*overview/i.test(lowerMessage)) {
        const customerCount = businessData.customers.length;
        const activeCustomers = businessData.customers.filter((c: any) => c.active).length;
        
        const content = `👥 **CUSTOMERS DASHBOARD**
        
**Total:** ${customerCount}
**Active:** ${activeCustomers}`;
        
        return {
          type: 'data_card',
          content,
          priority: 'high',
        };
      }
    }
    
    // Supplier data card
    if (reasoning.relevantDataPoints.includes('supplier_data') && businessData.suppliers) {
      if (/analyze.*suppliers|suppliers.*performance|how are suppliers|suppliers.*doing|suppliers.*overview/i.test(lowerMessage)) {
        const supplierCount = businessData.suppliers.length;
        const activeSuppliers = businessData.suppliers.filter((s: any) => s.active).length;
        
        const content = `🏭 **SUPPLIERS DASHBOARD**
        
**Total:** ${supplierCount}
**Active:** ${activeSuppliers}`;
        
        return {
          type: 'data_card',
          content,
          priority: 'high',
        };
      }
    }
    
    return null;
  }
  
  // Generate data insight section - NEW
  private generateDataInsight(context: ResponsePlanningContext): ResponseSection | null {
    const { businessData, reasoning } = context;
    
    if (!businessData || !reasoning?.relevantDataPoints) {
      return null;
    }
    
    let content = '';
    
    // Sales data insight
    if (reasoning.relevantDataPoints.includes('sales_data') && businessData.sales) {
      const totalSales = businessData.sales.reduce((sum: number, sale: any) => 
        sum + (parseFloat(sale.totalRevenue) || parseFloat(sale.total) || parseFloat(sale.amount) || 0), 0
      );
      
      const todaySales = businessData.sales.filter((sale: any) => {
        const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
        return saleDate.toDateString() === new Date().toDateString();
      })
      .reduce((sum: number, sale: any) => 
        sum + (parseFloat(sale.totalRevenue) || parseFloat(sale.total) || parseFloat(sale.amount) || 0), 0
      );
      
      content += `Total sales: ₦${totalSales.toLocaleString()}. Today: ₦${todaySales.toLocaleString()}`;
    }
    
    // Inventory data insight
    if (reasoning.relevantDataPoints.includes('inventory_data') && businessData.products) {
      if (content) content += '. ';
      
      const lowStockCount = businessData.products.filter((p: any) => p.stockLevel < p.reorderLevel).length;
      const outOfStockCount = businessData.products.filter((p: any) => p.stockLevel === 0).length;
      
      content += `${businessData.products.length} products. Low stock: ${lowStockCount}. Out of stock: ${outOfStockCount}`;
    }
    
    // Expense data insight
    if (reasoning.relevantDataPoints.includes('expense_data') && businessData.expenses) {
      if (content) content += '. ';
      
      const totalExpenses = businessData.expenses.reduce((sum: number, expense: any) => 
        sum + (parseFloat(expense.amount) || 0), 0
      );
      
      content += `Total expenses: ₦${totalExpenses.toLocaleString()}`;
    }
    
    // Cash flow data insight
    if (reasoning.relevantDataPoints.includes('cash_flow_data') && businessData.cashFlow) {
      if (content) content += '. ';
      
      const cashAvailable = businessData.cashFlow.find((cf: any) => cf.type === 'available')?.amount || 0;
      const cashInHand = businessData.cashFlow.find((cf: any) => cf.type === 'in_hand')?.amount || 0;
      
      content += `Cash available: ₦${cashAvailable.toLocaleString()}. In hand: ₦${cashInHand.toLocaleString()}`;
    }
    
    if (!content) return null;
    
    return {
      type: 'data_insight',
      content,
      priority: 'high',
    };
  }
  
  // Generate observation section
  private generateObservation(context: ResponsePlanningContext): ResponseSection | null {
    const { businessContext, reasoning } = context;
    
    let observation = '';
    
    // Business state observation
    if (businessContext?.stage) {
      observation += `Business at ${businessContext.stage} stage`;
      if (businessContext.industry) {
        observation += ` in ${businessContext.industry} industry`;
      }
    }
    
    // Contextual observation based on reasoning
    if (reasoning?.contextSummary) {
      if (observation) observation += '. ';
      observation += reasoning.contextSummary;
    }
    
    if (!observation) return null;
    
    return {
      type: 'observation',
      content: observation,
      priority: 'medium',
    };
  }
  
  // Generate analysis section
  private generateAnalysis(context: ResponsePlanningContext): ResponseSection | null {
    const { reasoning, intent, userMessage } = context;
    
    let analysis = '';
    
    // Intent-based analysis
    if (intent) {
      analysis += `You're looking to ${intent.replace(/_/g, ' ')}`;
    }
    
    // Add reasoning analysis
    if (reasoning?.actualGoal) {
      if (analysis) analysis += '. ';
      analysis += `The core goal is ${reasoning.actualGoal}`;
    }
    
    // Add implications
    if (reasoning?.nextNeeds && reasoning.nextNeeds.length > 0) {
      if (analysis) analysis += '. ';
      analysis += `This will require attention to: ${reasoning.nextNeeds.slice(0, 2).join(', ')}`;
    }
    
    if (!analysis) return null;
    
    return {
      type: 'analysis',
      content: analysis,
      priority: 'high',
    };
  }
  
  // Generate calculation section
  private generateCalculation(context: ResponsePlanningContext): ResponseSection | null {
    const { calculations } = context;
    
    if (!calculations || calculations.length === 0) return null;
    
    // Focus on the most important calculation
    const primaryCalc = calculations[0];
    
    let content = '';
    content += `${primaryCalc.type}: ${primaryCalc.result}`;
    
    if (primaryCalc.breakdown) {
      const keyBreakdown = Object.entries(primaryCalc.breakdown).slice(0, 2);
      content += `. Key factors: ${keyBreakdown.map(([k, v]) => `${k}=${v}`).join(', ')}`;
    }
    
    if (primaryCalc.implications && primaryCalc.implications.length > 0) {
      content += `. Implication: ${primaryCalc.implications[0]}`;
    }
    
    return {
      type: 'calculation',
      content,
      priority: 'high',
      data: primaryCalc,
    };
  }
  
  // Generate risk section
  private generateRisk(context: ResponsePlanningContext): ResponseSection | null {
    const { risks } = context;
    
    const criticalRisks = risks?.filter((r: any) => r.severity === 'critical' || r.severity === 'high');
    
    if (!criticalRisks || criticalRisks.length === 0) return null;
    
    const primaryRisk = criticalRisks[0];
    
    let content = '';
    content += `${primaryRisk.severity.toUpperCase()} risk: ${primaryRisk.description}`;
    
    if (primaryRisk.mitigation && primaryRisk.mitigation.length > 0) {
      content += `. Mitigation: ${primaryRisk.mitigation[0]}`;
    }
    
    return {
      type: 'risk',
      content,
      priority: 'high',
      data: primaryRisk,
    };
  }
  
  // Generate recommendation section
  private generateRecommendation(context: ResponsePlanningContext): ResponseSection | null {
    const { reasoning, suggestedAction, opportunities } = context;
    
    let recommendation = '';
    
    // Use reasoning recommendation if available
    if (reasoning?.recommendedAction) {
      recommendation = reasoning.recommendedAction;
    } 
    // Use suggested action if available
    else if (suggestedAction) {
      recommendation = suggestedAction;
    }
    // Use opportunity if available prioritized
    else if (opportunities && opportunities.length > 0) {
      const topOpportunity = opportunities[0];
      recommendation = topOpportunity.suggestedAction || topOpportunity.message;
    }
    
    if (!recommendation) return null;
    
    return {
      type: 'recommendation',
      content: recommendation,
      priority: 'high',
    };
  }
  
  // Generate next step section
  private generateNextStep(context: ResponsePlanningContext): ResponseSection | null {
    const { reasoning, busmoAction, businessContext } = context;
    
    let nextStep = '';
    
    // If there's a Busmo action, that's the next step
    if (busmoAction) {
      nextStep = `Execute: ${busmoAction.description}`;
      if (busmoAction.requiresConfirmation) {
        nextStep += ' (requires confirmation)';
      }
    }
    // Use reasoning next action
    else if (reasoning?.recommendedAction) {
      nextStep = reasoning.recommendedAction;
    }
    // Stage-specific next step
    else if (businessContext?.stage) {
      nextStep = this.getStageNextStep(businessContext.stage);
    }
    
    if (!nextStep) return null;
    
    return {
      type: 'next_step',
      content: nextStep,
      priority: 'high',
    };
  }
  
  // Get stage-specific next step
  private getStageNextStep(stage: string): string {
    switch (stage) {
      case 'idea':
        return 'Validate your business idea with potential customers';
      case 'startup':
        return 'Focus on generating your first sales';
      case 'growing':
        return 'Optimize operations and consider hiring';
      case 'mature':
        return 'Explore expansion opportunities';
      default:
        return 'Continue building your business';
    }
  }
  
  // Determine response tone
  private determineTone(context: ResponsePlanningContext): 'professional' | 'urgent' | 'cautious' | 'encouraging' {
    const { risks, businessContext } = context;
    
    // Check for critical risks
    const hasCriticalRisk = risks?.some((r: any) => r.severity === 'critical');
    if (hasCriticalRisk) return 'urgent';
    
    // Check for high risks
    const hasHighRisk = risks?.some((r: any) => r.severity === 'high');
    if (hasHighRisk) return 'cautious';
    
    // Check business stage
    if (businessContext?.stage === 'startup') return 'encouraging';
    
    return 'professional';
  }
  
  // Generate summary
  private generateSummary(sections: ResponseSection[], context: ResponsePlanningContext): string {
    if (sections.length === 0) return '';
    
    const dataCard = sections.find(s => s.type === 'data_card');
    const dataInsight = sections.find(s => s.type === 'data_insight');
    const observation = sections.find(s => s.type === 'observation');
    const analysis = sections.find(s => s.type === 'analysis');
    const recommendation = sections.find(s => s.type === 'recommendation');
    
    let summary = '';
    
    if (dataCard) {
      summary += dataCard.content.split('\n')[0]; // Just the first line for summary
    } else if (dataInsight) {
      summary += dataInsight.content;
    }
    
    if (observation) {
      if (summary) summary += '. ';
      summary += observation.content;
    }
    
    if (analysis) {
      if (summary) summary += '. ';
      summary += analysis.content;
    }
    
    if (recommendation) {
      if (summary) summary += '. ';
      summary += `Recommended: ${recommendation.content}`;
    }
    
    return summary;
  }
  
  // Estimate response length
  private estimateLength(sections: ResponseSection[]): number {
    return sections.reduce((total, section) => total + section.content.length, 0);
  }
  
  // Format planned response for AI
  formatForAI(plannedResponse: PlannedResponse): string {
    let response = '';
    
    // Add tone indicator if not professional
    if (plannedResponse.tone !== 'professional') {
      const toneIndicator = {
        urgent: '⚠️ URGENT: ',
        cautious: '⚡ CAUTION: ',
        encouraging: '💡 NOTE: ',
      };
      
      response += toneIndicator[plannedResponse.tone] || '';
    }
    
    // Add sections in order
    plannedResponse.sections.forEach(section => {
      const sectionHeaders = {
        observation: '📊 Observation',
        analysis: '🔍 Analysis',
        calculation: '🧮 Calculation',
        risk: '⚠️ Risk',
        recommendation: '✅ Recommendation',
        next_step: '🎯 Next Step',
        data_insight: '📈 Data Insight', // NEW: Data insight header
        data_card: '', // NEW: Data card doesn't need a header as it's formatted differently
      };
      
      // Special formatting for data cards
      if (section.type === 'data_card') {
        response += `${section.content}\n\n`;
      } else {
        response += `\n${sectionHeaders[section.type]}:\n`;
        response += `${section.content}\n`;
      }
    });
    
    return response;
  }
  
  // Format as concise response (for shorter interactions)
  formatConcise(plannedResponse: PlannedResponse): string {
    const dataCard = plannedResponse.sections.find(s => s.type === 'data_card');
    const recommendation = plannedResponse.sections.find(s => s.type === 'recommendation');
    const nextStep = plannedResponse.sections.find(s => s.type === 'next_step');
    const risk = plannedResponse.sections.find(s => s.type === 'risk');
    
    let response = '';
    
    if (dataCard) {
      response += dataCard.content + '\n\n';
    }
    
    if (risk && risk.priority === 'high') {
      response += `⚠️ ${risk.content}\n\n`;
    }
    
    if (recommendation) {
      response += recommendation.content;
    }
    
    if (nextStep) {
      if (response) response += '\n\n';
      response += `Next: ${nextStep.content}`;
    }
    
    return response;
  }
  
  // Validate response against principles
  validateResponse(plannedResponse: PlannedResponse, context: ResponsePlanningContext): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check for generic statements
    const genericPhrases = [
      'great initiative',
      'fantastic business',
      'excellent idea',
      'happy to help',
      'good luck',
      'that\'s wonderful',
      'amazing',
      'very good',
      'very well',
      'very bad',
      'very poor',
    ];
    
    plannedResponse.sections.forEach(section => {
      const lowerContent = section.content.toLowerCase();
      genericPhrases.forEach(phrase => {
        if (lowerContent.includes(phrase)) {
          issues.push(`Generic phrase detected: "${phrase}"`);
        }
      });
    });
    
    // Check for repetition
    const contents = plannedResponse.sections.map(s => s.content.toLowerCase());
    const uniqueContents = new Set(contents);
    if (contents.length !== uniqueContents.size) {
      issues.push('Duplicate content detected in sections');
    }
    
    // Check if response moves business forward
    const hasRecommendation = plannedResponse.sections.some(s => s.type === 'recommendation');
    const hasNextStep = plannedResponse.sections.some(s => s.type === 'next_step');
    const hasDataInsight = plannedResponse.sections.some(s => s.type === 'data_insight' || s.type === 'data_card'); // NEW: Check for data insight or data card
    
    if (!hasRecommendation && !hasNextStep && !hasDataInsight) { // NEW: Allow data insight or data card as valid content
      issues.push('Response lacks clear recommendation, next step, or data insight');
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }
  
  // Apply principles to response
  applyPrinciples(plannedResponse: PlannedResponse): PlannedResponse {
    // Remove generic phrases
    const genericPhrases = [
      'great initiative',
      'fantastic business',
      'excellent idea',
      'happy to help',
      'good luck',
      'that\'s wonderful',
      'amazing',
      'very good',
      'very well',
      'very bad',
      'very poor',
    ];
    
    plannedResponse.sections.forEach(section => {
      let content = section.content;
      genericPhrases.forEach(phrase => {
        const regex = new RegExp(phrase, 'gi');
        content = content.replace(regex, '');
      });
      // Clean up double spaces
      content = content.replace(/\s+/g, ' ').trim();
      section.content = content;
    });
    
    // Remove empty sections
    plannedResponse.sections = plannedResponse.sections.filter(s => s.content.length > 0);
    
    // Ensure response has actionable content
    const hasActionable = plannedResponse.sections.some(
      s => s.type === 'recommendation' || s.type === 'next_step' || s.type === 'data_insight' || s.type === 'data_card'
    ); // NEW: Allow data insight or data card as actionable content
    
    if (!hasActionable) {
      plannedResponse.sections.push({
        type: 'next_step',
        content: 'Continue with your current business activities',
        priority: 'low',
      });
    }
    
    return plannedResponse;
  }
}

// Singleton instance
let responsePlannerInstance: ResponsePlanner | null = null;

export function getResponsePlanner(): ResponsePlanner {
  if (!responsePlannerInstance) {
    responsePlannerInstance = new ResponsePlanner();
  }
  return responsePlannerInstance;
}