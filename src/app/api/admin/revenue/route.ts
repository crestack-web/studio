import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin/require-admin';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { BUSMO_PLANS, formatNaira, planDisplayName } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdminUser(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sb = getSupabaseAdmin();
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const d30 = new Date(now);
    d30.setUTCDate(d30.getUTCDate() - 30);

    const { data: payments, error } = await sb
      .from('payment_transactions')
      .select('id, amount, currency, status, provider_ref, metadata, created_at, user_id')
      .eq('type', 'subscription')
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) {
      console.error('[admin/revenue]', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = payments || [];
    let totalRevenue = 0;
    let revenueThisMonth = 0;
    let revenue30d = 0;
    const byPlan: Record<string, { count: number; amount: number }> = {
      starter: { count: 0, amount: 0 },
      standard: { count: 0, amount: 0 },
      pro: { count: 0, amount: 0 },
    };
    const byBilling: Record<string, number> = { monthly: 0, yearly: 0 };

    for (const p of rows) {
      const amt = Number((p as any).amount) || 0;
      totalRevenue += amt;
      const created = (p as any).created_at ? new Date((p as any).created_at) : null;
      if (created && created >= monthStart) revenueThisMonth += amt;
      if (created && created >= d30) revenue30d += amt;

      const meta = ((p as any).metadata || {}) as Record<string, unknown>;
      let planId = String(meta.planId || meta.plan || 'starter').toLowerCase();
      if (planId.includes('control') || planId.includes('standard')) planId = 'standard';
      else if (planId.includes('scale') || planId.includes('pro')) planId = 'pro';
      else if (planId.includes('start')) planId = 'starter';
      if (!byPlan[planId]) byPlan[planId] = { count: 0, amount: 0 };
      byPlan[planId].count += 1;
      byPlan[planId].amount += amt;

      const billing = String(meta.billing || 'monthly').toLowerCase();
      byBilling[billing === 'yearly' ? 'yearly' : 'monthly'] =
        (byBilling[billing === 'yearly' ? 'yearly' : 'monthly'] || 0) + amt;
    }

    const recent = rows.slice(0, 40).map((p: any) => {
      const meta = p.metadata || {};
      return {
        id: p.id,
        reference: p.provider_ref,
        amount: Number(p.amount) || 0,
        currency: p.currency || 'NGN',
        planId: meta.planId || meta.plan || null,
        planName: meta.planName || planDisplayName(String(meta.planId || meta.plan || '')),
        billing: meta.billing || 'monthly',
        email: meta.email || null,
        createdAt: p.created_at,
      };
    });

    return NextResponse.json({
      generatedAt: now.toISOString(),
      source: 'supabase+paystack',
      plans: BUSMO_PLANS.map((pl) => ({
        id: pl.id,
        name: pl.name,
        tagline: pl.tagline,
        monthlyPrice: pl.monthlyPrice,
        yearlyPrice: pl.yearlyPrice,
        monthlyPriceLabel: formatNaira(pl.monthlyPrice),
        yearlyPriceLabel: formatNaira(pl.yearlyPrice),
        popular: Boolean(pl.popular),
        paymentsCount: byPlan[pl.id]?.count || 0,
        revenue: byPlan[pl.id]?.amount || 0,
      })),
      metrics: {
        totalRevenue,
        revenueThisMonth,
        revenue30d,
        successfulPayments: rows.length,
        byBilling,
      },
      recentPayments: recent,
    });
  } catch (e: any) {
    console.error('[admin/revenue]', e?.message);
    return NextResponse.json({ error: 'Failed to load revenue' }, { status: 500 });
  }
}
