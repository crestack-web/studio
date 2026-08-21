/**
 * supabase-firestore.ts
 * ============================================================
 * Firestore-compatible data facade backed by Supabase Postgres.
 *
 * The app was originally written against the Firestore SDK. This module
 * exposes the small subset of the Firestore API that the server-side code
 * actually uses (`db.collection(...).doc(...).get/set/update/delete`,
 * `query.where().orderBy().limit().get()`, `db.runTransaction(...)` and the
 * `admin.firestore.FieldValue` / `admin.firestore.Timestamp` sentinels) and
 * translates every call into PostgREST queries via the service-role client.
 *
 * Responsibilities:
 *   * map Firestore collection paths to Supabase tables
 *     (e.g. `businesses/{id}/products` -> `products` where business_id = id)
 *   * camelCase (Firestore) <-> snake_case (Postgres) field conversion
 *   * drop / park unknown fields into the `metadata` jsonb column
 *   * translate firebase uids <-> supabase uuids using auth-users.json
 *   * convert FieldValue/Timestamp sentinels to plain values
 *   * re-hydrate rows into camelCase objects (with `.toDate()` timestamps)
 *
 * This is a cutover shim: it lets the whole server-side data layer read and
 * write Supabase without touching 30+ call sites. It is intentionally
 * best-effort for transactional semantics (no true multi-row atomicity).
 */

import { getSupabaseAdmin } from '@/lib/supabase-server';
import { readFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Path / collection aliases (Firestore collection name -> Supabase table)
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
  subscriptionTransactions: 'subscription_transactions',
  businessVerifications: 'business_verifications',
  supportTickets: 'support_tickets',
  supportMessages: 'support_messages',
  supportAgents: 'support_agents',
  chatConversations: 'chat_conversations',
  chatMessages: 'chat_messages',
  staffPermissions: 'staff_permissions',
  referralCodes: 'referral_codes',
  referralEarnings: 'referral_earnings',
  referralTransactions: 'referral_earnings',
  referralStats: 'referral_stats',
  referralPayouts: 'referral_payouts',
  marketProducts: 'market_products',
  marketCategories: 'market_categories',
  storeProducts: 'store_products',
  storeCollections: 'store_collections',
  storeOrders: 'store_orders',
  storeAnalytics: 'store_analytics',
  storeShippingZones: 'store_shipping_zones',
  subscriptionPlans: 'plans',
  adminUsers: 'admins',
};

// Collections that have no Supabase table; stored as arrays inside the parent
// document's `metadata` jsonb (key = `__sub_<snake>`).
const META_SUBCOLLECTIONS = new Set([
  'mo_usage',
  'wasteRecords',
  'categories',
  'pageViews',
  'moLearning',
  'page_visits',
]);

// Field aliases for WRITES: Firestore field name -> column name.
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
  users: {
    displayName: 'full_name',
    photoURL: 'avatar_url',
    firebaseUid: 'firebase_uid',
    emailVerified: 'email_verified',
  },
  expenses: { timestamp: 'metadata', receiptUrl: 'receipt_url' },
  purchases: { purchaseDate: 'metadata', status: 'status' },
  cash_flow: { date: 'entry_date' },
  cashFlow: { date: 'entry_date' },
  audit_trail: {
    newValues: 'details',
    timestamp: 'created_at',
    ipAddress: 'metadata',
  },
  productsMeta: {},
};

// Read-side column aliases: column name -> extra camelCase keys to expose.
// e.g. stock_level surfaces as `stock` and `quantity`; products.active is
// derived from the `status` column.
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
    name: ['name'],
  },
  users: {
    full_name: ['fullName', 'displayName', 'name'],
    avatar_url: ['photoURL', 'avatarUrl'],
    email_verified: ['emailVerified'],
  },
  sales: {
    payment_method: ['paymentMethod', 'paymentType'],
    total_revenue: ['totalRevenue'],
    items: ['products', 'items'],
  },
  businesses: {
    owner_id: ['ownerId'],
    logo_url: ['logoUrl'],
  },
};

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
  const snake = camelToSnake(collection);
  return snake;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Schema cache (PostgREST OpenAPI) + auth mapping
// ---------------------------------------------------------------------------

interface ColumnMeta {
  type?: string;
  format?: string;
}

type SchemaMap = Record<string, Record<string, ColumnMeta>>;

let schemaCache: SchemaMap | null = null;
let schemaPromise: Promise<SchemaMap> | null = null;

async function getSchema(): Promise<SchemaMap> {
  if (schemaCache) return schemaCache;
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
    const admin = getSupabaseAdmin();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/openapi+json',
      },
    });
    if (!res.ok) throw new Error(`Supabase schema fetch failed (${res.status})`);
    const doc = await res.json();
    const schemas = doc.components?.schemas || doc.definitions || {};
    const out: SchemaMap = {};
    for (const [name, s] of Object.entries<any>(schemas)) {
      const props = s.properties || {};
      out[name.toLowerCase()] = Object.fromEntries(
        Object.entries<any>(props).map(([col, meta]) => [
          col,
          { type: meta.type, format: meta.format },
        ])
      );
    }
    return out;
  })();
  return schemaPromise;
}

async function getTableColumns(table: string): Promise<Record<string, ColumnMeta>> {
  const schema = await getSchema();
  return schema[table] || {};
}

let authMap: Record<string, string> | null = null;
let reverseMap: Record<string, string> | null = null;
let authMapPromise: Promise<void> | null = null;

function loadAuthMap(): Promise<void> {
  if (authMap) return Promise.resolve();
  if (authMapPromise) return authMapPromise;
  authMapPromise = (async () => {
    try {
      const ROOT = path.resolve(process.cwd());
      const raw = await readFile(
        path.join(ROOT, 'supabase', 'migration-data', 'auth-users.json'),
        'utf8'
      );
      authMap = JSON.parse(raw);
      reverseMap = {};
      for (const [fb, sb] of Object.entries(authMap!)) reverseMap[sb] = fb;
    } catch {
      authMap = {};
      reverseMap = {};
    }
  })();
  return authMapPromise;
}

function toSupabaseUid(uid: string): string {
  if (!uid) return uid;
  if (UUID_RE.test(uid)) return uid;
  return authMap?.[uid] || uid;
}

function toFirebaseUid(uid: string): string {
  if (!uid) return uid;
  return reverseMap?.[uid] || uid;
}

// ---------------------------------------------------------------------------
// Timestamp / sentinel handling
// ---------------------------------------------------------------------------

export class FdbTimestamp {
  seconds: number;
  nanoseconds: number;

  constructor(secondsOrIso: number | string, nanoseconds = 0) {
    if (typeof secondsOrIso === 'string') {
      const d = new Date(secondsOrIso);
      this.seconds = Math.floor(d.getTime() / 1000);
      this.nanoseconds = (d.getMilliseconds() % 1000) * 1e6;
    } else {
      this.seconds = secondsOrIso;
      this.nanoseconds = nanoseconds;
    }
  }

  toDate(): Date {
    return new Date(this.seconds * 1000);
  }
  toMillis(): number {
    return this.seconds * 1000;
  }
  static now(): FdbTimestamp {
    return new FdbTimestamp(Date.now() / 1000);
  }
}

interface IncrementOp {
  __increment: number;
}
interface ServerTsOp {
  __serverTimestamp: true;
}

function isFirebaseFieldValue(v: any): boolean {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof v._methodName === 'string' &&
    v._methodName.length > 0
  );
}

function translateWriteValue(v: any): any {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if (isFirebaseFieldValue(v)) {
      if (v._methodName === 'serverTimestamp') return { __serverTimestamp: true } as ServerTsOp;
      if (v._methodName === 'increment') {
        const n = v._operand ?? v._value ?? v.operand;
        return { __increment: Number(n) } as IncrementOp;
      }
      // arrayUnion / arrayRemove: Postgres jsonb handles plain arrays, so
      // serialize the operand list.
      const operand = v._operand ?? v._value ?? v.operand;
      return Array.isArray(operand) ? operand : operand;
    }
    // Firebase Timestamp
    if (typeof v.toDate === 'function' && typeof v.seconds === 'number') {
      return v.toDate().toISOString();
    }
    if (Array.isArray(v)) return v.map(translateWriteValue);
  }
  return v;
}

function isIncrementOp(v: any): v is IncrementOp {
  return !!v && typeof v === 'object' && '__increment' in v;
}
function isServerTsOp(v: any): v is ServerTsOp {
  return !!v && typeof v === 'object' && '__serverTimestamp' in v;
}

// ---------------------------------------------------------------------------
// Path parsing
// ---------------------------------------------------------------------------

interface ParsedPath {
  table: string | null;
  isMetaSub?: boolean;
  mayBeMeta?: boolean;
  metaKey?: string;
  parentTable?: string;
  parentKey?: string;
  parentValue?: string;
  keyColumn?: string; // 'id' | 'business_id' | 'user_id'
  keyValue?: string;
}

function splitPath(p: string): string[] {
  return p.split('/').filter((s) => s.length > 0);
}

// Resolve a Firestore path into a table target.
// Supports:
//   top-level        users, businesses, plans ...
//   doc              users/{uid}, businesses/{bid}
//   subcollection    businesses/{bid}/{coll}  |  users/{uid}/{coll}
//   sub-doc          businesses/{bid}/{coll}/{id}
function resolvePath(pathStr: string): ParsedPath {
  const segs = splitPath(pathStr);

  // top-level collection
  if (segs.length === 1) {
    return { table: tableForCollection(segs[0]), isMetaSub: false };
  }

  // doc in top-level collection
  if (segs.length === 2) {
    return {
      table: tableForCollection(segs[0]),
      isMetaSub: false,
      keyColumn: 'id',
      keyValue: segs[1],
    };
  }

  // subcollection under a parent doc
  if (segs.length === 3) {
    const coll = segs[2];
    const parentValue = segs[1];
    return {
      table: tableForCollection(coll),
      mayBeMeta: META_SUBCOLLECTIONS.has(coll),
      metaKey: `__sub_${camelToSnake(coll)}`,
      parentTable: tableForCollection(segs[0]),
      parentKey: segs[0] === 'users' ? 'user_id' : 'business_id',
      parentValue,
    };
  }

  // doc inside subcollection
  if (segs.length === 4) {
    const coll = segs[2];
    return {
      table: tableForCollection(coll),
      mayBeMeta: META_SUBCOLLECTIONS.has(coll),
      metaKey: `__sub_${camelToSnake(coll)}`,
      parentTable: tableForCollection(segs[0]),
      parentKey: segs[0] === 'users' ? 'user_id' : 'business_id',
      parentValue: segs[1],
      keyColumn: 'id',
      keyValue: segs[3],
    };
  }

  throw new Error(`Unsupported Firestore path: ${pathStr}`);
}

// Async target resolution: a subcollection is stored in parent metadata when
// its table does not exist in the schema (e.g. wasteRecords, mo_usage).
async function resolveTarget(parsed: ParsedPath): Promise<ParsedPath> {
  const canMeta = !!parsed.parentTable;
  if (!parsed.mayBeMeta && parsed.table) {
    const cols = await getTableColumns(parsed.table);
    if (cols && Object.keys(cols).length > 0) {
      return { ...parsed, isMetaSub: false };
    }
    if (!canMeta) {
      throw new Error(`Unknown Supabase table: ${parsed.table}`);
    }
    return { ...parsed, table: null, isMetaSub: true };
  }
  if (canMeta) {
    return { ...parsed, table: null, isMetaSub: true };
  }
  throw new Error(`Unknown collection path: ${parsed.table}`);
}

// ---------------------------------------------------------------------------
// Field mapping
// ---------------------------------------------------------------------------

function columnNameFor(cols: Record<string, ColumnMeta>, table: string, field: string): string | null {
  const snake = camelToSnake(field);
  if (snake in cols) return snake;
  const alias = WRITE_ALIASES[table]?.[field];
  if (alias && alias !== 'metadata' && alias in cols) return alias;
  return null;
}

function isUuidColumn(cols: Record<string, ColumnMeta>, col: string): boolean {
  return cols[col]?.format === 'uuid';
}

function coerceForColumn(cols: Record<string, ColumnMeta>, col: string, v: any): any {
  const meta = cols[col];
  if (!meta) return v;
  if (meta.format === 'uuid' && typeof v === 'string') return toSupabaseUid(v);
  return v;
}

function mapWriteFields(
  cols: Record<string, ColumnMeta>,
  table: string,
  data: Record<string, any>
): { columnData: Record<string, any>; metaData: Record<string, any>; hasMetadataCol: boolean } {
  const hasMetadataCol = 'metadata' in cols;
  const columnData: Record<string, any> = {};
  const metaData: Record<string, any> = {};

  for (const [field, raw] of Object.entries(data)) {
    if (field === 'id' || field === '_id') continue;
    let v = translateWriteValue(raw);
    if (v === null || v === undefined || isServerTsOp(v)) continue;

    // products.active -> status column
    if (table === 'products' && field === 'active') {
      columnData.status = v === true || v === 'active' || v === 1 ? 'active' : 'inactive';
      continue;
    }

    const col = columnNameFor(cols, table, field);
    if (col) {
      if (isIncrementOp(v)) {
        columnData[col] = v; // resolved during apply
      } else {
        columnData[col] = coerceForColumn(cols, col, v);
      }
      continue;
    }

    // park into metadata
    if (hasMetadataCol) {
      metaData[camelToSnake(field)] = isIncrementOp(v) ? v : v;
    }
    // else: dropped (mirrors import behaviour)
  }

  return { columnData, metaData, hasMetadataCol };
}

function mapReadRow(cols: Record<string, ColumnMeta>, table: string, row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};

  for (const [col, value] of Object.entries(row)) {
    if (col === 'metadata') continue;
    const camel = snakeToCamel(col);
    let v = value;
    const meta = cols[col];
    if (meta && (meta.format === 'timestamp with time zone' || meta.format === 'timestamp without time zone')) {
      if (typeof v === 'string') v = new FdbTimestamp(v);
    } else if (meta && meta.format === 'date') {
      if (typeof v === 'string') v = new FdbTimestamp(v);
    }
    if (meta?.format === 'uuid' && typeof v === 'string') v = toFirebaseUid(v);
    out[camel] = v;

    // read aliases
    const aliases = READ_ALIASES[table]?.[col];
    if (aliases) {
      for (const a of aliases) {
        if (a === 'active') {
          out[a] = typeof value === 'string' ? value === 'active' : !!value;
        } else if (a === 'products' && col === 'items') {
          out[a] = value;
        } else {
          out[a] = out[camel];
        }
      }
    }
  }

  // merge metadata jsonb (snake_case keys -> camelCase) into the doc
  if (row.metadata && typeof row.metadata === 'object') {
    for (const [k, v] of Object.entries(row.metadata)) {
      const camel = snakeToCamel(k);
      out[camel] = v;
    }
  }

  // products: surface `status` column also as `active` boolean
  if (table === 'products' && out.status !== undefined && out.active === undefined) {
    out.active = out.status === 'active';
  }

  return out;
}

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

class DocumentSnapshot {
  constructor(
    public ref: DocumentReference,
    public exists: boolean,
    private dataValue: Record<string, any> | null
  ) {}

  data(): any {
    return this.dataValue ? { ...this.dataValue } : null;
  }
  get id(): string {
    return this.ref.id;
  }
}

class QuerySnapshot {
  private _docs: DocumentSnapshot[];

  constructor(
    ref: Query | CollectionReference,
    rows: { id: string; data: Record<string, any> }[]
  ) {
    this._docs = rows.map((r) => {
      const docRef =
        ref instanceof CollectionReference
          ? new DocumentReference(ref.path + '/' + r.id)
          : ref.asDocRef(r.id);
      return new DocumentSnapshot(docRef, true, r.data);
    });
  }

  get empty(): boolean {
    return this._docs.length === 0;
  }
  get size(): number {
    return this._docs.length;
  }
  get docs(): DocumentSnapshot[] {
    return [...this._docs];
  }
  forEach(cb: (doc: DocumentSnapshot) => void): void {
    this._docs.forEach(cb);
  }
}

// ---------------------------------------------------------------------------
// References / Query
// ---------------------------------------------------------------------------

export class DocumentReference {
  public path: string;

  constructor(pathStr: string) {
    this.path = pathStr;
  }

  get id(): string {
    const segs = splitPath(this.path);
    return segs[segs.length - 1];
  }

  collection(collectionPath: string): CollectionReference {
    return new CollectionReference(`${this.path}/${collectionPath}`);
  }

  async get(): Promise<DocumentSnapshot> {
    const parsed = await resolveTarget(resolvePath(this.path));
    const cols = await getTableColumns(parsed.table || '');

    if (parsed.isMetaSub) {
      return readMetaDoc(parsed);
    }
    const table = parsed.table!;

    // users may be addressed by firebase uid directly (id column is a uuid)
    if (table === 'users' && parsed.keyValue && !UUID_RE.test(parsed.keyValue)) {
      await loadAuthMap();
      const fbUid = parsed.keyValue;
      const sbUid = authMap?.[fbUid];
      if (sbUid) {
        const mapped = await getSupabaseAdmin()
          .from('users')
          .select('*')
          .eq('id', sbUid)
          .maybeSingle();
        if (mapped.error) console.error(`[supabase-firestore] get ${this.path} (auth-map):`, mapped.error.message);
        if (mapped.data) {
          return new DocumentSnapshot(this, true, mapReadRow(cols, table, mapped.data));
        }
      }
      const alt = await getSupabaseAdmin()
        .from('users')
        .select('*')
        .eq('firebase_uid', parsed.keyValue)
        .maybeSingle();
      if (alt.error) console.error(`[supabase-firestore] get ${this.path} (firebase_uid):`, alt.error.message);
      if (alt.data) {
        return new DocumentSnapshot(this, true, mapReadRow(cols, table, alt.data));
      }
      return new DocumentSnapshot(this, false, null);
    }

    let query = getSupabaseAdmin().from(table).select('*').eq('id', parsed.keyValue!);
    if (parsed.parentKey && parsed.parentValue) {
      query = query.eq(parsed.parentKey, parsed.parentValue);
    }
    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error(`[supabase-firestore] get ${this.path}:`, error.message);
    }
    if (!data) {
      // fallback: users may be addressed by firebase uid (auth-map or firebase_uid)
      if (table === 'users' && parsed.keyValue) {
        await loadAuthMap();
        const fbUid = parsed.keyValue;
        const sbUid = authMap?.[fbUid];
        if (sbUid) {
          const mapped = await getSupabaseAdmin()
            .from('users')
            .select('*')
            .eq('id', sbUid)
            .maybeSingle();
          if (mapped.error) console.error(`[supabase-firestore] get ${this.path} (auth-map):`, mapped.error.message);
          if (mapped.data) {
            return new DocumentSnapshot(this, true, mapReadRow(cols, table, mapped.data));
          }
        }
        const alt = await getSupabaseAdmin()
          .from('users')
          .select('*')
          .eq('firebase_uid', parsed.keyValue)
          .maybeSingle();
        if (alt.error) console.error(`[supabase-firestore] get ${this.path} (firebase_uid):`, alt.error.message);
        if (alt.data) {
          return new DocumentSnapshot(this, true, mapReadRow(cols, table, alt.data));
        }
      }
      return new DocumentSnapshot(this, false, null);
    }
    return new DocumentSnapshot(this, true, mapReadRow(cols, table, data));
  }

  async set(data: Record<string, any>, options?: { merge?: boolean }): Promise<void> {
    const parsed = await resolveTarget(resolvePath(this.path));
    if (parsed.isMetaSub) {
      return writeMetaDoc(parsed, data, 'set');
    }
    const table = parsed.table!;
    const cols = await getTableColumns(table);
    const { columnData, metaData, hasMetadataCol } = mapWriteFields(cols, table, data);
    const row: Record<string, any> = { ...columnData, id: parsed.keyValue };
    if (parsed.parentKey && parsed.parentKey !== 'id' && parsed.parentValue) row[parsed.parentKey] = parsed.parentValue;
    if (hasMetadataCol && Object.keys(metaData).length > 0) row.metadata = metaData;

    let builder = getSupabaseAdmin().from(table).insert({ ...row });
    const res = await builder.select();
    if (res.error) {
      // PK conflict -> fall back to upsert
      if (res.error.code === '23505' && options?.merge) {
        const up = await applyUpdate(table, parsed.keyValue!, data);
        if (up.error) {
          const msg = `[supabase-firestore] set ${this.path}: ${up.error.message}`;
          console.error(msg);
          throw new Error(msg);
        }
      } else if (res.error.code === '23505') {
        // existing doc, no merge: replace (delete then insert)
        await getSupabaseAdmin().from(table).delete().eq('id', parsed.keyValue!);
        const r2 = await getSupabaseAdmin().from(table).insert({ ...row }).select();
        if (r2.error) {
          const msg = `[supabase-firestore] set ${this.path}: ${r2.error.message}`;
          console.error(msg);
          throw new Error(msg);
        }
      } else {
        const msg = `[supabase-firestore] set ${this.path}: ${res.error.message}`;
        console.error(msg);
        throw new Error(msg);
      }
    }
  }

  async update(data: Record<string, any>): Promise<void> {
    const parsed = await resolveTarget(resolvePath(this.path));
    if (parsed.isMetaSub) {
      return writeMetaDoc(parsed, data, 'update');
    }
    const table = parsed.table!;
    const res = await applyUpdate(table, parsed.keyValue!, data);
    if (res.error) {
      const msg = `[supabase-firestore] update ${this.path}: ${res.error.message}`;
      console.error(msg);
      throw new Error(msg);
    }
  }

  async delete(): Promise<void> {
    const parsed = await resolveTarget(resolvePath(this.path));
    if (parsed.isMetaSub) {
      const parent = await getParentRow(parsed);
      if (!parent) return;
      const meta = parent.metadata || {};
      const arr = Array.isArray(meta[parsed.metaKey!]) ? meta[parsed.metaKey!] : [];
      meta[parsed.metaKey!] = arr.filter((x: any) => x.id !== parsed.keyValue);
      const res = await getSupabaseAdmin()
        .from(parsed.parentTable!)
        .update({ metadata: meta })
        .eq('id', parsed.parentValue!);
      if (res.error) {
        const msg = `[supabase-firestore] delete ${this.path}: ${res.error.message}`;
        console.error(msg);
        throw new Error(msg);
      }
      return;
    }
    const table = parsed.table!;
    const { error } = await getSupabaseAdmin()
      .from(table)
      .delete()
      .eq('id', parsed.keyValue!);
    if (error) {
      const msg = `[supabase-firestore] delete ${this.path}: ${error.message}`;
      console.error(msg);
      throw new Error(msg);
    }
  }
}

export class CollectionReference {
  public path: string;

  constructor(pathStr: string) {
    this.path = pathStr;
  }

  get id(): string {
    const segs = splitPath(this.path);
    return segs[segs.length - 1];
  }

  doc(id?: string): DocumentReference {
    return new DocumentReference(id ? `${this.path}/${id}` : `${this.path}/${randomUUID()}`);
  }

  async add(data: Record<string, any>): Promise<DocumentReference> {
    const docRef = this.doc();
    await docRef.set(data);
    return docRef;
  }

  where(field: string, op: string, value: any): Query {
    return new Query(this).where(field, op, value);
  }
  orderBy(field: string, dir?: 'asc' | 'desc'): Query {
    return new Query(this).orderBy(field, dir);
  }
  limit(n: number): Query {
    return new Query(this).limit(n);
  }
  async get(): Promise<QuerySnapshot> {
    return new Query(this).get();
  }
}

type WhereClause = { field: string; op: string; value: any };
type OrderClause = { field: string; dir: 'asc' | 'desc' };

export class Query {
  private clauses: WhereClause[] = [];
  private orders: OrderClause[] = [];
  private limitN: number | null = null;

  constructor(private base: CollectionReference) {}

  where(field: string, op: string, value: any): Query {
    const q = new Query(this.base);
    q.clauses = [...this.clauses, { field, op, value }];
    q.orders = [...this.orders];
    q.limitN = this.limitN;
    return q;
  }
  orderBy(field: string, dir: 'asc' | 'desc' = 'asc'): Query {
    const q = new Query(this.base);
    q.clauses = [...this.clauses];
    q.orders = [...this.orders, { field, dir }];
    q.limitN = this.limitN;
    return q;
  }
  limit(n: number): Query {
    const q = new Query(this.base);
    q.clauses = [...this.clauses];
    q.orders = [...this.orders];
    q.limitN = n;
    return q;
  }

  asDocRef(id: string): DocumentReference {
    return new DocumentReference(`${this.base.path}/${id}`);
  }

  async get(): Promise<QuerySnapshot> {
    const parsed = await resolveTarget(resolvePath(this.base.path));
    const rows = await executeQuery(parsed, this.clauses, this.orders, this.limitN);
    return new QuerySnapshot(this.base, rows);
  }
}

async function executeQuery(
  parsed: ParsedPath,
  clauses: WhereClause[],
  orders: OrderClause[],
  limitN: number | null
): Promise<{ id: string; data: Record<string, any> }[]> {
  if (parsed.isMetaSub) {
    return readMetaCollection(parsed, clauses, orders, limitN);
  }

  const table = parsed.table!;
  const cols = await getTableColumns(table);
  let builder = getSupabaseAdmin().from(table).select('*');

  if (parsed.parentKey && parsed.parentValue) {
    builder = builder.eq(parsed.parentKey, parsed.parentValue);
  }

  const filterParts: string[] = [];
  for (const c of clauses) {
    const col = queryColumnFor(cols, table, c.field);
    if (!col) continue;
    const v = queryValueFor(cols, table, col, c.field, c.value);
    if (v === undefined) continue;
    const op =
      c.op === '==' ? 'eq' : c.op === '>=' ? 'gte' : c.op === '<=' ? 'lte' : c.op === '>' ? 'gt' : c.op === '<' ? 'lt' : c.op === '!=' ? 'neq' : null;
    if (!op) continue;
    if (typeof v === 'boolean' || typeof v === 'number') {
      builder = builder[op as 'eq'](col, v);
    } else {
      builder = builder[op as 'eq'](col, v);
    }
  }

  for (const o of orders) {
    const col = queryColumnFor(cols, table, o.field);
    if (!col) continue;
    builder = builder.order(col, { ascending: o.dir !== 'desc' });
  }
  if (limitN !== null) builder = builder.limit(limitN);

  const { data, error } = await builder;
  if (error) {
    console.error(`[supabase-firestore] query ${table}:`, error.message);
    return [];
  }
  return (data || []).map((row: any) => ({
    id:
      table === 'users' && cols.id?.format === 'uuid'
        ? toFirebaseUid(row.id)
        : row.id,
    data: mapReadRow(cols, table, row),
  }));
}

function queryColumnFor(
  cols: Record<string, ColumnMeta>,
  table: string,
  field: string
): string | null {
  if (table === 'products' && field === 'active') return 'status';
  return columnNameFor(cols, table, field) || (camelToSnake(field) in cols ? camelToSnake(field) : null);
}

function queryValueFor(
  cols: Record<string, ColumnMeta>,
  table: string,
  col: string,
  field: string,
  value: any
): any {
  if (table === 'products' && field === 'active') {
    return value === true || value === 'active' || value === 1 ? 'active' : 'inactive';
  }
  let v = value instanceof Date ? value.toISOString() : value;
  if (isUuidColumn(cols, col) && typeof v === 'string') v = toSupabaseUid(v);
  return v;
}

// ---------------------------------------------------------------------------
// Row update helper (handles increments + metadata merging)
// ---------------------------------------------------------------------------

async function getRow(table: string, keyColumn: string, keyValue: string): Promise<Record<string, any> | null> {
  const { data } = await getSupabaseAdmin().from(table).select('*').eq(keyColumn, keyValue).maybeSingle();
  return data || null;
}

async function applyUpdate(
  table: string,
  keyValue: string,
  data: Record<string, any>
): Promise<{ error?: { message: string; code?: string } | null }> {
  const cols = await getTableColumns(table);
  const { columnData, metaData, hasMetadataCol } = mapWriteFields(cols, table, data);

  const needsIncrement =
    Object.values(columnData).some(isIncrementOp) ||
    Object.values(metaData).some(isIncrementOp);
  const needsMetaMerge = hasMetadataCol && Object.keys(metaData).length > 0 && needsIncrement;

  let current: Record<string, any> | null = null;
  if (needsIncrement) {
    current = await getRow(table, 'id', keyValue);
  }

  const final: Record<string, any> = {};
  for (const [col, v] of Object.entries(columnData)) {
    if (isIncrementOp(v)) {
      const base = current ? Number(current[col] ?? 0) : 0;
      final[col] = base + v.__increment;
    } else {
      final[col] = v;
    }
  }

  if (hasMetadataCol && Object.keys(metaData).length > 0) {
    let metaBase: Record<string, any> = {};
    if (needsMetaMerge && current?.metadata) {
      metaBase = { ...current.metadata };
    }
    for (const [k, v] of Object.entries(metaData)) {
      if (isIncrementOp(v)) {
        const base = current ? Number(metaBase[k] ?? 0) : 0;
        metaBase[k] = base + v.__increment;
      } else {
        metaBase[k] = v;
      }
    }
    final.metadata = metaBase;
  }

  if (Object.keys(final).length === 0) return {};

  const { error } = await getSupabaseAdmin()
    .from(table)
    .update(final)
    .eq('id', keyValue);
  return { error: error as any };
}

// ---------------------------------------------------------------------------
// Metadata subcollections (mo_usage, wasteRecords, ...)
// ---------------------------------------------------------------------------

async function getParentRow(parsed: ParsedPath): Promise<Record<string, any> | null> {
  const { data } = await getSupabaseAdmin()
    .from(parsed.parentTable!)
    .select('metadata')
    .eq('id', parsed.parentValue!)
    .maybeSingle();
  return data || null;
}

async function getMetaCollection(parsed: ParsedPath): Promise<any[]> {
  const parent = await getParentRow(parsed);
  const meta = parent?.metadata || {};
  const arr = meta[parsed.metaKey!];
  return Array.isArray(arr) ? arr : [];
}

async function saveMetaCollection(parsed: ParsedPath, arr: any[]): Promise<void> {
  const parent = await getParentRow(parsed);
  const meta = { ...(parent?.metadata || {}) };
  meta[parsed.metaKey!] = arr;
  await getSupabaseAdmin()
    .from(parsed.parentTable!)
    .update({ metadata: meta })
    .eq('id', parsed.parentValue!);
}

async function readMetaDoc(parsed: ParsedPath): Promise<DocumentSnapshot> {
  const arr = await getMetaCollection(parsed);
  const doc = arr.find((x) => x.id === parsed.keyValue);
  const coll = parsed.metaKey?.replace('__sub_', '') || 'collection';
  const base = parsed.parentTable === 'users' ? 'users' : 'businesses';
  const ref = new DocumentReference(
    `${base}/${parsed.parentValue}/${coll}${parsed.keyValue ? `/${parsed.keyValue}` : ''}`
  );
  if (!doc) return new DocumentSnapshot(ref, false, null);
  return new DocumentSnapshot(ref, true, doc);
}

async function writeMetaDoc(parsed: ParsedPath, data: Record<string, any>, mode: 'set' | 'update'): Promise<void> {
  const arr = await getMetaCollection(parsed);
  const id = parsed.keyValue || randomUUID();
  const existing = arr.findIndex((x) => x.id === id);
  let entry = { id, ...data };
  if (mode === 'update' && existing >= 0) {
    entry = { ...arr[existing], ...data };
  }
  if (existing >= 0) arr[existing] = entry;
  else arr.push(entry);
  await saveMetaCollection(parsed, arr);
}

async function readMetaCollection(
  parsed: ParsedPath,
  clauses: WhereClause[],
  orders: OrderClause[],
  limitN: number | null
): Promise<{ id: string; data: Record<string, any> }[]> {
  let arr = await getMetaCollection(parsed);
  for (const c of clauses) {
    if (c.op !== '==') continue;
    arr = arr.filter((x) => x[c.field] === c.value || String(x[c.field]) === String(c.value));
  }
  for (const o of orders) {
    const dir = o.dir === 'desc' ? -1 : 1;
    arr = [...arr].sort((a, b) => {
      const av = a[o.field];
      const bv = b[o.field];
      if (av == null) return 1;
      if (bv == null) return -1;
      return av > bv ? dir : av < bv ? -dir : 0;
    });
  }
  if (limitN !== null) arr = arr.slice(0, limitN);
  return arr.map((x) => ({ id: x.id, data: x }));
}

// ---------------------------------------------------------------------------
// Transactions (best-effort)
// ---------------------------------------------------------------------------

class FacadeTransaction {
  private reads = new Map<string, Promise<DocumentSnapshot>>();
  private writes: { kind: 'set' | 'update' | 'create' | 'delete'; ref: DocumentReference; data?: any }[] = [];

  constructor() {}

  get(docRef: DocumentReference): Promise<DocumentSnapshot> {
    if (!this.reads.has(docRef.path)) {
      this.reads.set(docRef.path, docRef.get());
    }
    return this.reads.get(docRef.path)!;
  }

  set(docRef: DocumentReference, data: any): void {
    this.writes.push({ kind: 'set', ref: docRef, data });
  }
  create(docRef: DocumentReference, data: any): void {
    this.writes.push({ kind: 'create', ref: docRef, data });
  }
  update(docRef: DocumentReference, data: any): void {
    this.writes.push({ kind: 'update', ref: docRef, data });
  }
  delete(docRef: DocumentReference): void {
    this.writes.push({ kind: 'delete', ref: docRef });
  }

  async commit(): Promise<void> {
    for (const w of this.writes) {
      if (w.kind === 'set' || w.kind === 'create') {
        // resolve increments against reads already cached in this txn
        const data = await this.resolveIncrements(w.ref, w.data);
        if (w.kind === 'create') {
          await createWithId(w.ref, data);
        } else {
          await w.ref.set(data);
        }
      } else if (w.kind === 'update') {
        const data = await this.resolveIncrements(w.ref, w.data);
        await w.ref.update(data);
      } else if (w.kind === 'delete') {
        await w.ref.delete();
      }
    }
  }

  private async resolveIncrements(
    ref: DocumentReference,
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const hasIncr = Object.values(data).some(isIncrementOp);
    if (!hasIncr) return data;
    const pending = this.reads.get(ref.path);
    const snap = pending ? await pending : await ref.get();
    const current = snap.exists ? (snap.data() as Record<string, any>) : {};
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (isIncrementOp(v)) {
        const base = Number(current[k] ?? 0);
        out[k] = base + v.__increment;
      } else {
        out[k] = v;
      }
    }
    return out;
  }
}

async function createWithId(ref: DocumentReference, data: Record<string, any>): Promise<void> {
  const parsed = await resolveTarget(resolvePath(ref.path));
  const table = parsed.table!;
  const cols = await getTableColumns(table);
  const { columnData, metaData, hasMetadataCol } = mapWriteFields(cols, table, data);
  const row: Record<string, any> = { ...columnData, id: parsed.keyValue };
  if (parsed.parentKey && parsed.parentKey !== 'id' && parsed.parentValue) row[parsed.parentKey] = parsed.parentValue;
  if (hasMetadataCol && Object.keys(metaData).length > 0) row.metadata = metaData;
  const { error } = await getSupabaseAdmin().from(table).insert(row);
  if (error) console.error(`[supabase-firestore] create ${ref.path}:`, error.message);
}

// ---------------------------------------------------------------------------
// Write batch (best-effort)
// ---------------------------------------------------------------------------

export class WriteBatch {
  private ops: { kind: 'set' | 'update' | 'delete'; ref: DocumentReference; data?: any }[] = [];

  set(ref: DocumentReference, data: any): void {
    this.ops.push({ kind: 'set', ref, data });
  }
  update(ref: DocumentReference, data: any): void {
    this.ops.push({ kind: 'update', ref, data });
  }
  delete(ref: DocumentReference): void {
    this.ops.push({ kind: 'delete', ref });
  }

  async commit(): Promise<void> {
    for (const op of this.ops) {
      if (op.kind === 'set') await op.ref.set(op.data);
      else if (op.kind === 'update') await op.ref.update(op.data);
      else await op.ref.delete();
    }
  }
}

// ---------------------------------------------------------------------------
// Public facade
// ---------------------------------------------------------------------------

export interface FirestoreFacade {
  collection(path: string): CollectionReference;
  doc(path: string): DocumentReference;
  runTransaction<T>(updateFn: (txn: FacadeTransaction) => Promise<T>): Promise<T>;
  batch(): WriteBatch;
  FieldValue: typeof FieldValueFacade;
  Timestamp: typeof TimestampFacade;
}

const FieldValueFacade = {
  serverTimestamp(): ServerTsOp {
    return { __serverTimestamp: true };
  },
  increment(n: number): IncrementOp {
    return { __increment: n };
  },
};

const TimestampFacade = {
  now: () => FdbTimestamp.now(),
  fromDate: (d: Date) => new FdbTimestamp(d.getTime() / 1000),
  fromMillis: (ms: number) => new FdbTimestamp(ms / 1000),
};

let facadeSingleton: FirestoreFacade | null = null;

export function getSupabaseDb(): FirestoreFacade {
  if (facadeSingleton) return facadeSingleton;

  loadAuthMap();

  facadeSingleton = {
    collection: (p: string) => new CollectionReference(p),
    doc: (p: string) => new DocumentReference(p),
    runTransaction: async <T>(updateFn: (txn: FacadeTransaction) => Promise<T>): Promise<T> => {
      const txn = new FacadeTransaction();
      const result = await updateFn(txn);
      await txn.commit();
      return result;
    },
    batch: () => new WriteBatch(),
    FieldValue: FieldValueFacade,
    Timestamp: TimestampFacade,
  };
  return facadeSingleton;
}
