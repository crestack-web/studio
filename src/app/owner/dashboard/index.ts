// ═══════════════════════════════════════════
//  BUSMO — Shared TypeScript Types
// ═══════════════════════════════════════════

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
  | 'money-control'
  | 'bank-statement-import'
  | 'cash-reconciliation'
  | 'staff-accountability'
  | 'money-leakage'
  | 'payment-traceability'
  | 'update'
  | 'recordsale'
  | 'settings'
  | 'branches';

// ── Navigation ──────────────────────────────
export interface NavItem {
  id: PageId;
  label: string;
  tip: string;
  iconClass: string;
  badge?: number;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// ── User ────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  shortName: string;
  initials: string;
  role: string;
  plan: string;
  avatarContent: string;   // emoji, initials, or img URL
  avatarStyle?: React.CSSProperties;
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
  id: number;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  emoji: string;
  category?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export type PaymentMethod = 'cash' | 'transfer' | 'card';

// ── Staff ───────────────────────────────────
export interface StaffMember {
  id: number;
  initials: string;
  name: string;
  role: string;
  revenue: string;
  transactions: number;
  avatarBg: string;
  avatarColor: string;
}

// ── Services ────────────────────────────────
export type ServiceCategory = 'all' | 'setup' | 'marketing' | 'finance' | 'legal' | 'tech';

export interface Service {
  id: number;
  category: ServiceCategory;
  name: string;
  description: string;
  price: string;
  delivery: string;
  rating: string;
  iconBg: string;
  iconStroke: string;
}

// ── MO (AI) ─────────────────────────────────
export type MOMessageRole = 'user' | 'bot';

export interface MOMessage {
  id: string;
  role: MOMessageRole;
  content: string | MOCardContent;
  timestamp: Date;
}

export interface MOCardContent {
  type: 'card';
  title: string;
  rows: { label: string; value: string }[];
}

// ── Capital ─────────────────────────────────
export interface FundingOption {
  id: number;
  icon: string;
  name: string;
  description: string;
  rangeLabel: string;
  rangeValue: string;
  secondLabel: string;
  secondValue: string;
  tag: string;
  tagType: 'pending' | 'qualify' | 'info';
}

export interface ChecklistItem {
  id: number;
  label: string;
  detail: string;
  status: 'done' | 'pending' | 'todo';
  action?: string;
}

// ── Toast ────────────────────────────────────
export interface ToastState {
  message: string;
  visible: boolean;
}

// ── Avatar ───────────────────────────────────
export interface AvatarOption {
  id: string;
  type: 'color' | 'emoji';
  content: string;
  bg: string;
  color: string;
}
