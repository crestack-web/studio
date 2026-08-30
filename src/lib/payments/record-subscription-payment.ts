import 'server-only';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getPlanById, planDisplayName } from '@/lib/pricing';

/**
 * Idempotent record of a successful Paystack subscription payment into Supabase.
 * Amount stored in Naira (Paystack amount is kobo).
 * Also unlocks the user account: plan + subscription_status=active + end dates.
 */
export async function recordSubscriptionPayment(params: {
  reference: string;
  amountKobo: number;
  currency?: string;
  email?: string | null;
  userId?: string | null;
  planId?: string | null;
  planName?: string | null;
  billing?: string | null;
  paidAt?: string | null;
}): Promise<{ ok: boolean; id?: string; duplicate?: boolean; error?: string; userId?: string | null }> {
  const sb = getSupabaseAdmin();
  const reference = String(params.reference || '').trim();
  if (!reference) return { ok: false, error: 'reference required' };

  const { data: existing } = await sb
    .from('payment_transactions')
    .select('id')
    .eq('provider_ref', reference)
    .maybeSingle();

  if (existing) {
    await unlockUserSubscription(sb, {
      userId: params.userId,
      email: params.email,
      planId: params.planId,
      billing: params.billing,
      paidAt: params.paidAt,
    });
    return { ok: true, id: (existing as any).id, duplicate: true };
  }

  const plan = getPlanById(params.planId || 'starter');
  const amountNaira = Number(params.amountKobo || 0) / 100;
  const id = randomUUID();
  const billing =
    String(params.billing || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';

  let userId = params.userId || null;
  if ((!userId || !/^[0-9a-f-]{36}$/i.test(String(userId))) && params.email) {
    const { data: u } = await sb
      .from('users')
      .select('id')
      .eq('email', params.email.toLowerCase())
      .maybeSingle();
    if (u) userId = (u as any).id;
  }

  let businessId: string | null = null;
  if (userId) {
    const { data: u } = await sb
      .from('users')
      .select('business_id, businessId')
      .eq('id', userId)
      .maybeSingle();
    businessId = (u as any)?.business_id || (u as any)?.businessId || null;
  }

  const { error } = await sb.from('payment_transactions').insert({
    id,
    business_id: businessId,
    user_id: userId,
    type: 'subscription',
    amount: amountNaira,
    currency: params.currency || 'NGN',
    status: 'success',
    provider: 'paystack',
    provider_ref: reference,
    metadata: {
      planId: plan.id,
      planName: params.planName || planDisplayName(params.planId || plan.id),
      billing,
      email: params.email || null,
      paidAt: params.paidAt || new Date().toISOString(),
      amountKobo: params.amountKobo,
    },
    created_at: params.paidAt || new Date().toISOString(),
  });

  if (error) {
    if (String(error.message || '').includes('duplicate') || error.code === '23505') {
      await unlockUserSubscription(sb, {
        userId,
        email: params.email,
        planId: plan.id,
        billing,
        paidAt: params.paidAt,
      });
      return { ok: true, duplicate: true, userId };
    }
    console.error('[recordSubscriptionPayment]', error.message);
    return { ok: false, error: error.message };
  }

  await unlockUserSubscription(sb, {
    userId,
    email: params.email,
    planId: plan.id,
    billing,
    paidAt: params.paidAt,
  });

  return { ok: true, id, userId };
}

async function unlockUserSubscription(
  sb: ReturnType<typeof getSupabaseAdmin>,
  opts: {
    userId?: string | null;
    email?: string | null;
    planId?: string | null;
    billing?: string | null;
    paidAt?: string | null;
  }
) {
  const plan = getPlanById(opts.planId || 'starter');
  const billing =
    String(opts.billing || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';

  const end = new Date(opts.paidAt ? new Date(opts.paidAt) : new Date());
  if (billing === 'yearly') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setDate(end.getDate() + 30);
  }
  const endIso = end.toISOString();
  const nowIso = new Date().toISOString();

  const patch: Record<string, unknown> = {
    plan: plan.id,
    subscription_status: 'active',
    subscription_end_date: endIso,
    subscription_start_date: nowIso,
    trial_end_date: nowIso,
    updated_at: nowIso,
  };

  let userId = opts.userId || null;
  if (userId) {
    try {
      const { data: existing } = await sb.from('users').select('metadata').eq('id', userId).maybeSingle();
      const prev =
        existing?.metadata && typeof existing.metadata === 'object'
          ? { ...(existing.metadata as Record<string, unknown>) }
          : {};
      patch.metadata = {
        ...prev,
        plan: plan.id,
        subscriptionStatus: 'active',
        subscriptionEndDate: endIso,
        subscriptionStartDate: nowIso,
        trialEndDate: nowIso,
      };
    } catch {
      /* ignore */
    }
    const { error } = await sb.from('users').update(patch).eq('id', userId);
    if (error) {
      console.error('[unlockUserSubscription] by id', error.message);
    } else {
      try {
        const { data: u } = await sb
          .from('users')
          .select('business_id, businessId')
          .eq('id', userId)
          .maybeSingle();
        const bid = (u as any)?.business_id || (u as any)?.businessId;
        if (bid) {
          await sb
            .from('businesses')
            .update({
              plan: plan.id,
              subscription_status: 'active',
              updated_at: nowIso,
            })
            .eq('id', bid);
        }
      } catch (e: any) {
        console.warn('[unlockUserSubscription] business update skipped', e?.message);
      }
      return;
    }
  }

  if (opts.email) {
    const { error } = await sb
      .from('users')
      .update(patch)
      .eq('email', opts.email.toLowerCase());
    if (error) {
      console.error('[unlockUserSubscription] by email', error.message);
    }
  }
}
