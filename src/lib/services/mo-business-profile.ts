// MO Business Profile - Internal Business Brain
// Maintains evolving understanding of every business

export interface BusinessProfile {
  // Business Profile
  industry?: string;
  businessModel?: string;
  stage?: 'idea' | 'startup' | 'growing' | 'mature';
  location?: string;
  staffCount?: number;
  products?: string[];
  services?: string[];
  customers?: string[];
  suppliers?: string[];
  revenueStreams?: string[];
  goals?: string[];
  challenges?: string[];
  risks?: string[];
  priorities?: string[];
  
  // Financial State
  openingCapital?: number;
  cashAvailable?: number;
  inventoryValue?: number;
  assets?: number;
  liabilities?: number;
  expectedExpenses?: number;
  expectedIncome?: number;
  monthlyBurn?: number;
  profitTrend?: 'increasing' | 'stable' | 'decreasing';
  
  // Operational State
  outstandingInvoices?: number;
  creditSales?: number;
  inventoryShortages?: string[];
  inventorySurplus?: string[];
  productionCapacity?: number;
  deliveryStatus?: string;
  staffPerformance?: Record<string, any>;
  
  // Conversation Memory
  learnedInfo?: Record<string, any>;
  lastUpdated?: Date;
}

export interface BusinessSnapshot {
  openingCapital?: number;
  cashAvailable?: number;
  expenses?: number;
  sales?: number;
  profit?: number;
  currentStage?: string;
  nextRecommendedAction?: string;
}

export class BusinessProfileManager {
  private profile: BusinessProfile = {};
  
  // Update business profile from conversation
  updateFromMessage(message: string, extractedData: any): void {
    // Extract and update business information
    if (extractedData.capital) {
      this.profile.openingCapital = extractedData.capital;
      this.profile.cashAvailable = extractedData.capital;
    }
    
    if (extractedData.location) {
      this.profile.location = extractedData.location;
    }
    
    if (extractedData.industry) {
      this.profile.industry = extractedData.industry;
    }
    
    if (extractedData.staffCount) {
      this.profile.staffCount = extractedData.staffCount;
    }
    
    if (extractedData.products) {
      this.profile.products = [...(this.profile.products || []), ...extractedData.products];
    }
    
    if (extractedData.suppliers) {
      this.profile.suppliers = [...(this.profile.suppliers || []), ...extractedData.suppliers];
    }
    
    if (extractedData.goals) {
      this.profile.goals = [...(this.profile.goals || []), ...extractedData.goals];
    }
    
    // Store learned information
    if (!this.profile.learnedInfo) {
      this.profile.learnedInfo = {};
    }
    
    Object.keys(extractedData).forEach(key => {
      this.profile.learnedInfo![key] = extractedData[key];
    });
    
    this.profile.lastUpdated = new Date();
  }
  
  // Get current business snapshot
  getSnapshot(): BusinessSnapshot {
    return {
      openingCapital: this.profile.openingCapital,
      cashAvailable: this.profile.cashAvailable,
      expenses: this.profile.expectedExpenses,
      sales: this.profile.expectedIncome,
      profit: (this.profile.expectedIncome || 0) - (this.profile.expectedExpenses || 0),
      currentStage: this.profile.stage,
      nextRecommendedAction: this.determineNextAction(),
    };
  }
  
  // Determine next recommended action based on business state
  private determineNextAction(): string {
    // Priority logic based on business stage and missing information
    const missingCriticalInfo = this.getMissingCriticalInfo();
    
    if (missingCriticalInfo.length > 0) {
      return `Complete: ${missingCriticalInfo[0]}`;
    }
    
    // Stage-specific recommendations
    switch (this.profile.stage) {
      case 'idea':
        return 'Validate business idea with potential customers';
      case 'startup':
        return 'Focus on cash flow and first customer acquisition';
      case 'growing':
        return 'Consider automation and hiring for expansion';
      case 'mature':
        return 'Optimize margins and explore scaling opportunities';
      default:
        return 'Define business stage for tailored recommendations';
    }
  }
  
  // Get missing critical information
  private getMissingCriticalInfo(): string[] {
    const missing: string[] = [];
    
    if (!this.profile.industry) missing.push('industry');
    if (!this.profile.location) missing.push('location');
    if (!this.profile.businessModel) missing.push('business model');
    if (!this.profile.stage) missing.push('business stage');
    if (this.profile.openingCapital === undefined) missing.push('capital');
    
    return missing;
  }
  
  // Detect business stage from available data
  detectBusinessStage(): 'idea' | 'startup' | 'growing' | 'mature' {
    const hasSales = this.profile.expectedIncome && this.profile.expectedIncome > 0;
    const hasStaff = this.profile.staffCount && this.profile.staffCount > 0;
    const hasMultipleProducts = this.profile.products && this.profile.products.length > 1;
    const hasCustomers = this.profile.customers && this.profile.customers.length > 0;
    const hasSuppliers = this.profile.suppliers && this.profile.suppliers.length > 0;
    
    if (!hasSales) return 'idea';
    if (hasSales && !hasStaff && !hasMultipleProducts) return 'startup';
    if (hasSales && (hasStaff || hasMultipleProducts) && !hasCustomers) return 'growing';
    return 'mature';
  }
  
  // Get stage-specific advice
  getStageSpecificAdvice(): string {
    const stage = this.detectBusinessStage();
    
    switch (stage) {
      case 'idea':
        return `Focus on:
• Validating your business idea with potential customers
• Understanding your target market and their needs
• Researching competitors and market gaps
• Estimating startup costs and pricing
• Creating a minimum viable product or service
• Testing demand before full investment`;
        
      case 'startup':
        return `Focus on:
• Cash flow management - track every naira
• First customer acquisition and retention
• Operational efficiency and processes
• Product/service refinement based on feedback
• Building initial supplier relationships
• Establishing basic financial tracking`;
        
      case 'growing':
        return `Focus on:
• Automating repetitive tasks and processes
• Hiring and training staff effectively
• Expanding product/service offerings
• Improving profit margins
• Building customer loyalty programs
• Scaling successful operations`;
        
      case 'mature':
        return `Focus on:
• Operational efficiency and cost optimization
• Margin improvement across all products/services
• Exploring new markets or locations
• Diversifying revenue streams
• Strategic partnerships and alliances
• Long-term sustainability planning`;
        
      default:
        return 'Define your business stage for tailored advice';
    }
  }
  
  // Get stage-specific KPIs to track
  getStageSpecificKPIs(): string[] {
    const stage = this.detectBusinessStage();
    
    switch (stage) {
      case 'idea':
        return [
          'Customer validation rate',
          'Market research completion',
          'Startup cost accuracy',
          'Pricing validation',
          'MVP completion status',
        ];
        
      case 'startup':
        return [
          'Daily cash balance',
          'Customer acquisition cost',
          'Revenue per customer',
          'Operating expenses ratio',
          'Cash burn rate',
        ];
        
      case 'growing':
        return [
          'Revenue growth rate',
          'Profit margin by product',
          'Customer retention rate',
          'Staff productivity',
          'Inventory turnover',
        ];
        
      case 'mature':
        return [
          'ROI by business unit',
          'Market share growth',
          'Customer lifetime value',
          'Operating margin',
          'Return on assets',
        ];
        
      default:
        return [];
    }
  }
  
  // Get industry-specific intelligence
  getIndustryIntelligence(): string {
    switch (this.profile.industry?.toLowerCase()) {
      case 'retail':
        return 'Focus on: fast moving inventory, dead stock, reorder points, margin optimization';
      case 'restaurant':
        return 'Focus on: food cost, wastage, recipe costing, menu engineering, peak hours';
      case 'manufacturing':
        return 'Focus on: production cost, yield, capacity, downtime';
      case 'plastic recycling':
        return 'Focus on: PET grades, color separation, moisture, yield loss, processing stages, buyers, export quality';
      case 'agriculture':
        return 'Focus on: seasons, inputs, yield, harvest planning';
      case 'construction':
        return 'Focus on: project costing, materials, labour';
      default:
        return 'General business intelligence applied';
    }
  }
  
  // Check if information is already known
  knowsInformation(key: string): boolean {
    return this.profile.learnedInfo?.[key] !== undefined;
  }
  
  // Get known information
  getKnownInformation(key: string): any {
    return this.profile.learnedInfo?.[key];
  }
  
  // Get full profile
  getProfile(): BusinessProfile {
    return { ...this.profile };
  }
  
  // Reset profile (for new conversations)
  reset(): void {
    this.profile = {};
  }
}

// Singleton instance
let profileManagerInstance: BusinessProfileManager | null = null;

export function getBusinessProfileManager(): BusinessProfileManager {
  if (!profileManagerInstance) {
    profileManagerInstance = new BusinessProfileManager();
  }
  return profileManagerInstance;
}
