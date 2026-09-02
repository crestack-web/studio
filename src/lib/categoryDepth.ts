/**
 * Category depth — makes Busmo feel native to each business model.
 * Used by Home nudges, inventory framing, margin targets, and owner tools.
 */

import type { BusinessCategory } from '@/lib/featureRegistry';
import type { PageId } from '@/app/owner/dashboard/index';

export type DepthModel =
  | 'restaurant'
  | 'retail'
  | 'wholesale'
  | 'services'
  | 'manufacturing'
  | 'pharmacy'
  | 'general';

export interface CategoryDepthProfile {
  model: DepthModel;
  label: string;
  /** One line for home / tools */
  promise: string;
  /** Gross margin guide for products/dishes */
  targetMarginPct: number;
  /** When margin is "thin" relative to target */
  thinMarginFactor: number;
  costLabel: string;
  priceLabel: string;
  inventoryFocus: string;
  /** Quick actions shown in category depth strip */
  quickActions: Array<{ label: string; href: PageId }>;
  nudgeCopy: {
    thinMargin: string;
    lowStock: string;
    supplier: string;
    quiet: string;
  };
}

const PROFILES: Record<DepthModel, CategoryDepthProfile> = {
  restaurant: {
    model: 'restaurant',
    label: 'Restaurant / Cafe',
    promise: 'Plate cost, ingredients, and menu margin — not generic shop stock.',
    targetMarginPct: 65,
    thinMarginFactor: 0.7,
    costLabel: 'Plate cost',
    priceLabel: 'Menu price',
    inventoryFocus:
      'Ingredients track quantity & expiry for recipes. Dishes carry selling price and margin.',
    quickActions: [
      { label: 'Menu', href: 'menu-management' as PageId },
      { label: 'Ingredients', href: 'ingredient-tracking' as PageId },
      { label: 'Margins', href: 'margin-calculator' as PageId },
      { label: 'Can I buy?', href: 'can-i-buy' as PageId },
    ],
    nudgeCopy: {
      thinMargin: 'Menu items under food-cost targets — fix plate cost or price.',
      lowStock: 'Key ingredients or dishes are low. Restock what the kitchen needs first.',
      supplier: 'Kitchen suppliers are owed — keep deliveries flowing.',
      quiet: 'No covers logged yet. Record the first sale or check the menu floor.',
    },
  },
  retail: {
    model: 'retail',
    label: 'Retail / Shop',
    promise: 'Stock that moves, dead stock that doesn’t, and healthy shelf margins.',
    targetMarginPct: 30,
    thinMarginFactor: 0.7,
    costLabel: 'Product cost',
    priceLabel: 'Shelf price',
    inventoryFocus:
      'Watch high stock with weak sales (dead stock) and thin margins on fast movers.',
    quickActions: [
      { label: 'Inventory', href: 'inventory' as PageId },
      { label: 'Margins', href: 'margin-calculator' as PageId },
      { label: 'Suppliers', href: 'supplier-management' as PageId },
      { label: 'Can I buy?', href: 'can-i-buy' as PageId },
    ],
    nudgeCopy: {
      thinMargin: 'Shelf prices leave little profit — adjust cost or mark-up.',
      lowStock: 'Bestsellers may stock out. Reorder winners before fillers.',
      supplier: 'Supplier balances are up — clear dues before the next order.',
      quiet: 'Till is quiet. A push on top sellers or a promo can start the day.',
    },
  },
  wholesale: {
    model: 'wholesale',
    label: 'Wholesale / Distributor',
    promise: 'Volume, credit terms, and landed cost — thin margins, tight cash.',
    targetMarginPct: 12,
    thinMarginFactor: 0.75,
    costLabel: 'Landed cost',
    priceLabel: 'Trade price',
    inventoryFocus:
      'Protect cash with credit limits on customers and FIFO against supplier debt.',
    quickActions: [
      { label: 'Credit', href: 'credit-tracking' as PageId },
      { label: 'Warehouse', href: 'warehouse' as PageId },
      { label: 'Can I buy?', href: 'can-i-buy' as PageId },
      { label: 'Cashflow', href: 'cashflow' as PageId },
    ],
    nudgeCopy: {
      thinMargin: 'Trade prices are too close to landed cost for this volume model.',
      lowStock: 'Lines are low — prioritise SKUs your retailers reorder weekly.',
      supplier: 'Payables are high vs cash — don’t stack inbound without a plan.',
      quiet: 'No movement yet. Check open customer credit and today’s deliveries.',
    },
  },
  services: {
    model: 'services',
    label: 'Services',
    promise: 'Price the job, not imaginary inventory — margin on time and delivery cost.',
    targetMarginPct: 50,
    thinMarginFactor: 0.7,
    costLabel: 'Delivery cost',
    priceLabel: 'Service fee',
    inventoryFocus:
      'Inventory is secondary. Track job cost, packages, and customer collections.',
    quickActions: [
      { label: 'Record sale', href: 'sale' as PageId },
      { label: 'Customers', href: 'customer-management' as PageId },
      { label: 'Margins', href: 'margin-calculator' as PageId },
      { label: 'Expenses', href: 'add-expense' as PageId },
    ],
    nudgeCopy: {
      thinMargin: 'Fees barely cover delivery cost — raise packages or cut scope.',
      lowStock: 'Materials for jobs are low if you stock any — restock for booked work only.',
      supplier: 'Vendor balances open — clear before the next project buy.',
      quiet: 'No jobs billed yet. Log today’s work so cash and statements stay true.',
    },
  },
  manufacturing: {
    model: 'manufacturing',
    label: 'Manufacturing',
    promise: 'Unit cost, production, and trade price — scrap and downtime kill margin.',
    targetMarginPct: 25,
    thinMarginFactor: 0.7,
    costLabel: 'Unit production cost',
    priceLabel: 'Factory price',
    inventoryFocus:
      'Raw vs finished goods matter. Production runs should update finished stock.',
    quickActions: [
      { label: 'Production', href: 'production-tracking' as PageId },
      { label: 'Inventory', href: 'inventory' as PageId },
      { label: 'Margins', href: 'margin-calculator' as PageId },
      { label: 'Can I buy?', href: 'can-i-buy' as PageId },
    ],
    nudgeCopy: {
      thinMargin: 'Factory prices leave thin cover after unit cost — review BOM or price.',
      lowStock: 'Inputs or finished goods are low — schedule production or procurement.',
      supplier: 'Raw-material payables are heavy relative to cash.',
      quiet: 'No sales logged. Align production output with orders.',
    },
  },
  pharmacy: {
    model: 'pharmacy',
    label: 'Pharmacy / Health retail',
    promise: 'Expiry, regulated stock, and reliable margins on fast-moving SKUs.',
    targetMarginPct: 25,
    thinMarginFactor: 0.7,
    costLabel: 'Product cost',
    priceLabel: 'Retail price',
    inventoryFocus: 'Expiry alerts and batch discipline matter as much as stock counts.',
    quickActions: [
      { label: 'Expiry', href: 'expiry-alerts' as PageId },
      { label: 'Inventory', href: 'inventory' as PageId },
      { label: 'Margins', href: 'margin-calculator' as PageId },
      { label: 'Can I buy?', href: 'can-i-buy' as PageId },
    ],
    nudgeCopy: {
      thinMargin: 'Some SKUs are under target margin — check cost and shelf price.',
      lowStock: 'Critical lines are low — reorder before patients walk out.',
      supplier: 'Supplier balances need attention before the next indent.',
      quiet: 'Quiet counter so far — ensure near-expiry items are visible.',
    },
  },
  general: {
    model: 'general',
    label: 'Your business',
    promise: 'Cash, margin, and stock truth in one place — tuned as we learn your model.',
    targetMarginPct: 25,
    thinMarginFactor: 0.7,
    costLabel: 'Cost',
    priceLabel: 'Selling price',
    inventoryFocus: 'Keep costs and prices updated so MO and margins stay honest.',
    quickActions: [
      { label: 'Cashflow', href: 'cashflow' as PageId },
      { label: 'Margins', href: 'margin-calculator' as PageId },
      { label: 'Can I buy?', href: 'can-i-buy' as PageId },
      { label: 'Ask MO', href: 'mo' as PageId },
    ],
    nudgeCopy: {
      thinMargin: 'Some items are priced thin vs cost — open the margin calculator.',
      lowStock: 'Stock is low on some lines — buy only what will move.',
      supplier: 'Supplier credit is open — plan payments.',
      quiet: 'No sales yet today — record activity so the books stay live.',
    },
  },
};

export function normalizeCategory(raw: unknown): DepthModel {
  const c = String(raw || '')
    .toLowerCase()
    .trim();
  if (!c) return 'general';
  if (
    /restaurant|resturant|cafe|café|food service|eatery|bistro|kitchen|catering/.test(c)
  ) {
    return 'restaurant';
  }
  if (/wholesale|distributor|distribution|bulk/.test(c)) return 'wholesale';
  if (/manufactur|factory|production|industrial/.test(c)) return 'manufacturing';
  if (/service|consult|salon|agency|education|school|training/.test(c)) return 'services';
  if (/pharm|chemist|drug|healthcare|clinic/.test(c)) return 'pharmacy';
  if (/retail|shop|store|supermarket|grocery|fashion|electronic|mart/.test(c)) {
    return 'retail';
  }
  // Map registry categories
  const map: Partial<Record<BusinessCategory, DepthModel>> = {
    restaurant: 'restaurant',
    cafe: 'restaurant',
    retail: 'retail',
    grocery: 'retail',
    fashion: 'retail',
    electronics: 'retail',
    supermarket: 'retail',
    wholesale: 'wholesale',
    distributor: 'wholesale',
    manufacturing: 'manufacturing',
    services: 'services',
    education: 'services',
    pharmacy: 'pharmacy',
    healthcare: 'pharmacy',
    other: 'general',
  };
  if (c in map) return map[c as BusinessCategory] || 'general';
  return 'general';
}

export function getCategoryDepth(rawCategory: unknown): CategoryDepthProfile {
  return PROFILES[normalizeCategory(rawCategory)];
}

/** Detect dead / slow stock: high on-hand, weak 30d sales signal when available */
export function isLikelyDeadStock(p: {
  stock?: number;
  stockLevel?: number;
  unitsSold30d?: number;
  reorderLevel?: number;
  lowStockThreshold?: number;
}): boolean {
  const stock = Number(p.stock ?? p.stockLevel ?? 0) || 0;
  const sold = Number(p.unitsSold30d ?? 0) || 0;
  const reorder = Number(p.reorderLevel ?? p.lowStockThreshold ?? 5) || 5;
  if (stock <= 0) return false;
  // High stock relative to reorder and almost no movement
  if (stock >= Math.max(reorder * 3, 15) && sold <= 2) return true;
  if (stock >= 20 && sold === 0) return true;
  return false;
}
