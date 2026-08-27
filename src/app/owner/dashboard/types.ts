// ═══════════════════════════════════════════
//  BUSMO — Shared TypeScript Types
// ═══════════════════════════════════════════

import { Key } from 'react';

export type Theme = 'light' | 'dark';

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
  | 'services'
  | 'staff'
  | 'add-product'
  | 'add-expense'
  | 'statement'
  | 'reports'
  | 'bank-reconciliation'
  | 'settings'
  | 'recordsale'
  | 'money-control'
  | 'branches'
  | 'email-campaigns'
  | 'credit-tracking'
  | 'document-templates'
  | 'supplier-management'
  | 'customer-management'
  | 'payroll'
  | 'menu-management'
  | 'ingredient-tracking'
  | 'expiry-alerts'
  | 'production-tracking'
  | 'warehouse'
  | 'stock-transfers'
  | 'audit-trail'
  | 'staff-activity'
  | 'staff-accountability'
  | 'bank-statement-import'
  | 'mo-sell'
  | 'mo-sales';

// ── Navigation ──────────────────────────────
export interface NavItem {
  id: PageId;
  label: string;
  tip: string;
  iconClass: string;
  badge?: number | string;
}

export interface NavSection {
  icon: string;
  id: Key | null | undefined;
  label: string;
  items: NavItem[];
}

// ── User ────────────────────────────────────
export interface User {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  role: string;
  plan: string;
  avatarContent: string;
  avatarStyle?: React.CSSProperties;
  photoURL?: string;
}
