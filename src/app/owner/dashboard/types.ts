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
  | 'email-campaigns';

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
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  emoji: string;
  category?: string;
  imageUrl?: string;
}

export interface CartItem extends Product {
  qty: number;
}

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'pos' | 'credit' | 'split';
export type Shift = 'morning' | 'afternoon' | 'evening';

// Helper function to detect shift from timestamp
export function detectShift(date: Date): Shift {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

// ── Money Control Types ───────────────────────
export interface PaymentBreakdown {
  method: PaymentMethod;
  amount: number;
  reference?: string; // Transfer reference, POS transaction ID, etc.
  received?: boolean; // For credit/split payments
  receivedAt?: Date;
  bankTransactionId?: string; // Linked bank transaction
}

export interface SalePayment {
  saleId: string;
  totalAmount: number;
  breakdown: PaymentBreakdown[];
  expectedCash: number;
  expectedBank: number;
  recordedBy: string; // Staff ID
  recordedAt: Date;
  shift?: Shift; // Detected shift based on timestamp
  customerName?: string;
  customerPhone?: string;
  invoiceNumber?: string;
}

export interface BankTransaction {
  id: string;
  merchantId: string;
  date: Date;
  amount: number;
  type: 'credit' | 'debit';
  narration: string;
  reference?: string;
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  matchedSaleId?: string;
  matchConfidence?: number; // 0-100
  matchStatus?: 'unmatched' | 'pending' | 'confirmed' | 'rejected';
  matchedAt?: Date;
  importedAt: Date;
}

export interface ReconciliationMatch {
  id: string;
  bankTransactionId: string;
  saleId: string;
  confidence: number;
  status: 'pending' | 'confirmed' | 'rejected';
  matchedBy: string;
  matchedAt: Date;
  matchReasons: string[];
}

export interface CashReconciliation {
  id: string;
  merchantId: string;
  staffId: string;
  date: Date;
  expectedCash: number;
  actualCash: number;
  variance: number;
  notes?: string;
  shift?: string;
  reconciledBy: string;
  reconciledAt: Date;
}

export interface StaffAccountability {
  staffId: string;
  staffName: string;
  period: {
    start: Date;
    end: Date;
  };
  salesRecorded: number;
  expectedCash: number;
  cashSubmitted: number;
  bankCollections: number;
  shortages: number;
  outstandingPayments: number;
  reconciliationRate: number;
}

export interface MoneyLeakageReport {
  merchantId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalSales: number;
  expectedCollections: number;
  confirmedCollections: number;
  difference: number;
  breakdown: {
    missingTransfers: number;
    cashShortages: number;
    unmatchedDeposits: number;
    outstandingCreditSales: number;
    pendingReconciliation: number;
  };
}

export interface PaymentTraceability {
  saleId: string;
  saleDate: Date;
  totalAmount: number;
  customerName?: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  staffId: string;
  staffName: string;
  paymentBreakdown: PaymentBreakdown[];
  paymentReceived: boolean;
  bankTransaction?: BankTransaction;
  reconciled: boolean;
  reconciledAt?: Date;
}

export interface MoneyLeakageAlert {
  id: string;
  type: 'cash_shortage' | 'missing_transfer' | 'unmatched_deposit' | 'duplicate_payment' | 'overpayment';
  severity: 'high' | 'medium' | 'low';
  amount: number;
  description: string;
  saleId?: string;
  detectedAt: Date;
  status: 'open' | 'resolved';
}

export interface MoneyLeakageReport {
  period: {
    start: Date;
    end: Date;
  };
  totalLeakage: number;
  alerts: MoneyLeakageAlert[];
  resolvedAlerts: number;
  openAlerts: number;
}

export interface MoneyControlSummary {
  totalSales: number;
  cashSales: number;
  transferSales: number;
  posSales: number;
  splitPayments: number;
  creditSales: number;
  expectedCashCollections: number;
  expectedBankCollections: number;
  confirmedCashCollections: number;
  confirmedBankCollections: number;
  outstandingCollections: number;
  matchedTransactions: number;
  unmatchedSales: number;
  unmatchedBankTransactions: number;
  pendingReconciliation: number;
  alerts: {
    cashShortages: number;
    missingTransfers: number;
    unmatchedDeposits: number;
    overpayments: number;
    duplicatePayments: number;
  };
}

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
