/**
 * Controlled product lookup for MO WhatsApp sales (server-only).
 * Source of truth: products.stock_level + products.price (selling price).
 */
import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export type ProductSearchHit = {
  product_id: string;
  name: string;
  description: string | null;
  price: number | null;
  stock_level: number;
  unit: string | null;
  category: string | null;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  image_url: string | null;
};

export function sanitizeSearchQuery(raw: string): string {
  return String(raw || '')
    .replace(/[%_,.()"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function mapRow(row: any): ProductSearchHit {
  const stock = Number(row.stock_level);
  const stockLevel = Number.isFinite(stock) ? stock : 0;
  const priceNum = row.price === null || row.price === undefined ? null : Number(row.price);
  const price = priceNum !== null && Number.isFinite(priceNum) ? priceNum : null;

  let availability: ProductSearchHit['availability'] = 'unknown';
  if (Number.isFinite(stock)) {
    if (stockLevel <= 0) availability = 'out_of_stock';
    else if (stockLevel <= 3) availability = 'low_stock';
    else availability = 'in_stock';
  }

  return {
    product_id: String(row.id),
    name: String(row.name || 'Product'),
    description: row.description ? String(row.description) : null,
    price,
    stock_level: stockLevel,
    unit: row.unit ? String(row.unit) : null,
    category: row.category ? String(row.category) : null,
    availability,
    image_url: row.image_url ? String(row.image_url) : null,
  };
}

export async function searchProducts(
  businessId: string,
  query: string,
  options?: { limit?: number; maxPrice?: number }
): Promise<ProductSearchHit[]> {
  if (!businessId) return [];
  const limit = Math.min(options?.limit ?? 8, 15);
  const q = sanitizeSearchQuery(query);

  const sb = getSupabaseAdmin();
  let builder = sb
    .from('products')
    .select('id, name, description, price, stock_level, unit, category, image_url, status')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('name')
    .limit(limit);

  if (q) {
    const tokens = q.split(' ').filter((t) => t.length >= 2).slice(0, 3);
    if (tokens.length >= 1) {
      const primary = [...tokens].sort((a, b) => b.length - a.length)[0];
      builder = builder.or(
        `name.ilike.%${primary}%,description.ilike.%${primary}%,category.ilike.%${primary}%`
      );
    }
  }
  if (typeof options?.maxPrice === 'number' && options.maxPrice > 0) {
    builder = builder.lte('price', options.maxPrice);
  }

  const { data, error } = await builder;
  if (error) {
    console.error(JSON.stringify({ event: 'product_search_failed', error: error.message, businessId }));
    return [];
  }

  return (data || []).map(mapRow);
}

export async function getSampleCatalog(
  businessId: string,
  limit = 12
): Promise<ProductSearchHit[]> {
  if (!businessId) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('products')
    .select('id, name, description, price, stock_level, unit, category, image_url, status')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('name')
    .limit(Math.min(limit, 15));

  if (error) {
    console.error(JSON.stringify({ event: 'product_search_failed', error: error.message, businessId }));
    return [];
  }
  return (data || []).map(mapRow);
}

export function formatProductsForPrompt(
  hits: ProductSearchHit[],
  currency: string
): string {
  if (!hits.length) {
    return 'PRODUCT DATA: No matching active products found. Do not invent products or prices.';
  }
  const lines = hits.map((h) => {
    const priceStr =
      h.price === null
        ? 'price=NOT SET (say you cannot confirm price)'
        : `price=${currency} ${h.price}`;
    return `- ${h.name} | ${priceStr} | ${h.availability} (stock=${h.stock_level})${
      h.unit ? ` | unit=${h.unit}` : ''
    }${h.category ? ` | cat=${h.category}` : ''}`;
  });
  return [
    'PRODUCT DATA (source of truth — never invent outside this list):',
    ...lines,
  ].join('\n');
}
