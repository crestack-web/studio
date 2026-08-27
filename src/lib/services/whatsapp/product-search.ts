/**
 * Controlled product lookup for MO WhatsApp sales (server-only).
 */
import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export type ProductSearchHit = {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  stock_level: number;
  unit: string | null;
  category: string | null;
  availability: 'in_stock' | 'low_stock' | 'out_of_stock';
  image_url: string | null;
};

export async function searchProducts(
  businessId: string,
  query: string,
  options?: { limit?: number; maxPrice?: number }
): Promise<ProductSearchHit[]> {
  if (!businessId) return [];
  const limit = Math.min(options?.limit ?? 8, 20);
  const q = (query || '').trim();

  const sb = getSupabaseAdmin();
  let builder = sb
    .from('products')
    .select('id, name, description, price, stock_level, unit, category, image_url, status')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('name')
    .limit(limit);

  if (q) {
    builder = builder.or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
  }
  if (typeof options?.maxPrice === 'number' && options.maxPrice > 0) {
    builder = builder.lte('price', options.maxPrice);
  }

  const { data, error } = await builder;
  if (error) {
    console.error(JSON.stringify({ event: 'product_search_failed', error: error.message }));
    return [];
  }

  return (data || []).map((row: any) => {
    const stock = Number(row.stock_level) || 0;
    let availability: ProductSearchHit['availability'] = 'in_stock';
    if (stock <= 0) availability = 'out_of_stock';
    else if (stock <= 3) availability = 'low_stock';
    return {
      product_id: String(row.id),
      name: String(row.name || 'Product'),
      description: row.description ? String(row.description) : null,
      price: Number(row.price) || 0,
      stock_level: stock,
      unit: row.unit ? String(row.unit) : null,
      category: row.category ? String(row.category) : null,
      availability,
      image_url: row.image_url ? String(row.image_url) : null,
    };
  });
}

export async function getBusinessProductContext(
  businessId: string,
  limit = 40
): Promise<string> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('products')
    .select('id, name, description, price, stock_level, unit, category')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('name')
    .limit(limit);

  if (error || !data?.length) {
    return 'PRODUCT CATALOG: No active products found in Busmo for this business. Do not invent products or prices.';
  }

  const lines = data.map((p: any) => {
    const stock = Number(p.stock_level) || 0;
    const avail = stock <= 0 ? 'OUT OF STOCK' : stock <= 3 ? `LOW STOCK (${stock})` : `IN STOCK (${stock})`;
    return `- ${p.name} | price=${Number(p.price) || 0} | ${avail}${p.unit ? ` | unit=${p.unit}` : ''}${p.category ? ` | cat=${p.category}` : ''}`;
  });

  return [
    'PRODUCT CATALOG (source of truth — never invent prices or stock outside this list):',
    ...lines,
  ].join('\n');
}
