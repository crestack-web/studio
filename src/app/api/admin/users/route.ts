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
    const plan = (url.searchParams.get('plan') || '').trim().toLowerCase();
    const status = (url.searchParams.get('status') || '').trim().toLowerCase();
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 100)));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));

    const sb = getSupabaseAdmin();
    let query = sb
      .from('users')
      .select(
        'id, email, full_name, phone, role, plan, status, business_id, metadata, created_at, updated_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (plan) query = query.eq('plan', plan);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) {
      console.error('[admin/users]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let rows = data || [];
    if (q) {
      rows = rows.filter((u: any) => {
        const hay = `${u.email || ''} ${u.full_name || ''} ${u.phone || ''} ${u.business_id || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    // Attach business names
    const bizIds = Array.from(new Set(rows.map((u: any) => u.business_id).filter(Boolean)));
    const bizMap: Record<string, string> = {};
    if (bizIds.length) {
      const { data: biz } = await sb.from('businesses').select('id, name').in('id', bizIds);
      for (const b of biz || []) bizMap[(b as any).id] = (b as any).name || '';
    }

    return NextResponse.json({
      total: count ?? rows.length,
      offset,
      limit,
      users: rows.map((u: any) => {
        const meta = u.metadata || {};
        return {
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          phone: u.phone,
          role: u.role,
          plan: u.plan || 'starter',
          status: u.status || 'active',
          businessId: u.business_id,
          businessName: u.business_id ? bizMap[u.business_id] || null : null,
          subscriptionStatus: meta.subscriptionStatus || meta.subscription_status || null,
          lifetimeAccess: Boolean(meta.lifetimeAccess || meta.lifetime_access),
          createdAt: u.created_at,
          updatedAt: u.updated_at,
          lastSeenAt: u.updated_at,
        };
      }),
    });
  } catch (e: any) {
    console.error('[admin/users]', e?.message);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
