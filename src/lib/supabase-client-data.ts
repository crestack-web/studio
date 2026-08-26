/**
 * supabase-client-data.ts
 * ============================================================
 * Client-side data access layer backed by Supabase PostgREST.
 *
 * Replaces direct Firestore client SDK usage in dashboard components.
 * Uses the Supabase browser client (RLS-protected) instead of
 * Firestore client SDK + initializeFirebase().
 *
 * Maps Firestore collection paths to Supabase tables and handles
 * camelCase <-> snake_case field conversion.
 *
 * Responsibilities:
 *   - Map collection paths to Supabase tables
 *   - camelCase (Firestore) <-> snake_case (Postgres) field conversion
 *   - Provide query(), addDoc(), updateDoc(), deleteDoc() equivalents
 *   - Handle date-based filtering (replaces Timestamp-based Firestore queries)
 */

import { getSupabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Table aliases (Firestore collection name -> Supabase table)
// ---------------------------------------------------------------------------

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

// Field aliases for WRITES: Firestore field name -> column name
const WRITE_ALIASES: Record<string, Record<string, string>> = {
  products: {
    stock: 'stock_level',
    quantity: 'stock_level',
    stockLevel: 'stock_level',
    costPrice: 'cost',
    sellingPrice: 'price',
    reorderLevel: 'reorder_level',
    imageUrl: 'image_url',
  },
  sales: {
    products: 'items',
    totalRevenue: 'total_revenue',
    paymentMethod: 'payment_method',
    paymentType: 'metadata',
    businessId: 'business_id',
    customerId: 'customer_id',
    createdAt: 'created_at',
  },
  customers: { isActive: 'active' },
  expenses: { timestamp: 'metadata', receiptUrl: 'receipt_url' },
  bank_accounts: { isActive: 'active' },
  staff: { lastSaleAt: 'last_sale_at' },
};

// Read-side aliases: column name -> extra camelCase keys to expose
const READ_ALIASES: Record<string, Record<string, string[]>> = {
  products: {
    stock_level: ['stock', 'quantity', 'stockLevel'],
    price: ['sellingPrice'],
    cost: ['costPrice'],
    status: ['status', 'active'],
    image_url: ['imageUrl'],
    reorder_level: ['reorderLevel'],
  },
  customers: {
    active: ['active', 'isActive'],
  },
  sales: {
    payment_method: ['paymentMethod', 'paymentType'],
    total_revenue: ['totalRevenue', 'total', 'totalAmount'],
    total_amount: ['totalAmount', 'total', 'totalRevenue'],
    items: ['products', 'items'],
    created_at: ['createdAt'],
  },
  businesses: {
    owner_id: ['ownerId'],
    logo_url: ['logoUrl'],
  },
  bank_accounts: {
    is_active: ['isActive'],
  },
  staff: {
    last_sale_at: ['lastSaleAt'],
  },
};

// Special status fields that get aliased
const SPECIAL_STATUS_FIELDS: Record<string, string> = {
  products: 'active',
};

// ---------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------

function camelToSnake(s: string): string {
  return s
    .replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`)
    .replace(/-/g, '_')
    .replace(/^_/, '');
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function tableForCollection(collection: string): string {
  const direct = TABLE_ALIASES[collection];
  if (direct) return direct;
  return camelToSnake(collection);
}

/**
 * Convert a Firestore-style document to a Supabase row.
 * Fields not in the schema are parked in `metadata` jsonb.
 */
function toRow(
  tableName: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const aliases = WRITE_ALIASES[tableName] || {};
  const row: Record<string, unknown> = {};
  const metadata: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip internal Firestore fields
    if (key === 'id' || key === 'businessId' || key === '__name__') continue;

    // Products: callers often set boolean `active` instead of Postgres `status`
    if (tableName === 'products' && key === 'active') {
      if (typeof value === 'boolean') {
        row['status'] = value ? 'active' : 'inactive';
      } else if (typeof value === 'string') {
        row['status'] = value;
      }
      continue;
    }
    if (tableName === 'products' && key === 'status' && typeof value === 'string') {
      row['status'] = value;
      continue;
    }

    // Map field aliases
    const colName = aliases[key] || camelToSnake(key);

    // Check if this is a known column (or the table has it)
    // For now, store known columns directly, unknown in metadata
    if (KNOWN_COLUMNS[tableName]?.has(colName)) {
      row[colName] = value;
    } else if (colName === 'metadata' && typeof value === 'object' && value !== null) {
      // Merge into metadata
      Object.assign(metadata, value);
    } else {
      metadata[key] = value;
    }
  }

  // Default product status when neither status nor active was provided
  if (tableName === 'products' && row['status'] == null) {
    row['status'] = 'active';
  }

  // Sales: keep denormalized totals consistent for statement/cashflow/money pages
  if (tableName === 'sales') {
    if (row['total_revenue'] == null && data['total'] != null) {
      row['total_revenue'] = data['total'];
    }
    if (row['total_amount'] == null && row['total_revenue'] != null) {
      row['total_amount'] = row['total_revenue'];
    }
  }

  if (Object.keys(metadata).length > 0) {
    row.metadata = row.metadata
      ? { ...(row.metadata as object), ...metadata }
      : metadata;
  }

  return row;
}

/**
 * Convert a Supabase row to Firestore-style document.
 * Adds camelCase aliases for common fields.
 */
function toDoc(tableName: string, row: Record<string, unknown>): Record<string, unknown> {
  const doc: Record<string, unknown> = {};
  const aliases = READ_ALIASES[tableName] || {};

  for (const [colName, value] of Object.entries(row)) {
    // Convert snake_case key to camelCase
    const camelKey = snakeToCamel(colName);
    doc[camelKey] = value;

    // Add aliases
    if (aliases[colName]) {
      for (const alias of aliases[colName]) {
        doc[alias] = value;
      }
    }
  }

  // Special status field handling for products
  if (tableName === 'products') {
    doc.active = row.status === 'active';
  }

  return doc;
}

// Known columns per table (for field routing)
const KNOWN_COLUMNS: Record<string, Set<string>> = {
  products: new Set([
    'id', 'business_id', 'name', 'description', 'category', 'sku', 'barcode',
    'price', 'cost', 'stock_level', 'reorder_level', 'unit', 'image_url',
    'tags', 'status', 'metadata', 'created_at', 'updated_at',
  ]),
  sales: new Set([
    'id', 'business_id', 'customer_id', 'customer_name', 'items',
    'total_amount', 'total_revenue', 'profit', 'payment_method',
    'cash_received', 'change_due', 'status', 'metadata', 'created_at',
  ]),
  expenses: new Set([
    'id', 'business_id', 'category', 'amount', 'description',
    'payment_method', 'receipt_url', 'created_by', 'metadata', 'created_at',
  ]),
  customers: new Set([
    'id', 'business_id', 'name', 'email', 'phone', 'address', 'notes',
    'active', 'total_spent', 'total_visits', 'last_visit', 'metadata',
    'created_at', 'updated_at',
  ]),
  suppliers: new Set([
    'id', 'business_id', 'name', 'contact', 'email', 'phone', 'address',
    'status', 'balance', 'total_purchases', 'rating', 'notes', 'metadata',
    'created_at', 'updated_at',
  ]),
  bank_accounts: new Set([
    'id', 'business_id', 'name', 'type', 'bank_name', 'account_number',
    'routing_number', 'current_balance', 'opening_balance', 'currency',
    'active', 'is_default', 'metadata', 'created_at', 'updated_at',
  ]),
  bank_transactions: new Set([
    'id', 'business_id', 'bank_account_id', 'type', 'amount', 'balance_after',
    'description', 'category', 'reference', 'status', 'metadata',
    'created_at',
  ]),
  cash_flow: new Set([
    'id', 'business_id', 'type', 'amount', 'category', 'description',
    'payment_method', 'reference', 'entry_date', 'metadata', 'created_at',
  ]),
  transactions: new Set([
    'id', 'business_id', 'type', 'category', 'amount', 'balance_after',
    'reference', 'note', 'created_by', 'created_at', 'updated_at',
  ]),
  staff: new Set([
    'id', 'business_id', 'user_id', 'role', 'name', 'email', 'phone',
    'status', 'revenue', 'transactions', 'last_sale_at', 'metadata',
    'created_at', 'updated_at',
  ]),
  stock_receipts: new Set([
    'id', 'business_id', 'supplier_id', 'items', 'total_amount',
    'status', 'notes', 'received_at', 'metadata', 'created_at',
  ]),
  credit_customers: new Set([
    'id', 'business_id', 'customer_id', 'customer_name', 'phone',
    'current_balance', 'credit_limit', 'status', 'metadata',
    'created_at', 'updated_at',
  ]),
  credit_transactions: new Set([
    'id', 'business_id', 'credit_customer_id', 'type', 'amount',
    'balance_after', 'description', 'reference', 'status', 'metadata',
    'created_at',
  ]),
  audit_trail: new Set([
    'id', 'business_id', 'user_id', 'action', 'entity_type', 'entity_id',
    'details', 'ip_address', 'created_at',
  ]),
  stock_locations: new Set([
    'id', 'business_id', 'name', 'type', 'address', 'active', 'metadata',
    'created_at', 'updated_at',
  ]),
  stock_transfers: new Set([
    'id', 'business_id', 'product_id', 'from_location', 'to_location',
    'quantity', 'status', 'notes', 'metadata', 'created_at',
  ]),
  invoices: new Set([
    'id', 'business_id', 'type', 'amount', 'status', 'items',
    'customer_id', 'metadata', 'created_at',
  ]),
};

// ---------------------------------------------------------------------------
// Core data access functions
// ---------------------------------------------------------------------------

export interface QueryFilter {
  field: string;
  op: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'like';
  value: unknown;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: { field: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

/**
 * Parse a Firestore-style collection path into { businessId, table }.
 * Supports: `businesses/{bid}/collectionName` or just `collectionName`.
 */
function parsePath(path: string): { businessId: string | null; table: string } {
  const parts = path.split('/');

  if (parts.length >= 3 && parts[0] === 'businesses') {
    const businessId = parts[1];
    const collection = parts[2];
    // Handle nested like `businesses/{bid}/branches/{branchId}/products`
    if (parts.length > 3) {
      return { businessId, table: tableForCollection(collection) };
    }
    return { businessId, table: tableForCollection(collection) };
  }

  // Top-level collection (e.g., 'users')
  return { businessId: null, table: tableForCollection(parts[parts.length - 1]) };
}

/**
 * Fetch documents from a Supabase table, matching Firestore query patterns.
 *
 * Usage:
 *   const products = await fetchDocs('businesses/' + bid + '/products', {
 *     filters: [{ field: 'status', op: '=', value: 'active' }],
 *     orderBy: { field: 'created_at', ascending: false },
 *   });
 */
export async function fetchDocs<T = any>(
  collectionPath: string,
  options: QueryOptions = {}
): Promise<T[]> {
  const { businessId, table } = parsePath(collectionPath);
  const supabase = getSupabase();

  let queryBuilder = supabase.from(table).select('*');

  // Filter by business_id if in a subcollection
  if (businessId) {
    queryBuilder = queryBuilder.eq('business_id', businessId);
  }

  // Apply additional filters
  if (options.filters) {
    for (const filter of options.filters) {
      const colName = camelToSnake(filter.field);
      switch (filter.op) {
        case '=':
          queryBuilder = queryBuilder.eq(colName, filter.value);
          break;
        case '!=':
          queryBuilder = queryBuilder.neq(colName, filter.value);
          break;
        case '>':
          queryBuilder = queryBuilder.gt(colName, filter.value);
          break;
        case '>=':
          queryBuilder = queryBuilder.gte(colName, filter.value);
          break;
        case '<':
          queryBuilder = queryBuilder.lt(colName, filter.value);
          break;
        case '<=':
          queryBuilder = queryBuilder.lte(colName, filter.value);
          break;
        case 'in':
          queryBuilder = queryBuilder.in(colName, filter.value as unknown[]);
          break;
        case 'like':
          queryBuilder = queryBuilder.ilike(colName, filter.value as string);
          break;
      }
    }
  }

  // Order by (normalize camelCase field names to snake_case columns)
  if (options.orderBy) {
    const orderField = camelToSnake(options.orderBy.field);
    queryBuilder = queryBuilder.order(orderField, {
      ascending: options.orderBy.ascending ?? true,
    });
  }

  // Limit
  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  // Offset
  if (options.offset) {
    queryBuilder = queryBuilder.range(
      options.offset,
      options.offset + (options.limit || 1000) - 1
    );
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error(`[supabase-client-data] fetchDocs error (${table}):`, error);
    return [];
  }

  return (data || []).map((row) => toDoc(table, row)) as T[];
}

/**
 * Fetch a single document by ID.
 */
export async function fetchDoc<T = any>(
  collectionPath: string,
  docId: string
): Promise<T | null> {
  const { table } = parsePath(collectionPath);
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', docId)
    .single();

  if (error) {
    console.error(`[supabase-client-data] fetchDoc error (${table}):`, error);
    return null;
  }

  return toDoc(table, data) as T;
}

/**
 * Add a new document to a Supabase table.
 * Auto-generates an ID if not provided.
 */
export async function addDoc(
  collectionPath: string,
  data: Record<string, unknown>
): Promise<string> {
  const { businessId, table } = parsePath(collectionPath);
  const supabase = getSupabase();

  // Auto-generate ID
  const id = data.id as string || crypto.randomUUID();

  // Convert to row format
  const row = toRow(table, data);

  // Add ID and business_id
  row.id = id;
  if (businessId && !row.business_id) {
    row.business_id = businessId;
  }

  // Ensure timestamps
  if (!row.created_at) {
    row.created_at = new Date().toISOString();
  }
  if (!row.updated_at && table !== 'sales' && table !== 'audit_trail') {
    row.updated_at = new Date().toISOString();
  }

  const { error } = await supabase.from(table).insert(row);

  if (error) {
    console.error(`[supabase-client-data] addDoc error (${table}):`, error);
    throw error;
  }

  return id;
}

/**
 * Update an existing document.
 */
export async function updateDoc(
  collectionPath: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const { table } = parsePath(collectionPath);
  const supabase = getSupabase();

  const row = toRow(table, data);

  // Always update updated_at
  row.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from(table)
    .update(row)
    .eq('id', docId);

  if (error) {
    console.error(`[supabase-client-data] updateDoc error (${table}):`, error);
    throw error;
  }
}

/**
 * Delete a document.
 */
export async function deleteDoc(
  collectionPath: string,
  docId: string
): Promise<void> {
  const { table } = parsePath(collectionPath);
  const supabase = getSupabase();

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', docId);

  if (error) {
    console.error(`[supabase-client-data] deleteDoc error (${table}):`, error);
    throw error;
  }
}

/**
 * Execute multiple operations as a batch (using Supabase RPC if available,
 * or sequential operations with error handling).
 *
 * NOTE: Supabase does not support client-side transactions natively.
 * This is a best-effort batch that runs operations sequentially.
 * For true atomicity, use server-side API routes.
 */
export async function runBatch(
  operations: Array<{
    type: 'add' | 'update' | 'delete';
    path: string;
    id?: string;
    data?: Record<string, unknown>;
  }>
): Promise<void> {
  for (const op of operations) {
    switch (op.type) {
      case 'add':
        if (op.data) await addDoc(op.path, op.data);
        break;
      case 'update':
        if (op.id && op.data) await updateDoc(op.path, op.id, op.data);
        break;
      case 'delete':
        if (op.id) await deleteDoc(op.path, op.id);
        break;
    }
  }
}

/**
 * Convert a Firestore Timestamp-like value to an ISO string.
 * Handles: Date, { toDate(): Date }, { seconds, nanoseconds }, string, null.
 */
export function toISOString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toDate === 'function') return (obj.toDate as () => Date)().toISOString();
    if (typeof obj.seconds === 'number') {
      const ms = obj.seconds * 1000 + (obj.nanoseconds as number || 0) / 1_000_000;
      return new Date(ms).toISOString();
    }
  }
  return null;
}

/**
 * Convert an ISO string to a Date, handling Firestore Timestamp-like values.
 */
export function toDate(value: unknown): Date | null {
  const iso = toISOString(value);
  if (!iso) return null;
  return new Date(iso);
}
