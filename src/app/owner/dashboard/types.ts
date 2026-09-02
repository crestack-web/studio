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
  avatarContent: string;   // emoji, initials, or img URL
  avatarStyle?: React.CSSProperties;
  photoURL?: string;       // uploaded profile picture URL
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
  type?: string; // 'product', 'ingredient', 'menu', etc.
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

// ── Credit Tracking (Retailer Focus) ─────────
export type CreditStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'written_off';

export interface CreditCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  businessType?: 'individual' | 'business';
  notes?: string;
  createdAt: Date;
  totalCreditLimit?: number;
  currentBalance: number;
  isRegularCustomer: boolean;
}

export interface CreditTransaction {
  id: string;
  customerId: string;
  customerName: string;
  saleId: string;
  amount: number;
  originalAmount: number;
  status: CreditStatus;
  dueDate: Date;
  issuedDate: Date;
  paidAmount: number;
  remainingAmount: number;
  paymentHistory: CreditPayment[];
  notes?: string;
  reminderSent: boolean;
  reminderCount: number;
  lastReminderDate?: Date;
  writtenOffAt?: Date;
  writtenOffReason?: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  branchId?: string;
  recordedBy: string;
  recordedByName: string;
}

export interface CreditPayment {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'card';
  reference?: string;
  notes?: string;
  recordedBy: string;
  recordedByName: string;
}

export interface CreditSummary {
  totalOutstanding: number;
  overdueAmount: number;
  dueThisWeek: number;
  dueThisMonth: number;
  totalCustomers: number;
  activeCredits: number;
  paidThisMonth: number;
  averageCollectionDays: number;
}

// ── Supplier Management (First-Class Entities) ─────────────────────────────
export type SupplierStatus = 'active' | 'inactive' | 'blocked';
export type PaymentTerms = 'cash' | 'net_7' | 'net_14' | 'net_30' | 'net_60' | 'net_90' | 'custom';
export type SupplierCategory = 'general' | 'food' | 'beverages' | 'dairy' | 'pharmaceutical' | 'cosmetics' | 'electronics' | 'clothing' | 'raw_materials' | 'equipment' | 'services' | 'other';

export interface Supplier {
  id: string;
  businessId: string;
  supplierName: string;
  businessName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  paymentTerms: PaymentTerms;
  customPaymentDays?: number; // For custom payment terms
  creditLimit: number;
  openingBalance: number;
  currentBalance: number;
  category: SupplierCategory;
  status: SupplierStatus;
  taxId?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  contactPerson?: {
    name: string;
    phone: string;
    email?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastPurchaseDate?: Date;
  lastPaymentDate?: Date;
  totalPurchases: number;
  totalPayments: number;
  purchaseCount: number;
  paymentCount: number;
  averagePaymentDays: number;
  creditUtilization: number; // percentage of credit limit used
}

export interface SupplierLedgerTransaction {
  id: string;
  supplierId: string;
  businessId: string;
  type: 'purchase' | 'payment' | 'credit_note' | 'balance_adjustment' | 'opening_balance';
  amount: number;
  balanceAfter: number;
  description: string;
  reference?: string; // Purchase order ID, receipt ID, etc.
  date: Date;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  metadata?: {
    purchaseOrderId?: string;
    stockReceiptId?: string;
    paymentMethod?: 'cash' | 'transfer' | 'pos' | 'card';
    bankReference?: string;
    reason?: string; // For adjustments
    status?: string;
    paid?: number;
    balance?: number;
  };
}

export interface PurchaseOrder {
  id: string;
  businessId: string;
  supplierId: string;
  supplierName: string;
  orderNumber: string;
  status: 'draft' | 'pending' | 'approved' | 'partial' | 'received' | 'cancelled';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  approvedAt?: Date;
  receivedBy?: string;
  receivedAt?: Date;
}

export interface StockReceipt {
  id: string;
  businessId: string;
  supplierId: string;
  supplierName: string;
  purchaseOrderId?: string;
  receiptNumber: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    batchNumber?: string;
    expiryDate?: Date;
    location?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  receivedDate: Date;
  notes?: string;
  receivedBy: string;
  receivedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierPayment {
  id: string;
  businessId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'card';
  paymentDate: Date;
  reference?: string;
  bankReference?: string;
  notes?: string;
  paidBy: string;
  paidByName: string;
  createdAt: Date;
  relatedPurchaseOrders?: string[]; // IDs of purchase orders this payment covers
  relatedStockReceipts?: string[]; // IDs of stock receipts this payment covers
}

export interface SupplierDashboard {
  totalSuppliers: number;
  activeSuppliers: number;
  totalOutstandingPayables: number;
  dueThisWeek: number;
  dueThisMonth: number;
  overduePayables: number;
  topSupplierBySpend: {
    supplierId: string;
    supplierName: string;
    totalSpend: number;
  } | null;
  monthlyPurchaseVolume: number;
  supplierCreditUtilization: number; // Average across all suppliers
  supplierPaymentTrend: {
    month: string;
    payments: number;
    purchases: number;
  }[];
}

export interface SupplierProfile {
  supplier: Supplier;
  purchaseHistory: {
    totalPurchases: number;
    purchaseCount: number;
    averagePurchaseValue: number;
    lastPurchaseDate?: Date;
    purchasesByMonth: Array<{
      month: string;
      amount: number;
      count: number;
    }>;
    productsSupplied: Array<{
      productName: string;
      totalQuantity: number;
      totalAmount: number;
      lastSupplied: Date;
    }>;
  };
  financials: {
    totalPurchases: number;
    totalPayments: number;
    currentBalance: number;
    creditLimit: number;
    creditUtilization: number;
    averagePaymentDays: number;
    paymentHistory: Array<{
      month: string;
      amount: number;
      daysToPay: number;
    }>;
  };
  ledger: SupplierLedgerTransaction[];
  analytics: {
    priceChanges: Array<{
      productName: string;
      oldPrice: number;
      newPrice: number;
      changePercent: number;
      date: Date;
    }>;
    supplierDependency: number; // Percentage of total purchases
    purchaseFrequency: number; // Average days between purchases
    deliveryReliability: number; // Percentage of on-time deliveries
  };
}

// ── Credit Tracking (Extended for Payables) ────────────────────────────────
export interface PayableSummary {
  totalOutstanding: number;
  overdueAmount: number;
  dueThisWeek: number;
  dueThisMonth: number;
  totalSuppliers: number;
  activePayables: number;
  paidThisMonth: number;
  averagePaymentDays: number;
}

export interface CreditTrackingSummary {
  receivables: CreditSummary;
  payables: PayableSummary;
  netCreditPosition: number; // receivables - payables
  totalCreditExposure: number; // receivables + payables
}

// ── Purchase Intelligence ─────────────────────────────────────────────────
export interface PurchaseIntelligence {
  totalSpendBySupplier: Array<{
    supplierId: string;
    supplierName: string;
    totalSpend: number;
    purchaseCount: number;
    percentageOfTotal: number;
  }>;
  purchaseTrends: Array<{
    month: string;
    totalPurchases: number;
    supplierCount: number;
    averageOrderValue: number;
  }>;
  supplierPriceChanges: Array<{
    supplierId: string;
    supplierName: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
    changePercent: number;
    date: Date;
  }>;
  supplierDependency: Array<{
    supplierId: string;
    supplierName: string;
    dependencyScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    productsCount: number;
    percentageOfPurchases: number;
  }>;
  productSourcing: Array<{
    productId: string;
    productName: string;
    primarySupplier: string;
    alternativeSuppliers: string[];
    lastPurchaseDate: Date;
    averageCost: number;
    costTrend: 'increasing' | 'decreasing' | 'stable';
  }>;
}

// ── Category-Specific Supplier Features ───────────────────────────────────
export type BusinessCategory = 'retail' | 'wholesale' | 'restaurant' | 'pharmacy' | 'fashion' | 'manufacturing' | 'services' | 'supermarket' | 'cafe' | 'distributor' | 'grocery' | 'electronics';

export interface CategorySupplierFeatures {
  category: BusinessCategory;
  enabledFeatures: string[];
  customFields: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
  analytics: string[];
  insights: string[];
}
