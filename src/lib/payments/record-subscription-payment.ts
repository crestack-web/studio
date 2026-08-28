import 'server-only';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getPlanById, planDisplayName } from '@/lib/pricing';

/**
 * Idempotent record of a successful Paystack subscription payment into Supabase.
 * Amount stored in Naira (Paystack amount is kobo).
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
}): Promise<{ ok: boolean; id?: string; duplicate?: boolean; error?: string }> {
  const sb = getSupabaseAdmin();
  const reference = String(params.reference || '').trim();
  if (!reference) return { ok: false, error: 'reference required' };

  const { data: existing } = await sb
    .from('payment_transactions')
    .select('id')
    .eq('provider_ref', reference)
    .maybeSingle();

  if (existing) {
    return { ok: true, id: (existing as any).id, duplicate: true };
  }

  const plan = getPlanById(params.planId || 'starter');
  const amountNaira = Number(params.amountKobo || 0) / 100;
  const id = randomUUID();

  let userId = params.userId || null;
  if (userId && !String(userId).includes('-')) {
    userId = null;
  }
  if (!userId && params.email) {
    const { data: u } = await sb
      .from('users')
      .select('id')
      .eq('email', params.email.toLowerCase())
      .maybeSingle();
    if (u) userId = (u as any).id;
  }

  let businessId: string | null = null;
  if (userId) {
    const { data: u } = await sb.from('users').select('business_id').eq('id', userId).maybeSingle();
    businessId = (u as any)?.business_id || null;
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
      billing: params.billing || 'monthly',
      email: params.email || null,
      paidAt: params.paidAt || new Date().toISOString(),
      amountKobo: params.amountKobo,
    },
    created_at: params.paidAt || new Date().toISOString(),
  });

  if (error) {
    if (String(error.message || '').includes('duplicate') || error.code === '23505') {
      return { ok: true, duplicate: true };
    }
    console.error('[recordSubscriptionPayment]', error.message);
    return { ok: false, error: error.message };
  }

  if (userId) {
    await sb
      .from('users')
      .update({
        plan: plan.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  return { ok: true, id };
}
