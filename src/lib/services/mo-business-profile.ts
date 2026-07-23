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
    return {};
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
    console.log('📊 [Profile Manager] updateWithFullData called with keys:', Object.keys(data));
    
    // Update snapshot with actual business data
    if (data.businessSnapshot) {
      this.snapshot = {
        ...this.snapshot,
        ...data.businessSnapshot,
      };
      console.log('📊 [Profile Manager] Updated with businessSnapshot');
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
      console.log('📊 [Profile Manager] Calculated sales totals:', { totalSales, totalProfit, recordCount: data.sales.length });
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
      console.log('📊 [Profile Manager] Calculated inventory counts:', { lowStockCount, outOfStockCount, productCount: data.products.length });
    }
    
    // Process expense data with robust field mapping
    if (data.expenses && Array.isArray(data.expenses)) {
      const totalExpenses = data.expenses.reduce((sum: number, expense: any) => {
        const amount = parseFloat(expense.amount) || parseFloat(expense.total) || 0;
        return sum + amount;
      }, 0);
      this.snapshot.totalExpenses = totalExpenses;
      console.log('📊 [Profile Manager] Calculated total expenses:', { totalExpenses, recordCount: data.expenses.length });
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
    
    console.log('📊 [Profile Manager] Final snapshot keys:', Object.keys(this.snapshot));
  }

  reset() {
    this.profile = null;
    this.snapshot = {};
  }
}

export function getProfileManager(businessId: string): BusinessProfileManager {
  return new BusinessProfileManager(businessId);
}

export const getBusinessProfileManager = getProfileManager;
