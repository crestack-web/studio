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
  | 'wallet'
  | 'menu-management'
  | 'margin-calculator'
  | 'can-i-buy'
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
  | 'mo-sales'
  | 'jobs'
  | 'recycling';

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

// ── Metrics ─────────────────────────────────
export interface MetricItem {
  label: string;
  value: string;
  trend?: string;
  trendType?: 'up' | 'down' | 'neutral';
}

// ── Products ────────────────────────────────
export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  stockByLocation?: {
    main_store: number;
    back_store: number;
    warehouse: number;
  };
  emoji: string;
  category?: string;
  imageUrl?: string;
  lowStockThreshold?: number;
  type?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'pos' | 'credit' | 'split';
export type Shift = 'morning' | 'afternoon' | 'evening';

export function detectShift(date: Date): Shift {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

// Rest of types restored from main; PageId includes jobs + recycling.
export type BusinessCategory = 'retail' | 'wholesale' | 'restaurant' | 'pharmacy' | 'fashion' | 'manufacturing' | 'services' | 'supermarket' | 'cafe' | 'distributor' | 'grocery' | 'electronics' | 'jobs' | 'recycling_material_collection';
