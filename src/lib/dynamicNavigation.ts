// ═══════════════════════════════════════════
//  BUSMO — Dynamic Navigation Generation
//  Generates navigation items based on feature registry
// ═══════════════════════════════════════════

import { PageId } from '@/app/owner/dashboard/types';
import { 
  getAllFeatures, 
  checkFeatureAccess, 
  Plan, 
  BusinessCategory,
  Feature,
} from './featureRegistry';
import { NavItem, NavSection } from '@/app/owner/dashboard/types';

// Re-export types for convenience
export type { Plan, BusinessCategory } from './featureRegistry';

// ── Navigation Item Definition ─────────────────────────────────────

export interface NavigationItem {
  id: PageId;
  label: string;
  tip: string;
  iconClass: string;
  badge?: number | string;
  section: string;
  featureId?: string; // Link to feature registry
  requiredCategories?: BusinessCategory[];
  excludedCategories?: BusinessCategory[];
}

// ── Static Navigation Configuration ───────────────────────────────────

export const NAVIGATION_ITEMS: NavigationItem[] = [
  // Main Section
  {
    id: 'home',
    label: 'Home',
    tip: 'Dashboard overview',
    iconClass: 'Home',
    section: 'Main',
  },
  {
    id: 'sale',
    label: 'Record Sale',
    tip: 'Record a new sale',
    iconClass: 'ShoppingCart',
    section: 'Main',
    featureId: 'sales-recording',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    tip: 'Manage your products',
    iconClass: 'Package',
    section: 'Main',
    featureId: 'inventory-tracking',
    excludedCategories: ['education', 'services'],
  },
  {
    id: 'add-product',
    label: 'Add Product',
    tip: 'Add a new product',
    iconClass: 'Plus',
    section: 'Main',
    featureId: 'inventory-tracking',
  },
  {
    id: 'add-expense',
    label: 'Add Expense',
    tip: 'Record an expense',
    iconClass: 'Receipt',
    section: 'Main',
    featureId: 'expense-management',
  },
  {
    id: 'cashflow',
    label: 'Cashflow',
    tip: 'Track cash flow',
    iconClass: 'TrendingUp',
    section: 'Main',
    featureId: 'cashflow-tracking',
  },
  {
    id: 'statement',
    label: 'Statement',
    tip: 'View transaction history',
    iconClass: 'FileText',
    section: 'Main',
    featureId: 'statement-history',
  },
  {
    id: 'reports',
    label: 'Reports',
    tip: 'Business analytics',
    iconClass: 'BarChart3',
    section: 'Main',
    featureId: 'reports-analytics',
  },
  {
    id: 'bank-reconciliation',
    label: 'Bank Reconciliation',
    tip: 'Match bank transactions',
    iconClass: 'RefreshCw',
    section: 'Main',
    featureId: 'bank-reconciliation',
  },
  {
    id: 'money-control',
    label: 'Money Control',
    tip: 'Track payments and collections',
    iconClass: 'ShieldCheck',
    section: 'Main',
    featureId: 'money-control',
  },
  {
    id: 'credit-tracking',
    label: 'Credit Tracking',
    tip: 'Track debts and credits',
    iconClass: 'UserCheck',
    section: 'Main',
    featureId: 'credit-tracking',
    excludedCategories: ['restaurant', 'cafe', 'pharmacy', 'healthcare', 'education'],
  },
  {
    id: 'menu-management',
    label: 'Menu Management',
    tip: 'Manage restaurant menus',
    iconClass: 'Menu',
    section: 'Main',
    featureId: 'menu-management',
    requiredCategories: ['restaurant', 'cafe'],
  },
  {
    id: 'ingredient-tracking',
    label: 'Ingredients',
    tip: 'Track ingredients and recipes',
    iconClass: 'ChefHat',
    section: 'Main',
    featureId: 'ingredient-tracking',
    requiredCategories: ['restaurant', 'cafe'],
  },
  {
    id: 'expiry-alerts',
    label: 'Expiry Alerts',
    tip: 'Track product expiry dates',
    iconClass: 'AlertTriangle',
    section: 'Main',
    featureId: 'expiry-alerts',
    requiredCategories: ['grocery', 'pharmacy', 'supermarket', 'restaurant', 'cafe', 'healthcare'],
  },
  {
    id: 'production-tracking',
    label: 'Production',
    tip: 'Track manufacturing production',
    iconClass: 'Wrench',
    section: 'Main',
    featureId: 'production-tracking',
    requiredCategories: ['manufacturing'],
  },
  {
    id: 'ecommerce-storefront',
    label: 'E-commerce',
    tip: 'Online store',
    iconClass: 'ShoppingBag',
    section: 'Main',
    featureId: 'ecommerce-storefront',
    requiredCategories: ['retail', 'fashion', 'electronics'],
  },

  // Growth Section
  {
    id: 'capital',
    label: 'Access Capital',
    tip: 'Get business funding',
    iconClass: 'Briefcase',
    section: 'Growth',
    featureId: 'access-capital',
    requiredCategories: ['wholesale', 'retail', 'manufacturing', 'distributor'],
  },
  {
    id: 'referrals',
    label: 'Referrals',
    tip: 'Earn rewards',
    iconClass: 'Gift',
    section: 'Growth',
    featureId: 'referrals',
  },

  // Account Section
  {
    id: 'mo',
    label: 'Ask MO',
    tip: 'AI Assistant',
    iconClass: 'Bot',
    section: 'Account',
    featureId: 'ask-mo-ai-assistant',
  },
  {
    id: 'services',
    label: 'Business Services',
    tip: 'Paid services',
    iconClass: 'Sparkles',
    section: 'Account',
    featureId: 'business-services',
  },
  {
    id: 'staff',
    label: 'Staff',
    tip: 'Manage staff',
    iconClass: 'Users',
    section: 'Account',
    featureId: 'staff-management',
  },
  {
    id: 'supplier-management',
    label: 'Suppliers',
    tip: 'Manage suppliers',
    iconClass: 'Truck',
    section: 'Account',
    featureId: 'supplier-management',
    excludedCategories: ['education', 'services'],
  },
  {
    id: 'customer-management',
    label: 'Customers',
    tip: 'Manage customers',
    iconClass: 'UserCircle',
    section: 'Account',
    featureId: 'customer-management',
  },
  {
    id: 'invoice-verification',
    label: 'Invoice Verification',
    tip: 'Verify invoices',
    iconClass: 'FileCheck',
    section: 'Account',
    featureId: 'invoice-verification',
    requiredCategories: ['wholesale', 'distributor'],
  },
  {
    id: 'branches',
    label: 'Branches',
    tip: 'Manage branches',
    iconClass: 'Building2',
    section: 'Account',
    featureId: 'multi-branch-support',
    excludedCategories: ['wholesale', 'distributor'],
  },
  {
    id: 'warehouse',
    label: 'Warehouse',
    tip: 'Warehouse management',
    iconClass: 'Layers',
    section: 'Account',
    featureId: 'warehouse-management',
  },
  {
    id: 'stock-transfers',
    label: 'Stock Transfers',
    tip: 'Transfer stock',
    iconClass: 'ArrowRightLeft',
    section: 'Account',
    featureId: 'stock-transfers',
  },
  {
    id: 'payroll',
    label: 'Payroll',
    tip: 'Manage payroll',
    iconClass: 'DollarSign',
    section: 'Account',
    featureId: 'payroll-management',
  },
  {
    id: 'audit-trail',
    label: 'Audit Trail',
    tip: 'Activity logs',
    iconClass: 'ClipboardList',
    section: 'Account',
    featureId: 'audit-trail',
  },
  {
    id: 'staff-activity',
    label: 'Staff Activity',
    tip: 'Staff performance',
    iconClass: 'Activity',
    section: 'Account',
    featureId: 'staff-activity-tracking',
  },
  {
    id: 'staff-accountability',
    label: 'Staff Accountability',
    tip: 'Staff cash handling',
    iconClass: 'UserCheck2',
    section: 'Account',
    featureId: 'staff-accountability',
  },
  {
    id: 'bank-statement-import',
    label: 'Bank Import',
    tip: 'Import bank statements',
    iconClass: 'Upload',
    section: 'Account',
    featureId: 'bank-statement-import',
  },
  {
    id: 'settings',
    label: 'Settings',
    tip: 'Account settings',
    iconClass: 'Settings',
    section: 'Account',
  },
];

// ── Section Definitions ───────────────────────────────────────────────

export const NAVIGATION_SECTIONS = [
  { id: 'Main', label: 'Main', icon: 'Home' },
  { id: 'Growth', label: 'Growth', icon: 'TrendingUp' },
  { id: 'Account', label: 'Account', icon: 'User' },
];

// ── Helper Functions ───────────────────────────────────────────────────

/**
 * Check if navigation item is visible based on user context
 */
export function isNavItemVisible(
  item: NavigationItem,
  userPlan: Plan,
  businessCategory: BusinessCategory,
  enabledFeatures: Set<string>
): boolean {
  // Check category restrictions
  if (item.requiredCategories && !item.requiredCategories.includes(businessCategory)) {
    return false;
  }
  
  if (item.excludedCategories && item.excludedCategories.includes(businessCategory)) {
    return false;
  }
  
  // Check feature access if linked to a feature
  if (item.featureId) {
    const access = checkFeatureAccess(item.featureId, userPlan, businessCategory, enabledFeatures);
    return access.eligible;
  }
  
  // No feature restriction, always visible
  return true;
}

/**
 * Generate navigation sections based on user context
 */
export function generateNavigation(
  userPlan: Plan,
  businessCategory: BusinessCategory,
  enabledFeatures: Set<string>
): NavSection[] {
  const sections: NavSection[] = [];
  
  for (const sectionDef of NAVIGATION_SECTIONS) {
    const sectionItems: NavItem[] = [];
    
    for (const item of NAVIGATION_ITEMS) {
      if (item.section === sectionDef.id) {
        if (isNavItemVisible(item, userPlan, businessCategory, enabledFeatures)) {
          sectionItems.push({
            id: item.id,
            label: item.label,
            tip: item.tip,
            iconClass: item.iconClass,
            badge: item.badge,
          });
        }
      }
    }
    
    if (sectionItems.length > 0) {
      sections.push({
        id: sectionDef.id,
        label: sectionDef.label,
        icon: sectionDef.icon,
        items: sectionItems,
      });
    }
  }
  
  return sections;
}

/**
 * Get all navigation items for a section
 */
export function getSectionItems(
  sectionId: string,
  userPlan: Plan,
  businessCategory: BusinessCategory,
  enabledFeatures: Set<string>
): NavItem[] {
  return NAVIGATION_ITEMS
    .filter(item => item.section === sectionId)
    .filter(item => isNavItemVisible(item, userPlan, businessCategory, enabledFeatures))
    .map(item => ({
      id: item.id,
      label: item.label,
      tip: item.tip,
      iconClass: item.iconClass,
      badge: item.badge,
    }));
}

/**
 * Get navigation item by page ID
 */
export function getNavItemByPageId(pageId: PageId): NavigationItem | undefined {
  return NAVIGATION_ITEMS.find(item => item.id === pageId);
}

/**
 * Check if a page is accessible
 */
export function isPageAccessible(
  pageId: PageId,
  userPlan: Plan,
  businessCategory: BusinessCategory,
  enabledFeatures: Set<string>
): boolean {
  const item = getNavItemByPageId(pageId);
  if (!item) return false;
  
  return isNavItemVisible(item, userPlan, businessCategory, enabledFeatures);
}

/**
 * Get all accessible page IDs
 */
export function getAccessiblePageIds(
  userPlan: Plan,
  businessCategory: BusinessCategory,
  enabledFeatures: Set<string>
): PageId[] {
  return NAVIGATION_ITEMS
    .filter(item => isNavItemVisible(item, userPlan, businessCategory, enabledFeatures))
    .map(item => item.id);
}
