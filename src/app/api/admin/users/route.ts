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

/** Soft-null FK columns that block deleting public.users (no ON DELETE CASCADE). */
const NULL_USER_FK: { table: string; column: string }[] = [
  { table: 'invitations', column: 'invited_by' },
  { table: 'expenses', column: 'created_by' },
  { table: 'transactions', column: 'created_by' },
  { table: 'inventory_adjustments', column: 'created_by' },
  { table: 'credit_transactions', column: 'created_by' },
  { table: 'cash_reconciliations', column: 'reconciled_by' },
  { table: 'purchases', column: 'created_by' },
  { table: 'stock_receipts', column: 'created_by' },
  { table: 'service_requests', column: 'assigned_to' },
  { table: 'support_tickets', column: 'assigned_to' },
  { table: 'business_verifications', column: 'reviewed_by' },
  { table: 'blogs', column: 'author_id' },
  { table: 'referrals', column: 'referred_id' },
  { table: 'businesses', column: 'owner_id' },
  { table: 'staff', column: 'user_id' },
];

/** Rows to delete by user_id (or leave for cascade after users row is gone). */
const DELETE_BY_USER: { table: string; column: string }[] = [
  { table: 'staff_permissions', column: 'user_id' },
  { table: 'subscriptions', column: 'user_id' },
  { table: 'subscription_transactions', column: 'user_id' },
  { table: 'admins', column: 'user_id' },
  { table: 'notifications', column: 'user_id' },
  { table: 'conversations', column: 'user_id' },
  { table: 'ai_conversations', column: 'user_id' },
  { table: 'ai_questions', column: 'user_id' },
  { table: 'audit_trail', column: 'user_id' },
  { table: 'payment_transactions', column: 'user_id' },
  { table: 'payouts', column: 'user_id' },
  { table: 'service_requests', column: 'user_id' },
  { table: 'attendance', column: 'user_id' },
  { table: 'statements', column: 'user_id' },
  { table: 'mo_conversations', column: 'user_id' },
  { table: 'mo_messages', column: 'user_id' },
  { table: 'reviews', column: 'user_id' },
  { table: 'referral_earnings', column: 'user_id' },
  { table: 'referral_payouts', column: 'user_id' },
  { table: 'referral_codes', column: 'user_id' },
  { table: 'referrals', column: 'referrer_id' },
  { table: 'support_tickets', column: 'user_id' },
  { table: 'support_messages', column: 'user_id' },
  { table: 'support_agents', column: 'user_id' },
  { table: 'chat_conversations', column: 'user_id' },
  { table: 'delivery_agents', column: 'user_id' },
  { table: 'investments', column: 'user_id' },
  { table: 'business_verifications', column: 'user_id' },
  { table: 'page_visits', column: 'user_id' },
  { table: 'ugc_creators', column: 'user_id' },
  { table: 'ugc_orders', column: 'user_id' },
];

const DELETE_BY_BUSINESS = [
  'staff',
  'products',
  'sales',
  'customers',
  'industry_records',
  'hospitality_staff',
  'hospitality_bookings',
  'hospitality_rooms',
  'hospitality_guests',
  'hospitality_websites',
  'solution_branding',
  'mo_credit_wallets',
  'business_wallets',
];

async function softNull(
  sb: ReturnType<typeof getSupabaseAdmin>,
  table: string,
  column: string,
  userId: string,
  cleaned: string[],
  warnings: string[]
) {
  try {
    const { error } = await sb.from(table).update({ [column]: null }).eq(column, userId);
    if (!error) cleaned.push(`null:${table}.${column}`);
    else if (!/relation|does not exist|schema cache|Could not find/i.test(error.message || '')) {
      warnings.push(`null ${table}.${column}: ${error.message}`);
    }
  } catch (e: any) {
    warnings.push(`null ${table}.${column}: ${e?.message || 'skip'}`);
  }
}

async function hardDelete(
  sb: ReturnType<typeof getSupabaseAdmin>,
  table: string,
  column: string,
  value: string,
  cleaned: string[],
  warnings: string[]
) {
  try {
    const { error } = await sb.from(table).delete().eq(column, value);
    if (!error) cleaned.push(`del:${table}.${column}`);
    else if (!/relation|does not exist|schema cache|Could not find/i.test(error.message || '')) {
      warnings.push(`del ${table}.${column}: ${error.message}`);
    }
  } catch (e: any) {
    warnings.push(`del ${table}.${column}: ${e?.message || 'skip'}`);
  }
}

/**
 * Permanently delete a user so the same email can sign up again.
 * Clears FK blockers, removes profile data, then auth.users.
 * If auth delete still fails, renames the auth email so the original is free.
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

    if (adminUser.id && adminUser.id === userId) {
      return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();

    const { data: profile } = await sb
      .from('users')
      .select('id, email, business_id, role')
      .eq('id', userId)
      .maybeSingle();

    // Also resolve email from Auth if profile missing
    let profileEmail = String((profile as any)?.email || '').toLowerCase();
    if (!profileEmail) {
      try {
        const { data: authData } = await sb.auth.admin.getUserById(userId);
        profileEmail = String(authData?.user?.email || '').toLowerCase();
      } catch {
        /* ignore */
      }
    }

    if (confirmEmail && profileEmail && confirmEmail !== profileEmail) {
      return NextResponse.json(
        { error: 'confirmEmail does not match the user record' },
        { status: 400 }
      );
    }

    const role = String((profile as any)?.role || '').toLowerCase();
    if (['admin', 'superadmin'].includes(role)) {
      return NextResponse.json({ error: 'Cannot delete admin accounts via this tool' }, { status: 403 });
    }

    const businessId = String((profile as any)?.business_id || userId);
    const cleaned: string[] = [];
    const warnings: string[] = [];

    // 1) Null non-cascade FKs pointing at this user
    for (const { table, column } of NULL_USER_FK) {
      await softNull(sb, table, column, userId, cleaned, warnings);
    }

    // 2) Delete user-scoped rows
    for (const { table, column } of DELETE_BY_USER) {
      await hardDelete(sb, table, column, userId, cleaned, warnings);
    }

    // 3) Delete business-scoped rows for their org (id often equals user id)
    for (const table of DELETE_BY_BUSINESS) {
      await hardDelete(sb, table, 'business_id', businessId, cleaned, warnings);
      if (businessId !== userId) {
        await hardDelete(sb, table, 'business_id', userId, cleaned, warnings);
      }
    }

    try {
      const { error } = await sb.from('businesses').delete().eq('id', businessId);
      if (!error) cleaned.push('del:businesses.id');
      else {
        await sb.from('businesses').delete().eq('owner_id', userId);
        cleaned.push('del:businesses.owner_id');
      }
    } catch {
      /* optional */
    }

    // 4) public.users row (auth cascade also removes this; delete early to surface FK errors)
    try {
      const { error } = await sb.from('users').delete().eq('id', userId);
      if (error) warnings.push(`users: ${error.message}`);
      else cleaned.push('del:users');
    } catch (e: any) {
      warnings.push(`users: ${e?.message || 'failed'}`);
    }

    // 5) Auth user — frees the email for signup
    let authDeleted = false;
    let emailFreed = false;
    const originalEmail = profileEmail || confirmEmail || null;

    const { error: authErr } = await sb.auth.admin.deleteUser(userId);
    if (!authErr) {
      authDeleted = true;
      emailFreed = true;
      cleaned.push('auth.users');
    } else {
      console.error('[admin/users DELETE] auth', authErr.message);
      warnings.push(`auth.delete: ${authErr.message}`);

      // Fallback: rename auth email so the real address can register again
      if (originalEmail) {
        const tombstone = `deleted.${userId.replace(/-/g, '').slice(0, 12)}.${Date.now()}@busmo-deleted.invalid`;
        const { error: updErr } = await sb.auth.admin.updateUserById(userId, {
          email: tombstone,
          email_confirm: true,
          ban_duration: '876000h',
          user_metadata: {
            deleted_at: new Date().toISOString(),
            deleted_by_admin: adminUser.email,
            previous_email: originalEmail,
          },
        });
        if (!updErr) {
          emailFreed = true;
          cleaned.push('auth.email_tombstoned');
          // Retry delete after FKs cleared / email moved
          const { error: retryErr } = await sb.auth.admin.deleteUser(userId);
          if (!retryErr) {
            authDeleted = true;
            cleaned.push('auth.users(retry)');
          } else {
            warnings.push(`auth.delete.retry: ${retryErr.message}`);
          }
        } else {
          warnings.push(`auth.tombstone: ${updErr.message}`);
        }
      }
    }

    if (!emailFreed && !authDeleted) {
      return NextResponse.json(
        {
          error:
            'Could not delete or free this auth user. Check foreign keys / Auth logs. Try again or delete from Supabase Auth dashboard.',
          cleaned,
          warnings,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      deletedUserId: userId,
      email: originalEmail,
      authDeleted,
      emailFreed,
      cleaned,
      warnings,
      message: authDeleted
        ? 'User permanently deleted. They can sign up again with the same email.'
        : 'Auth row kept but email was released. They can sign up again with the same email.',
    });
  } catch (e: any) {
    console.error('[admin/users DELETE]', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Delete failed' }, { status: 500 });
  }
}
