import { getDoc, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { isAdmin } from './adminAuth';
import { 
  getProOnlyFeatures, 
  getStandardOrProFeatures, 
  getCreditLayerEligibleFeatures,
  Plan,
  BusinessCategory,
  checkFeatureAccess as checkRegistryAccess,
} from './featureRegistry';

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

// Legacy feature name mapping for backward compatibility
const FEATURE_NAME_MAP: Record<string, string> = {
  'bankAccounts': 'bank-accounts',
  'auditTrail': 'audit-trail',
  'staffActivity': 'staff-activity-tracking',
  'multiLocation': 'multi-branch-support',
  'cashFlow': 'cashflow-tracking',
  'creditTracking': 'credit-tracking',
  'menuManagement': 'menu-management',
  'ingredientTracking': 'ingredient-tracking',
  'multiBranchSupport': 'multi-branch-support',
  'expiryAlerts': 'expiry-alerts',
  'productionTracking': 'production-tracking',
  'payrollManagement': 'payroll-management',
  'ecommerceStorefront': 'ecommerce-storefront',
  // Onboarding feature names
  'Supplier Management': 'supplier-management',
  'Warehouse Management': 'warehouse-management',
  'Credit Tracking': 'credit-tracking',
  'Menu Management': 'menu-management',
  'Ingredient Tracking': 'ingredient-tracking',
  'Expiry Alerts': 'expiry-alerts',
  'Multi-branch Support': 'multi-branch-support',
  'Production Tracking': 'production-tracking',
  'Payroll Management': 'payroll-management',
  'E-commerce Storefront': 'ecommerce-storefront',
};

// Get Pro-only features from registry (for backward compatibility)
const PRO_ONLY_FEATURES = getProOnlyFeatures().map(f => f.id);

// Get Standard-or-Pro features from registry (for backward compatibility)
const STANDARD_OR_PRO_FEATURES = getStandardOrProFeatures().map(f => f.id);

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
 * Normalize feature name to registry format
 */
function normalizeFeatureName(feature: string): string {
  // Check if it's already in registry format (kebab-case)
  if (feature.includes('-')) return feature;
  
  // Map legacy camelCase to kebab-case
  return FEATURE_NAME_MAP[feature] || feature.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Normalize business category to registry format
 */
function normalizeBusinessCategory(businessType?: string): BusinessCategory {
  if (!businessType) return 'other';
  
  const normalized = businessType.toLowerCase();
  
  const categoryMap: Record<string, BusinessCategory> = {
    'retail': 'retail',
    'shop': 'retail',
    'restaurant': 'restaurant',
    'food service': 'restaurant',
    'grocery': 'grocery',
    'fashion': 'fashion',
    'electronics': 'electronics',
    'manufacturing': 'manufacturing',
    'manufacturer': 'manufacturing',
    'services': 'services',
    'pharmacy': 'pharmacy',
    'supermarket': 'supermarket',
    'cafe': 'cafe',
    'wholesale': 'wholesale',
    'whole seller': 'wholesale',
    'big retailer': 'retail',
    'distributor': 'distributor',
    'healthcare': 'healthcare',
    'education': 'education',
  };
  
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'other';
}

/**
 * Normalize plan to registry format
 */
function normalizePlan(plan?: string): Plan {
  if (!plan) return 'starter';
  const normalized = plan.toLowerCase();
  if (normalized.includes('pro')) return 'pro';
  if (normalized.includes('standard')) return 'standard';
  return 'starter';
}

/**
 * Check if a user has access to a specific feature
 * Now uses the centralized feature registry for consistent access control
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
    const plan = normalizePlan(userData?.plan);
    const businessCategory = normalizeBusinessCategory(userData?.category || userData?.businessType);
    const subscriptionStatus = userData?.subscriptionStatus;
    const trialEndDate = userData?.trialEndDate?.toDate();
    const selectedFeatures = userData?.selectedFeatures || [];
    const lifetimeAccess = userData?.lifetimeAccess;
    const now = new Date();

    // Users with lifetime access have unlimited feature access
    if (lifetimeAccess === true) {
      return { eligible: true };
    }

    // Check if user is in trial mode
    const isInTrial = subscriptionStatus === 'trial' && trialEndDate && trialEndDate > now;

    // Normalize feature name to registry format
    const normalizedFeature = normalizeFeatureName(feature);

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

    // Use registry-based access check
    const enabledFeatures = new Set<string>(
      selectedFeatures.map((f: string) => normalizeFeatureName(f))
    );
    
    const registryResult = checkRegistryAccess(
      normalizedFeature,
      plan,
      businessCategory,
      enabledFeatures
    );

    if (!registryResult.eligible) {
      // Convert registry result to legacy format
      const result: FeatureRestrictionResult = {
        eligible: false,
        reason: registryResult.reason,
      };
      
      if (registryResult.requiresUpgrade) {
        if (registryResult.requiredPlan === 'pro') {
          result.requiresPro = true;
        } else {
          result.requiresStandardOrPro = true;
        }
      }
      
      return result;
    }
    
    // Legacy credit layer check (for backward compatibility)
    if (feature === 'creditLayer' && !isCreditLayerEligible(businessCategory)) {
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
