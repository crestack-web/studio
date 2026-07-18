// MO Master Processor - Integrates All Engines
// The master processing loop that orchestrates all MO engines

import { getIntentEngine, IntentClassification } from './mo-intent-engine';
import { getMemoryEngine, clearMemoryEngine } from './mo-memory-engine';
import { getBusinessProfileManager, BusinessProfile, getBusinessProfile, BusinessSnapshot, updateBusinessProfile } from './mo-business-profile';
import { getCalculationEngine } from './mo-calculation-engine';
import { getReasoningEngine } from './mo-reasoning-engine';
import { getIndustryIntelligenceEngine } from './mo-industry-intelligence';
import { getRiskEngine } from './mo-risk-engine';
import { getPlanningEngine, clearPlanningEngine } from './mo-planning-engine';
import { getBusmoActionEngine } from './mo-action-engine';
import { getResponsePlanner, PlannedResponse } from './mo-response-planner';
import { getLearningEngine, clearLearningEngine } from './mo-learning-engine';
import { getPrinciplesEnforcer } from './mo-principles-enforcer';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Define the ProcessingContext interface here since it's used in this file
export interface ProcessingContext {
  message: string;
  businessId: string;
  userId: string;
  conversationId: string;
  conversationHistory: any[];
  businessData: any;
  userRole?: string;
  language?: string;
  languageName?: string;
}

// Update the ProcessingResult interface to include sales data
export interface ProcessingResult {
  intent: IntentClassification;
  reasoning: any;
  calculations: any[];
  risks: any[];
  opportunities: any[];
  plannedResponse: PlannedResponse;
  busmoAction?: any;
  nextAction?: string;
  learnedFacts: any[];
  principlesScore: number;
  finalResponse: string;
  processingTime: number;
  canAnswerWithExistingData: boolean;
  relevantDataPoints: string[];
  todaySales?: number;
  todaySalesCount?: number;
  todayProfit?: number;
  totalSales?: number;
  totalProfit?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  salesData?: any[];
}

export class BusinessProfileManager {
  private profile: BusinessProfile | null = null;

  constructor(private businessId: string) {}

  async loadProfile() {
    this.profile = await getBusinessProfile(this.businessId);
    return this.profile;
  }

  getSnapshot(): BusinessSnapshot {
    if (!this.profile) {
      return {};
    }
    return {
      openingCapital: 0,
      expectedExpenses: 0,
      expectedIncome: 0,
      totalSales: 0,
      totalProfit: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      salesData: [],
      ...this.profile
    };
  }

  updateFromMessage(message: string, updates: any) {
    if (!this.profile) {
      return;
    }
    Object.assign(this.profile, updates);
    updateBusinessProfile(this.businessId, this.profile);
  }

  updateWithFullData(data: any) {
    if (!this.profile) {
      return;
    }
    Object.assign(this.profile, data);
    updateBusinessProfile(this.businessId, this.profile);
  }

  // Add method to get today's sales
  async getTodaysSales(businessId: string): Promise<{ totalSales: number, salesCount: number, profit: number }> {
    try {
      const { firestore } = initializeFirebase();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const salesQuery = query(
        collection(firestore, `businesses/${businessId}/sales`),
        where('timestamp', '>=', Timestamp.fromDate(today))
      );
      
      const snapshot = await getDocs(salesQuery);
      if (snapshot.empty) {
        return { totalSales: 0, salesCount: 0, profit: 0 };
      }
      
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalSales = sales.reduce((sum, sale: any) => sum + (sale.amount || sale.totalAmount || sale.saleAmount || 0), 0);
      const salesCount = sales.length;
      const profit = totalSales * 0.2; // Simplified profit calculation
      
      return { totalSales, salesCount, profit };
    } catch (error) {
      console.error('Error getting today\'s sales:', error);
      return { totalSales: 0, salesCount: 0, profit: 0 };
    }
  }
}

export class MasterProcessor {
  private businessId: string;
  private userId: string;
  
  constructor(businessId: string, userId: string) {
    this.businessId = businessId;
    this.userId = userId;
  }
  
  // Master processing loop - executes all engines in sequence
  async process(context: ProcessingContext): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    console.log('🚀 [MO Master Processor] Starting processing loop');
    
    // Step 1: Initialize engines
    const intentEngine = getIntentEngine();
    const memoryEngine = getMemoryEngine(this.businessId, this.userId);
    const profileManager = getBusinessProfileManager(this.businessId);
    const calculationEngine = getCalculationEngine();
    const reasoningEngine = getReasoningEngine(); // Updated to use enhanced reasoning
    const industryEngine = getIndustryIntelligenceEngine();
    const riskEngine = getRiskEngine();
    const planningEngine = getPlanningEngine(this.businessId);
    const actionEngine = getBusmoActionEngine();
    const responsePlanner = getResponsePlanner();
    const learningEngine = getLearningEngine(this.businessId, this.userId);
    const principlesEnforcer = getPrinciplesEnforcer();
    
    // Step 2: Retrieve relevant memory
    const relevantMemory = memoryEngine.getRelevantMemories(context.message, 10);
    console.log('🧠 [MO Master Processor] Retrieved relevant memories:', relevantMemory.length);
    
    // Step 3: Get business profile - load it first
    await profileManager.loadProfile();
    const businessProfile = profileManager.getProfile();
    const businessSnapshot = profileManager.getSnapshot();
    console.log('📊 [MO Master Processor] Business profile loaded:', businessProfile ? 'Found' : 'Not found');
    
    // Step 4: Classify intent
    const intent = intentEngine.classifyIntent({
      message: context.message,
      conversationHistory: context.conversationHistory,
      businessProfile: businessProfile || { industry: 'general', businessName: 'Unknown Business' },
      businessData: context.businessData,
    });
    console.log('🎯 [MO Master Processor] Intent classified:', intent.primaryIntent, 'confidence:', intent.confidence);
    
    // Step 5: Extract entities
    const extractedEntities = intentEngine.extractEntities(context.message);
    console.log('🔍 [MO Master Processor] Entities extracted:', Object.keys(extractedEntities).length);
    
    // Step 6: Run reasoning engine - UPDATED to pass businessData
    const reasoning = reasoningEngine.reason({
      message: context.message,
      businessProfile: businessProfile || { industry: 'general', businessName: 'Unknown Business' },
      businessSnapshot,
      calculations: [],
      conversationHistory: context.conversationHistory,
      businessData: context.businessData, // NEW: Pass business data for analysis
    });
    console.log('💭 [MO Master Processor] Reasoning completed');
    
    // Step 7: Run calculation engine
    const calculations = calculationEngine.generateInsights(context.message, {
      capital: businessSnapshot?.openingCapital ?? 0,
      expenses: businessSnapshot?.expectedExpenses ?? 0,
      revenue: businessSnapshot?.expectedIncome ?? 0,
    });
    if (calculations.length > 0) {
      console.log('🧮 [MO Master Processor] Calculations generated:', calculations.length);
    }
    
    // Step 8: Get industry intelligence
    const industryIntelligence = industryEngine.getIndustryAdvice(businessProfile?.industry || 'retail');
    console.log('🏭 [MO Master Processor] Industry intelligence loaded');
    
    // Step 9: Assess risks
    const risks = riskEngine.assessRisks({
      businessProfile: businessProfile || { industry: 'general', businessName: 'Unknown Business' },
      businessData: context.businessData,
      financialData: businessSnapshot,
      operationalData: context.businessData,
    });
    if (risks.length > 0) {
      console.log('⚠️ [MO Master Processor] Risks assessed:', risks.length);
    }
    
    // Step 10: Generate proactive insights
    const proactiveInsights = this.generateProactiveInsights(context.businessData, businessProfile);
    
    // Step 11: Determine next priority action
    const planningContext = {
      businessProfile: businessProfile || { industry: 'general', businessName: 'Unknown Business' },
      businessData: context.businessData,
      currentIntent: intent.primaryIntent,
      risks,
      opportunities: proactiveInsights,
      missingInformation: reasoning.missingInformation,
    };
    const nextPriority = planningEngine.determineNextPriority(planningContext);
    console.log('📋 [MO Master Processor] Next priority determined');
    
    // Step 12: Check for Busmo actions
    const actionContext = {
      message: context.message,
      intent: intent.primaryIntent,
      businessData: context.businessData,
      businessProfile: businessProfile || { industry: 'general', businessName: 'Unknown Business' },
      extractedEntities,
    };
    const busmoAction = actionEngine.determineAction(actionContext);
    if (busmoAction) {
      console.log('🎯 [MO Master Processor] Busmo action detected:', busmoAction.type);
    }
    
    // Step 13: Plan response structure
    const responsePlanningContext = {
      userMessage: context.message,
      intent: intent.primaryIntent,
      reasoning,
      calculations,
      risks,
      opportunities: proactiveInsights,
      businessContext: businessProfile || { industry: 'general', businessName: 'Unknown Business' },
      suggestedAction: reasoning.recommendedAction,
      busmoAction,
      businessData: context.businessData, // NEW: Pass business data for response planning
    };
    let plannedResponse = responsePlanner.planResponse(responsePlanningContext);
    console.log('📝 [MO Master Processor] Response planned');
    
    // Step 14: Enforce principles
    const principlesCheck = principlesEnforcer.checkPrinciples({
      message: plannedResponse.summary,
      sections: plannedResponse.sections,
      context: businessProfile,
    });
    
    if (!principlesCheck.valid) {
      console.log('⚡ [MO Master Processor] Principles violations detected:', principlesCheck.violations.length);
      // Auto-fix violations
      plannedResponse = responsePlanner.applyPrinciples(plannedResponse);
    }
    
    // Step 15: Format final response
    let finalResponse = this.formatFinalResponse({
      intent,
      reasoning,
      calculations,
      risks,
      businessProfile,
      businessSnapshot,
      industryIntelligence,
      proactiveInsights,
      nextPriority,
      busmoAction,
      plannedResponse,
    });
    
    // Step 16: Store conversation memory
    memoryEngine.storeConversation('last_intent', intent.primaryIntent, 3600);
    memoryEngine.storeConversation('last_topic', reasoning.actualGoal, 3600);
    
    // Step 17: Extract and store learned facts
    const learningContext = {
      conversationHistory: context.conversationHistory,
      businessProfile,
      businessData: context.businessData,
      extractedEntities,
      reasoning,
      calculations,
    };
    const conversationSummary = learningEngine.learnFromConversation(learningContext, context.conversationId);
    console.log('📚 [MO Master Processor] Learning completed:', conversationSummary.factsLearned.length, 'facts');
    
    // Step 18: Update business profile with new information
    if (extractedEntities.amounts && extractedEntities.amounts.length > 0) {
      profileManager.updateFromMessage(context.message, { capital: extractedEntities.amounts[0] });
    }
    
    // Step 19: Update business profile with full business data
    if (context.businessData) {
      profileManager.updateWithFullData({
        businessProfile: context.businessData.businessProfile,
        sales: context.businessData.sales,
        expenses: context.businessData.expenses,
        products: context.businessData.products,
        customers: context.businessData.customers,
        suppliers: context.businessData.suppliers,
        cashFlow: context.businessData.cashFlow,
        staff: context.businessData.staff,
      });
      
      // Update business snapshot with business data
      const totalSales = context.businessData.sales?.reduce((sum: number, sale: any) => 
        sum + (parseFloat(sale.amount) || 0), 0
      );
      
      const todaySales = context.businessData.sales?.filter((sale: any) => {
        const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date(sale.createdAt);
        return saleDate.toDateString() === new Date().toDateString();
      })
      .reduce((sum: number, sale: any) => 
        sum + (parseFloat(sale.amount) || 0), 0
      );
      
      // Calculate profit from sales and expenses
      const totalProfit = totalSales - ((context.businessData.expenses?.reduce((sum: number, expense: any) => 
        sum + (parseFloat(expense.amount) || 0), 0
      )) || 0);
      
      const todayProfit = todaySales - ((context.businessData.expenses?.filter((expense: any) => {
        const expenseDate = expense.createdAt?.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
        return expenseDate.toDateString() === new Date().toDateString();
      })
      .reduce((sum: number, expense: any) => 
        sum + (parseFloat(expense.amount) || 0), 0
      )) || 0);
      
      // Count low stock and out of stock items
      const lowStockCount = context.businessData.products?.filter((p: any) => p.stockLevel < p.reorderLevel).length || 0;
      const outOfStockCount = context.businessData.products?.filter((p: any) => p.stockLevel === 0).length || 0;
      
      // Update business snapshot with new data
      profileManager.updateWithFullData({
        businessSnapshot: {
          totalSales,
          todaySales,
          totalProfit,
          todayProfit,
          lowStockCount,
          outOfStockCount,
        },
      });
    }
    
    const processingTime = Date.now() - startTime;
    console.log('✅ [MO Master Processor] Processing completed in', processingTime, 'ms');
    
    return {
      intent,
      reasoning,
      calculations,
      risks,
      opportunities: proactiveInsights,
      plannedResponse,
      busmoAction,
      nextAction: nextPriority?.title,
      learnedFacts: conversationSummary.factsLearned,
      principlesScore: principlesCheck.score,
      finalResponse,
      processingTime,
      canAnswerWithExistingData: reasoning.canAnswerWithExistingData,
      relevantDataPoints: reasoning.relevantDataPoints,
      totalSales: profileManager.getSnapshot().totalSales,
      todaySales: profileManager.getSnapshot().todaySales,
      totalProfit: profileManager.getSnapshot().totalProfit,
      todayProfit: profileManager.getSnapshot().todayProfit,
      lowStockCount: profileManager.getSnapshot().lowStockCount,
      outOfStockCount: profileManager.getSnapshot().outOfStockCount,
    };
  }
  
  // Generate proactive insights (simplified version)
  private generateProactiveInsights(businessData: any, businessProfile: any): any[] {
    const insights: any[] = [];
    
    // Check for common proactive insights
    if (businessProfile?.openingCapital && businessProfile.openingCapital < 50000) {
      insights.push({
        type: 'risk',
        priority: 'high',
        category: 'Financial',
        message: 'Low capital reserves - consider building emergency fund',
      });
    }
    
    // Check for low stock items
    const lowStockItems = businessData.products?.filter((p: any) => p.stockLevel < p.reorderLevel) || [];
    if (lowStockItems.length > 0) {
      insights.push({
        type: 'opportunity',
        priority: 'high',
        category: 'Inventory',
        message: `You have ${lowStockItems.length} items with low stock. Consider reordering them soon.`,
      });
    }
    
    // Check for out of stock items
    const outOfStockItems = businessData.products?.filter((p: any) => p.stockLevel === 0) || [];
    if (outOfStockItems.length > 0) {
      insights.push({
        type: 'risk',
        priority: 'high',
        category: 'Inventory',
        message: `You have ${outOfStockItems.length} items out of stock. This could be affecting your sales.`,
      });
    }
    
    // Add sales insights
    if (businessProfile?.todaySales && businessProfile.todaySales > 0) {
      insights.push({
        type: 'opportunity',
        priority: 'medium',
        category: 'Sales',
        message: `Today's sales are ₦${businessProfile.todaySales?.toLocaleString()}. This is ${businessProfile.todaySales > 100000 ? 'a strong' : 'a moderate'} performance. What would you like to explore further?`,
      });
    }
    
    // Add expense insights
    if (businessProfile?.todayExpenses && businessProfile.todayExpenses > 0) {
      insights.push({
        type: 'risk',
        priority: 'medium',
        category: 'Expenses',
        message: `Today's expenses are ₦${businessProfile.todayExpenses?.toLocaleString()}. Consider reviewing for cost optimization opportunities.`,
      });
    }
    
    return insights;
  }
  
  // Format final response with all engine outputs
  private formatFinalResponse(data: any): string {
    let response = '';
    
    // Add business context if available
    if (data.businessProfile?.industry || data.businessProfile?.stage || data.businessSnapshot?.openingCapital) {
      response += '\n📊 BUSINESS CONTEXT:\n';
      if (data.businessProfile?.industry) {
        response += `• Industry: ${data.businessProfile.industry}\n`;
      }
      if (data.businessProfile?.stage) {
        response += `• Stage: ${data.businessProfile.stage}\n`;
      }
      if (data.businessSnapshot?.openingCapital) {
        response += `• Capital: ₦${data.businessSnapshot.openingCapital.toLocaleString()}\n`;
      }
      if (data.businessSnapshot?.cashAvailable) {
        response += `• Cash Available: ₦${data.businessSnapshot.cashAvailable.toLocaleString()}\n`;
      }
    }
    
    // Add data availability information
    if (data.reasoning?.canAnswerWithExistingData !== undefined) {
      response += `\n📊 DATA AVAILABILITY:\n`;
      response += `• Can Answer With Existing Data: ${data.reasoning.canAnswerWithExistingData}\n`;
      if (data.reasoning?.relevantDataPoints && data.reasoning.relevantDataPoints.length > 0) {
        response += `• Relevant Data Points: ${data.reasoning.relevantDataPoints.join(', ')}\n`;
      }
    }
    
    // Add sales data if available
    if (data.businessProfile?.todaySales !== undefined) {
      const grossMargin = data.businessProfile.totalSales > 0 ? (data.businessProfile.totalProfit / data.businessProfile.totalSales) * 100 : 0;
      
      response += `\n💰 SALES DATA:\n`;
      response += `• Total Sales: ₦${data.businessProfile.totalSales?.toLocaleString() || 'N/A'}\n`;
      response += `• Today's Sales: ₦${data.businessProfile.todaySales?.toLocaleString() || 'N/A'}\n`;
      if (grossMargin > 0) {
        response += `• Gross Margin: ${grossMargin.toFixed(1)}%\n`;
      }
    }
    
    // Add inventory data if available
    if (data.businessProfile?.lowStockCount !== undefined || data.businessProfile?.outOfStockCount !== undefined) {
      response += `\n📦 INVENTORY DATA:\n`;
      if (data.businessProfile?.lowStockCount !== undefined && data.businessProfile.lowStockCount > 0) {
        response += `• Low Stock Items: ${data.businessProfile.lowStockCount}\n`;
      }
      if (data.businessProfile?.outOfStockCount !== undefined && data.businessProfile.outOfStockCount > 0) {
        response += `• Out of Stock Items: ${data.businessProfile.outOfStockCount}\n`;
      }
    }
    
    // Add expense data if available
    if (data.businessProfile?.todayExpenses !== undefined) {
      response += `\n💸 EXPENSE DATA:\n`;
      response += `• Today's Expenses: ₦${data.businessProfile.todayExpenses?.toLocaleString() || 'N/A'}\n`;
      if (data.businessProfile?.totalExpenses !== undefined) {
        response += `• Total Expenses: ₦${data.businessProfile.totalExpenses?.toLocaleString() || 'N/A'}\n`;
      }
    }
    
    // Add cash flow data if available
    if (data.businessProfile?.cashFlow && data.businessProfile.cashFlow.length > 0) {
      const cashAvailable = data.businessProfile.cashFlow.find((cf: any) => cf.type === 'available')?.amount || 0;
      const cashInHand = data.businessProfile.cashFlow.find((cf: any) => cf.type === 'in_hand')?.amount || 0;
      
      response += `\n💵 CASH FLOW DATA:\n`;
      response += `• Cash Available: ₦${cashAvailable.toLocaleString()}\n`;
      response += `• Cash In Hand: ₦${cashInHand.toLocaleString()}\n`;
    }
    
    // Add calculations
    if (data.calculations && data.calculations.length > 0) {
      response += `\n🧮 CALCULATIONS:\n`;
      data.calculations.slice(0, 2).forEach((calc: any) => {
        response += `• ${calc.type}: ${calc.result}\n`;
      });
    }
    
    // Add risks
    const criticalRisks = data.risks?.filter((r: any) => r.severity === 'critical' || r.severity === 'high');
    if (criticalRisks && criticalRisks.length > 0) {
      response += `\n⚠️ RISKS:\n`;
      criticalRisks.slice(0, 2).forEach((risk: any) => {
        response += `• [${risk.severity.toUpperCase()}] ${risk.description}\n`;
      });
    }
    
    // Add industry intelligence
    if (data.industryIntelligence?.focusAreas) {
      response += `\n🏭 INDUSTRY FOCUS:\n`;
      data.industryIntelligence.focusAreas.slice(0, 2).forEach((focus: string) => {
        response += `• ${focus}\n`;
      });
    }
    
    // Add next action
    if (data.nextPriority) {
      response += `\n🎯 NEXT ACTION:\n`;
      response += `• ${data.nextPriority.title}\n`;
      response += `  ${data.nextPriority.description}\n`;
    }
    
    // Add Busmo action if available
    if (data.busmoAction) {
      response += `\n🎯 BUSMO ACTION:\n`;
      response += `• ${data.busmoAction.description}\n`;
      response += `  Confidence: ${(data.busmoAction.confidence * 100).toFixed(0)}%\n`;
    }
    
    return response;
  }
  
  // Get processing statistics
  getStats(): Record<string, any> {
    const memoryEngine = getMemoryEngine(this.businessId, this.userId);
    const learningEngine = getLearningEngine(this.businessId, this.userId);
    
    return {
      businessId: this.businessId,
      userId: this.userId,
      memoryStats: memoryEngine.getStats(),
      learnedFactsCount: learningEngine.getAllFacts().length,
      conversationSummariesCount: learningEngine.getRecentSummaries(100).length,
    };
  }
}

// Singleton instances per business
const masterProcessors: Map<string, MasterProcessor> = new Map();

export function getMasterProcessor(businessId: string, userId: string): MasterProcessor {
  const key = `${businessId}:${userId}`;
  if (!masterProcessors.has(key)) {
    masterProcessors.set(key, new MasterProcessor(businessId, userId));
  }
  return masterProcessors.get(key)!;
}

export function clearMasterProcessor(businessId: string, userId: string): void {
  const key = `${businessId}:${userId}`;
  masterProcessors.delete(key);
  
  // Also clear dependent engines
  clearMemoryEngine(businessId, userId);
  clearLearningEngine(businessId, userId);
  clearPlanningEngine(businessId);
}

/**
 * Factory function to create a conversation planner
 */
export function createConversationPlanner(context: any): any {
  // This would create and return a conversation planner
  // Implementation details would go here
  return {};
}