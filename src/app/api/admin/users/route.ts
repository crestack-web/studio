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

/**
 * Permanently delete a user so the same email can sign up again.
 * Body: { userId: string, confirmEmail?: string }
 * Removes: auth user, users row, owned businesses (best-effort related rows).
 */
export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await requireAdminUser(req);
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const userId = String(body.userId || body.id || '').trim();
    const confirmEmail = String(body.confirmEmail || body.email || '')
      .trim()
      .toLowerCase();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Never delete the acting admin's own account via this endpoint
    if (adminUser.id && adminUser.id === userId) {
      return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();

    const { data: profile } = await sb
      .from('users')
      .select('id, email, business_id, role')
      .eq('id', userId)
      .maybeSingle();

    const profileEmail = String((profile as any)?.email || '').toLowerCase();
    if (confirmEmail && profileEmail && confirmEmail !== profileEmail) {
      return NextResponse.json(
        { error: 'confirmEmail does not match the user record' },
        { status: 400 }
      );
    }

    // Block deleting other admins by email whitelist role
    const role = String((profile as any)?.role || '').toLowerCase();
    if (['admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Cannot delete admin accounts via this tool' }, { status: 403 });
    }

    const businessId = (profile as any)?.business_id || userId;
    const cleaned: string[] = [];
    const warnings: string[] = [];

    // Best-effort clean of org-owned rows (ignore missing tables)
    const softTables: { table: string; column: string }[] = [
      { table: 'staff', column: 'business_id' },
      { table: 'products', column: 'business_id' },
      { table: 'sales', column: 'business_id' },
      { table: 'customers', column: 'business_id' },
      { table: 'industry_records', column: 'business_id' },
      { table: 'organizations', column: 'owner_user_id' },
      { table: 'organizations', column: 'id' },
    ];
    for (const { table, column } of softTables) {
      try {
        const val = column.includes('user') ? userId : businessId;
        const { error } = await sb.from(table).delete().eq(column, val);
        if (!error) cleaned.push(`${table}.${column}`);
        else if (!/relation|does not exist|schema cache/i.test(error.message || '')) {
          warnings.push(`${table}: ${error.message}`);
        }
      } catch (e: any) {
        warnings.push(`${table}: ${e?.message || 'skip'}`);
      }
    }

    try {
      const { error } = await sb.from('businesses').delete().eq('id', businessId);
      if (!error) cleaned.push('businesses');
      else if (!/relation|does not exist/i.test(error.message || '')) {
        // also try owner_id
        await sb.from('businesses').delete().eq('owner_id', userId);
        cleaned.push('businesses(owner)');
      }
    } catch {
      /* optional */
    }

    try {
      const { error } = await sb.from('users').delete().eq('id', userId);
      if (error) warnings.push(`users: ${error.message}`);
      else cleaned.push('users');
    } catch (e: any) {
      warnings.push(`users: ${e?.message || 'failed'}`);
    }

    // Auth user last — this is what frees the email for signup again
    const { error: authErr } = await sb.auth.admin.deleteUser(userId);
    if (authErr) {
      // Profile may already be gone; still report auth failure clearly
      console.error('[admin/users DELETE] auth', authErr.message);
      return NextResponse.json(
        {
          error: `Could not delete auth user: ${authErr.message}`,
          cleaned,
          warnings,
        },
        { status: 500 }
      );
    }
    cleaned.push('auth.users');

    return NextResponse.json({
      ok: true,
      deletedUserId: userId,
      email: profileEmail || confirmEmail || null,
      cleaned,
      warnings,
      message: 'User permanently deleted. They can sign up again with the same email.',
    });
  } catch (e: any) {
    console.error('[admin/users DELETE]', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Delete failed' }, { status: 500 });
  }
}
