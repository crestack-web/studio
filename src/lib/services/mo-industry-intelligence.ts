// MO Industry Intelligence Engine - Specialized Industry Knowledge
// Adapts reasoning based on user's business industry

export interface IndustryKnowledge {
  id: string;
  name: string;
  keyMetrics: string[];
  commonChallenges: string[];
  bestPractices: string[];
  criticalFactors: string[];
  seasonalPatterns?: string[];
  regulatoryConsiderations?: string[];
  supplyChainFactors?: string[];
  pricingDynamics?: string[];
  operationalFocus: string[];
}

export interface IndustrySpecificAdvice {
  metrics: string[];
  focusAreas: string[];
  risks: string[];
  opportunities: string[];
  kpis: string[];
  questions: string[];
}

export class IndustryIntelligenceEngine {
  private industryKnowledge: Map<string, IndustryKnowledge> = new Map();
  
  constructor() {
    this.initializeIndustryKnowledge();
  }
  
  // Initialize industry-specific knowledge base
  private initializeIndustryKnowledge(): void {
    // Restaurant Industry
    this.industryKnowledge.set('restaurant', {
      id: 'restaurant',
      name: 'Restaurant',
      keyMetrics: [
        'Food cost percentage',
        'Labor cost percentage',
        'Table turnover rate',
        'Average order value',
        'Wastage percentage',
        'Peak hours utilization',
        'Menu item profitability',
      ],
      commonChallenges: [
        'Food cost volatility',
        'High wastage rates',
        'Labor scheduling efficiency',
        'Menu pricing optimization',
        'Inventory spoilage',
        'Seasonal demand fluctuations',
      ],
      bestPractices: [
        'Implement daily inventory tracking',
        'Use recipe costing for all menu items',
        'Schedule staff based on historical demand patterns',
        'Regular menu engineering analysis',
        'Implement portion control systems',
        'Track food waste by category',
      ],
      criticalFactors: [
        'Food quality consistency',
        'Service speed during peak hours',
        'Menu pricing vs market',
        'Supplier reliability',
        'Staff retention',
      ],
      seasonalPatterns: [
        'Holiday season spikes',
        'Weekend vs weekday patterns',
        'Weather impact on foot traffic',
        'Local event calendar influence',
      ],
      regulatoryConsiderations: [
        'Food safety regulations',
        'Health department inspections',
        'Alcohol licensing requirements',
        'Labor law compliance',
      ],
      supplyChainFactors: [
        'Fresh ingredient availability',
        'Perishable goods lead time',
        'Multiple supplier dependency',
        'Seasonal ingredient pricing',
      ],
      pricingDynamics: [
        'Competitor menu pricing',
        'Local market price sensitivity',
        'Ingredient cost pass-through',
        'Value perception vs price',
      ],
      operationalFocus: [
        'Kitchen workflow optimization',
        'Front-of-house service efficiency',
        'Inventory turnover management',
        'Quality control systems',
      ],
    });
    
    // Retail Industry
    this.industryKnowledge.set('retail', {
      id: 'retail',
      name: 'Retail',
      keyMetrics: [
        'Inventory turnover ratio',
        'Gross margin by product',
        'Sales per square foot',
        'Customer acquisition cost',
        'Customer lifetime value',
        'Shrinkage percentage',
        'Average transaction value',
      ],
      commonChallenges: [
        'Dead stock accumulation',
        'Seasonal inventory management',
        'Competitive pricing pressure',
        'Customer retention',
        'Supplier lead times',
        'Cash flow timing',
      ],
      bestPractices: [
        'Implement ABC inventory analysis',
        'Use just-in-time ordering for fast movers',
        'Regular dead stock clearance',
        'Dynamic pricing based on demand',
        'Customer loyalty programs',
        'Supplier diversification',
      ],
      criticalFactors: [
        'Product availability',
        'Competitive pricing',
        'Store location and accessibility',
        'Customer service quality',
        'Inventory management efficiency',
      ],
      seasonalPatterns: [
        'Holiday shopping seasons',
        'Back-to-school periods',
        'Weather-related demand shifts',
        'Local festival impacts',
      ],
      regulatoryConsiderations: [
        'Consumer protection laws',
        'Product safety standards',
        'Tax compliance on sales',
        'Employee labor regulations',
      ],
      supplyChainFactors: [
        'Supplier reliability',
        'Lead time variability',
        'Minimum order quantities',
        'Shipping cost optimization',
      ],
      pricingDynamics: [
        'Competitor price matching',
        'Promotional pricing strategies',
        'Margin vs volume trade-offs',
        'Psychological pricing tactics',
      ],
      operationalFocus: [
        'Stock level optimization',
        'Customer experience enhancement',
        'Loss prevention',
        'Staff scheduling efficiency',
      ],
    });
    
    // Manufacturing Industry
    this.industryKnowledge.set('manufacturing', {
      id: 'manufacturing',
      name: 'Manufacturing',
      keyMetrics: [
        'Production yield rate',
        'Capacity utilization',
        'Downtime percentage',
        'Defect rate',
        'Production cost per unit',
        'Inventory holding cost',
        'Order fulfillment time',
      ],
      commonChallenges: [
        'Raw material cost volatility',
        'Production bottlenecks',
        'Quality control consistency',
        'Equipment maintenance',
        'Workforce skill gaps',
        'Supply chain disruptions',
      ],
      bestPractices: [
        'Implement preventive maintenance schedules',
        'Use statistical process control',
        'Optimize production scheduling',
        'Implement lean manufacturing principles',
        'Diversify raw material suppliers',
        'Track yield by production batch',
      ],
      criticalFactors: [
        'Production capacity',
        'Quality consistency',
        'Raw material availability',
        'Equipment reliability',
        'Skilled workforce availability',
      ],
      seasonalPatterns: [
        'Raw material seasonal pricing',
        'End-of-quarter demand spikes',
        'Holiday production schedules',
        'Maintenance windows',
      ],
      regulatoryConsiderations: [
        'Environmental regulations',
        'Worker safety standards',
        'Product quality certifications',
        'Waste disposal regulations',
      ],
      supplyChainFactors: [
        'Raw material lead times',
        'Supplier quality consistency',
        'Logistics and transportation',
        'Inventory buffer requirements',
      ],
      pricingDynamics: [
        'Raw material cost pass-through',
        'Volume-based pricing tiers',
        'Competitive manufacturing costs',
        'Value-added pricing',
      ],
      operationalFocus: [
        'Production efficiency optimization',
        'Quality assurance systems',
        'Maintenance management',
        'Workforce training',
      ],
    });
    
    // Plastic Recycling Industry
    this.industryKnowledge.set('plastic recycling', {
      id: 'plastic recycling',
      name: 'Plastic Recycling',
      keyMetrics: [
        'PET grade yield',
        'Color separation efficiency',
        'Moisture content percentage',
        'Processing cost per ton',
        'Collection network efficiency',
        'Buyer quality requirements',
        'Export market prices',
      ],
      commonChallenges: [
        'PET grade contamination',
        'Collection network logistics',
        'Moisture control in processing',
        'Buyer quality standards',
        'Market price volatility',
        'Processing yield optimization',
      ],
      bestPractices: [
        'Implement strict quality sorting',
        'Monitor moisture content continuously',
        'Build reliable collection networks',
        'Maintain buyer quality certifications',
        'Track yield by processing batch',
        'Diversify buyer relationships',
      ],
      criticalFactors: [
        'PET grade quality',
        'Color separation accuracy',
        'Moisture control',
        'Collection network reliability',
        'Buyer relationships',
      ],
      seasonalPatterns: [
        'Collection volume fluctuations',
        'Export market demand cycles',
        'Raw material availability seasons',
        'Processing capacity utilization',
      ],
      regulatoryConsiderations: [
        'Environmental waste regulations',
        'Export quality certifications',
        'Waste handling permits',
        'Environmental impact reporting',
      ],
      supplyChainFactors: [
        'Collection network reliability',
        'Raw material quality consistency',
        'Processing capacity',
        'Export logistics',
      ],
      pricingDynamics: [
        'International PET prices',
        'Quality grade pricing tiers',
        'Buyer negotiation power',
        'Volume-based pricing',
      ],
      operationalFocus: [
        'Quality control systems',
        'Collection network management',
        'Processing efficiency',
        'Buyer relationship management',
      ],
    });
    
    // Agriculture Industry
    this.industryKnowledge.set('agriculture', {
      id: 'agriculture',
      name: 'Agriculture',
      keyMetrics: [
        'Yield per hectare',
        'Input cost per unit',
        'Crop loss percentage',
        'Market price realization',
        'Storage capacity utilization',
        'Labor productivity',
        'Water usage efficiency',
      ],
      commonChallenges: [
        'Weather dependency',
        'Pest and disease management',
        'Input cost volatility',
        'Market price fluctuations',
        'Storage and preservation',
        'Labor availability',
      ],
      bestPractices: [
        'Implement crop rotation schedules',
        'Use weather forecasting for planning',
        'Diversify crop varieties',
        'Implement irrigation efficiency systems',
        'Build storage infrastructure',
        'Secure forward contracts',
      ],
      criticalFactors: [
        'Weather conditions',
        'Input availability',
        'Market access',
        'Storage capacity',
        'Labor availability',
      ],
      seasonalPatterns: [
        'Planting and harvest cycles',
        'Rainy vs dry seasons',
        'Market demand seasons',
        'Input price seasons',
      ],
      regulatoryConsiderations: [
        'Agricultural subsidies',
        'Environmental regulations',
        'Food safety standards',
        'Land use regulations',
      ],
      supplyChainFactors: [
        'Input supplier reliability',
        'Market access infrastructure',
        'Storage facility availability',
        'Transportation logistics',
      ],
      pricingDynamics: [
        'Seasonal price variations',
        'Market demand fluctuations',
        'Quality-based pricing',
        'Volume discounts',
      ],
      operationalFocus: [
        'Crop management optimization',
        'Resource efficiency',
        'Market timing',
        'Risk management',
      ],
    });
    
    // Construction Industry
    this.industryKnowledge.set('construction', {
      id: 'construction',
      name: 'Construction',
      keyMetrics: [
        'Project cost variance',
        'Schedule adherence',
        'Material waste percentage',
        'Labor productivity',
        'Safety incident rate',
        'Client satisfaction score',
        'Profit margin per project',
      ],
      commonChallenges: [
        'Project cost overruns',
        'Schedule delays',
        'Material price volatility',
        'Skilled labor shortages',
        'Subcontractor coordination',
        'Weather impact on timeline',
      ],
      bestPractices: [
        'Implement detailed project planning',
        'Use material procurement schedules',
        'Maintain safety protocols',
        'Regular progress monitoring',
        'Subcontractor performance tracking',
        'Contingency budgeting',
      ],
      criticalFactors: [
        'Project planning accuracy',
        'Material availability',
        'Skilled labor access',
        'Safety compliance',
        'Client communication',
      ],
      seasonalPatterns: [
        'Weather-dependent work windows',
        'Material price seasonal variations',
        'Labor availability seasons',
        'Permit processing timelines',
      ],
      regulatoryConsiderations: [
        'Building codes compliance',
        'Safety regulations',
        'Environmental permits',
        'Labor law compliance',
      ],
      supplyChainFactors: [
        'Material supplier reliability',
        'Equipment availability',
        'Subcontractor capacity',
        'Just-in-time material delivery',
      ],
      pricingDynamics: [
        'Fixed vs cost-plus contracts',
        'Change order management',
        'Competitive bidding',
        'Material cost escalation clauses',
      ],
      operationalFocus: [
        'Project management efficiency',
        'Resource allocation',
        'Quality control',
        'Safety management',
      ],
    });
    
    // Wholesale Industry
    this.industryKnowledge.set('wholesale', {
      id: 'wholesale',
      name: 'Wholesale',
      keyMetrics: [
        'Inventory turnover',
        'Gross margin by product line',
        'Order fulfillment rate',
        'Customer order frequency',
        'Return rate percentage',
        'Warehouse space utilization',
        'Delivery time accuracy',
      ],
      commonChallenges: [
        'Bulk inventory management',
        'Customer payment terms',
        'Minimum order quantities',
        'Seasonal demand fluctuations',
        'Competitive pricing pressure',
        'Logistics cost optimization',
      ],
      bestPractices: [
        'Implement demand forecasting',
        'Optimize warehouse layout',
        'Use automated ordering systems',
        'Negotiate favorable supplier terms',
        'Implement customer tiering',
        'Track customer buying patterns',
      ],
      criticalFactors: [
        'Inventory availability',
        'Competitive pricing',
        'Reliable delivery',
        'Credit terms management',
        'Supplier relationships',
      ],
      seasonalPatterns: [
        'Retail buying seasons',
        'Holiday demand spikes',
        'Industry-specific cycles',
        'End-of-quarter pushes',
      ],
      regulatoryConsiderations: [
        'Trade regulations',
        'Tax compliance on bulk sales',
        'Credit lending regulations',
        'Product safety standards',
      ],
      supplyChainFactors: [
        'Bulk supplier reliability',
        'Warehouse capacity',
        'Distribution network',
        'Transportation costs',
      ],
      pricingDynamics: [
        'Volume-based discount structures',
        'Competitive wholesale pricing',
        'Cost-plus margin models',
        'Seasonal pricing adjustments',
      ],
      operationalFocus: [
        'Inventory optimization',
        'Order fulfillment efficiency',
        'Customer relationship management',
        'Logistics coordination',
      ],
    });
    
    // Service Industry
    this.industryKnowledge.set('services', {
      id: 'services',
      name: 'Services',
      keyMetrics: [
        'Customer acquisition cost',
        'Customer lifetime value',
        'Service utilization rate',
        'Customer satisfaction score',
        'Staff utilization',
        'Revenue per employee',
        'Churn rate',
      ],
      commonChallenges: [
        'Service quality consistency',
        'Staff retention',
        'Customer acquisition',
        'Pricing strategy',
        'Capacity management',
        'Differentiation from competitors',
      ],
      bestPractices: [
        'Implement service standardization',
        'Invest in staff training',
        'Build customer relationships',
        'Use customer feedback systems',
        'Implement booking/scheduling systems',
        'Track service metrics',
      ],
      criticalFactors: [
        'Service quality',
        'Customer satisfaction',
        'Staff competence',
        'Pricing competitiveness',
        'Brand reputation',
      ],
      seasonalPatterns: [
        'Peak service demand periods',
        'Holiday service demand',
        'Industry-specific cycles',
        'Economic condition impacts',
      ],
      regulatoryConsiderations: [
        'Professional licensing',
        'Service contracts',
        'Consumer protection laws',
        'Data privacy regulations',
      ],
      supplyChainFactors: [
        'Staff availability',
        'Equipment/supply availability',
        'Partner service providers',
        'Technology infrastructure',
      ],
      pricingDynamics: [
        'Value-based pricing',
        'Hourly vs project-based',
        'Competitive service pricing',
        'Premium service tiers',
      ],
      operationalFocus: [
        'Service quality control',
        'Staff management',
        'Customer relationship management',
        'Capacity planning',
      ],
    });
  }
  
  // Get industry-specific advice
  getIndustryAdvice(industry: string): IndustrySpecificAdvice {
    const knowledge = this.industryKnowledge.get(industry.toLowerCase());
    
    if (!knowledge) {
      return this.getGenericAdvice();
    }
    
    return {
      metrics: knowledge.keyMetrics,
      focusAreas: knowledge.operationalFocus,
      risks: knowledge.commonChallenges,
      opportunities: knowledge.bestPractices,
      kpis: knowledge.keyMetrics,
      questions: this.generateIndustryQuestions(knowledge),
    };
  }
  
  // Generate industry-specific questions
  private generateIndustryQuestions(knowledge: IndustryKnowledge): string[] {
    const questions: string[] = [];
    
    knowledge.keyMetrics.slice(0, 3).forEach(metric => {
      questions.push(`What is your current ${metric.toLowerCase()}?`);
    });
    
    knowledge.commonChallenges.slice(0, 2).forEach(challenge => {
      questions.push(`How are you handling ${challenge.toLowerCase()}?`);
    });
    
    return questions;
  }
  
  // Get generic advice for unknown industries
  private getGenericAdvice(): IndustrySpecificAdvice {
    return {
      metrics: [
        'Revenue growth rate',
        'Profit margin',
        'Customer acquisition cost',
        'Customer retention rate',
        'Cash flow position',
      ],
      focusAreas: [
        'Revenue optimization',
        'Cost management',
        'Customer satisfaction',
        'Operational efficiency',
      ],
      risks: [
        'Cash flow volatility',
        'Market competition',
        'Economic conditions',
        'Regulatory changes',
      ],
      opportunities: [
        'Market expansion',
        'Process optimization',
        'Customer base growth',
        'Product/service diversification',
      ],
      kpis: [
        'Revenue',
        'Profit',
        'Customer satisfaction',
        'Operational efficiency',
      ],
      questions: [
        'What are your main revenue streams?',
        'What are your biggest operational challenges?',
        'Who are your primary customers?',
        'What are your growth goals?',
      ],
    };
  }
  
  // Check if industry is supported
  isIndustrySupported(industry: string): boolean {
    return this.industryKnowledge.has(industry.toLowerCase());
  }
  
  // Get all supported industries
  getSupportedIndustries(): string[] {
    return Array.from(this.industryKnowledge.keys());
  }
  
  // Get industry knowledge
  getIndustryKnowledge(industry: string): IndustryKnowledge | undefined {
    return this.industryKnowledge.get(industry.toLowerCase());
  }
  
  // Format industry intelligence for AI response
  formatForAIResponse(industry: string): string {
    const advice = this.getIndustryAdvice(industry);
    
    let response = `\n\n🏭 INDUSTRY INTELLIGENCE (${industry.toUpperCase()}):\n`;
    response += `\nKey Metrics to Track:\n`;
    advice.metrics.forEach(metric => {
      response += `• ${metric}\n`;
    });
    
    response += `\nOperational Focus:\n`;
    advice.focusAreas.forEach(focus => {
      response += `• ${focus}\n`;
    });
    
    response += `\nCommon Challenges:\n`;
    advice.risks.slice(0, 3).forEach(risk => {
      response += `• ${risk}\n`;
    });
    
    response += `\nBest Practices:\n`;
    advice.opportunities.slice(0, 3).forEach(opportunity => {
      response += `• ${opportunity}\n`;
    });
    
    return response;
  }
}

// Singleton instance
let industryIntelligenceInstance: IndustryIntelligenceEngine | null = null;

export function getIndustryIntelligenceEngine(): IndustryIntelligenceEngine {
  if (!industryIntelligenceInstance) {
    industryIntelligenceInstance = new IndustryIntelligenceEngine();
  }
  return industryIntelligenceInstance;
}
