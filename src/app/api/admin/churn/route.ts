import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAdminUser } from '@/lib/admin/require-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireAdminUser(req);
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sb = getSupabaseAdmin();
    const now = new Date();
    const d7 = new Date(now);
    d7.setUTCDate(d7.getUTCDate() - 7);
    const d14 = new Date(now);
    d14.setUTCDate(d14.getUTCDate() - 14);
    const d30 = new Date(now);
    d30.setUTCDate(d30.getUTCDate() - 30);
    const d60 = new Date(now);
    d60.setUTCDate(d60.getUTCDate() - 60);

    const { data: users } = await sb
      .from('users')
      .select('id, email, full_name, phone, plan, status, business_id, metadata, created_at, updated_at')
      .order('updated_at', { ascending: true })
      .limit(3000);

    const list = users || [];

    type Risk = {
      id: string;
      email: string | null;
      fullName: string | null;
      plan: string;
      status: string;
      businessId: string | null;
      createdAt: string | null;
      lastSeenAt: string | null;
      riskLevel: 'critical' | 'high' | 'medium' | 'low';
      reasons: string[];
      daysInactive: number | null;
    };

    const risks: Risk[] = [];

    for (const u of list) {
      const reasons: string[] = [];
      const updated = (u as any).updated_at ? new Date((u as any).updated_at) : null;
      const created = (u as any).created_at ? new Date((u as any).created_at) : null;
      const st = String((u as any).status || 'active').toLowerCase();
      const plan = String((u as any).plan || 'starter').toLowerCase();
      const meta = ((u as any).metadata || {}) as Record<string, unknown>;
      const sub = String(meta.subscriptionStatus || meta.subscription_status || '').toLowerCase();

      let daysInactive: number | null = null;
      if (updated) {
        daysInactive = Math.floor((now.getTime() - updated.getTime()) / (86400 * 1000));
      }

      if (st === 'suspended') reasons.push('Account suspended');
      if (sub === 'cancelled' || sub === 'canceled' || sub === 'expired') {
        reasons.push(`Subscription ${sub}`);
      }
      if (updated && updated < d60) reasons.push('Inactive 60+ days');
      else if (updated && updated < d30) reasons.push('Inactive 30+ days');
      else if (updated && updated < d14) reasons.push('Inactive 14+ days');
      else if (updated && updated < d7) reasons.push('Inactive 7+ days');

      if (created && created < d30 && !updated) reasons.push('No activity signal after signup');
      if (!(u as any).business_id) reasons.push('No business linked');
      if (plan === 'starter' && updated && updated < d30) reasons.push('Starter + cold');

      if (reasons.length === 0) continue;

      let riskLevel: Risk['riskLevel'] = 'low';
      if (st === 'suspended' || (daysInactive != null && daysInactive >= 60)) riskLevel = 'critical';
      else if (daysInactive != null && daysInactive >= 30) riskLevel = 'high';
      else if (daysInactive != null && daysInactive >= 14) riskLevel = 'medium';
      else riskLevel = 'low';

      risks.push({
        id: (u as any).id,
        email: (u as any).email,
        fullName: (u as any).full_name,
        plan,
        status: st,
        businessId: (u as any).business_id,
        createdAt: (u as any).created_at,
        lastSeenAt: (u as any).updated_at,
        riskLevel,
        reasons,
        daysInactive,
      });
    }

    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    risks.sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);

    const summary = {
      critical: risks.filter((r) => r.riskLevel === 'critical').length,
      high: risks.filter((r) => r.riskLevel === 'high').length,
      medium: risks.filter((r) => r.riskLevel === 'medium').length,
      low: risks.filter((r) => r.riskLevel === 'low').length,
      totalFlagged: risks.length,
    };

    return NextResponse.json({
      generatedAt: now.toISOString(),
      source: 'supabase',
      summary,
      risks: risks.slice(0, 150),
    });
  } catch (e: any) {
    console.error('[admin/churn]', e?.message);
    return NextResponse.json({ error: 'Failed to load churn' }, { status: 500 });
  }
}
