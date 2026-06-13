// ─────────────────────────────────────────────
// Busmo – Inventory Mock Data
// Replace with API calls when backend is ready
// ─────────────────────────────────────────────

export type StockStatus = 'in_stock' | 'low' | 'out';
export type TrendDir = 'up' | 'down' | 'flat';

export interface StockMovementEntry {
  date: string;
  type: 'sale' | 'restock' | 'adjustment' | 'return';
  qty: number;
  note: string;
  balance: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  emoji: string;            // placeholder for image
  category: string;
  costPrice: number;        // ₦
  sellingPrice: number;     // ₦
  currentStock: number;     // units
  stock: number;            // alias for currentStock (for backwards compatibility)
  reorderThreshold: number; // alert threshold
  suggestedReorder: number; // how many to order
  unitsSold30d: number;     // units sold in last 30 days
  lastSaleDate: string;     // ISO date string
  trend: TrendDir;
  movement: StockMovementEntry[];
  imageUrl?: string;        // product image URL
}

export const CATEGORIES = ['All', 'Food & Drink', 'Household', 'Personal Care', 'Snacks', 'Beverages', 'Frozen', 'Electronics'];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p001', sku: 'SKU-001',
    name: 'Indomie Instant Noodles (70g)', emoji: '🍜',
    category: 'Food & Drink',
    costPrice: 180, sellingPrice: 250,
    currentStock: 8, stock: 8, reorderThreshold: 20, suggestedReorder: 60,
    unitsSold30d: 340, lastSaleDate: '2026-02-25',
    trend: 'up',
    movement: [
      { date: '2026-02-25', type: 'sale', qty: -20, note: '20 packs sold (cash)', balance: 8 },
      { date: '2026-02-24', type: 'sale', qty: -35, note: '35 packs sold', balance: 28 },
      { date: '2026-02-20', type: 'restock', qty: 100, note: 'Restock from distributor', balance: 63 },
      { date: '2026-02-18', type: 'sale', qty: -40, note: '40 packs sold', balance: -37 },
      { date: '2026-02-15', type: 'adjustment', qty: -3, note: 'Damaged stock removed', balance: 3 },
    ],
  },
  {
    id: 'p002', sku: 'SKU-002',
    name: 'Milo Chocolate Drink (400g)', emoji: '🥛',
    category: 'Beverages',
    costPrice: 1400, sellingPrice: 1800,
    currentStock: 34, stock: 34, reorderThreshold: 15, suggestedReorder: 30,
    unitsSold30d: 82, lastSaleDate: '2026-02-25',
    trend: 'up',
    movement: [
      { date: '2026-02-25', type: 'sale', qty: -5, note: '5 tins sold', balance: 34 },
      { date: '2026-02-22', type: 'sale', qty: -8, note: '8 tins sold', balance: 39 },
      { date: '2026-02-19', type: 'restock', qty: 24, note: 'Restock – 2 cartons', balance: 47 },
    ],
  },
  {
    id: 'p003', sku: 'SKU-003',
    name: 'Peak Full Cream Milk (170g)', emoji: '🥛',
    category: 'Food & Drink',
    costPrice: 380, sellingPrice: 520,
    currentStock: 0, stock: 0, reorderThreshold: 10, suggestedReorder: 36,
    unitsSold30d: 124, lastSaleDate: '2026-02-23',
    trend: 'down',
    movement: [
      { date: '2026-02-23', type: 'sale', qty: -12, note: 'Last of stock sold', balance: 0 },
      { date: '2026-02-21', type: 'sale', qty: -14, note: '14 cans sold', balance: 12 },
      { date: '2026-02-18', type: 'restock', qty: 36, note: 'Monthly restock', balance: 26 },
    ],
  },
  {
    id: 'p004', sku: 'SKU-004',
    name: 'Gino Tomato Paste (70g)', emoji: '🍅',
    category: 'Food & Drink',
    costPrice: 90, sellingPrice: 150,
    currentStock: 220, stock: 220, reorderThreshold: 50, suggestedReorder: 0,
    unitsSold30d: 18, lastSaleDate: '2026-02-20',
    trend: 'down',
    movement: [
      { date: '2026-02-20', type: 'sale', qty: -5, note: '5 sachets sold', balance: 220 },
      { date: '2026-02-10', type: 'restock', qty: 200, note: 'Bulk purchase – over-stocked', balance: 225 },
      { date: '2026-02-08', type: 'sale', qty: -4, note: '4 sachets sold', balance: 25 },
    ],
  },
  {
    id: 'p005', sku: 'SKU-005',
    name: 'Close-Up Toothpaste (150ml)', emoji: '🦷',
    category: 'Personal Care',
    costPrice: 320, sellingPrice: 450,
    currentStock: 12, stock: 12, reorderThreshold: 15, suggestedReorder: 30,
    unitsSold30d: 55, lastSaleDate: '2026-02-25',
    trend: 'up',
    movement: [
      { date: '2026-02-25', type: 'sale', qty: -3, note: '3 tubes sold', balance: 12 },
      { date: '2026-02-22', type: 'restock', qty: 24, note: '2 boxes restocked', balance: 15 },
      { date: '2026-02-19', type: 'sale', qty: -9, note: '9 tubes sold', balance: -9 },
    ],
  },
  {
    id: 'p006', sku: 'SKU-006',
    name: 'Eva Water (75cl)', emoji: '💧',
    category: 'Beverages',
    costPrice: 60, sellingPrice: 100,
    currentStock: 144, stock: 144, reorderThreshold: 48, suggestedReorder: 0,
    unitsSold30d: 420, lastSaleDate: '2026-02-25',
    trend: 'up',
    movement: [
      { date: '2026-02-25', type: 'sale', qty: -36, note: '36 bottles sold', balance: 144 },
      { date: '2026-02-24', type: 'sale', qty: -48, note: '48 bottles sold', balance: 180 },
      { date: '2026-02-23', type: 'restock', qty: 144, note: '4 packs restocked', balance: 228 },
    ],
  },
  {
    id: 'p007', sku: 'SKU-007',
    name: 'Cowbell Milk Sachet (15g)', emoji: '☕',
    category: 'Food & Drink',
    costPrice: 30, sellingPrice: 50,
    currentStock: 0, stock: 0, reorderThreshold: 50, suggestedReorder: 200,
    unitsSold30d: 310, lastSaleDate: '2026-02-24',
    trend: 'flat',
    movement: [
      { date: '2026-02-24', type: 'sale', qty: -60, note: '60 sachets sold', balance: 0 },
      { date: '2026-02-22', type: 'restock', qty: 200, note: 'Restock from market', balance: 60 },
    ],
  },
  {
    id: 'p008', sku: 'SKU-008',
    name: 'Omo Washing Powder (500g)', emoji: '🧺',
    category: 'Household',
    costPrice: 480, sellingPrice: 650,
    currentStock: 3, stock: 3, reorderThreshold: 12, suggestedReorder: 24,
    unitsSold30d: 28, lastSaleDate: '2026-02-24',
    trend: 'down',
    movement: [
      { date: '2026-02-24', type: 'sale', qty: -2, note: '2 packs sold', balance: 3 },
      { date: '2026-02-21', type: 'sale', qty: -5, note: '5 packs sold', balance: 5 },
      { date: '2026-02-17', type: 'restock', qty: 24, note: 'Monthly restock', balance: 10 },
    ],
  },
  {
    id: 'p009', sku: 'SKU-009',
    name: 'Pringles Original (40g)', emoji: '🥫',
    category: 'Snacks',
    costPrice: 550, sellingPrice: 750,
    currentStock: 42, stock: 42, reorderThreshold: 10, suggestedReorder: 0,
    unitsSold30d: 0,
    lastSaleDate: '2025-12-02',
    trend: 'down',
    movement: [
      { date: '2025-12-02', type: 'sale', qty: -6, note: 'Last sale', balance: 42 },
      { date: '2025-11-15', type: 'restock', qty: 48, note: 'Overstocked – imported', balance: 48 },
    ],
  },
  {
    id: 'p010', sku: 'SKU-010',
    name: 'Pantene Shampoo (200ml)', emoji: '🧴',
    category: 'Personal Care',
    costPrice: 1100, sellingPrice: 1500,
    currentStock: 28, stock: 28, reorderThreshold: 8, suggestedReorder: 0,
    unitsSold30d: 0,
    lastSaleDate: '2025-12-28',
    trend: 'down',
    movement: [
      { date: '2025-12-28', type: 'sale', qty: -3, note: 'Last sale', balance: 28 },
      { date: '2025-12-10', type: 'restock', qty: 24, note: 'Seasonal stock', balance: 31 },
    ],
  },
  {
    id: 'p011', sku: 'SKU-011',
    name: 'Golden Morn Cereal (500g)', emoji: '🌾',
    category: 'Food & Drink',
    costPrice: 890, sellingPrice: 1200,
    currentStock: 16, stock: 16, reorderThreshold: 10, suggestedReorder: 0,
    unitsSold30d: 14, lastSaleDate: '2026-02-22',
    trend: 'flat',
    movement: [
      { date: '2026-02-22', type: 'sale', qty: -2, note: '2 packs sold', balance: 16 },
      { date: '2026-02-19', type: 'restock', qty: 12, note: 'Restocked', balance: 18 },
    ],
  },
  {
    id: 'p012', sku: 'SKU-012',
    name: 'Vaseline Body Lotion (400ml)', emoji: '🧴',
    category: 'Personal Care',
    costPrice: 1200, sellingPrice: 1650,
    currentStock: 19, stock: 19, reorderThreshold: 8, suggestedReorder: 0,
    unitsSold30d: 31, lastSaleDate: '2026-02-25',
    trend: 'up',
    movement: [
      { date: '2026-02-25', type: 'sale', qty: -3, note: '3 bottles sold', balance: 19 },
      { date: '2026-02-22', type: 'restock', qty: 12, note: 'Restocked', balance: 22 },
    ],
  },
];

// ── Derived helpers ──────────────────────────

export function getStockStatus(p: Product): StockStatus {
  if (p.currentStock === 0) return 'out';
  if (p.currentStock <= p.reorderThreshold) return 'low';
  return 'in_stock';
}

export function getDaysSinceLastSale(p: Product): number {
  const last = new Date(p.lastSaleDate).getTime();
  const now  = new Date('2026-02-25').getTime();
  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
}

export function getDaysUntilStockout(p: Product): number | null {
  if (p.unitsSold30d === 0) return null;
  const dailyRate = p.unitsSold30d / 30;
  return Math.floor(p.currentStock / dailyRate);
}

export function getInventoryStats(products: Product[]) {
  const total        = products.length;
  const totalUnits   = products.reduce((s, p) => s + p.currentStock, 0);
  const lowStock     = products.filter(p => getStockStatus(p) === 'low').length;
  const outOfStock   = products.filter(p => getStockStatus(p) === 'out').length;
  const invValue     = products.reduce((s, p) => s + p.costPrice * p.currentStock, 0);
  const potRevenue   = products.reduce((s, p) => s + p.sellingPrice * p.currentStock, 0);
  return { total, totalUnits, lowStock, outOfStock, invValue, potRevenue };
}

export function getLowStockProducts(products: Product[]): Product[] {
  return products
    .filter(p => getStockStatus(p) !== 'in_stock')
    .sort((a, b) => a.currentStock - b.currentStock);
}

export function getDeadStockProducts(products: Product[], days = 30): Product[] {
  return products.filter(p => getDaysSinceLastSale(p) >= days && p.currentStock > 0);
}

export function formatNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return `₦${n.toLocaleString()}`;
}
