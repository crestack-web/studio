/**
 * Shared Record Sale Service
 * This service provides a single source of truth for recording sales
 * Used by both the Record Sale page and MO AI
 */

import { getSupabaseAdmin } from '@/lib/supabase-server';

function mapProductRow(row: any) {
  const meta =
    row?.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, any>) : {};
  const price = Number(meta.sellingPrice ?? meta.price ?? row.price ?? 0) || 0;
  const cost = Number(meta.costPrice ?? meta.cost ?? row.cost ?? 0) || 0;
  const stock = Number(meta.currentStock ?? meta.stock ?? row.stock_level ?? 0) || 0;
  return {
    id: row.id,
    name: row.name || meta.name || 'Product',
    price,
    sellingPrice: price,
    costPrice: cost,
    cost,
    stock,
    quantity: stock,
    stock_level: stock,
    imageUrl: row.image_url || meta.imageUrl || '',
    active: String(row.status || 'active').toLowerCase() !== 'inactive',
    metadata: meta,
  };
}

export interface SaleItem {
  productId: string;
  name: string;
  variantId?: string | null;
  variantName?: string | null;
  quantity: number;
  price: number;
  costPrice: number;
  emoji?: string;
}

export interface RecordSaleParams {
  businessId: string;
  userId: string;
  items: SaleItem[];
  paymentType: 'cash' | 'transfer' | 'pos' | 'credit';
  source?: 'pos' | 'mo_ai' | 'staff';
  recordedBy?: {
    uid: string;
    email: string;
    displayName: string;
    role: string;
    staffId?: string | null;
  };
}

export interface RecordSaleResult {
  success: boolean;
  saleId?: string;
  message: string;
  data?: {
    items: SaleItem[];
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    remainingStock: { [productId: string]: number };
  };
  error?: string;
}

/**
 * Record a sale using the same logic as the Record Sale page
 * This ensures consistency across all sale recording methods
 */
export async function recordSale(params: RecordSaleParams): Promise<RecordSaleResult> {
  const sb = getSupabaseAdmin();
  const { businessId, userId, items, paymentType, source = 'mo_ai', recordedBy } = params;

  try {
    if (!businessId || !userId || !items || items.length === 0) {
      return {
        success: false,
        message: 'Invalid sale parameters',
        error: 'Missing required fields: businessId, userId, or items',
      };
    }

    let totalRevenue = 0;
    let totalCost = 0;
    const remainingStock: { [productId: string]: number } = {};
    const stockUpdates: Array<{ id: string; next: number }> = [];

    for (const item of items) {
      const { data: row, error } = await sb
        .from('products')
        .select('id, name, price, cost, stock_level, status, metadata, image_url')
        .eq('business_id', businessId)
        .eq('id', item.productId)
        .maybeSingle();

      if (error || !row) {
        return {
          success: false,
          message: `Product "${item.name}" not found in inventory`,
          error: `Product ${item.productId} does not exist`,
        };
      }

      const product = mapProductRow(row);
      if (product.stock < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${item.name}". Only ${product.stock} units available.`,
          error: `Stock check failed for ${item.productId}`,
        };
      }

      totalRevenue += item.price * item.quantity;
      totalCost += item.costPrice * item.quantity;
      const next = product.stock - item.quantity;
      remainingStock[item.productId] = next;
      stockUpdates.push({ id: item.productId, next });
    }

    const totalProfit = totalRevenue - totalCost;
    const saleId = `sale-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();

    const saleRow = {
      id: saleId,
      business_id: businessId,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        costPrice: item.costPrice,
      })),
      total_amount: totalRevenue,
      total_revenue: totalRevenue,
      profit: totalProfit,
      payment_method: paymentType,
      status: 'completed',
      metadata: {
        products: items,
        totalCost,
        source,
        recordedBy: recordedBy || {
          uid: userId,
          displayName: source === 'mo_ai' ? 'MO AI' : 'System',
          role: 'AI Assistant',
        },
        note: `Recorded via ${source === 'mo_ai' ? 'MO AI' : 'Point of Sale'}`,
      },
      created_at: nowIso,
    };

    const { error: saleErr } = await sb.from('sales').insert(saleRow);
    if (saleErr) {
      return {
        success: false,
        message: `Failed to record sale: ${saleErr.message}`,
        error: saleErr.message,
      };
    }

    for (const u of stockUpdates) {
      const { data: existing } = await sb
        .from('products')
        .select('metadata, stock_level')
        .eq('id', u.id)
        .maybeSingle();
      const meta =
        existing?.metadata && typeof existing.metadata === 'object'
          ? { ...(existing.metadata as Record<string, unknown>) }
          : {};
      meta.currentStock = u.next;
      meta.stock = u.next;
      await sb
        .from('products')
        .update({
          stock_level: u.next,
          metadata: meta,
          updated_at: nowIso,
        })
        .eq('id', u.id)
        .eq('business_id', businessId);
    }

    return {
      success: true,
      saleId,
      message: 'Sale recorded successfully',
      data: {
        items,
        totalRevenue,
        totalCost,
        totalProfit,
        remainingStock,
      },
    };
  } catch (error: any) {
    console.error('Error recording sale:', error);
    return {
      success: false,
      message: `Failed to record sale: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Get product by name (fuzzy match)
 * Used by MO to find products in inventory
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[n];
}

function normalizeName(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokenSimilarity(query: string, target: string): number {
  const qTokens = normalizeName(query).split(' ').filter(Boolean);
  const tTokens = normalizeName(target).split(' ').filter(Boolean);
  if (qTokens.length === 0 || tTokens.length === 0) return 0;

  let matchedScore = 0;
  for (const qt of qTokens) {
    let best = 0;
    for (const tt of tTokens) {
      if (qt === tt) {
        best = 1;
        break;
      }
      if (qt.length >= 3 && (tt.includes(qt) || qt.includes(tt))) {
        best = Math.max(best, 0.9);
        continue;
      }
      const ratio = 1 - levenshteinDistance(qt, tt) / Math.max(qt.length, tt.length, 1);
      if (ratio >= 0.7) {
        best = Math.max(best, ratio);
      }
    }
    matchedScore += best;
  }
  return matchedScore / qTokens.length;
}

function productNameSimilarity(query: string, target: string): number {
  const q = normalizeName(query);
  const t = normalizeName(target);
  if (!q || !t) return 0;
  if (q === t) return 1;
  if (q.length >= 3 && t.includes(q)) return 0.95;
  const tokenScore = tokenSimilarity(q, t);
  const fullRatio = 1 - levenshteinDistance(q, t) / Math.max(q.length, t.length);
  return Math.max(tokenScore, fullRatio);
}

export async function findProductByName(
  businessId: string,
  productName: string
): Promise<{ found: boolean; product?: any; matches?: any[] }> {
  try {
    const sb = getSupabaseAdmin();
    const q = (productName || '').trim();
    if (!businessId || !q) return { found: false };

    // Prefer active products; fall back to all if needed
    let { data: rows, error } = await sb
      .from('products')
      .select('id, name, price, cost, stock_level, status, metadata, image_url')
      .eq('business_id', businessId)
      .limit(300);

    if (error) {
      console.error('[findProductByName]', error.message);
      return { found: false };
    }

    const products = (rows || []).map(mapProductRow).filter((p) => p.active !== false);

    // Exact name (case-insensitive)
    const exact = products.filter(
      (p) => normalizeName(p.name) === normalizeName(q)
    );
    if (exact.length === 1) {
      return { found: true, product: exact[0] };
    }
    if (exact.length > 1) {
      return { found: true, matches: exact.slice(0, 5) };
    }

    // Starts-with / includes
    const includes = products.filter((p) => {
      const n = normalizeName(p.name);
      const qq = normalizeName(q);
      return n.includes(qq) || qq.includes(n);
    });
    if (includes.length === 1) {
      return { found: true, product: includes[0] };
    }
    if (includes.length > 1) {
      return { found: true, matches: includes.slice(0, 5) };
    }

    // Fuzzy
    const scored = products
      .map((p) => ({ product: p, score: productNameSimilarity(q, p.name) }))
      .filter((e) => e.score >= 0.55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((e) => e.product);

    if (scored.length === 1) return { found: true, product: scored[0] };
    if (scored.length > 1) return { found: true, matches: scored };
    return { found: false };
  } catch (error) {
    console.error('Error finding product:', error);
    return { found: false };
  }
}

/**
 * Get product details with stock information
 */
export async function getProductDetails(
  businessId: string,
  productId: string
): Promise<{ found: boolean; product?: any }> {
  try {
    const sb = getSupabaseAdmin();
    const { data: row, error } = await sb
      .from('products')
      .select('id, name, price, cost, stock_level, status, metadata, image_url')
      .eq('business_id', businessId)
      .eq('id', productId)
      .maybeSingle();

    if (error || !row) return { found: false };
    return { found: true, product: mapProductRow(row) };
  } catch (error) {
    console.error('Error getting product details:', error);
    return { found: false };
  }
}