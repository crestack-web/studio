// ═══════════════════════════════════════════
//  BUSMO — Shared TypeScript Types (dashboard index)
//  Keep PageId in sync with types.ts + AppShell routes
// ═══════════════════════════════════════════

export type Theme = 'light' | 'dark' | 'system';

export type PageId =
  | 'home'
  | 'sale'
  | 'sales'
  | 'inventory'
  | 'expenses'
  | 'cashflow'
  | 'market'
  | 'pay'
  | 'go'
  | 'capital'
  | 'referrals'
  | 'mo'
  | 'mo-mobile'
  | 'mo-sell'
  | 'mo-sales'
  | 'services'
  | 'staff'
  | 'add-product'
  | 'add-expense'
  | 'statement'
  | 'reports'
  | 'bank-reconciliation'
  | 'money-control'
  | 'bank-statement-import'
  | 'cash-reconciliation'
  | 'staff-accountability'
  | 'money-leakage'
  | 'payment-traceability'
  | 'update'
  | 'recordsale'
  | 'wallet'
  | 'settings'
  | 'branches'
  | 'supplier-management'
  | 'customer-management'
  | 'warehouse'
  | 'stock-transfers'
  | 'receive-stock'
  | 'credit-tracking'
  | 'payroll'
  | 'email-campaigns'
  | 'document-templates'
  | 'menu-management'
  | 'margin-calculator'
  | 'can-i-buy'
  | 'ingredient-tracking'
  | 'expiry-alerts'
  | 'production-tracking'
  | 'audit-trail'
  | 'staff-activity'
  | 'jobs'
  | 'recycling'
  | 'feature-prototype'
  | 'business-builder'
  | 'custom-feature';

// ── Navigation ──────────────────────────────
export interface NavItem {
  id: PageId;
  label: string;
  tip: string;
  iconClass: string;
  badge?: string | number;
}

export interface NavSection {
  label: string;
  items: NavItem[];
  icon?: string;
  id?: string;
}
