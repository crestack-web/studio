// MO Planning Engine - Step-by-Step Business Guidance
// Always knows the next best action and guides users systematically

export interface PlanningStep {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dependencies: string[]; // IDs of steps that must be completed first
  estimatedTime?: string;
  requiredResources?: string[];
  successCriteria?: string[];
  blockers?: string[];
}

export interface BusinessPlan {
  id: string;
  name: string;
  description: string;
  goal: string;
  steps: PlanningStep[];
  currentStep: string | null;
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanningContext {
  businessProfile: any;
  businessData: any;
  currentIntent: string;
  risks: any[];
  opportunities: any[];
  missingInformation: string[];
}

export class PlanningEngine {
  private activePlans: Map<string, BusinessPlan> = new Map();
  private businessId: string;
  
  constructor(businessId: string) {
    this.businessId = businessId;
  }
  
  // Analyze current business state and determine next priority
  determineNextPriority(context: PlanningContext): PlanningStep | null {
    const { businessProfile, businessData, risks, missingInformation } = context;
    
    // Critical risks take priority
    const criticalRisks = risks.filter((r: any) => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      return this.createRiskMitigationStep(criticalRisks[0]);
    }
    
    // Missing critical information
    if (missingInformation.length > 0) {
      return this.createInformationGatheringStep(missingInformation[0]);
    }
    
    // Stage-specific priorities
    const stage = businessProfile?.stage || 'idea';
    switch (stage) {
      case 'idea':
        return this.getIdeaStagePriority(context);
      case 'startup':
        return this.getStartupStagePriority(context);
      case 'growing':
        return this.getGrowingStagePriority(context);
      case 'mature':
        return this.getMatureStagePriority(context);
      default:
        return this.getGenericPriority(context);
    }
  }
  
  // Idea stage priorities
  private getIdeaStagePriority(context: PlanningContext): PlanningStep {
    const { businessProfile } = context;
    
    if (!businessProfile?.industry) {
      return {
        id: 'define_industry',
        title: 'Define Your Industry',
        description: 'Specify what industry your business will operate in for tailored advice',
        priority: 'critical',
        status: 'pending',
        dependencies: [],
        estimatedTime: '5 minutes',
        requiredResources: [],
        successCriteria: ['Industry specified'],
      };
    }
    
    if (businessProfile?.openingCapital === undefined) {
      return {
        id: 'define_capital',
        title: 'Define Your Capital',
        description: 'Specify how much capital you have available to start the business',
        priority: 'critical',
        status: 'pending',
        dependencies: [],
        estimatedTime: '5 minutes',
        requiredResources: [],
        successCriteria: ['Capital amount specified'],
      };
    }
    
    if (!businessProfile?.location) {
      return {
        id: 'define_location',
        title: 'Define Your Location',
        description: 'Specify where you plan to operate the business',
        priority: 'high',
        status: 'pending',
        dependencies: [],
        estimatedTime: '5 minutes',
        requiredResources: [],
        successCriteria: ['Location specified'],
      };
    }
    
    return {
      id: 'validate_idea',
      title: 'Validate Your Business Idea',
      description: 'Test your business idea with potential customers before investing',
      priority: 'high',
      status: 'pending',
      dependencies: ['define_industry', 'define_capital', 'define_location'],
      estimatedTime: '1-2 weeks',
      requiredResources: ['Time for customer interviews', 'Prototype or MVP'],
      successCriteria: ['Customer feedback collected', 'Market demand validated'],
    };
  }
  
  // Startup stage priorities
  private getStartupStagePriority(context: PlanningContext): PlanningStep {
    const { businessData, businessProfile } = context;
    
    // Check if first sale recorded
    const hasSales = businessData?.sales && businessData.sales.length > 0;
    if (!hasSales) {
      return {
        id: 'first_sale',
        title: 'Record Your First Sale',
        description: 'Focus on generating and recording your first sale',
        priority: 'critical',
        status: 'pending',
        dependencies: [],
        estimatedTime: 'Immediate',
        requiredResources: ['Customer', 'Product/Service'],
        successCriteria: ['First sale recorded'],
      };
    }
    
    // Check if suppliers recorded
    const hasSuppliers = businessData?.suppliers && businessData.suppliers.length > 0;
    if (!hasSuppliers && businessProfile?.industry !== 'services') {
      return {
        id: 'add_suppliers',
        title: 'Add Your Suppliers',
        description: 'Record your suppliers for better inventory management',
        priority: 'high',
        status: 'pending',
        dependencies: [],
        estimatedTime: '15 minutes',
        requiredResources: ['Supplier information'],
        successCriteria: ['Suppliers recorded in system'],
      };
    }
    
    // Check cash flow
    const cashAvailable = businessProfile?.cashAvailable || 0;
    if (cashAvailable < 50000) {
      return {
        id: 'improve_cash_flow',
        title: 'Improve Cash Flow',
        description: 'Focus on generating cash flow to build reserves',
        priority: 'critical',
        status: 'pending',
        dependencies: ['first_sale'],
        estimatedTime: 'Ongoing',
        requiredResources: ['Sales activities'],
        successCriteria: ['Cash reserves above ₦50,000'],
      };
    }
    
    return {
      id: 'optimize_operations',
      title: 'Optimize Operations',
      description: 'Streamline your business processes for efficiency',
      priority: 'medium',
      status: 'pending',
      dependencies: ['first_sale', 'add_suppliers'],
      estimatedTime: '1-2 weeks',
      requiredResources: [],
      successCriteria: ['Processes documented', 'Efficiency improved'],
    };
  }
  
  // Growing stage priorities
  private getGrowingStagePriority(context: PlanningContext): PlanningStep {
    const { businessData, businessProfile } = context;
    
    // Check if hiring needed
    const staffCount = businessProfile?.staffCount || 0;
    const hasSales = businessData?.sales?.length || 0;
    
    if (hasSales > 50 && staffCount < 2) {
      return {
        id: 'consider_hiring',
        title: 'Consider Hiring Staff',
        description: 'Your sales volume suggests you may benefit from additional staff',
        priority: 'high',
        status: 'pending',
        dependencies: [],
        estimatedTime: '2-4 weeks',
        requiredResources: ['Budget for salaries', 'Job descriptions'],
        successCriteria: ['Staff hired or decision made'],
      };
    }
    
    // Check for automation opportunities
    return {
      id: 'automate_processes',
      title: 'Automate Repetitive Tasks',
      description: 'Identify and automate repetitive tasks to free up time',
      priority: 'medium',
      status: 'pending',
      dependencies: [],
      estimatedTime: '2-4 weeks',
      requiredResources: ['Software tools', 'Process documentation'],
      successCriteria: ['Key processes automated'],
    };
  }
  
  // Mature stage priorities
  private getMatureStagePriority(context: PlanningContext): PlanningStep {
    const { businessProfile } = context;
    
    // Check for expansion opportunities
    if (!businessProfile?.goals || businessProfile.goals.length === 0) {
      return {
        id: 'define_growth_goals',
        title: 'Define Growth Goals',
        description: 'Set clear goals for business expansion or improvement',
        priority: 'high',
        status: 'pending',
        dependencies: [],
        estimatedTime: '1 week',
        requiredResources: [],
        successCriteria: ['Growth goals documented'],
      };
    }
    
    return {
      id: 'explore_expansion',
      title: 'Explore Expansion Opportunities',
      description: 'Evaluate opportunities for business expansion',
      priority: 'medium',
      status: 'pending',
      dependencies: ['define_growth_goals'],
      estimatedTime: '1-3 months',
      requiredResources: ['Market research', 'Capital'],
      successCriteria: ['Expansion plan developed'],
    };
  }
  
  // Generic priority when stage is unknown
  private getGenericPriority(context: PlanningContext): PlanningStep {
    return {
      id: 'define_business_stage',
      title: 'Define Business Stage',
      description: 'Specify your current business stage for tailored guidance',
      priority: 'high',
      status: 'pending',
      dependencies: [],
      estimatedTime: '5 minutes',
      requiredResources: [],
      successCriteria: ['Business stage specified'],
    };
  }
  
  // Create risk mitigation step
  private createRiskMitigationStep(risk: any): PlanningStep {
    return {
      id: `mitigate_${risk.id}`,
      title: `Address ${risk.category} Risk`,
      description: risk.description,
      priority: 'critical',
      status: 'pending',
      dependencies: [],
      estimatedTime: 'Immediate',
      requiredResources: [],
      successCriteria: risk.mitigation.slice(0, 2),
    };
  }
  
  // Create information gathering step
  private createInformationGatheringStep(missingInfo: string): PlanningStep {
    return {
      id: `gather_${missingInfo.toLowerCase().replace(/\s+/g, '_')}`,
      title: `Provide ${missingInfo}`,
      description: `Supply ${missingInfo.toLowerCase()} for better business insights`,
      priority: 'critical',
      status: 'pending',
      dependencies: [],
      estimatedTime: '5 minutes',
      requiredResources: [],
      successCriteria: [`${missingInfo} provided`],
    };
  }
  
  // Create a comprehensive business plan
  createBusinessPlan(goal: string, context: PlanningContext): BusinessPlan {
    const planId = `plan_${Date.now()}`;
    const steps: PlanningStep[] = [];
    
    // Determine initial steps based on context
    const firstStep = this.determineNextPriority(context);
    if (firstStep) {
      steps.push(firstStep);
    }
    
    // Add follow-up steps based on goal
    if (goal.includes('start') || goal.includes('launch')) {
      steps.push(...this.getStartupPlanSteps(context));
    } else if (goal.includes('grow') || goal.includes('expand')) {
      steps.push(...this.getGrowthPlanSteps(context));
    } else if (goal.includes('optimize') || goal.includes('improve')) {
      steps.push(...this.getOptimizationPlanSteps(context));
    }
    
    const plan: BusinessPlan = {
      id: planId,
      name: this.generatePlanName(goal),
      description: this.generatePlanDescription(goal),
      goal,
      steps,
      currentStep: steps.length > 0 ? steps[0].id : null,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.activePlans.set(planId, plan);
    return plan;
  }
  
  // Get startup plan steps
  private getStartupPlanSteps(context: PlanningContext): PlanningStep[] {
    return [
      {
        id: 'validate_market',
        title: 'Validate Market Demand',
        description: 'Confirm there is demand for your product/service',
        priority: 'high',
        status: 'pending',
        dependencies: [],
        estimatedTime: '1-2 weeks',
        requiredResources: ['Time for research', 'Potential customers'],
        successCriteria: ['Market validation completed'],
      },
      {
        id: 'setup_operations',
        title: 'Setup Basic Operations',
        description: 'Establish essential business operations',
        priority: 'high',
        status: 'pending',
        dependencies: ['validate_market'],
        estimatedTime: '1-2 weeks',
        requiredResources: ['Business location/setup', 'Basic equipment'],
        successCriteria: ['Operations ready for business'],
      },
      {
        id: 'acquire_first_customers',
        title: 'Acquire First Customers',
        description: 'Focus on getting your first paying customers',
        priority: 'critical',
        status: 'pending',
        dependencies: ['setup_operations'],
        estimatedTime: '2-4 weeks',
        requiredResources: ['Marketing materials', 'Sales effort'],
        successCriteria: ['First customers acquired'],
      },
      {
        id: 'establish_cash_flow',
        title: 'Establish Positive Cash Flow',
        description: 'Ensure revenue exceeds expenses consistently',
        priority: 'critical',
        status: 'pending',
        dependencies: ['acquire_first_customers'],
        estimatedTime: '1-3 months',
        requiredResources: ['Ongoing sales activity'],
        successCriteria: ['Positive cash flow achieved'],
      },
    ];
  }
  
  // Get growth plan steps
  private getGrowthPlanSteps(context: PlanningContext): PlanningStep[] {
    return [
      {
        id: 'analyze_current_performance',
        title: 'Analyze Current Performance',
        description: 'Review current business metrics and identify growth areas',
        priority: 'high',
        status: 'pending',
        dependencies: [],
        estimatedTime: '1 week',
        requiredResources: ['Business data', 'Analytics'],
        successCriteria: ['Performance analysis completed'],
      },
      {
        id: 'identify_growth_opportunities',
        title: 'Identify Growth Opportunities',
        description: 'Find specific areas for business expansion',
        priority: 'high',
        status: 'pending',
        dependencies: ['analyze_current_performance'],
        estimatedTime: '1-2 weeks',
        requiredResources: ['Market research'],
        successCriteria: ['Growth opportunities identified'],
      },
      {
        id: 'develop_growth_strategy',
        title: 'Develop Growth Strategy',
        description: 'Create a detailed plan for growth',
        priority: 'high',
        status: 'pending',
        dependencies: ['identify_growth_opportunities'],
        estimatedTime: '2-4 weeks',
        requiredResources: ['Planning time', 'Stakeholder input'],
        successCriteria: ['Growth strategy documented'],
      },
      {
        id: 'implement_growth_initiatives',
        title: 'Implement Growth Initiatives',
        description: 'Execute the growth strategy',
        priority: 'critical',
        status: 'pending',
        dependencies: ['develop_growth_strategy'],
        estimatedTime: '3-6 months',
        requiredResources: ['Capital', 'Resources'],
        successCriteria: ['Growth initiatives launched'],
      },
    ];
  }
  
  // Get optimization plan steps
  private getOptimizationPlanSteps(context: PlanningContext): PlanningStep[] {
    return [
      {
        id: 'audit_current_processes',
        title: 'Audit Current Processes',
        description: 'Review all business processes for inefficiencies',
        priority: 'high',
        status: 'pending',
        dependencies: [],
        estimatedTime: '1-2 weeks',
        requiredResources: ['Process documentation', 'Staff input'],
        successCriteria: ['Process audit completed'],
      },
      {
        id: 'identify_inefficiencies',
        title: 'Identify Inefficiencies',
        description: 'Find specific areas for improvement',
        priority: 'high',
        status: 'pending',
        dependencies: ['audit_current_processes'],
        estimatedTime: '1 week',
        requiredResources: ['Analysis tools'],
        successCriteria: ['Inefficiencies identified'],
      },
      {
        id: 'implement_improvements',
        title: 'Implement Improvements',
        description: 'Make changes to optimize operations',
        priority: 'high',
        status: 'pending',
        dependencies: ['identify_inefficiencies'],
        estimatedTime: '2-4 weeks',
        requiredResources: ['Implementation resources'],
        successCriteria: ['Improvements implemented'],
      },
      {
        id: 'measure_results',
        title: 'Measure Results',
        description: 'Track the impact of improvements',
        priority: 'medium',
        status: 'pending',
        dependencies: ['implement_improvements'],
        estimatedTime: '1-2 months',
        requiredResources: ['Metrics tracking'],
        successCriteria: ['Results measured and documented'],
      },
    ];
  }
  
  // Generate plan name
  private generatePlanName(goal: string): string {
    if (goal.includes('start') || goal.includes('launch')) return 'Business Startup Plan';
    if (goal.includes('grow') || goal.includes('expand')) return 'Business Growth Plan';
    if (goal.includes('optimize') || goal.includes('improve')) return 'Business Optimization Plan';
    return 'Business Action Plan';
  }
  
  // Generate plan description
  private generatePlanDescription(goal: string): string {
    if (goal.includes('start') || goal.includes('launch')) {
      return 'Step-by-step plan to successfully start and launch your business';
    }
    if (goal.includes('grow') || goal.includes('expand')) {
      return 'Strategic plan to grow and expand your business operations';
    }
    if (goal.includes('optimize') || goal.includes('improve')) {
      return 'Plan to optimize and improve business efficiency and performance';
    }
    return 'Action plan to achieve your business objectives';
  }
  
  // Update plan progress
  updatePlanProgress(planId: string, stepId: string, status: 'completed' | 'in_progress'): void {
    const plan = this.activePlans.get(planId);
    if (!plan) return;
    
    const step = plan.steps.find(s => s.id === stepId);
    if (step) {
      step.status = status;
      
      // Update current step
      if (status === 'completed') {
        const nextStep = plan.steps.find(s => 
          s.status === 'pending' && 
          s.dependencies.every(dep => 
            plan.steps.find(ps => ps.id === dep)?.status === 'completed'
          )
        );
        plan.currentStep = nextStep?.id || null;
      }
      
      // Calculate progress
      const completedSteps = plan.steps.filter(s => s.status === 'completed').length;
      plan.progress = (completedSteps / plan.steps.length) * 100;
      
      plan.updatedAt = new Date();
    }
  }
  
  // Get active plan
  getActivePlan(): BusinessPlan | null {
    const plans = Array.from(this.activePlans.values());
    if (plans.length === 0) return null;
    
    // Return most recently updated plan
    return plans.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  }
  
  // Get next action from active plan
  getNextAction(): PlanningStep | null {
    const plan = this.getActivePlan();
    if (!plan || !plan.currentStep) return null;
    
    return plan.steps.find(s => s.id === plan.currentStep) || null;
  }
  
  // Format plan for AI response
  formatForAIResponse(plan: BusinessPlan): string {
    let response = '\n\n📋 BUSINESS PLAN:\n';
    response += `Plan: ${plan.name}\n`;
    response += `Goal: ${plan.goal}\n`;
    response += `Progress: ${plan.progress.toFixed(0)}%\n\n`;
    
    const currentStep = plan.steps.find(s => s.id === plan.currentStep);
    if (currentStep) {
      response += `🎯 CURRENT FOCUS:\n`;
      response += `${currentStep.title}\n`;
      response += `${currentStep.description}\n`;
      if (currentStep.estimatedTime) {
        response += `Estimated time: ${currentStep.estimatedTime}\n`;
      }
      response += '\n';
    }
    
    response += `📝 PLAN STEPS:\n`;
    plan.steps.forEach((step, index) => {
      const icon = step.status === 'completed' ? '✅' : step.status === 'in_progress' ? '🔄' : step.id === plan.currentStep ? '🎯' : '⬜';
      response += `${icon} ${index + 1}. ${step.title}\n`;
      if (step.id === plan.currentStep) {
        response += `   ${step.description}\n`;
      }
    });
    
    return response;
  }
  
  // Format next action for AI response
  formatNextActionForAI(step: PlanningStep): string {
    if (!step) return '';
    
    let response = '\n\n🎯 RECOMMENDED NEXT ACTION:\n';
    response += `${step.title}\n`;
    response += `${step.description}\n`;
    
    if (step.priority === 'critical') {
      response += `\n⚠️ PRIORITY: CRITICAL - Address immediately\n`;
    }
    
    if (step.estimatedTime) {
      response += `⏱️ Estimated time: ${step.estimatedTime}\n`;
    }
    
    if (step.requiredResources && step.requiredResources.length > 0) {
      response += `📦 Required: ${step.requiredResources.join(', ')}\n`;
    }
    
    if (step.successCriteria && step.successCriteria.length > 0) {
      response += `✅ Success criteria: ${step.successCriteria.join(', ')}\n`;
    }
    
    return response;
  }
}

// Singleton instances per business
const planningEngines: Map<string, PlanningEngine> = new Map();

export function getPlanningEngine(businessId: string): PlanningEngine {
  if (!planningEngines.has(businessId)) {
    planningEngines.set(businessId, new PlanningEngine(businessId));
  }
  return planningEngines.get(businessId)!;
}

export function clearPlanningEngine(businessId: string): void {
  planningEngines.delete(businessId);
}
