// ═══════════════════════════════════════════
//  BUSMO — Business Category Feature Bundles
//  Maps business categories to recommended feature sets
// ═══════════════════════════════════════════

import { BusinessCategory, FEATURE_REGISTRY, Feature } from './featureRegistry';

export interface CategoryFeatureBundle {
  category: BusinessCategory;
  name: string;
  description: string;
  recommendedFeatures: string[];
  essentialFeatures: string[];
  optionalFeatures: string[];
  recommendedPlan: 'starter' | 'standard' | 'pro';
}

export const CATEGORY_FEATURE_BUNDLES: Record<BusinessCategory, CategoryFeatureBundle> = {
  retail: {
    category: 'retail',
    name: 'Retail Shop',
    description: 'General retail operations with inventory and sales tracking',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'reports-analytics', 'statement-history', 'staff-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'supplier-management', 'customer-management', 'multi-branch-support'],
    recommendedPlan: 'standard',
  },
  restaurant: {
    category: 'restaurant',
    name: 'Restaurant',
    description: 'Food service with menu management and ingredient tracking',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'menu-management', 'ingredient-tracking', 'expiry-alerts', 'reports-analytics', 'statement-history', 'staff-management', 'ask-mo-ai-assistant', 'supplier-management', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'menu-management', 'ingredient-tracking'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'staff-activity-tracking', 'customer-management'],
    recommendedPlan: 'standard',
  },
  grocery: {
    category: 'grocery',
    name: 'Grocery Store',
    description: 'Food retail with expiry tracking and inventory management',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'expiry-alerts', 'reports-analytics', 'statement-history', 'staff-management', 'ask-mo-ai-assistant', 'supplier-management', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'expiry-alerts'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'supplier-management', 'customer-management'],
    recommendedPlan: 'standard',
  },
  fashion: {
    category: 'fashion',
    name: 'Fashion',
    description: 'Clothing retail with variants and size management',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'reports-analytics', 'statement-history', 'staff-management', 'ask-mo-ai-assistant', 'supplier-management', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'customer-management'],
    recommendedPlan: 'standard',
  },
  electronics: {
    category: 'electronics',
    name: 'Electronics',
    description: 'Electronics retail with warranty tracking',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'reports-analytics', 'statement-history', 'staff-management', 'ask-mo-ai-assistant', 'supplier-management', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'customer-management'],
    recommendedPlan: 'standard',
  },
  manufacturing: {
    category: 'manufacturing',
    name: 'Manufacturing',
    description: 'Production and raw materials management',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'production-tracking', 'reports-analytics', 'statement-history', 'staff-management', 'supplier-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'production-tracking', 'supplier-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'warehouse-management', 'stock-transfers'],
    recommendedPlan: 'pro',
  },
  services: {
    category: 'services',
    name: 'Services',
    description: 'Service-based businesses with appointment tracking',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'expense-management', 'reports-analytics', 'statement-history', 'staff-management', 'ask-mo-ai-assistant', 'customer-management', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'expense-management', 'staff-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking'],
    recommendedPlan: 'starter',
  },
  pharmacy: {
    category: 'pharmacy',
    name: 'Pharmacy',
    description: 'Medical retail with expiry and batch tracking',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'expiry-alerts', 'reports-analytics', 'statement-history', 'staff-management', 'supplier-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'expiry-alerts', 'supplier-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'customer-management'],
    recommendedPlan: 'standard',
  },
  supermarket: {
    category: 'supermarket',
    name: 'Supermarket',
    description: 'Large retail with multi-branch support',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'expiry-alerts', 'reports-analytics', 'statement-history', 'staff-management', 'multi-branch-support', 'warehouse-management', 'stock-transfers', 'supplier-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'multi-branch-support', 'warehouse-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'customer-management'],
    recommendedPlan: 'pro',
  },
  cafe: {
    category: 'cafe',
    name: 'Cafe',
    description: 'Coffee shop with menu and ingredient tracking',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'menu-management', 'ingredient-tracking', 'expiry-alerts', 'reports-analytics', 'statement-history', 'staff-management', 'ask-mo-ai-assistant', 'supplier-management', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'menu-management', 'ingredient-tracking'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'customer-management'],
    recommendedPlan: 'standard',
  },
  wholesale: {
    category: 'wholesale',
    name: 'Wholesale',
    description: 'Bulk distribution with credit tracking',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'credit-tracking', 'reports-analytics', 'statement-history', 'staff-management', 'multi-branch-support', 'supplier-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'credit-tracking', 'supplier-management'],
    optionalFeatures: ['cashflow-tracking', 'warehouse-management', 'stock-transfers', 'customer-management'],
    recommendedPlan: 'standard',
  },
  distributor: {
    category: 'distributor',
    name: 'Distributor',
    description: 'Distribution network with multi-branch support',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'credit-tracking', 'reports-analytics', 'statement-history', 'staff-management', 'multi-branch-support', 'warehouse-management', 'stock-transfers', 'supplier-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'credit-tracking', 'multi-branch-support', 'warehouse-management'],
    optionalFeatures: ['cashflow-tracking', 'customer-management', 'money-control'],
    recommendedPlan: 'pro',
  },
  healthcare: {
    category: 'healthcare',
    name: 'Healthcare',
    description: 'Medical services with patient management',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'expense-management', 'reports-analytics', 'statement-history', 'staff-management', 'customer-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'expense-management', 'staff-management', 'customer-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking'],
    recommendedPlan: 'standard',
  },
  education: {
    category: 'education',
    name: 'Education',
    description: 'Educational institutions with fee tracking',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'expense-management', 'reports-analytics', 'statement-history', 'staff-management', 'customer-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'expense-management', 'staff-management', 'customer-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking'],
    recommendedPlan: 'standard',
  },
  jobs: {
    category: 'jobs',
    name: 'Jobs & Projects',
    description: 'Project-based work with costs, payments, materials and margins',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'expense-management', 'jobs-management', 'reports-analytics', 'statement-history', 'staff-management', 'customer-management', 'supplier-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'expense-management', 'jobs-management', 'customer-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'supplier-management'],
    recommendedPlan: 'standard',
  },
  recycling_material_collection: {
    category: 'recycling_material_collection',
    name: 'Recycling & Material Collection',
    description: 'Buy recyclable materials by weight from suppliers (PET, HDPE, aluminium, etc.)',
    recommendedFeatures: ['expense-management', 'material-collection', 'supplier-management', 'cashflow-tracking', 'reports-analytics', 'statement-history', 'staff-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['expense-management', 'material-collection', 'supplier-management'],
    optionalFeatures: ['cashflow-tracking', 'staff-management'],
    recommendedPlan: 'starter',
  },
  other: {
    category: 'other',
    name: 'Other',
    description: 'Catch-all for other business types',
    recommendedFeatures: ['sales-recording', 'multi-payment', 'inventory-tracking', 'expense-management', 'reports-analytics', 'statement-history', 'staff-management', 'ask-mo-ai-assistant', 'access-capital', 'referrals', 'business-services'],
    essentialFeatures: ['sales-recording', 'multi-payment', 'expense-management'],
    optionalFeatures: ['cashflow-tracking', 'credit-tracking', 'supplier-management', 'customer-management'],
    recommendedPlan: 'starter',
  },
};

export function getCategoryBundle(category: BusinessCategory): CategoryFeatureBundle {
  return CATEGORY_FEATURE_BUNDLES[category] || CATEGORY_FEATURE_BUNDLES.other;
}

export function getRecommendedFeatures(category: BusinessCategory): Feature[] {
  const bundle = getCategoryBundle(category);
  return bundle.recommendedFeatures
    .map(featureId => FEATURE_REGISTRY[featureId])
    .filter((f): f is Feature => f !== undefined);
}

export function getEssentialFeatures(category: BusinessCategory): Feature[] {
  const bundle = getCategoryBundle(category);
  return bundle.essentialFeatures
    .map(featureId => FEATURE_REGISTRY[featureId])
    .filter((f): f is Feature => f !== undefined);
}

export function getOptionalFeatures(category: BusinessCategory): Feature[] {
  const bundle = getCategoryBundle(category);
  return bundle.optionalFeatures
    .map(featureId => FEATURE_REGISTRY[featureId])
    .filter((f): f is Feature => f !== undefined);
}

export function getRecommendedPlan(category: BusinessCategory): 'starter' | 'standard' | 'pro' {
  return getCategoryBundle(category).recommendedPlan;
}

export function isFeatureRecommendedForCategory(featureId: string, category: BusinessCategory): boolean {
  return getCategoryBundle(category).recommendedFeatures.includes(featureId);
}

export function isFeatureEssentialForCategory(featureId: string, category: BusinessCategory): boolean {
  return getCategoryBundle(category).essentialFeatures.includes(featureId);
}

export function getAllCategoryBundles(): CategoryFeatureBundle[] {
  return Object.values(CATEGORY_FEATURE_BUNDLES);
}
