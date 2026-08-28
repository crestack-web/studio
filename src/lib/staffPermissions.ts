/**
 * Staff portal capabilities — category-aware for owner invite / edit permissions
 * and for staff dashboard navigation.
 */

export type StaffPermKey =
  | 'sale'
  | 'inv'
  | 'hist'
  | 'atd'
  | 'msg'
  | 'customers'
  | 'credit'
  | 'returns'
  | 'receive'
  | 'expenses'
  | 'shift'
  | 'expiry'
  | 'production'
  | 'menu'
  | 'transfers';

export type StaffPageId =
  | 'home'
  | 'sale'
  | 'inv'
  | 'hist'
  | 'atd'
  | 'msg'
  | 'settings'
  | 'customers'
  | 'credit'
  | 'returns'
  | 'receive'
  | 'expenses'
  | 'shift'
  | 'expiry'
  | 'production'
  | 'menu'
  | 'transfers';

export interface StaffPermissionDef {
  key: StaffPermKey;
  label: string;
  description: string;
  icon: string;
  page: StaffPageId;
  /** Empty = all categories */
  categories?: string[];
  defaultOn?: boolean;
}

const ALL = undefined;

export const STAFF_PERMISSION_DEFS: StaffPermissionDef[] = [
  {
    key: 'sale',
    label: 'Record sales',
    description: 'Checkout, payments, optional customer',
    icon: '🛒',
    page: 'sale',
    defaultOn: true,
  },
  {
    key: 'inv',
    label: 'View inventory',
    description: 'Search products and stock levels',
    icon: '📦',
    page: 'inv',
  },
  {
    key: 'hist',
    label: 'Sale history',
    description: 'See recent sales and reprints',
    icon: '📊',
    page: 'hist',
  },
  {
    key: 'atd',
    label: 'Attendance',
    description: 'Clock in and out of shifts',
    icon: '⏰',
    page: 'atd',
  },
  {
    key: 'msg',
    label: 'Messages',
    description: 'Chat with owner and team',
    icon: '💬',
    page: 'msg',
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'Look up and attach customers to sales',
    icon: '👤',
    page: 'customers',
  },
  {
    key: 'credit',
    label: 'Credit sales',
    description: 'Pay-later sales and balances',
    icon: '💳',
    page: 'credit',
    categories: ['wholesale', 'distributor', 'retail', 'electronics', 'fashion', 'grocery', 'supermarket', 'other'],
  },
  {
    key: 'returns',
    label: 'Returns',
    description: 'Log product returns with reason',
    icon: '↩️',
    page: 'returns',
  },
  {
    key: 'receive',
    label: 'Receive stock',
    description: 'Log inbound deliveries',
    icon: '📥',
    page: 'receive',
    categories: [
      'retail',
      'grocery',
      'supermarket',
      'wholesale',
      'distributor',
      'pharmacy',
      'electronics',
      'fashion',
      'manufacturing',
      'other',
    ],
  },
  {
    key: 'expenses',
    label: 'Record expenses',
    description: 'Log petty cash and small expenses',
    icon: '🧾',
    page: 'expenses',
  },
  {
    key: 'shift',
    label: 'Shift close',
    description: 'Count cash drawer at end of shift',
    icon: '🧮',
    page: 'shift',
  },
  {
    key: 'expiry',
    label: 'Expiry checks',
    description: 'Near-expiry and batch tasks',
    icon: '⚠️',
    page: 'expiry',
    categories: ['grocery', 'supermarket', 'pharmacy', 'restaurant', 'cafe'],
  },
  {
    key: 'menu',
    label: 'Menu / floor',
    description: 'Restaurant menu and order assistance',
    icon: '🍽️',
    page: 'menu',
    categories: ['restaurant', 'cafe'],
  },
  {
    key: 'production',
    label: 'Production',
    description: 'Log production runs and materials',
    icon: '🏭',
    page: 'production',
    categories: ['manufacturing'],
  },
  {
    key: 'transfers',
    label: 'Stock transfers',
    description: 'Move stock between locations',
    icon: '🔀',
    page: 'transfers',
    categories: ['retail', 'wholesale', 'distributor', 'supermarket', 'grocery', 'manufacturing', 'other'],
  },
];

export function normalizeBusinessCategory(raw?: string | null): string {
  return String(raw || 'other')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

export function getStaffPermissionsForCategory(category?: string | null): StaffPermissionDef[] {
  const cat = normalizeBusinessCategory(category);
  return STAFF_PERMISSION_DEFS.filter((def) => {
    if (!def.categories || def.categories.length === 0) return true;
    return def.categories.some((c) => c === cat || cat.includes(c) || c.includes(cat));
  });
}

export function defaultStaffPermissions(category?: string | null): Record<string, boolean> {
  const defs = getStaffPermissionsForCategory(category);
  const out: Record<string, boolean> = {};
  for (const d of STAFF_PERMISSION_DEFS) {
    out[d.key] = false;
  }
  for (const d of defs) {
    out[d.key] = Boolean(d.defaultOn);
  }
  // Always allow attendance & messages defaults off unless owner turns on — sale on
  out.sale = true;
  return out;
}

export type StaffPermissionsMap = Record<StaffPermKey, boolean> & Record<string, boolean>;

export function mergeStaffPermissions(
  stored: Record<string, boolean> | null | undefined,
  category?: string | null
): StaffPermissionsMap {
  const base = defaultStaffPermissions(category);
  const merged = { ...base, ...(stored || {}) } as StaffPermissionsMap;
  // Ensure core keys exist
  for (const d of STAFF_PERMISSION_DEFS) {
    if (typeof merged[d.key] !== 'boolean') merged[d.key] = false;
  }
  return merged;
}

// ── Role presets (owner invite UI) ─────────────────────────────

export interface StaffRoleConfig {
  label: string;
  description: string;
  /** Permission keys enabled by default for this role */
  permissions: StaffPermKey[];
  /** Business categories this role is recommended for; empty = all */
  categories?: string[];
}

export const ROLES: Record<string, StaffRoleConfig> = {
  Staff: {
    label: 'Staff',
    description: 'General team member — record sales and view basic data',
    permissions: ['sale', 'atd', 'msg'],
  },
  Cashier: {
    label: 'Cashier',
    description: 'Front desk — sales, customers, and shift close',
    permissions: ['sale', 'hist', 'customers', 'shift', 'atd', 'msg'],
    categories: ['retail', 'grocery', 'supermarket', 'electronics', 'fashion', 'pharmacy', 'other'],
  },
  Seller: {
    label: 'Seller',
    description: 'Sales-focused role with customer and credit tools',
    permissions: ['sale', 'hist', 'customers', 'credit', 'msg', 'atd'],
    categories: ['wholesale', 'distributor', 'retail', 'electronics', 'fashion'],
  },
  Manager: {
    label: 'Manager',
    description: 'Broader access — sales, inventory, expenses, and team tools',
    permissions: [
      'sale',
      'inv',
      'hist',
      'atd',
      'msg',
      'customers',
      'credit',
      'returns',
      'receive',
      'expenses',
      'shift',
    ],
  },
  'Store manager': {
    label: 'Store manager',
    description: 'Full floor ops including stock receives and transfers',
    permissions: [
      'sale',
      'inv',
      'hist',
      'atd',
      'msg',
      'customers',
      'credit',
      'returns',
      'receive',
      'expenses',
      'shift',
      'transfers',
      'expiry',
    ],
    categories: ['retail', 'supermarket', 'grocery', 'wholesale', 'distributor', 'pharmacy'],
  },
};

/** Roles recommended for a business category (ids match ROLES keys). */
export function getRecommendedRoles(category?: string | null): string[] {
  const cat = normalizeBusinessCategory(category);
  const ids = Object.keys(ROLES);
  const matched = ids.filter((id) => {
    const cfg = ROLES[id];
    if (!cfg.categories || cfg.categories.length === 0) return true;
    return cfg.categories.some((c) => c === cat || cat.includes(c) || c.includes(cat));
  });
  return matched.length > 0 ? matched : ['Staff'];
}

/** Permission keys recommended for a role id. */
export function getRecommendedPermissions(roleId?: string | null): StaffPermKey[] {
  if (!roleId) return ['sale'];
  const cfg = ROLES[roleId] || ROLES[String(roleId).trim()];
  if (cfg?.permissions?.length) return [...cfg.permissions];
  // Fuzzy match by label
  const lower = String(roleId).toLowerCase();
  const found = Object.values(ROLES).find((r) => r.label.toLowerCase() === lower);
  return found?.permissions ? [...found.permissions] : ['sale', 'atd', 'msg'];
}

/** Build a full permissions map from a list of enabled keys. */
export function createPermissionsObject(
  enabledKeys: Array<StaffPermKey | string> | null | undefined
): Record<string, boolean> {
  const enabled = new Set((enabledKeys || []).map(String));
  const out: Record<string, boolean> = {};
  for (const d of STAFF_PERMISSION_DEFS) {
    out[d.key] = enabled.has(d.key);
  }
  // Always enable sale if nothing selected
  if (!Object.values(out).some(Boolean)) {
    out.sale = true;
  }
  return out;
}
