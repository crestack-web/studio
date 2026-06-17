import { getDoc, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// Business types that are eligible for the credit layer
const CREDIT_LAYER_ELIGIBLE_TYPES = [
  'Wholesale',
  'Retail',
  'Whole Seller',
  'Big Retailer',
  'Manufacturer',
  'Distributor',
];

// Business types that are NOT eligible for the credit layer
const CREDIT_LAYER_EXCLUDED_TYPES = [
  'Supermarket',
  'Pharmacy',
  'Restaurant',
  'Cafe',
  'Food Service',
  'Healthcare',
];

// Features that require Pro plan
const PRO_ONLY_FEATURES = [
  'bankAccounts',
  'cashFlow',
  'auditTrail',
  'staffActivity',
  'multiLocation',
];

export interface FeatureRestrictionResult {
  eligible: boolean;
  reason?: string;
  requiresPro?: boolean;
}

/**
 * Check if a business type is eligible for the credit layer
 */
export function isCreditLayerEligible(businessType?: string): boolean {
  if (!businessType) return false;
  
  const normalizedType = businessType.toLowerCase();
  
  // Check if explicitly excluded
  if (CREDIT_LAYER_EXCLUDED_TYPES.some(type => 
    normalizedType.includes(type.toLowerCase())
  )) {
    return false;
  }
  
  // Check if explicitly eligible
  if (CREDIT_LAYER_ELIGIBLE_TYPES.some(type => 
    normalizedType.includes(type.toLowerCase())
  )) {
    return true;
  }
  
  return false;
}

/**
 * Check if a feature requires Pro plan
 */
export function requiresProPlan(feature: string): boolean {
  return PRO_ONLY_FEATURES.includes(feature);
}

/**
 * Check if a user has access to a specific feature
 */
export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<FeatureRestrictionResult> {
  try {
    const { firestore } = initializeFirebase();
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      return { eligible: false, reason: 'User not found' };
    }
    
    const userData = userDoc.data();
    const plan = userData?.plan || 'starter';
    const businessType = userData?.category || userData?.businessType;
    
    // Check if feature requires Pro plan
    if (requiresProPlan(feature) && plan !== 'pro') {
      return { 
        eligible: false, 
        reason: 'This feature requires a Pro plan',
        requiresPro: true 
      };
    }
    
    // Check if credit layer feature
    if (feature === 'creditLayer' && !isCreditLayerEligible(businessType)) {
      return { 
        eligible: false, 
        reason: 'Credit layer is available for wholesale and retail businesses only' 
      };
    }
    
    return { eligible: true };
  } catch (error) {
    console.error('Error checking feature access:', error);
    return { eligible: false, reason: 'Error checking access' };
  }
}

/**
 * Get user's plan
 */
export async function getUserPlan(userId: string): Promise<string> {
  try {
    const { firestore } = initializeFirebase();
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      return 'starter';
    }
    
    return userDoc.data()?.plan || 'starter';
  } catch (error) {
    console.error('Error getting user plan:', error);
    return 'starter';
  }
}

/**
 * Get business type
 */
export async function getBusinessType(userId: string): Promise<string> {
  try {
    const { firestore } = initializeFirebase();
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      return 'Other';
    }
    
    return userDoc.data()?.category || userDoc.data()?.businessType || 'Other';
  } catch (error) {
    console.error('Error getting business type:', error);
    return 'Other';
  }
}
