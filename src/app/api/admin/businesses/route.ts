import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAdminUser } from '@/lib/admin/require-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdminUser(req);
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const category = (url.searchParams.get('category') || '').trim().toLowerCase();
    const status = (url.searchParams.get('status') || '').trim().toLowerCase();
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 150)));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));

    const sb = getSupabaseAdmin();

    let query = sb
      .from('businesses')
      .select(
        'id, name, category, location, status, owner_id, user_id, currency, plan, metadata, created_at, updated_at',
        { count: 'exact' }
      )
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) {
      // Fallback without optional columns some schemas lack
      console.warn('[admin/businesses] primary select failed', error.message);
      const alt = await sb
        .from('businesses')
        .select('id, name, category, location, owner_id, metadata, created_at, updated_at', {
          count: 'exact',
        })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (alt.error) {
        return NextResponse.json({ error: alt.error.message }, { status: 500 });
      }
      return mapResponse(sb, alt.data || [], alt.count, q, category, offset, limit);
    }

    return mapResponse(sb, data || [], count, q, category, offset, limit);
  } catch (e: any) {
    console.error('[admin/businesses]', e?.message);
    return NextResponse.json({ error: 'Failed to load businesses' }, { status: 500 });
  }
}

async function mapResponse(
  sb: ReturnType<typeof getSupabaseAdmin>,
  rows: any[],
  count: number | null,
  q: string,
  category: string,
  offset: number,
  limit: number
) {
  let filtered = rows;
  if (category) {
    filtered = filtered.filter((b) => String(b.category || '').toLowerCase() === category);
  }
  if (q) {
    filtered = filtered.filter((b) => {
      const hay = `${b.name || ''} ${b.category || ''} ${b.location || ''} ${b.id || ''} ${b.owner_id || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const ownerIds = Array.from(
    new Set(
      filtered
        .map((b) => b.owner_id || b.user_id)
        .filter(Boolean)
        .map(String)
    )
  );

  const ownerMap: Record<string, { email: string | null; fullName: string | null; plan: string | null }> = {};
  if (ownerIds.length) {
    const { data: owners } = await sb
      .from('users')
      .select('id, email, full_name, plan')
      .in('id', ownerIds);
    for (const u of owners || []) {
      ownerMap[(u as any).id] = {
        email: (u as any).email || null,
        fullName: (u as any).full_name || null,
        plan: (u as any).plan || null,
      };
    }
  }

  // Light usage signals: count related rows per business (best-effort, capped)
  const usage: Record<
    string,
    { products: number; sales: number; staff: number; expenses: number }
  > = {};
  const sample = filtered.slice(0, 80);
  await Promise.all(
    sample.map(async (b) => {
      const id = String(b.id);
      try {
        const [p, s, st, e] = await Promise.all([
          sb.from('products').select('id', { count: 'exact', head: true }).eq('business_id', id),
          sb.from('sales').select('id', { count: 'exact', head: true }).eq('business_id', id),
          sb.from('staff').select('id', { count: 'exact', head: true }).eq('business_id', id),
          sb.from('expenses').select('id', { count: 'exact', head: true }).eq('business_id', id),
        ]);
        usage[id] = {
          products: p.count || 0,
          sales: s.count || 0,
          staff: st.count || 0,
          expenses: e.count || 0,
        };
      } catch {
        usage[id] = { products: 0, sales: 0, staff: 0, expenses: 0 };
      }
    })
  );

  const categories = Array.from(
    new Set(rows.map((b) => String(b.category || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json({
    total: count ?? filtered.length,
    offset,
    limit,
    categories,
    businesses: filtered.map((b) => {
      const meta = b.metadata && typeof b.metadata === 'object' ? b.metadata : {};
      const ownerId = b.owner_id || b.user_id || null;
      const owner = ownerId ? ownerMap[String(ownerId)] : null;
      const u = usage[String(b.id)] || { products: 0, sales: 0, staff: 0, expenses: 0 };
      return {
        id: b.id,
        name: b.name || null,
        category: b.category || meta.category || meta.selectedCategory || null,
        location: b.location || meta.location || meta.city || null,
        status: b.status || meta.status || 'active',
        plan: b.plan || owner?.plan || meta.plan || 'starter',
        currency: b.currency || meta.currency || 'NGN',
        ownerId,
        ownerEmail: owner?.email || null,
        ownerName: owner?.fullName || null,
        products: u.products,
        sales: u.sales,
        staff: u.staff,
        expenses: u.expenses,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      };
    }),
  });
}
