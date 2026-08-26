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
  supplierLedger: 'supplier_ledger',
  customerTransactions: 'customer_transactions',
  subscriptionTransactions: 'subscription_transactions',
  businessVerifications: 'business_verifications',
  supportTickets: 'support_tickets',
  supportMessages: 'support_messages',
  chatConversations: 'chat_conversations',
  chatMessages: 'chat_messages',
  staffPermissions: 'staff_permissions',
  referralCodes: 'referral_codes',
  referralEarnings: 'referral_earnings',
  referralStats: 'referral_stats',
  referralPayouts: 'referral_payouts',
  marketProducts: 'market_products',
  marketCategories: 'market_categories',
  storeProducts: 'store_products',
  storeCollections: 'store_collections',
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
  staff: { lastSaleAt: 'last_sale_at' },
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
  bank_accounts: {
    account_name: ['accountName', 'name'],
    is_primary: ['isDefault', 'isPrimary'],
    bank_name: ['bankName'],
    account_number: ['accountNumber'],
  },
  staff: { last_sale_at: ['lastSaleAt'] },
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
  products: new Set(['id','business_id','name','description','category','sku','barcode','price','cost','stock_level','reorder_level','unit','image_url','tags','status','metadata','created_at','updated_at']),
  sales: new Set(['id','business_id','customer_id','customer_name','items','total_amount','total_revenue','profit','payment_method','cash_received','change_due','status','metadata','created_at']),
  attendance: new Set(['id','business_id','staff_id','user_id','check_in','check_out','note','created_at']),
  expenses: new Set(['id','business_id','category','amount','description','payment_method','receipt_url','created_by','metadata','created_at']),
  customers: new Set(['id','business_id','name','email','phone','address','notes','active','total_spent','total_visits','last_visit','metadata','created_at','updated_at']),
  suppliers: new Set(['id','business_id','name','contact','email','phone','address','status','balance','total_purchases','rating','notes','metadata','created_at','updated_at']),
  bank_accounts: new Set(['id','business_id','bank_name','account_name','account_number','currency','is_primary','metadata','created_at','updated_at']),
  bank_transactions: new Set(['id','business_id','account_id','type','amount','balance_after','description','reference','metadata','created_at']),
  cash_flow: new Set(['id','business_id','type','amount','category','description','payment_method','reference','entry_date','metadata','created_at']),
  transactions: new Set(['id','business_id','type','category','amount','balance_after','reference','note','created_by','created_at','updated_at']),
  staff: new Set(['id','business_id','user_id','role','name','email','phone','status','revenue','transactions','last_sale_at','metadata','created_at','updated_at']),
  stock_receipts: new Set(['id','business_id','supplier_id','items','total_amount','status','notes','received_at','metadata','created_at']),
  credit_customers: new Set(['id','business_id','customer_id','customer_name','phone','current_balance','credit_limit','status','metadata','created_at','updated_at']),
  credit_transactions: new Set(['id','business_id','credit_customer_id','type','amount','balance_after','description','reference','status','metadata','created_at']),
  audit_trail: new Set(['id','business_id','user_id','action','entity_type','entity_id','details','ip_address','created_at']),
  stock_locations: new Set(['id','business_id','name','type','address','active','metadata','created_at','updated_at']),
  stock_transfers: new Set(['id','business_id','product_id','from_location','to_location','quantity','status','notes','metadata','created_at']),
  invoices: new Set(['id','business_id','type','amount','status','items','customer_id','metadata','created_at']),
};

function toRow(tableName: string, data: Record<string, unknown>): Record<string, unknown> {
  const aliases = WRITE_ALIASES[tableName] || {};
  const row: Record<string, unknown> = {};
  const metadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id' || key === 'businessId' || key === '__name__') continue;
    if (tableName === 'products' && key === 'active') {
      if (typeof value === 'boolean') row['status'] = value ? 'active' : 'inactive';
      else if (typeof value === 'string') row['status'] = value;
      continue;
    }
    if (tableName === 'products' && key === 'status' && typeof value === 'string') {
      row['status'] = value; continue;
    }
    const colName = aliases[key] || camelToSnake(key);
    if (KNOWN_COLUMNS[tableName]?.has(colName)) row[colName] = value;
    else if (colName === 'metadata' && typeof value === 'object' && value !== null) Object.assign(metadata, value);
    else metadata[key] = value;
  }
  if (tableName === 'products' && row['status'] == null) row['status'] = 'active';
  if (tableName === 'sales') {
    if (row['total_revenue'] == null && data['total'] != null) row['total_revenue'] = data['total'];
    if (row['total_amount'] == null && row['total_revenue'] != null) row['total_amount'] = row['total_revenue'];
  }
  for (const k of Object.keys(metadata)) {
    if (metadata[k] === null || metadata[k] === undefined) delete metadata[k];
  }
  if (Object.keys(metadata).length > 0) {
    row.metadata = row.metadata ? { ...(row.metadata as object), ...metadata } : metadata;
  }
  if (tableName === 'bank_accounts') {
    if (row.account_name == null && data.accountName != null) row.account_name = data.accountName;
    if (row.is_primary == null && typeof data.isDefault === 'boolean') row.is_primary = data.isDefault;
    const meta: Record<string, unknown> = (row.metadata && typeof row.metadata === 'object') ? { ...(row.metadata as object) } : {};
    for (const k of ['currentBalance','openingBalance','accountType','isActive','isPosDefault','totalMoneyIn','totalMoneyOut'] as const) {
      if (data[k] !== undefined && data[k] !== null) meta[k] = data[k];
    }
    if (meta.currentBalance == null && meta.openingBalance != null) meta.currentBalance = meta.openingBalance;
    if (meta.openingBalance == null && meta.currentBalance != null) meta.openingBalance = meta.currentBalance;
    if (meta.isActive == null) meta.isActive = true;
    row.metadata = meta;
    for (const p of ['name','type','routing_number','current_balance','opening_balance','active','is_default','is_active']) delete row[p];
  }
  if (tableName === 'bank_transactions') {
    if (row.account_id == null) {
      const src = data.bankAccountId ?? data.accountId;
      if (src != null) row.account_id = src;
    }
    delete row.bank_account_id;
  }
  if (tableName === 'products') {
    if (row.stock_level != null && row.stock_level !== '') {
      const n = Number(row.stock_level);
      row.stock_level = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
    }
    if (row.reorder_level != null && row.reorder_level !== '') {
      const n = Number(row.reorder_level);
      row.reorder_level = Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
    }
    if (row.price != null && row.price !== '') { const n = Number(row.price); row.price = Number.isFinite(n) ? n : 0; }
    if (row.cost != null && row.cost !== '') { const n = Number(row.cost); row.cost = Number.isFinite(n) ? n : 0; }
  }
  return row;
}

function toDoc(tableName: string, row: Record<string, unknown>): Record<string, unknown> {
  const doc: Record<string, unknown> = {};
  const aliases = READ_ALIASES[tableName] || {};
  for (const [colName, value] of Object.entries(row)) {
    const camelKey = snakeToCamel(colName);
    doc[camelKey] = value;
    if (aliases[colName]) for (const alias of aliases[colName]) doc[alias] = value;
  }
  const meta = row.metadata;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    for (const [k, v] of Object.entries(meta as Record<string, unknown>)) {
      if (doc[k] === undefined) doc[k] = v;
    }
  }
  if (tableName === 'bank_accounts') {
    const m = (row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)) ? (row.metadata as Record<string, unknown>) : {};
    if (doc.accountName == null && row.account_name != null) doc.accountName = row.account_name;
    if (doc.isDefault == null && row.is_primary != null) doc.isDefault = Boolean(row.is_primary);
    if (doc.currentBalance == null) doc.currentBalance = Number(m.currentBalance ?? m.openingBalance ?? 0) || 0;
    if (doc.openingBalance == null) doc.openingBalance = Number(m.openingBalance ?? doc.currentBalance ?? 0) || 0;
    if (doc.isActive == null) doc.isActive = m.isActive !== false;
    if (doc.accountType == null) doc.accountType = m.accountType ?? 'bank';
    if (doc.totalMoneyIn == null) doc.totalMoneyIn = Number(m.totalMoneyIn) || 0;
    if (doc.totalMoneyOut == null) doc.totalMoneyOut = Number(m.totalMoneyOut) || 0;
  }
  if (tableName === 'products') {
    const status = row.status == null ? '' : String(row.status).toLowerCase();
    if (!status || status === 'active') { doc.active = true; if (!status) doc.status = 'active'; }
    else if (['inactive','archived','deleted','draft'].includes(status)) doc.active = false;
    else doc.active = true;
  }
  return doc;
}

export interface QueryFilter { field: string; op: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'like'; value: unknown; }
export interface QueryOptions { filters?: QueryFilter[]; orderBy?: { field: string; ascending?: boolean }; limit?: number; offset?: number; }

function parsePath(path: string): { businessId: string | null; table: string } {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 3 && parts[0] === 'businesses') {
    return { businessId: parts[1], table: tableForCollection(parts[parts.length - 1]) };
  }
  return { businessId: null, table: tableForCollection(parts[parts.length - 1] || path) };
}

export async function fetchDocs<T = any>(collectionPath: string, options: QueryOptions = {}): Promise<T[]> {
  const { businessId, table } = parsePath(collectionPath);
  const supabase = getSupabase();
  let queryBuilder = supabase.from(table).select('*');
  if (businessId) queryBuilder = queryBuilder.eq('business_id', businessId);
  if (options.filters) {
    for (const filter of options.filters) {
      const colName = camelToSnake(filter.field);
      switch (filter.op) {
        case '=': queryBuilder = queryBuilder.eq(colName, filter.value); break;
        case '!=': queryBuilder = queryBuilder.neq(colName, filter.value); break;
        case '>': queryBuilder = queryBuilder.gt(colName, filter.value); break;
        case '>=': queryBuilder = queryBuilder.gte(colName, filter.value); break;
        case '<': queryBuilder = queryBuilder.lt(colName, filter.value); break;
        case '<=': queryBuilder = queryBuilder.lte(colName, filter.value); break;
        case 'in': queryBuilder = queryBuilder.in(colName, filter.value as unknown[]); break;
        case 'like': queryBuilder = queryBuilder.ilike(colName, filter.value as string); break;
      }
    }
  }
  if (options.orderBy) {
    queryBuilder = queryBuilder.order(camelToSnake(options.orderBy.field), { ascending: options.orderBy.ascending ?? true });
  }
  if (options.limit) queryBuilder = queryBuilder.limit(options.limit);
  if (options.offset) queryBuilder = queryBuilder.range(options.offset, options.offset + (options.limit || 1000) - 1);
  const { data, error } = await queryBuilder;
  if (error) { console.error(`[supabase-client-data] fetchDocs error (${table}):`, error); return []; }
  return (data || []).map((row) => toDoc(table, row)) as T[];
}

export async function fetchDoc<T = any>(collectionPath: string, docId: string): Promise<T | null> {
  const { table } = parsePath(collectionPath);
  const supabase = getSupabase();
  const { data, error } = await supabase.from(table).select('*').eq('id', docId).single();
  if (error) { console.error(`[supabase-client-data] fetchDoc error (${table}):`, error); return null; }
  return toDoc(table, data) as T;
}

export async function addDoc(collectionPath: string, data: Record<string, unknown>): Promise<string> {
  const { businessId, table } = parsePath(collectionPath);
  const supabase = getSupabase();
  const id = (data.id as string) || crypto.randomUUID();
  const row = toRow(table, data);
  row.id = id;
  if (businessId && !row.business_id) row.business_id = businessId;
  if (!row.created_at) row.created_at = new Date().toISOString();
  if (!row.updated_at && table !== 'sales' && table !== 'audit_trail') row.updated_at = new Date().toISOString();
  const { error } = await supabase.from(table).insert(row);
  if (error) {
    console.error(`[supabase-client-data] addDoc error (${table}):`, error, row);
    const err = new Error(error.message || 'Failed to save') as Error & { code?: string; details?: string };
    err.code = error.code; err.details = error.details; throw err;
  }
  return id;
}

export async function updateDoc(collectionPath: string, docId: string, data: Record<string, unknown>): Promise<void> {
  const { table } = parsePath(collectionPath);
  const supabase = getSupabase();
  const row = toRow(table, data);
  row.updated_at = new Date().toISOString();
  if (row.metadata && typeof row.metadata === 'object') {
    try {
      const { data: existing } = await supabase.from(table).select('metadata').eq('id', docId).maybeSingle();
      const prev = existing?.metadata && typeof existing.metadata === 'object' ? (existing.metadata as Record<string, unknown>) : {};
      row.metadata = { ...prev, ...(row.metadata as Record<string, unknown>) };
    } catch { /* best-effort */ }
  }
  const { error } = await supabase.from(table).update(row).eq('id', docId);
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
  const iso = toISOString(value);
  return iso ? new Date(iso) : null;
}
