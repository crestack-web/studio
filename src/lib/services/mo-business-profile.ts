import { getFirestore, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Business profile management for MO
export async function getBusinessProfile(businessId: string): Promise<any> {
  try {
    const { firestore } = initializeFirebase();
    const businessDoc = await getDoc(doc(firestore, 'businesses', businessId));
    
    if (businessDoc.exists()) {
      return {
        businessId: businessDoc.id,
        ...businessDoc.data(),
        createdAt: businessDoc.data().createdAt?.toDate(),
        updatedAt: businessDoc.data().updatedAt?.toDate()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return null;
  }
}

export async function updateBusinessProfile(businessId: string, profile: any): Promise<void> {
  try {
    const { firestore } = initializeFirebase();
    const businessDoc = doc(firestore, 'businesses', businessId);
    await updateDoc(businessDoc, {
      ...profile,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating business profile:', error);
  }
}

// Define the BusinessProfile interface
export interface BusinessProfile {
  businessId: string;
  businessName: string;
  businessType: string;
  industry: string;
  size: 'small' | 'medium' | 'large';
  location: string;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessSnapshot {
  openingCapital?: number;
  expectedIncome?: number;
  expectedExpenses?: number;
  totalSales?: number;
  totalProfit?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  [key: string]: any;
}

export interface IndustryIntelligence {
  [key: string]: any;
}

export class BusinessProfileManager {
  private profile: BusinessProfile | null = null;
  private snapshot: BusinessSnapshot = {};

  constructor(private businessId: string) {}

  async loadProfile() {
    this.profile = await getBusinessProfile(this.businessId);
    return this.profile;
  }

  getProfile(): BusinessProfile | null {
    return this.profile;
  }

  getSnapshot(): BusinessSnapshot {
    return this.snapshot;
  }

  getIndustryIntelligence(): IndustryIntelligence {
    const industry = this.profile?.industry;
    if (!industry) return {};

    const intelligenceMap: Record<string, string> = {
      retail: 'Fast-moving inventory, dead stock tracking, reorder points, margin optimization, seasonal trends',
      restaurant: 'Food cost percentage, wastage tracking, recipe costing, menu engineering, peak hour analysis',
      wholesale: 'Bulk pricing tiers, distribution logistics, credit management, volume discounts, warehouse efficiency',
      service: 'Service utilization rates, appointment scheduling, labor costs, customer retention, service bundling',
      manufacturing: 'Production cost per unit, yield tracking, capacity utilization, downtime analysis, raw material sourcing',
      ecommerce: 'Conversion rates, cart abandonment, shipping costs, return rates, digital marketing ROI',
      agriculture: 'Seasonal cycles, input costs, yield optimization, harvest timing, storage and preservation',
      recycling: 'Material grades, collection networks, processing yields, buyer pricing, quality sorting',
      construction: 'Project costing, material wastage, labor productivity, milestone tracking, subcontractor management',
    };

    const key = industry.toLowerCase();
    return {
      tips: intelligenceMap[key] || 'General business intelligence: cash flow management, inventory optimization, customer retention',
      industry,
    };
  }

  async saveProfile(profile: Partial<BusinessProfile>) {
    if (!this.profile) {
      throw new Error('Profile not loaded');
    }
    this.profile = { ...this.profile, ...profile, updatedAt: new Date() };
    await updateBusinessProfile(this.businessId, this.profile);
    return this.profile;
  }

  async updateFromMessage(message: string, _context?: any): Promise<void> {
    // Placeholder implementation
    return Promise.resolve();
  }

  async updateWithFullData(data: any): Promise<void> {
    
    // Update snapshot with actual business data
    if (data.businessSnapshot) {
      this.snapshot = {
        ...this.snapshot,
        ...data.businessSnapshot,
      };
    }
    
    // Process sales data with robust field mapping
    if (data.sales && Array.isArray(data.sales)) {
      const totalSales = data.sales.reduce((sum: number, sale: any) => {
        const amount = parseFloat(sale.totalRevenue) || parseFloat(sale.total) || parseFloat(sale.amount) || 0;
        return sum + amount;
      }, 0);
      
      const totalProfit = data.sales.reduce((sum: number, sale: any) => {
        const profit = parseFloat(sale.profit) || 0;
        return sum + profit;
      }, 0);
      
      this.snapshot.totalSales = totalSales;
      this.snapshot.totalProfit = totalProfit;
    }
    
    // Process products data with robust field mapping
    if (data.products && Array.isArray(data.products)) {
      const lowStockCount = data.products.filter((p: any) => {
        const stock = parseFloat(p.stock) || parseFloat(p.quantity) || 0;
        const threshold = parseFloat(p.lowStockThreshold) || parseFloat(p.reorderLevel) || 10;
        return stock > 0 && stock <= threshold;
      }).length;
      
      const outOfStockCount = data.products.filter((p: any) => {
        const stock = parseFloat(p.stock) || parseFloat(p.quantity) || 0;
        return stock === 0;
      }).length;
      
      this.snapshot.lowStockCount = lowStockCount;
      this.snapshot.outOfStockCount = outOfStockCount;
    }
    
    // Process expense data with robust field mapping
    if (data.expenses && Array.isArray(data.expenses)) {
      const totalExpenses = data.expenses.reduce((sum: number, expense: any) => {
        const amount = parseFloat(expense.amount) || parseFloat(expense.total) || 0;
        return sum + amount;
      }, 0);
      this.snapshot.totalExpenses = totalExpenses;
    }
    
    // Update pre-calculated values if provided
    if (data.totalSales !== undefined) {
      this.snapshot.totalSales = data.totalSales;
    }
    if (data.totalProfit !== undefined) {
      this.snapshot.totalProfit = data.totalProfit;
    }
    if (data.todaySales !== undefined) {
      this.snapshot.todaySales = data.todaySales;
    }
    if (data.todayProfit !== undefined) {
      this.snapshot.todayProfit = data.todayProfit;
    }
    if (data.lowStockCount !== undefined) {
      this.snapshot.lowStockCount = data.lowStockCount;
    }
    if (data.outOfStockCount !== undefined) {
      this.snapshot.outOfStockCount = data.outOfStockCount;
    }
    if (data.openingCapital !== undefined) {
      this.snapshot.openingCapital = data.openingCapital;
    }
    if (data.cashAvailable !== undefined) {
      this.snapshot.cashAvailable = data.cashAvailable;
    }
  }

  reset() {
    this.profile = null;
    this.snapshot = {};
  }
}

// Singleton cache: one manager per businessId so reset() actually clears the right instance
const profileManagerCache = new Map<string, BusinessProfileManager>();

export function getProfileManager(businessId: string): BusinessProfileManager {
  let manager = profileManagerCache.get(businessId);
  if (!manager) {
    manager = new BusinessProfileManager(businessId);
    profileManagerCache.set(businessId, manager);
  }
  return manager;
}

export const getBusinessProfileManager = getProfileManager;
