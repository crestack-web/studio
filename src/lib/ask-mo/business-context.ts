import { getSupabaseAdmin } from '@/lib/supabase-server';

export type MoBusinessContext = {
  products: Array<{
    id: string;
    name: string;
    price: number;
    cost: number;
    stock: number;
    productType: string;
    category?: string;
  }>;
  sellable: Array<{ name: string; price: number; stock: number; productType: string }>;
  ingredients: Array<{ name: string; stock: number }>;
  todaySales: number;
  todayProfit: number;
  todayTx: number;
  yesterdaySales: number;
  topItemsToday: Array<{ name: string; quantity: number; revenue: number }>;
  lowStock: Array<{ name: string; stock: number }>;
  outOfStock: Array<{ name: string }>;
  catalogNames: string[];
};

function num(v: unknown, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function dayBounds(offsetDays: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/** Ground MO on real Supabase inventory + sales. */
export async function loadMoBusinessContext(
  businessId: string
): Promise<MoBusinessContext | null> {
  if (!businessId) return null;
  try {
    const sb = getSupabaseAdmin();
    const { data: productRows } = await sb
      .from('products')
      .select('id, name, price, cost, stock_level, status, metadata, category')
      .eq('business_id', businessId)
      .limit(500);

    const products = (productRows || [])
      .filter((r: any) => {
        const st = String(r.status || '').toLowerCase();
        return !['inactive', 'archived', 'deleted', 'draft'].includes(st);
      })
      .map((r: any) => {
        const meta =
          r.metadata && typeof r.metadata === 'object' ? (r.metadata as any) : {};
        const productType = String(
          meta.productType || meta.product_type || r.category || 'product'
        ).toLowerCase();
        return {
          id: r.id,
          name: String(r.name || 'Unnamed'),
          price: num(r.price),
          cost: num(r.cost),
          stock: num(r.stock_level),
          productType,
          category: r.category || undefined,
        };
      });

    const sellable = products
      .filter((p) => p.productType !== 'ingredient')
      .map((p) => ({
        name: p.name,
        price: p.price,
        stock: p.stock,
        productType: p.productType,
      }));
    const ingredients = products
      .filter((p) => p.productType === 'ingredient')
      .map((p) => ({ name: p.name, stock: p.stock }));

    const lowStock = products
      .filter((p) => p.stock > 0 && p.stock <= 10)
      .map((p) => ({ name: p.name, stock: p.stock }));
    const outOfStock = products
      .filter((p) => p.stock <= 0)
      .map((p) => ({ name: p.name }));

    const today = dayBounds(0);
    const yday = dayBounds(-1);

    const { data: salesRows } = await sb
      .from('sales')
      .select('id, total, total_revenue, profit, products, items, created_at, metadata')
      .eq('business_id', businessId)
      .gte('created_at', yday.start.toISOString())
      .order('created_at', { ascending: false })
      .limit(200);

    let todaySales = 0;
    let todayProfit = 0;
    let todayTx = 0;
    let yesterdaySales = 0;
    const itemAgg: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const row of salesRows || []) {
      const created = row.created_at ? new Date(row.created_at) : null;
      if (!created || isNaN(created.getTime())) continue;
      const meta =
        row.metadata && typeof row.metadata === 'object' ? (row.metadata as any) : {};
      const amount =
        num(row.total_revenue) ||
        num(row.total) ||
        num(meta.totalRevenue) ||
        num(meta.total) ||
        0;
      const profit = num(row.profit) || num(meta.profit) || 0;
      const items = Array.isArray(row.products)
        ? row.products
        : Array.isArray(row.items)
          ? row.items
          : Array.isArray(meta.products)
            ? meta.products
            : [];

      if (created >= today.start && created < today.end) {
        todaySales += amount;
        todayProfit += profit;
        todayTx += 1;
        for (const it of items as any[]) {
          const name = String(it.name || it.productName || 'Item');
          const qty = num(it.quantity, 1);
          const rev = num(it.total) || num(it.price) * qty || 0;
          if (!itemAgg[name]) itemAgg[name] = { name, quantity: 0, revenue: 0 };
          itemAgg[name].quantity += qty;
          itemAgg[name].revenue += rev;
        }
      } else if (created >= yday.start && created < yday.end) {
        yesterdaySales += amount;
      }
    }

    const topItemsToday = Object.values(itemAgg)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      products,
      sellable,
      ingredients,
      todaySales,
      todayProfit,
      todayTx,
      yesterdaySales,
      topItemsToday,
      lowStock,
      outOfStock,
      catalogNames: products.map((p) => p.name),
    };
  } catch (e) {
    console.error('[loadMoBusinessContext]', e);
    return null;
  }
}

export function formatMoBusinessContextForPrompt(ctx: MoBusinessContext): string {
  const sellableLines =
    ctx.sellable.length === 0
      ? '- (no sellable dishes/products in catalog)'
      : ctx.sellable
          .slice(0, 40)
          .map(
            (p) =>
              `- ${p.name} | price ₦${p.price} | stock ${p.stock} | type ${p.productType}`
          )
          .join('\n');
  const ingredientLines =
    ctx.ingredients.length === 0
      ? '- (no ingredients listed)'
      : ctx.ingredients
          .slice(0, 40)
          .map((p) => `- ${p.name} | stock ${p.stock}`)
          .join('\n');
  const topLines =
    ctx.topItemsToday.length === 0
      ? '- (no line items recorded on sales today)'
      : ctx.topItemsToday
          .map(
            (i) =>
              `- ${i.name}: qty ${i.quantity}, revenue ₦${Math.round(i.revenue)}`
          )
          .join('\n');

  return [
    'LIVE BUSINESS DATA (source of truth — do not invent products or sales):',
    `Today sales: ₦${Math.round(ctx.todaySales)} | profit: ₦${Math.round(ctx.todayProfit)} | transactions: ${ctx.todayTx}`,
    `Yesterday sales: ₦${Math.round(ctx.yesterdaySales)}`,
    'Top items sold TODAY (from real sale lines only):',
    topLines,
    'Sellable catalog (dishes/products only — NOT ingredients):',
    sellableLines,
    'Ingredients only (cannot be sold as finished dishes):',
    ingredientLines,
    ctx.lowStock.length
      ? `Low stock: ${ctx.lowStock.map((p) => `${p.name}(${p.stock})`).join(', ')}`
      : 'Low stock: none flagged',
    ctx.outOfStock.length
      ? `Out of stock: ${ctx.outOfStock.map((p) => p.name).join(', ')}`
      : 'Out of stock: none',
    'RULES:',
    '- Only name products/dishes that appear in the sellable catalog or top items list above.',
    '- Never invent dishes (e.g. fried rice) if they are not in catalog/sales lines.',
    '- Ingredients are inputs, not menu items — do not recommend selling an ingredient as a dish.',
    '- If catalog is empty or only ingredients exist, say so and suggest adding menu dishes in Products/Menu.',
    '- Prefer concrete next actions grounded in the numbers above.',
  ].join('\n');
}
