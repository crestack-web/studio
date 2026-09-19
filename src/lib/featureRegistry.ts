// ═══════════════════════════════════════════
//  BUSMO — Centralized Feature Registry
//  Single source of truth for all feature access logic
// ═══════════════════════════════════════════

import { PageId } from '@/app/owner/dashboard/types';

export type Plan = 'starter' | 'standard' | 'pro';

export type BusinessCategory =
  | 'retail'
  | 'restaurant'
  | 'grocery'
  | 'fashion'
  | 'electronics'
  | 'manufacturing'
  | 'services'
  | 'pharmacy'
  | 'supermarket'
  | 'cafe'
  | 'wholesale'
  | 'distributor'
  | 'healthcare'
  | 'education'
  | 'jobs'
  | 'recycling_material_collection'
  | 'other';

export type FeatureCategory =
  | 'inventory'
  | 'sales'
  | 'analytics'
  | 'ai'
  | 'operations'
  | 'financial'
  | 'hr'
  | 'restaurant'
  | 'manufacturing'
  | 'ecommerce'
  | 'marketing';

export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: FeatureCategory;
  pageId?: PageId;
  requiredPlans: Plan[];
  excludedPlans?: Plan[];
  requiredCategories?: BusinessCategory[];
  excludedCategories?: BusinessCategory[];
  dependencies?: string[];
  isOptional: boolean;
  isProOnly: boolean;
  isStandardOrPro: boolean;
  isCreditLayerEligible?: boolean;
}

export interface FeatureAccessResult {
  eligible: boolean;
  reason?: string;
  requiresUpgrade?: boolean;
  requiredPlan?: Plan;
}

export const FEATURE_REGISTRY: Record<string, Feature> = {
  'inventory-tracking': {
    id: 'inventory-tracking',
    name: 'Inventory Tracking',
    description: 'Track stock levels, low stock alerts, and product management',
    icon: 'Package',
    category: 'inventory',
    pageId: 'inventory',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'warehouse-management': {
    id: 'warehouse-management',
    name: 'Warehouse Management',
    description: 'Multi-location stock tracking and warehouse operations',
    icon: 'Warehouse',
    category: 'inventory',
    pageId: 'warehouse',
    requiredPlans: ['pro'],
    isOptional: true,
    isProOnly: true,
    isStandardOrPro: false,
  },
  'stock-transfers': {
    id: 'stock-transfers',
    name: 'Stock Transfers',
    description: 'Transfer stock between locations and branches',
    icon: 'ArrowRightLeft',
    category: 'inventory',
    pageId: 'stock-transfers',
    requiredPlans: ['pro'],
    isOptional: true,
    isProOnly: true,
    isStandardOrPro: false,
  },
  'sales-recording': {
    id: 'sales-recording',
    name: 'Sales Recording',
    description: 'Record sales with multiple payment methods',
    icon: 'ShoppingCart',
    category: 'sales',
    pageId: 'sale',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: false,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'multi-payment': {
    id: 'multi-payment',
    name: 'Multi-Payment Support',
    description: 'Accept cash, transfer, POS, card, credit, and split payments',
    icon: 'CreditCard',
    category: 'sales',
    pageId: 'sale',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: false,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'reports-analytics': {
    id: 'reports-analytics',
    name: 'Reports & Analytics',
    description: 'Profit/loss reports, sales analytics, and business insights',
    icon: 'BarChart3',
    category: 'analytics',
    pageId: 'reports',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'cashflow-tracking': {
    id: 'cashflow-tracking',
    name: 'Cash Flow Tracking',
    description: 'Monitor cash inflows and outflows',
    icon: 'TrendingUp',
    category: 'analytics',
    pageId: 'cashflow',
    requiredPlans: ['standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: true,
  },
  'statement-history': {
    id: 'statement-history',
    name: 'Statement History',
    description: 'View all transaction history and statements',
    icon: 'FileText',
    category: 'analytics',
    pageId: 'statement',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'ask-mo-ai-assistant': {
    id: 'ask-mo-ai-assistant',
    name: 'Ask MO AI Assistant',
    description: 'AI-powered business intelligence and insights',
    icon: 'Bot',
    category: 'ai',
    pageId: 'mo',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'supplier-management': {
    id: 'supplier-management',
    name: 'Supplier Management',
    description: 'Manage suppliers, purchase orders, and stock receipts',
    icon: 'Truck',
    category: 'operations',
    pageId: 'supplier-management',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'multi-branch-support': {
    id: 'multi-branch-support',
    name: 'Multi-Branch Support',
    description: 'Manage multiple business locations',
    icon: 'Building2',
    category: 'operations',
    pageId: 'branches',
    requiredPlans: ['pro'],
    isOptional: true,
    isProOnly: true,
    isStandardOrPro: false,
  },
  'expense-management': {
    id: 'expense-management',
    name: 'Expense Management',
    description: 'Track and categorize business expenses',
    icon: 'Receipt',
    category: 'operations',
    pageId: 'expenses',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'credit-tracking': {
    id: 'credit-tracking',
    name: 'Credit Tracking',
    description: 'Track customer and supplier credit/debts',
    icon: 'UserCheck',
    category: 'financial',
    pageId: 'credit-tracking',
    requiredPlans: ['standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: true,
    isCreditLayerEligible: true,
  },
  'money-control': {
    id: 'money-control',
    name: 'Money Control',
    description: 'Track payments, bank collections, and cash reconciliation',
    icon: 'ShieldCheck',
    category: 'financial',
    pageId: 'money-control',
    requiredPlans: ['standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: true,
  },
  'bank-accounts': {
    id: 'bank-accounts',
    name: 'Bank Accounts',
    description: 'Connect and manage bank accounts',
    icon: 'Landmark',
    category: 'financial',
    pageId: 'bank-reconciliation',
    requiredPlans: ['standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: true,
  },
  'bank-reconciliation': {
    id: 'bank-reconciliation',
    name: 'Bank Reconciliation',
    description: 'Match bank transactions with sales',
    icon: 'RefreshCw',
    category: 'financial',
    pageId: 'bank-reconciliation',
    requiredPlans: ['standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: true,
  },
  'bank-statement-import': {
    id: 'bank-statement-import',
    name: 'Bank Statement Import',
    description: 'Import bank statements from CSV files',
    icon: 'Upload',
    category: 'financial',
    pageId: 'bank-statement-import',
    requiredPlans: ['standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: true,
  },
  'staff-management': {
    id: 'staff-management',
    name: 'Staff Management',
    description: 'Manage staff members, roles, and permissions',
    icon: 'Users',
    category: 'hr',
    pageId: 'staff',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'staff-activity-tracking': {
    id: 'staff-activity-tracking',
    name: 'Staff Activity Tracking',
    description: 'Monitor staff performance and activity logs',
    icon: 'Activity',
    category: 'hr',
    pageId: 'staff-activity',
    requiredPlans: ['pro'],
    isOptional: true,
    isProOnly: true,
    isStandardOrPro: false,
  },
  'staff-accountability': {
    id: 'staff-accountability',
    name: 'Staff Accountability',
    description: 'Track staff cash handling and reconciliation',
    icon: 'UserCheck2',
    category: 'hr',
    pageId: 'staff-accountability',
    requiredPlans: ['standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: true,
  },
  'payroll-management': {
    id: 'payroll-management',
    name: 'Payroll Management',
    description: 'Manage payroll and salary payments',
    icon: 'DollarSign',
    category: 'hr',
    pageId: 'payroll',
    requiredPlans: ['pro'],
    isOptional: true,
    isProOnly: true,
    isStandardOrPro: false,
  },
  'menu-management': {
    id: 'menu-management',
    name: 'Menu Management',
    description: 'Create and manage restaurant menus',
    icon: 'Menu',
    category: 'restaurant',
    pageId: 'menu-management',
    requiredPlans: ['standard', 'pro'],
    requiredCategories: ['restaurant', 'cafe'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: true,
  },
  'ingredient-tracking': {
    id: 'ingredient-tracking',
    name: 'Ingredient Tracking',
    description: 'Track ingredients and recipe costs',
    icon: 'ChefHat',
    category: 'restaurant',
    pageId: 'ingredient-tracking',
    requiredPlans: ['standard', 'pro'],
    requiredCategories: ['restaurant', 'cafe'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: true,
  },
  'production-tracking': {
    id: 'production-tracking',
    name: 'Production Tracking',
    description: 'Track manufacturing production and raw materials',
    icon: 'Wrench',
    category: 'manufacturing',
    pageId: 'production-tracking',
    requiredPlans: ['pro'],
    requiredCategories: ['manufacturing'],
    isOptional: true,
    isProOnly: true,
    isStandardOrPro: false,
  },
  'email-campaigns': {
    id: 'email-campaigns',
    name: 'Email Campaigns',
    description: 'Send marketing emails to customers',
    icon: 'Mail',
    category: 'marketing',
    pageId: 'email-campaigns',
    requiredPlans: ['pro'],
    isOptional: true,
    isProOnly: true,
    isStandardOrPro: false,
  },
  'audit-trail': {
    id: 'audit-trail',
    name: 'Audit Trail',
    description: 'Complete activity log for compliance',
    icon: 'ClipboardList',
    category: 'analytics',
    pageId: 'audit-trail',
    requiredPlans: ['pro'],
    isOptional: true,
    isProOnly: true,
    isStandardOrPro: false,
  },
  'expiry-alerts': {
    id: 'expiry-alerts',
    name: 'Expiry Alerts',
    description: 'Track product expiry dates and batch numbers',
    icon: 'AlertTriangle',
    category: 'inventory',
    pageId: 'expiry-alerts',
    requiredPlans: ['standard', 'pro'],
    requiredCategories: ['grocery', 'pharmacy', 'restaurant', 'cafe'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: true,
  },
  'customer-management': {
    id: 'customer-management',
    name: 'Customer Management',
    description: 'Manage customer profiles and purchase history',
    icon: 'UserCircle',
    category: 'operations',
    pageId: 'customer-management',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'access-capital': {
    id: 'access-capital',
    name: 'Access Capital',
    description: 'Get funding and business loans',
    icon: 'Briefcase',
    category: 'financial',
    pageId: 'capital',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'referrals': {
    id: 'referrals',
    name: 'Referral Program',
    description: 'Earn rewards by referring other businesses',
    icon: 'Gift',
    category: 'marketing',
    pageId: 'referrals',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'business-services': {
    id: 'business-services',
    name: 'Business Services',
    description: 'Access paid business services',
    icon: 'Sparkles',
    category: 'operations',
    pageId: 'services',
    requiredPlans: ['starter', 'standard', 'pro'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'jobs-management': {
    id: 'jobs-management',
    name: 'Jobs Management',
    description: 'Track jobs/projects, costs, payments, materials and margins',
    icon: 'Briefcase',
    category: 'operations',
    pageId: 'jobs',
    requiredPlans: ['starter', 'standard', 'pro'],
    requiredCategories: ['jobs'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
  'material-collection': {
    id: 'material-collection',
    name: 'Material Collection',
    description: 'Record supplier weigh-ins, pay by kg, track material purchases',
    icon: 'Recycle',
    category: 'operations',
    pageId: 'recycling',
    requiredPlans: ['starter', 'standard', 'pro'],
    requiredCategories: ['recycling_material_collection'],
    isOptional: true,
    isProOnly: false,
    isStandardOrPro: false,
  },
};

export function getFeature(featureId: string): Feature | undefined {
  return FEATURE_REGISTRY[featureId];
}

export function getAllFeatures(): Feature[] {
  return Object.values(FEATURE_REGISTRY);
}

export function getFeaturesByCategory(category: FeatureCategory): Feature[] {
  return Object.values(FEATURE_REGISTRY).filter(f => f.category === category);
}

export function getFeaturesByPlan(plan: Plan): Feature[] {
  return Object.values(FEATURE_REGISTRY).filter(f =>
    f.requiredPlans.includes(plan) && !f.excludedPlans?.includes(plan)
  );
}

export function getFeaturesByBusinessCategory(category: BusinessCategory): Feature[] {
  return Object.values(FEATURE_REGISTRY).filter(f => {
    if (!f.requiredCategories && !f.excludedCategories) return true;
    if (f.requiredCategories && f.requiredCategories.includes(category)) return true;
    if (f.excludedCategories && f.excludedCategories.includes(category)) return false;
    if (!f.requiredCategories) return true;
    return false;
  });
}

export function isFeatureAllowedForCategory(
  featureId: string,
  businessCategory: BusinessCategory
): boolean {
  const feature = getFeature(featureId);
  if (!feature) return false;
  if (!feature.requiredCategories && !feature.excludedCategories) return true;
  if (feature.excludedCategories?.includes(businessCategory)) return false;
  if (feature.requiredCategories && !feature.requiredCategories.includes(businessCategory)) {
    return false;
  }
  return true;
}

export function isFeatureAllowedForPlan(featureId: string, plan: Plan): boolean {
  const feature = getFeature(featureId);
  if (!feature) return false;
  if (feature.excludedPlans?.includes(plan)) return false;
  return feature.requiredPlans.includes(plan);
}

export function areFeatureDependenciesMet(
  featureId: string,
  enabledFeatures: Set<string>
): boolean {
  const feature = getFeature(featureId);
  if (!feature || !feature.dependencies) return true;
  return feature.dependencies.every(dep => enabledFeatures.has(dep));
}

export function checkFeatureAccess(
  featureId: string,
  userPlan: Plan,
  businessCategory: BusinessCategory,
  enabledFeatures: Set<string>
): FeatureAccessResult {
  const feature = getFeature(featureId);
  if (!feature) {
    return { eligible: false, reason: 'Feature not found in registry' };
  }
  if (!isFeatureAllowedForCategory(featureId, businessCategory)) {
    return {
      eligible: false,
      reason: `This feature is not available for ${businessCategory} businesses`,
    };
  }
  if (!isFeatureAllowedForPlan(featureId, userPlan)) {
    const requiredPlan = feature.requiredPlans[0];
    return {
      eligible: false,
      reason: `This feature requires ${requiredPlan.toUpperCase()} plan or higher`,
      requiresUpgrade: true,
      requiredPlan,
    };
  }
  if (feature.isOptional && !enabledFeatures.has(featureId)) {
    return { eligible: false, reason: 'This feature is not enabled in your settings' };
  }
  if (!areFeatureDependenciesMet(featureId, enabledFeatures)) {
    return { eligible: false, reason: 'Required features are not enabled' };
  }
  return { eligible: true };
}

export function getRecommendedFeatures(category: BusinessCategory): Feature[] {
  const categoryFeatures = getFeaturesByBusinessCategory(category);
  return categoryFeatures.filter(f => !f.isProOnly);
}

export function getProOnlyFeatures(): Feature[] {
  return Object.values(FEATURE_REGISTRY).filter(f => f.isProOnly);
}

export function getStandardOrProFeatures(): Feature[] {
  return Object.values(FEATURE_REGISTRY).filter(f => f.isStandardOrPro);
}

export function getCreditLayerEligibleFeatures(): Feature[] {
  return Object.values(FEATURE_REGISTRY).filter(f => f.isCreditLayerEligible);
}

export function getFeatureByPageId(pageId: PageId): Feature | undefined {
  return Object.values(FEATURE_REGISTRY).find(f => f.pageId === pageId);
}

export function getEnabledPageIds(
  userPlan: Plan,
  businessCategory: BusinessCategory,
  enabledFeatures: Set<string>
): PageId[] {
  const enabledPageIds: PageId[] = [];
  for (const feature of Object.values(FEATURE_REGISTRY)) {
    const access = checkFeatureAccess(feature.id, userPlan, businessCategory, enabledFeatures);
    if (access.eligible && feature.pageId) {
      enabledPageIds.push(feature.pageId);
    }
  }
  return enabledPageIds;
}
