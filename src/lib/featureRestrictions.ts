import { getDoc, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { isAdmin } from './adminAuth';

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
  'auditTrail',
  'staffActivity',
  'multiLocation',
  'productionTracking',
  'payrollManagement',
  'ecommerceStorefront',
];

// Features that require Standard or Pro plan (not available to starters)
const STANDARD_OR_PRO_FEATURES = [
  'cashFlow',
  'creditTracking',
  'menuManagement',
  'ingredientTracking',
  'multiBranchSupport',
  'expiryAlerts',
];

// Feature name mapping for onboarding selections
const FEATURE_NAME_MAP: Record<string, string> = {
  'bankAccounts': 'Bank Accounts Integration',
  'auditTrail': 'Audit Trail',
  'staffActivity': 'Staff Activity Tracking',
  'multiLocation': 'Multi-branch Support',
  'cashFlow': 'Cash Flow Tracking',
  'creditTracking': 'Credit Tracking',
  'menuManagement': 'Menu Management',
  'ingredientTracking': 'Ingredient Tracking',
  'multiBranchSupport': 'Multi-branch Support',
  'expiryAlerts': 'Expiry Alerts',
  'productionTracking': 'Production Tracking',
  'payrollManagement': 'Payroll Management',
  'ecommerceStorefront': 'E-commerce Storefront',
  // Onboarding feature names
  'Supplier Management': 'supplierManagement',
  'Warehouse Management': 'warehouseManagement',
  'Credit Tracking': 'creditTracking',
  'Menu Management': 'menuManagement',
  'Ingredient Tracking': 'ingredientTracking',
  'Expiry Alerts': 'expiryAlerts',
  'Multi-branch Support': 'multiBranchSupport',
  'Production Tracking': 'productionTracking',
  'Payroll Management': 'payrollManagement',
  'E-commerce Storefront': 'ecommerceStorefront',
};

export interface FeatureRestrictionResult {
  eligible: boolean;
  reason?: string;
  requiresPro?: boolean;
  requiresStandardOrPro?: boolean;
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
 * Check if a feature requires Standard or Pro plan (not available to starters)
 */
export function requiresStandardOrProPlan(feature: string): boolean {
  return STANDARD_OR_PRO_FEATURES.includes(feature);
}

/**
 * Check if a user has access to a specific feature
 */
export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<FeatureRestrictionResult> {
  try {
    // Admin users have unlimited access to all features
    const isUserAdmin = await isAdmin();
    if (isUserAdmin) {
      return { eligible: true };
    }

    const { firestore } = initializeFirebase();
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (!userDoc.exists()) {
      return { eligible: false, reason: 'User not found' };
    }
    
    const userData = userDoc.data();
    const plan = userData?.plan || 'starter';
    const businessType = userData?.category || userData?.businessType;
    const subscriptionStatus = userData?.subscriptionStatus;
    const trialEndDate = userData?.trialEndDate?.toDate();
    const selectedFeatures = userData?.selectedFeatures || [];
    const now = new Date();

    // Check if user is in trial mode
    const isInTrial = subscriptionStatus === 'trial' && trialEndDate && trialEndDate > now;

    // If in trial, check if feature is in selected features
    if (isInTrial) {
      // Map feature names to selected feature names
      const selectedFeatureName = FEATURE_NAME_MAP[feature] || feature;
      
      // If feature is in selected features, allow access during trial
      if (selectedFeatures.includes(selectedFeatureName)) {
        return { eligible: true };
      }
      
      // If not in selected features, fall back to plan-based restrictions
    }

    // Check if feature requires Standard or Pro plan (not available to starters)
    if (requiresStandardOrProPlan(feature) && plan === 'starter') {
      return {
        eligible: false,
        reason: 'This feature requires a Standard or Pro plan',
        requiresStandardOrPro: true
      };
    }

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
