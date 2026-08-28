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
    description: 'Log product or order returns with reason',
    icon: '↩️',
    page: 'returns',
    categories: [
      'retail',
      'grocery',
      'supermarket',
      'wholesale',
      'distributor',
      'electronics',
      'fashion',
      'pharmacy',
      'restaurant',
      'cafe',
      'other',
    ],
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
    categories: [
      'retail',
      'grocery',
      'supermarket',
      'restaurant',
      'cafe',
      'pharmacy',
      'electronics',
      'fashion',
      'other',
    ],
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
    description: 'Restaurant menu, dishes, and floor orders',
    icon: '🍽️',
    page: 'menu',
    categories: ['restaurant', 'cafe'],
    defaultOn: true,
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

/** Map free-text / onboarding labels to canonical category ids */
const CATEGORY_ALIASES: Record<string, string> = {
  restaurant: 'restaurant',
  restaurants: 'restaurant',
  resturant: 'restaurant',
  resturants: 'restaurant',
  food: 'restaurant',
  food_service: 'restaurant',
  foodservice: 'restaurant',
  'restaurants_&_food_service': 'restaurant',
  restaurants_and_food_service: 'restaurant',
  'restaurants_&_food': 'restaurant',
  cafe: 'cafe',
  café: 'cafe',
  coffee: 'cafe',
  coffee_shop: 'cafe',
  retail: 'retail',
  shop: 'retail',
  store: 'retail',
  grocery: 'grocery',
  groceries: 'grocery',
  supermarket: 'supermarket',
  super_market: 'supermarket',
  wholesale: 'wholesale',
  wholesaler: 'wholesale',
  distributor: 'distributor',
  distribution: 'distributor',
  pharmacy: 'pharmacy',
  chemist: 'pharmacy',
  electronics: 'electronics',
  fashion: 'fashion',
  clothing: 'fashion',
  manufacturing: 'manufacturing',
  manufacturer: 'manufacturing',
  factory: 'manufacturing',
  other: 'other',
};

export function normalizeBusinessCategory(raw?: string | null): string {
  let s = String(raw || 'other')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!s) return 'other';
  if (CATEGORY_ALIASES[s]) return CATEGORY_ALIASES[s];

  // Fuzzy: contains keyword
  if (s.includes('restaurant') || s.includes('resturant') || s.includes('food_service')) {
    return 'restaurant';
  }
  if (s.includes('cafe') || s.includes('coffee')) return 'cafe';
  if (s.includes('super') && s.includes('market')) return 'supermarket';
  if (s.includes('grocery')) return 'grocery';
  if (s.includes('wholesale')) return 'wholesale';
  if (s.includes('distribut')) return 'distributor';
  if (s.includes('pharma') || s.includes('chemist')) return 'pharmacy';
  if (s.includes('electronic')) return 'electronics';
  if (s.includes('fashion') || s.includes('cloth')) return 'fashion';
  if (s.includes('manufactur') || s.includes('factory')) return 'manufacturing';
  if (s.includes('retail') || s.includes('shop')) return 'retail';

  return s || 'other';
}

export function getStaffPermissionsForCategory(category?: string | null): StaffPermissionDef[] {
  const cat = normalizeBusinessCategory(category);
  const matched = STAFF_PERMISSION_DEFS.filter((def) => {
    if (!def.categories || def.categories.length === 0) return true;
    return def.categories.some((c) => {
      const nc = normalizeBusinessCategory(c);
      return nc === cat || cat.includes(nc) || nc.includes(cat);
    });
  });

  // Restaurant/cafe: ensure menu is present even if category string was noisy
  if ((cat === 'restaurant' || cat === 'cafe') && !matched.some((d) => d.key === 'menu')) {
    const menuDef = STAFF_PERMISSION_DEFS.find((d) => d.key === 'menu');
    if (menuDef) matched.push(menuDef);
  }

  // Stable order as defined
  const order = new Map(STAFF_PERMISSION_DEFS.map((d, i) => [d.key, i]));
  matched.sort((a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99));
  return matched;
}

/** True when this permission applies to the business category */
export function isPermissionForCategory(
  key: string,
  category?: string | null
): boolean {
  const def = STAFF_PERMISSION_DEFS.find((d) => d.key === key);
  if (!def) return false;
  if (!def.categories || def.categories.length === 0) return true;
  const cat = normalizeBusinessCategory(category);
  return def.categories.some((c) => normalizeBusinessCategory(c) === cat);
}

export function defaultStaffPermissions(category?: string | null): Record<string, boolean> {
  const cat = normalizeBusinessCategory(category);
  const defs = getStaffPermissionsForCategory(cat);
  const out: Record<string, boolean> = {};
  for (const d of STAFF_PERMISSION_DEFS) {
    out[d.key] = false;
  }
  for (const d of defs) {
    out[d.key] = Boolean(d.defaultOn);
  }
  // Always enable sales for any staff
  out.sale = true;
  // Restaurant / cafe: menu is a core floor tool
  if (cat === 'restaurant' || cat === 'cafe') {
    out.menu = true;
    out.expiry = true;
  }
  // Manufacturing: production on by default when relevant
  if (cat === 'manufacturing') {
    out.production = true;
  }
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
    permissions: ['sale', 'atd', 'msg', 'menu'],
  },
  Cashier: {
    label: 'Cashier',
    description: 'Front desk — sales, customers, and shift close',
    permissions: ['sale', 'hist', 'customers', 'shift', 'atd', 'msg', 'menu'],
    categories: ['retail', 'grocery', 'supermarket', 'electronics', 'fashion', 'pharmacy', 'restaurant', 'cafe', 'other'],
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
      'menu',
      'expiry',
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

/** Permission keys recommended for a role id (optionally tuned by business category). */
export function getRecommendedPermissions(
  roleId?: string | null,
  category?: string | null
): StaffPermKey[] {
  if (!roleId) return ['sale'];
  const cfg = ROLES[roleId] || ROLES[String(roleId).trim()];
  let keys: StaffPermKey[] = cfg?.permissions
    ? [...cfg.permissions]
    : (() => {
        const lower = String(roleId).toLowerCase();
        const found = Object.values(ROLES).find((r) => r.label.toLowerCase() === lower);
        return found?.permissions ? [...found.permissions] : (['sale', 'atd', 'msg'] as StaffPermKey[]);
      })();

  const cat = normalizeBusinessCategory(category);
  if (cat === 'restaurant' || cat === 'cafe') {
    if (!keys.includes('menu')) keys.push('menu');
    if (!keys.includes('expiry')) keys.push('expiry');
  }
  if (cat === 'manufacturing' && !keys.includes('production')) {
    keys.push('production');
  }

  // Drop keys that don't apply to this category
  keys = keys.filter((k) => isPermissionForCategory(k, cat));
  if (!keys.includes('sale')) keys.unshift('sale');
  return keys;
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
