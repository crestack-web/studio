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

  constructor(private businessId: string) {}

  async loadProfile() {
    this.profile = await getBusinessProfile(this.businessId);
    return this.profile;
  }

  getProfile(): BusinessProfile | null {
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
    };
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
    // Placeholder implementation
    return Promise.resolve();
  }

  reset() {
    this.profile = null;
  }
}

export function getProfileManager(businessId: string): BusinessProfileManager {
  return new BusinessProfileManager(businessId);
}

export const getBusinessProfileManager = getProfileManager;
