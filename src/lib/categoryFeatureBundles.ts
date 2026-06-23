// ═══════════════════════════════════════════
//  BUSMO — Business Category Feature Bundles
//  Maps business categories to recommended feature sets
// ═══════════════════════════════════════════

import { BusinessCategory, FEATURE_REGISTRY, Feature } from './featureRegistry';

// ── Category Feature Bundle Definition ───────

export interface CategoryFeatureBundle {
  category: BusinessCategory;
  name: string;
  description: string;
  recommendedFeatures: string[]; // Feature IDs
  essentialFeatures: string[]; // Must-have features
  optionalFeatures: string[]; // Nice-to-have features
  recommendedPlan: 'starter' | 'standard' | 'pro';
}

// ── Category Feature Bundles ─────────────────

export const CATEGORY_FEATURE_BUNDLES: Record<BusinessCategory, CategoryFeatureBundle> = {
  retail: {
    category: 'retail',
    name: 'Retail Shop',
    description: 'General retail operations with inventory and sales tracking',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'ask-mo-ai-assistant',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'supplier-management',
      'customer-management',
      'multi-branch-support',
      'invoice-verification',
    ],
    recommendedPlan: 'standard',
  },

  restaurant: {
    category: 'restaurant',
    name: 'Restaurant',
    description: 'Food service with menu management and ingredient tracking',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'menu-management',
      'ingredient-tracking',
      'expiry-alerts',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'ask-mo-ai-assistant',
      'supplier-management',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'menu-management',
      'ingredient-tracking',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'staff-activity-tracking',
      'staff-accountability',
      'multi-branch-support',
      'customer-management',
    ],
    recommendedPlan: 'standard',
  },

  grocery: {
    category: 'grocery',
    name: 'Grocery Store',
    description: 'Food retail with expiry tracking and inventory management',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'expiry-alerts',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'ask-mo-ai-assistant',
      'supplier-management',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'expiry-alerts',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'supplier-management',
      'customer-management',
      'multi-branch-support',
    ],
    recommendedPlan: 'standard',
  },

  fashion: {
    category: 'fashion',
    name: 'Fashion',
    description: 'Clothing retail with variants and size management',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'ask-mo-ai-assistant',
      'supplier-management',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'customer-management',
      'ecommerce-storefront',
      'multi-branch-support',
      'email-campaigns',
    ],
    recommendedPlan: 'standard',
  },

  electronics: {
    category: 'electronics',
    name: 'Electronics',
    description: 'Electronics retail with warranty tracking',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'ask-mo-ai-assistant',
      'supplier-management',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'customer-management',
      'ecommerce-storefront',
      'multi-branch-support',
      'invoice-verification',
    ],
    recommendedPlan: 'standard',
  },

  manufacturing: {
    category: 'manufacturing',
    name: 'Manufacturing',
    description: 'Production and raw materials management',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'production-tracking',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'supplier-management',
      'ask-mo-ai-assistant',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'production-tracking',
      'supplier-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'warehouse-management',
      'stock-transfers',
      'staff-activity-tracking',
      'multi-branch-support',
    ],
    recommendedPlan: 'pro',
  },

  services: {
    category: 'services',
    name: 'Services',
    description: 'Service-based businesses with appointment tracking',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'expense-management',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'ask-mo-ai-assistant',
      'customer-management',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'expense-management',
      'staff-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'invoice-verification',
      'email-campaigns',
    ],
    recommendedPlan: 'starter',
  },

  pharmacy: {
    category: 'pharmacy',
    name: 'Pharmacy',
    description: 'Medical retail with expiry and batch tracking',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'expiry-alerts',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'supplier-management',
      'ask-mo-ai-assistant',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'expiry-alerts',
      'supplier-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'customer-management',
      'multi-branch-support',
      'audit-trail',
    ],
    recommendedPlan: 'standard',
  },

  supermarket: {
    category: 'supermarket',
    name: 'Supermarket',
    description: 'Large retail with multi-branch support',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'expiry-alerts',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'multi-branch-support',
      'warehouse-management',
      'stock-transfers',
      'supplier-management',
      'ask-mo-ai-assistant',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'multi-branch-support',
      'warehouse-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'customer-management',
      'staff-activity-tracking',
      'staff-accountability',
      'bank-accounts',
      'bank-reconciliation',
    ],
    recommendedPlan: 'pro',
  },

  cafe: {
    category: 'cafe',
    name: 'Cafe',
    description: 'Coffee shop with menu and ingredient tracking',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'menu-management',
      'ingredient-tracking',
      'expiry-alerts',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'ask-mo-ai-assistant',
      'supplier-management',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'menu-management',
      'ingredient-tracking',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'staff-activity-tracking',
      'customer-management',
    ],
    recommendedPlan: 'standard',
  },

  wholesale: {
    category: 'wholesale',
    name: 'Wholesale',
    description: 'Bulk distribution with credit tracking',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'credit-tracking',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'multi-branch-support',
      'supplier-management',
      'ask-mo-ai-assistant',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'credit-tracking',
      'supplier-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'warehouse-management',
      'stock-transfers',
      'customer-management',
      'invoice-verification',
      'money-control',
    ],
    recommendedPlan: 'standard',
  },

  distributor: {
    category: 'distributor',
    name: 'Distributor',
    description: 'Distribution network with multi-branch support',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'credit-tracking',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'multi-branch-support',
      'warehouse-management',
      'stock-transfers',
      'supplier-management',
      'ask-mo-ai-assistant',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'credit-tracking',
      'multi-branch-support',
      'warehouse-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'customer-management',
      'invoice-verification',
      'money-control',
      'bank-accounts',
      'bank-reconciliation',
    ],
    recommendedPlan: 'pro',
  },

  healthcare: {
    category: 'healthcare',
    name: 'Healthcare',
    description: 'Medical services with patient management',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'expense-management',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'customer-management',
      'ask-mo-ai-assistant',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'expense-management',
      'staff-management',
      'customer-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'invoice-verification',
      'audit-trail',
    ],
    recommendedPlan: 'standard',
  },

  education: {
    category: 'education',
    name: 'Education',
    description: 'Educational institutions with fee tracking',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'expense-management',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'customer-management',
      'ask-mo-ai-assistant',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'expense-management',
      'staff-management',
      'customer-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'invoice-verification',
      'email-campaigns',
    ],
    recommendedPlan: 'standard',
  },

  other: {
    category: 'other',
    name: 'Other',
    description: 'Catch-all for other business types',
    recommendedFeatures: [
      'sales-recording',
      'multi-payment',
      'inventory-tracking',
      'expense-management',
      'reports-analytics',
      'statement-history',
      'staff-management',
      'ask-mo-ai-assistant',
      'access-capital',
      'referrals',
      'business-services',
    ],
    essentialFeatures: [
      'sales-recording',
      'multi-payment',
      'expense-management',
    ],
    optionalFeatures: [
      'cashflow-tracking',
      'credit-tracking',
      'supplier-management',
      'customer-management',
    ],
    recommendedPlan: 'starter',
  },
};

// ── Helper Functions ───────────────────────

/**
 * Get feature bundle for category
 */
export function getCategoryBundle(category: BusinessCategory): CategoryFeatureBundle {
  return CATEGORY_FEATURE_BUNDLES[category] || CATEGORY_FEATURE_BUNDLES.other;
}

/**
 * Get recommended features for category
 */
export function getRecommendedFeatures(category: BusinessCategory): Feature[] {
  const bundle = getCategoryBundle(category);
  return bundle.recommendedFeatures
    .map(featureId => FEATURE_REGISTRY[featureId])
    .filter((f): f is Feature => f !== undefined);
}

/**
 * Get essential features for category
 */
export function getEssentialFeatures(category: BusinessCategory): Feature[] {
  const bundle = getCategoryBundle(category);
  return bundle.essentialFeatures
    .map(featureId => FEATURE_REGISTRY[featureId])
    .filter((f): f is Feature => f !== undefined);
}

/**
 * Get optional features for category
 */
export function getOptionalFeatures(category: BusinessCategory): Feature[] {
  const bundle = getCategoryBundle(category);
  return bundle.optionalFeatures
    .map(featureId => FEATURE_REGISTRY[featureId])
    .filter((f): f is Feature => f !== undefined);
}

/**
 * Get recommended plan for category
 */
export function getRecommendedPlan(category: BusinessCategory): 'starter' | 'standard' | 'pro' {
  const bundle = getCategoryBundle(category);
  return bundle.recommendedPlan;
}

/**
 * Check if feature is recommended for category
 */
export function isFeatureRecommendedForCategory(
  featureId: string,
  category: BusinessCategory
): boolean {
  const bundle = getCategoryBundle(category);
  return bundle.recommendedFeatures.includes(featureId);
}

/**
 * Check if feature is essential for category
 */
export function isFeatureEssentialForCategory(
  featureId: string,
  category: BusinessCategory
): boolean {
  const bundle = getCategoryBundle(category);
  return bundle.essentialFeatures.includes(featureId);
}

/**
 * Get all category bundles
 */
export function getAllCategoryBundles(): CategoryFeatureBundle[] {
  return Object.values(CATEGORY_FEATURE_BUNDLES);
}
