import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAdminUser } from '@/lib/admin/require-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return startOfDay(d);
}

async function countRows(
  sb: ReturnType<typeof getSupabaseAdmin>,
  table: string,
  filters?: (q: any) => any
): Promise<number> {
  try {
    let q = sb.from(table).select('id', { count: 'exact', head: true });
    if (filters) q = filters(q);
    const { count, error } = await q;
    if (error) {
      console.warn(`[admin/insights] count ${table}:`, error.message);
      return 0;
    }
    return count ?? 0;
  } catch (e: any) {
    console.warn(`[admin/insights] count ${table} failed`, e?.message);
    return 0;
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdminUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sb = getSupabaseAdmin();
    const now = new Date();
    const today = startOfDay(now);
    const d7 = daysAgo(7);
    const d30 = daysAgo(30);
    const d90 = daysAgo(90);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // Core counts (parallel)
    const [
      totalUsers,
      totalBusinesses,
      usersToday,
      usersWeek,
      businessesMonth,
      activeUsers,
      suspendedUsers,
      salesCount,
      productsCount,
      expensesCount,
      staffCount,
      suppliersCount,
      moConversations,
      moMessages,
      waConnections,
    ] = await Promise.all([
      countRows(sb, 'users'),
      countRows(sb, 'businesses'),
      countRows(sb, 'users', (q) => q.gte('created_at', today.toISOString())),
      countRows(sb, 'users', (q) => q.gte('created_at', d7.toISOString())),
      countRows(sb, 'businesses', (q) => q.gte('created_at', monthStart.toISOString())),
      countRows(sb, 'users', (q) => q.eq('status', 'active')),
      countRows(sb, 'users', (q) => q.eq('status', 'suspended')),
      countRows(sb, 'sales'),
      countRows(sb, 'products'),
      countRows(sb, 'expenses'),
      countRows(sb, 'staff'),
      countRows(sb, 'suppliers'),
      countRows(sb, 'whatsapp_conversations'),
      countRows(sb, 'whatsapp_messages'),
      countRows(sb, 'whatsapp_connections'),
    ]);

    // User rows for plan / identity / growth series (capped)
    const { data: userRows } = await sb
      .from('users')
      .select('id, email, full_name, phone, role, plan, status, business_id, metadata, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(5000);

    const users = userRows || [];

    const planBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    let paidSubscribers = 0;
    let trialUsers = 0;
    let lifetimeUsers = 0;

    for (const u of users) {
      const plan = String((u as any).plan || 'unknown').toLowerCase() || 'unknown';
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
      const st = String((u as any).status || 'active').toLowerCase();
      statusBreakdown[st] = (statusBreakdown[st] || 0) + 1;

      const meta = ((u as any).metadata || {}) as Record<string, unknown>;
      const subStatus = String(
        meta.subscriptionStatus || meta.subscription_status || ''
      ).toLowerCase();
      if (meta.lifetimeAccess === true || meta.lifetime_access === true) lifetimeUsers += 1;
      if (['active', 'paid'].includes(subStatus) || ['standard', 'pro', 'control', 'scale'].includes(plan)) {
        if (plan !== 'starter' && plan !== 'unknown' && plan !== 'free') paidSubscribers += 1;
      }
      if (subStatus === 'trial' || subStatus === 'trialing' || plan === 'trial') trialUsers += 1;
    }

    // Business categories
    const { data: bizRows } = await sb
      .from('businesses')
      .select('id, name, category, industry, location, status, owner_id, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(3000);

    const businesses = bizRows || [];
    const categoryBreakdown: Record<string, number> = {};
    for (const b of businesses) {
      const cat = String((b as any).category || 'other').toLowerCase() || 'other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    }

    // Activity proxies from updated_at (businesses active in windows)
    const activeBiz7 = businesses.filter(
      (b: any) => b.updated_at && new Date(b.updated_at) >= d7
    ).length;
    const activeBiz30 = businesses.filter(
      (b: any) => b.updated_at && new Date(b.updated_at) >= d30
    ).length;

    // Churn risk: users created >30d ago, status not active, or no recent update
    const churnRisk = users.filter((u: any) => {
      const created = u.created_at ? new Date(u.created_at) : null;
      const updated = u.updated_at ? new Date(u.updated_at) : null;
      const st = String(u.status || '').toLowerCase();
      if (st === 'suspended') return true;
      if (created && created < d30 && updated && updated < d30) return true;
      return false;
    }).length;

    const retained30 = users.filter((u: any) => {
      const created = u.created_at ? new Date(u.created_at) : null;
      const updated = u.updated_at ? new Date(u.updated_at) : null;
      if (!created || created > d30) return false;
      return updated && updated >= d30;
    }).length;
    const cohort30 = users.filter((u: any) => {
      const created = u.created_at ? new Date(u.created_at) : null;
      return created && created <= d30;
    }).length;
    const retentionRate30 =
      cohort30 > 0 ? Math.round((retained30 / cohort30) * 1000) / 10 : 0;

    // Daily growth series (last 30 days)
    const growthSeries: Array<{
      date: string;
      newUsers: number;
      newBusinesses: number;
    }> = [];
    for (let i = 29; i >= 0; i--) {
      const day = daysAgo(i);
      const next = daysAgo(i - 1);
      const nextIso = i === 0 ? now.toISOString() : next.toISOString();
      const dayIso = day.toISOString();
      const label = day.toISOString().slice(0, 10);
      growthSeries.push({
        date: label,
        newUsers: users.filter((u: any) => {
          const c = u.created_at;
          return c && c >= dayIso && c < nextIso;
        }).length,
        newBusinesses: businesses.filter((b: any) => {
          const c = b.created_at;
          return c && c >= dayIso && c < nextIso;
        }).length,
      });
    }

    // Recent users (identity)
    const recentUsers = users.slice(0, 25).map((u: any) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      phone: u.phone,
      plan: u.plan || 'starter',
      status: u.status || 'active',
      businessId: u.business_id,
      role: u.role,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    // Recent businesses
    const recentBusinesses = businesses.slice(0, 20).map((b: any) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      location: b.location,
      status: b.status,
      ownerId: b.owner_id,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    // MO Sales credits aggregate if table exists
    let moCreditsGranted = 0;
    let moCreditsUsed = 0;
    try {
      const { data: wallets } = await sb
        .from('mo_credit_wallets')
        .select('trial_credits_granted, trial_credits_used, purchased_credits, total_credits_used')
        .limit(2000);
      for (const w of wallets || []) {
        moCreditsGranted +=
          Number((w as any).trial_credits_granted || 0) + Number((w as any).purchased_credits || 0);
        moCreditsUsed += Number((w as any).total_credits_used || 0);
      }
    } catch {
      /* table may not exist yet */
    }

    return NextResponse.json({
      generatedAt: now.toISOString(),
      source: 'supabase',
      metrics: {
        totalUsers,
        totalBusinesses,
        activeUsers,
        suspendedUsers,
        newUsersToday: usersToday,
        newUsersThisWeek: usersWeek,
        newBusinessesThisMonth: businessesMonth,
        activeBusinesses7Days: activeBiz7,
        activeBusinesses30Days: activeBiz30,
        paidSubscribers,
        trialUsers,
        lifetimeUsers,
        totalSales: salesCount,
        totalProducts: productsCount,
        totalExpenses: expensesCount,
        totalStaff: staffCount,
        totalSuppliers: suppliersCount,
        moConversations,
        moMessages,
        waConnections,
        churnRisk,
        retentionRate30,
        moCreditsGranted,
        moCreditsUsed,
      },
      planBreakdown,
      statusBreakdown,
      categoryBreakdown,
      growthSeries,
      recentUsers,
      recentBusinesses,
    });
  } catch (e: any) {
    console.error('[admin/insights]', e?.message || e);
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 });
  }
}
