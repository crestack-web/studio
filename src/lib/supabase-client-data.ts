/**
 * supabase-client-data.ts
 * Client-side data access layer backed by Supabase PostgREST.
 * Maps Firestore-style paths to Supabase tables.
 */

import { getSupabase } from '@/lib/supabase';

const TABLE_ALIASES: Record<string, string> = {
  payments: 'payment_transactions',
  purchaseOrders: 'purchases',
  cashFlow: 'cash_flow',
  cashflow: 'cash_flow',
  auditTrail: 'audit_trail',
  inventoryAdjustments: 'inventory_adjustments',
  creditCustomers: 'credit_customers',
  creditTransactions: 'credit_transactions',
  stockReceipts: 'stock_receipts',
  stockLocations: 'stock_locations',
  stockTransfers: 'stock_transfers',
  bankAccounts: 'bank_accounts',
  bankTransactions: 'bank_transactions',
  supplierLedger: 'supplier_credit',
  supplierCredit: 'supplier_credit',
  purchases: 'purchases',
  customerTransactions: 'customer_transactions',
  subscriptionTransactions: 'subscription_transactions',
  businessVerifications: 'business_verifications',
  supportTickets: 'support_tickets',
  supportMessages: 'support_messages',
  chatConversations: 'chat_conversations',
  chatMessages: 'chat_messages',
  conversations: 'chat_conversations',
  cashReconciliations: 'cash_reconciliations',
  cash_reconciliations: 'cash_reconciliations',
  staffPermissions: 'staff_permissions',
  referralCodes: 'referral_codes',
  referralEarnings: 'referral_earnings',
  referralStats: 'referral_stats',
  referralPayouts: 'referral_payouts',
  marketProducts: 'market_products',
  marketCategories: 'market_categories',
  storeProducts: 'store_products',
  storeCollections: 'store_collections',
  payroll: 'payroll_entries',
  storeOrders: 'store_orders',
  storeAnalytics: 'store_analytics',
  storeShippingZones: 'store_shipping_zones',
  adminUsers: 'admins',
};

const WRITE_ALIASES: Record<string, Record<string, string>> = {
  products: {
    stock: 'stock_level', quantity: 'stock_level', stockLevel: 'stock_level',
    costPrice: 'cost', sellingPrice: 'price', reorderLevel: 'reorder_level', imageUrl: 'image_url',
  },
  sales: {
    products: 'items', totalRevenue: 'total_revenue', paymentMethod: 'payment_method',
    paymentType: 'metadata', businessId: 'business_id', customerId: 'customer_id', createdAt: 'created_at',
  },
  attendance: {
    clockIn: 'check_in', clockOut: 'check_out', checkIn: 'check_in', checkOut: 'check_out',
    staffId: 'staff_id', userId: 'user_id', businessId: 'business_id', createdAt: 'created_at',
  },
  customers: { isActive: 'active' },
  expenses: { timestamp: 'metadata', receiptUrl: 'receipt_url' },
  bank_accounts: {
    accountName: 'account_name',
    isDefault: 'is_primary',
    isPrimary: 'is_primary',
  },
  bank_transactions: {
    bankAccountId: 'account_id',
    accountId: 'account_id',
  },
  staff: { lastSaleAt: 'last_sale_at', bankName: 'bank_name', bankCode: 'bank_code', accountNumber: 'account_number', accountName: 'account_name', paystackRecipientCode: 'paystack_recipient_code' },
  payroll_entries: {
    staffId: 'staff_id',
    staffName: 'staff_name',
    staffRole: 'staff_role',
    baseSalary: 'base_salary',
    overtimeHours: 'overtime_hours',
    overtimeRate: 'overtime_rate',
    overtimePay: 'overtime_pay',
    netSalary: 'net_salary',
    paidDate: 'paid_date',
    paidFromWallet: 'paid_from_wallet',
    walletReference: 'wallet_reference',
    paystackTransferCode: 'paystack_transfer_code',
    paystackTransferStatus: 'paystack_transfer_status',
    bankName: 'bank_name',
    bankCode: 'bank_code',
    accountNumber: 'account_number',
    accountName: 'account_name',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  staffBank: {
    bankName: 'bank_name',
    bankCode: 'bank_code',
    accountNumber: 'account_number',
    accountName: 'account_name',
    paystackRecipientCode: 'paystack_recipient_code',
  },
  suppliers: {
    supplierName: 'name', businessName: 'name', name: 'name',
  },
  credit_customers: {
    totalCreditLimit: 'credit_limit', creditLimit: 'credit_limit',
    currentBalance: 'balance', customerName: 'name',
    totalCredit: 'total_credit', totalPaid: 'total_paid',
  },
  credit_transactions: {
    customerId: 'customer_id', paymentMethod: 'payment_method',
    note: 'note', notes: 'note', description: 'note', createdBy: 'created_by',
  },
  cash_reconciliations: {
    expectedCash: 'expected_amount', expected_cash: 'expected_amount',
    actualCash: 'counted_amount', actual_cash: 'counted_amount',
    counted: 'counted_amount', variance: 'difference',
    notes: 'note', reconciledBy: 'reconciled_by', staffId: 'reconciled_by',
  },
  purchases: {
    supplierId: 'supplier_id', totalAmount: 'total', totalCost: 'total', total: 'total',
    paidAmount: 'paid', paid: 'paid', creditAmount: 'balance', balance: 'balance',
    notes: 'note', note: 'note', createdBy: 'created_by',
  },
  stock_receipts: {
    purchaseId: 'purchase_id', notes: 'note', note: 'note', createdBy: 'created_by',
  },
  supplier_credit: {
    supplierId: 'supplier_id', amount: 'amount', paid: 'paid',
    balance: 'balance', dueDate: 'due_date',
  },
  material_prices: {
    materialId: 'material_id', pricePerUnit: 'price_per_unit',
    effectiveFrom: 'effective_from', createdBy: 'created_by',
  },
  material_purchases: {
    supplierId: 'supplier_id', supplierName: 'supplier_name',
    materialId: 'material_id', materialName: 'material_name',
    weightKg: 'weight_kg', pricePerKg: 'price_per_kg',
    totalAmount: 'total_amount', amountPaid: 'amount_paid',
    paymentStatus: 'payment_status', paymentMethod: 'payment_method',
    purchaseDate: 'purchase_date', recordedBy: 'recorded_by',
    recordedByName: 'recorded_by_name', expenseId: 'expense_id',
    cashFlowId: 'cash_flow_id',
  },
  recyclable_materials: {
    active: 'active',
  },
};

const READ_ALIASES: Record<string, Record<string, string[]>> = {
  products: {
    stock_level: ['stock', 'quantity', 'stockLevel'], price: ['sellingPrice'], cost: ['costPrice'],
    status: ['status', 'active'], image_url: ['imageUrl'], reorder_level: ['reorderLevel'],
  },
  customers: { active: ['active', 'isActive'] },
  sales: {
    payment_method: ['paymentMethod', 'paymentType'],
    total_revenue: ['totalRevenue', 'total', 'totalAmount'],
    total_amount: ['totalAmount', 'total', 'totalRevenue'],
    items: ['products', 'items'], created_at: ['createdAt'],
  },
  attendance: {
    check_in: ['checkIn', 'clockIn'], check_out: ['checkOut', 'clockOut'],
    staff_id: ['staffId'], user_id: ['userId'], created_at: ['createdAt'],
  },
  businesses: { owner_id: ['ownerId'], logo_url: ['logoUrl'] },
  suppliers: {
    name: ['name', 'supplierName', 'businessName'],
    active: ['active', 'status'],
  },
  bank_accounts: {
    account_name: ['accountName', 'name'],
    is_primary: ['isDefault', 'isPrimary'],
    bank_name: ['bankName'],
    account_number: ['accountNumber'],
  },
  staff: { last_sale_at: ['lastSaleAt'] },
  credit_customers: {
    credit_limit: ['totalCreditLimit', 'creditLimit'],
    balance: ['currentBalance', 'balance'],
    total_credit: ['totalCredit'],
    total_paid: ['totalPaid'],
    name: ['name', 'customerName'],
  },
  credit_transactions: {
    customer_id: ['customerId'],
    payment_method: ['paymentMethod'],
    note: ['note', 'notes', 'description'],
    created_by: ['createdBy'],
  },
};

function camelToSnake(s: string): string {
  return s.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`).replace(/-/g, '_').replace(/^_/, '');
}
function snakeToCamel(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}
function tableForCollection(collection: string): string {
  return TABLE_ALIASES[collection] || camelToSnake(collection);
}

const KNOWN_COLUMNS: Record<string, Set<string>> = {
  cash_reconciliations: new Set(['id', 'business_id', 'expected_amount', 'counted_amount', 'difference', 'note', 'reconciled_by', 'created_at']),
  chat_conversations: new Set(['id','business_id','type','participants','messages','metadata','created_at','updated_at']),
  chat_messages: new Set(['id','business_id','conversation_id','sender_id','sender_name','sender_type','body','text','metadata','created_at']),
  products: new Set(['id','business_id','name','description','category','sku','barcode','price','cost','stock_level','reorder_level','unit','image_url','tags','status','metadata','created_at','updated_at']),
  sales: new Set(['id','business_id','customer_id','customer_name','items','total_amount','total_revenue','profit','payment_method','cash_received','change_due','status','metadata','created_at']),
  attendance: new Set(['id','business_id','staff_id','user_id','check_in','check_out','note','created_at']),
  expenses: new Set(['id','business_id','category','amount','description','payment_method','receipt_url','created_by','metadata','created_at']),
  customers: new Set(['id','business_id','name','email','phone','address','notes','active','metadata','created_at','updated_at']),
  suppliers: new Set(['id','business_id','name','email','phone','address','active','metadata','created_at','updated_at']),
  bank_accounts: new Set(['id','business_id','bank_name','account_name','account_number','currency','is_primary','metadata','created_at','updated_at']),
  bank_transactions: new Set(['id','business_id','account_id','type','amount','balance_after','description','reference','created_at']),
  cash_flow: new Set(['id','business_id','type','amount','category','description','entry_date','created_at']),
  transactions: new Set(['id','business_id','type','category','amount','balance_after','reference','note','created_by','created_at','updated_at']),
  staff: new Set(['id','business_id','user_id','role','name','email','phone','status','salary','active','revenue','transactions','last_sale_at','permissions','bank_name','bank_code','account_number','account_name','paystack_recipient_code','created_at','updated_at']),
  payroll_entries: new Set(['id','business_id','staff_id','staff_name','staff_role','period','base_salary','bonuses','deductions','overtime_hours','overtime_rate','overtime_pay','net_salary','status','paid_date','paid_from_wallet','wallet_reference','paystack_transfer_code','paystack_transfer_status','bank_name','bank_code','account_number','account_name','notes','metadata','created_at','updated_at']),
  stock_receipts: new Set(['id','business_id','purchase_id','items','note','created_by','created_at']),
  purchases: new Set(['id','business_id','supplier_id','items','total','paid','balance','status','note','created_by','created_at','updated_at']),
  supplier_credit: new Set(['id','business_id','supplier_id','amount','paid','balance','status','due_date','created_at','updated_at']),
  credit_customers: new Set(['id','business_id','name','phone','email','address','credit_limit','total_credit','total_paid','balance','status','created_at','updated_at']),
  credit_transactions: new Set(['id','business_id','customer_id','type','amount','payment_method','note','created_by','created_at']),
  audit_trail: new Set(['id','business_id','user_id','action','entity_type','entity_id','details','ip_address','created_at']),
  stock_locations: new Set(['id','business_id','name','type','address','active','metadata','created_at','updated_at']),
  stock_transfers: new Set(['id','business_id','product_id','from_location','to_location','quantity','status','notes','metadata','created_at']),
  invoices: new Set(['id','business_id','type','amount','status','items','customer_id','metadata','created_at']),
  recyclable_materials: new Set(['id','business_id','name','unit','active','metadata','created_at','updated_at']),
  material_prices: new Set(['id','business_id','material_id','price_per_unit','effective_from','created_by','metadata','created_at']),
  material_purchases: new Set(['id','business_id','supplier_id','supplier_name','material_id','material_name','weight_kg','price_per_kg','total_amount','amount_paid','balance','payment_status','payment_method','note','purchase_date','recorded_by','recorded_by_name','expense_id','cash_flow_id','metadata','created_at']),
};

function parsePath(collectionPath: string): { table: string; businessId?: string; docId?: string } {
  const parts = collectionPath.split('/').filter(Boolean);
  if (parts[0] === 'businesses' && parts.length >= 3) {
    return {
      businessId: parts[1],
      table: tableForCollection(parts[2]),
      docId: parts[3],
    };
  }
  return { table: tableForCollection(parts[0]), docId: parts[1] };
}

function toRow(tableName: string, data: Record<string, unknown>): Record<string, unknown> {
  const aliases = WRITE_ALIASES[tableName] || {};
  const row: Record<string, unknown> = {};
  const metadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id' || key === 'businessId' || key === '__name__') continue;
    const colName = aliases[key] || camelToSnake(key);
    if (KNOWN_COLUMNS[tableName]?.has(colName)) row[colName] = value;
    else if (colName === 'metadata' && typeof value === 'object' && value !== null) Object.assign(metadata, value);
    else metadata[key] = value;
  }
  if (Object.keys(metadata).length > 0) {
    row.metadata = row.metadata ? { ...(row.metadata as object), ...metadata } : metadata;
  }
  return row;
}

function fromRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { id: row.id };
  for (const [k, v] of Object.entries(row)) {
    if (k === 'id') continue;
    out[snakeToCamel(k)] = v;
    out[k] = v;
  }
  if (row.metadata && typeof row.metadata === 'object') {
    Object.assign(out, row.metadata as object);
  }
  return out;
}

export interface QueryFilter { field: string; op: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'like'; value: unknown; }
export interface QueryOptions { filters?: QueryFilter[]; orderBy?: { field: string; ascending?: boolean }; limit?: number; offset?: number; }

export async function fetchDocs<T = any>(collectionPath: string, options: QueryOptions = {}): Promise<T[]> {
  const { table, businessId } = parsePath(collectionPath);
  const supabase = getSupabase();
  let q = supabase.from(table).select('*');
  if (businessId) q = q.eq('business_id', businessId);
  if (options.filters) {
    for (const f of options.filters) {
      const col = camelToSnake(f.field);
      if (f.op === '=') q = q.eq(col, f.value);
      else if (f.op === '!=') q = q.neq(col, f.value);
      else if (f.op === '>') q = q.gt(col, f.value);
      else if (f.op === '>=') q = q.gte(col, f.value);
      else if (f.op === '<') q = q.lt(col, f.value);
      else if (f.op === '<=') q = q.lte(col, f.value);
      else if (f.op === 'in') q = q.in(col, f.value as unknown[]);
      else if (f.op === 'like') q = q.like(col, String(f.value));
    }
  }
  if (options.orderBy) {
    q = q.order(camelToSnake(options.orderBy.field), { ascending: options.orderBy.ascending !== false });
  }
  if (options.limit) q = q.limit(options.limit);
  if (options.offset) q = q.range(options.offset, options.offset + (options.limit || 100) - 1);
  const { data, error } = await q;
  if (error) { console.error(`[supabase-client-data] fetchDocs error (${table}):`, error); throw error; }
  return (data || []).map((row: any) => fromRow(row) as T);
}

export async function fetchDoc<T = any>(collectionPath: string, docId: string): Promise<T | null> {
  const { table } = parsePath(collectionPath);
  const supabase = getSupabase();
  const { data, error } = await supabase.from(table).select('*').eq('id', docId).maybeSingle();
  if (error) { console.error(`[supabase-client-data] fetchDoc error (${table}):`, error); throw error; }
  return data ? (fromRow(data) as T) : null;
}

export async function addDoc(collectionPath: string, data: Record<string, unknown>): Promise<string> {
  const { table, businessId } = parsePath(collectionPath);
  const supabase = getSupabase();
  const id = (data.id as string) || crypto.randomUUID();
  const row = toRow(table, data);
  row.id = id;
  if (businessId) row.business_id = businessId;
  else if (data.businessId) row.business_id = data.businessId;
  const { error } = await supabase.from(table).insert(row);
  if (error) { console.error(`[supabase-client-data] addDoc error (${table}):`, error); throw error; }
  return id;
}

export async function updateDoc(collectionPath: string, docId: string, data: Record<string, unknown>): Promise<void> {
  const { table } = parsePath(collectionPath);
  const supabase = getSupabase();
  const row = toRow(table, data);
  delete row.id;
  if (KNOWN_COLUMNS[table]?.has('updated_at')) {
    row.updated_at = new Date().toISOString();
  } else {
    delete row.updated_at;
  }
  if (table === 'staff') {
    if (row.metadata && typeof row.metadata === 'object') {
      const meta = row.metadata as Record<string, unknown>;
      if (meta.permissions != null && row.permissions == null) {
        row.permissions = meta.permissions;
      }
    }
    delete row.metadata;
  } else if (KNOWN_COLUMNS[table]?.has('metadata') && row.metadata && typeof row.metadata === 'object') {
    try {
      const { data: existing } = await supabase.from(table).select('metadata').eq('id', docId).maybeSingle();
      const prev = existing?.metadata && typeof existing.metadata === 'object' ? (existing.metadata as Record<string, unknown>) : {};
      row.metadata = { ...prev, ...(row.metadata as Record<string, unknown>) };
    } catch { /* best-effort */ }
  } else {
    delete row.metadata;
  }
  let { error } = await supabase.from(table).update(row).eq('id', docId);
  if (error && table === 'staff' && /permissions|schema cache|column/i.test(error.message || '')) {
    const withoutPerms = { ...row };
    delete withoutPerms.permissions;
    delete withoutPerms.metadata;
    if (Object.keys(withoutPerms).length) {
      const retry = await supabase.from(table).update(withoutPerms).eq('id', docId);
      error = retry.error;
    }
  }
  if (error) { console.error(`[supabase-client-data] updateDoc error (${table}):`, error); throw error; }
}

export async function deleteDoc(collectionPath: string, docId: string): Promise<void> {
  const { table } = parsePath(collectionPath);
  const supabase = getSupabase();
  const { error } = await supabase.from(table).delete().eq('id', docId);
  if (error) { console.error(`[supabase-client-data] deleteDoc error (${table}):`, error); throw error; }
}

export async function runBatch(operations: Array<{ type: 'add' | 'update' | 'delete'; path: string; id?: string; data?: Record<string, unknown> }>): Promise<void> {
  for (const op of operations) {
    switch (op.type) {
      case 'add': if (op.data) await addDoc(op.path, op.data); break;
      case 'update': if (op.id && op.data) await updateDoc(op.path, op.id, op.data); break;
      case 'delete': if (op.id) await deleteDoc(op.path, op.id); break;
    }
  }
}

export function toISOString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toDate === 'function') return (obj.toDate as () => Date)().toISOString();
    if (typeof obj.seconds === 'number') {
      const ms = (obj.seconds as number) * 1000 + ((obj.nanoseconds as number) || 0) / 1_000_000;
      return new Date(ms).toISOString();
    }
  }
  return null;
}

export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toDate === 'function') return (obj.toDate as () => Date)();
    if (typeof obj.seconds === 'number') {
      return new Date((obj.seconds as number) * 1000 + ((obj.nanoseconds as number) || 0) / 1_000_000);
    }
  }
  return null;
}
