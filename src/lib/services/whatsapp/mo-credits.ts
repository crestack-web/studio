/**
 * MO Sales credit wallet + ledger (server-only).
 * Trial is per business_id; deductions are atomic via Postgres RPCs.
 */
import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/** Credits charged when MO successfully generates a reply to send. */
export const MO_CREDITS_PER_RESPONSE = 1;

export type MoCreditConfig = {
  trialCredits: number;
  creditsPerResponse: number;
  lowCreditPct: number;
  criticalCreditPct: number;
  currency: string;
};

export type MoCreditPackage = {
  id: string;
  name: string;
  credits: number;
  priceKobo: number;
  currency: string;
  description: string | null;
};

export type MoWalletSnapshot = {
  businessId: string;
  trialCreditsGranted: number;
  trialCreditsUsed: number;
  trialCreditsRemaining: number;
  purchasedCredits: number;
  purchasedCreditsUsed: number;
  purchasedCreditsRemaining: number;
  totalCreditsUsed: number;
  availableCredits: number;
  trialStartedAt: string | null;
  status: 'trial' | 'healthy' | 'low' | 'critical' | 'empty' | 'no_wallet';
};

export type MoLedgerRow = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  conversationId: string | null;
  messageId: string | null;
  description: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

function availableFromWallet(w: {
  trial_credits_granted: number;
  trial_credits_used: number;
  purchased_credits: number;
  purchased_credits_used: number;
}): number {
  return Math.max(
    0,
    w.trial_credits_granted -
      w.trial_credits_used +
      (w.purchased_credits - w.purchased_credits_used)
  );
}

export async function getMoCreditConfig(): Promise<MoCreditConfig> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('mo_credit_config')
    .select('trial_credits, credits_per_response, low_credit_pct, critical_credit_pct, currency')
    .eq('id', 'default')
    .maybeSingle();

  return {
    trialCredits: data?.trial_credits ?? 100,
    creditsPerResponse: data?.credits_per_response ?? MO_CREDITS_PER_RESPONSE,
    lowCreditPct: data?.low_credit_pct ?? 20,
    criticalCreditPct: data?.critical_credit_pct ?? 10,
    currency: data?.currency ?? 'NGN',
  };
}

export async function listMoCreditPackages(): Promise<MoCreditPackage[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('mo_credit_packages')
    .select('id, name, credits, price_kobo, currency, description')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    credits: p.credits,
    priceKobo: p.price_kobo,
    currency: p.currency || 'NGN',
    description: p.description || null,
  }));
}

function deriveStatus(
  snap: Omit<MoWalletSnapshot, 'status'>,
  cfg: MoCreditConfig
): MoWalletSnapshot['status'] {
  if (snap.trialCreditsGranted === 0 && snap.purchasedCredits === 0 && snap.availableCredits === 0) {
    return 'no_wallet';
  }
  if (snap.availableCredits <= 0) return 'empty';

  const lifetimeGranted = snap.trialCreditsGranted + snap.purchasedCredits;
  if (lifetimeGranted <= 0) return 'empty';

  const remainingPct = (snap.availableCredits / lifetimeGranted) * 100;
  const onlyTrialLeft =
    snap.purchasedCreditsRemaining === 0 && snap.trialCreditsRemaining > 0;

  if (onlyTrialLeft && snap.purchasedCredits === 0) return 'trial';
  if (remainingPct <= cfg.criticalCreditPct) return 'critical';
  if (remainingPct <= cfg.lowCreditPct) return 'low';
  if (onlyTrialLeft) return 'trial';
  return 'healthy';
}

export function snapshotFromRow(
  businessId: string,
  row: any | null,
  cfg: MoCreditConfig
): MoWalletSnapshot {
  if (!row) {
    return {
      businessId,
      trialCreditsGranted: 0,
      trialCreditsUsed: 0,
      trialCreditsRemaining: 0,
      purchasedCredits: 0,
      purchasedCreditsUsed: 0,
      purchasedCreditsRemaining: 0,
      totalCreditsUsed: 0,
      availableCredits: 0,
      trialStartedAt: null,
      status: 'no_wallet',
    };
  }

  const trialGranted = Number(row.trial_credits_granted) || 0;
  const trialUsed = Number(row.trial_credits_used) || 0;
  const purchased = Number(row.purchased_credits) || 0;
  const purchasedUsed = Number(row.purchased_credits_used) || 0;
  const base = {
    businessId,
    trialCreditsGranted: trialGranted,
    trialCreditsUsed: trialUsed,
    trialCreditsRemaining: Math.max(0, trialGranted - trialUsed),
    purchasedCredits: purchased,
    purchasedCreditsUsed: purchasedUsed,
    purchasedCreditsRemaining: Math.max(0, purchased - purchasedUsed),
    totalCreditsUsed: Number(row.total_credits_used) || 0,
    availableCredits: availableFromWallet(row),
    trialStartedAt: row.trial_started_at || null,
  };
  return { ...base, status: deriveStatus(base, cfg) };
}

export async function getWalletSnapshot(businessId: string): Promise<MoWalletSnapshot> {
  const sb = getSupabaseAdmin();
  const cfg = await getMoCreditConfig();
  const { data } = await sb
    .from('mo_credit_wallets')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();
  return snapshotFromRow(businessId, data, cfg);
}

/** Ensure wallet exists and trial is granted at most once per business. */
export async function ensureTrialCredits(businessId: string): Promise<MoWalletSnapshot> {
  const sb = getSupabaseAdmin();
  const { error } = await sb.rpc('mo_credits_ensure_trial', {
    p_business_id: businessId,
    p_trial_amount: null,
  });
  if (error) {
    console.error(JSON.stringify({ event: 'mo_credits_ensure_trial_failed', error: error.message }));
  }
  return getWalletSnapshot(businessId);
}

export async function getAvailableCredits(businessId: string): Promise<number> {
  const snap = await getWalletSnapshot(businessId);
  return snap.availableCredits;
}

/**
 * Atomically reserve/deduct credits for one MO response.
 * Safe for concurrent messages; idempotent on message_id.
 */
export async function deductForMoResponse(params: {
  businessId: string;
  amount?: number;
  conversationId?: string;
  messageId?: string;
  providerMessageId?: string;
  description?: string;
}): Promise<{ ok: boolean; balance: number; ledgerId?: string; error?: string; duplicate?: boolean }> {
  const sb = getSupabaseAdmin();
  const cfg = await getMoCreditConfig();
  const amount = params.amount ?? cfg.creditsPerResponse ?? MO_CREDITS_PER_RESPONSE;

  const { data, error } = await sb.rpc('mo_credits_deduct_for_response', {
    p_business_id: params.businessId,
    p_amount: amount,
    p_conversation_id: params.conversationId || null,
    p_message_id: params.messageId || null,
    p_provider_message_id: params.providerMessageId || null,
    p_description: params.description || 'MO response',
  });

  if (error) {
    console.error(JSON.stringify({ event: 'mo_credits_deduct_failed', error: error.message }));
    return { ok: false, balance: 0, error: error.message };
  }

  const row = data as any;
  if (!row?.ok) {
    return {
      ok: false,
      balance: Number(row?.balance) || 0,
      error: String(row?.error || 'deduct_failed'),
    };
  }

  return {
    ok: true,
    balance: Number(row.balance) || 0,
    ledgerId: row.ledger_id,
    duplicate: Boolean(row.duplicate),
  };
}

export async function refundUsageForFailedSend(params: {
  businessId: string;
  messageId: string;
  reason?: string;
}): Promise<{ ok: boolean; balance?: number; error?: string }> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.rpc('mo_credits_refund_usage', {
    p_business_id: params.businessId,
    p_message_id: params.messageId,
    p_reason: params.reason || 'outbound_send_failed',
  });
  if (error) {
    console.error(JSON.stringify({ event: 'mo_credits_refund_failed', error: error.message }));
    return { ok: false, error: error.message };
  }
  const row = data as any;
  if (!row?.ok && !row?.duplicate) {
    return { ok: false, error: String(row?.error || 'refund_failed') };
  }
  return { ok: true, balance: Number(row?.balance) };
}

export async function grantPurchaseCredits(params: {
  businessId: string;
  credits: number;
  paymentReference: string;
  packageId?: string;
  amountKobo?: number;
  currency?: string;
}): Promise<{ ok: boolean; balance?: number; duplicate?: boolean; error?: string }> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.rpc('mo_credits_grant_purchase', {
    p_business_id: params.businessId,
    p_credits: params.credits,
    p_payment_reference: params.paymentReference,
    p_package_id: params.packageId || null,
    p_amount_kobo: params.amountKobo ?? null,
    p_currency: params.currency || 'NGN',
  });
  if (error) {
    console.error(JSON.stringify({ event: 'mo_credits_grant_failed', error: error.message }));
    return { ok: false, error: error.message };
  }
  const row = data as any;
  if (!row?.ok) return { ok: false, error: String(row?.error || 'grant_failed') };
  return {
    ok: true,
    balance: Number(row.balance),
    duplicate: Boolean(row.duplicate),
  };
}

export async function listLedger(params: {
  businessId: string;
  limit?: number;
  offset?: number;
  since?: string;
  until?: string;
}): Promise<MoLedgerRow[]> {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('mo_credit_ledger')
    .select('id, type, amount, balance_after, conversation_id, message_id, description, metadata, created_at')
    .eq('business_id', params.businessId)
    .order('created_at', { ascending: false })
    .range(params.offset || 0, (params.offset || 0) + (params.limit || 50) - 1);

  if (params.since) q = q.gte('created_at', params.since);
  if (params.until) q = q.lte('created_at', params.until);

  const { data } = await q;
  return (data || []).map((r: any) => ({
    id: r.id,
    type: r.type,
    amount: r.amount,
    balanceAfter: r.balance_after,
    conversationId: r.conversation_id,
    messageId: r.message_id,
    description: r.description,
    createdAt: r.created_at,
    metadata: (r.metadata || {}) as Record<string, unknown>,
  }));
}

export async function usageThisMonth(businessId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { data } = await sb
    .from('mo_credit_ledger')
    .select('amount')
    .eq('business_id', businessId)
    .eq('type', 'message_usage')
    .gte('created_at', start.toISOString());
  return (data || []).reduce((s: number, r: any) => s + Math.abs(Number(r.amount) || 0), 0);
}

export async function usageToday(businessId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { data } = await sb
    .from('mo_credit_ledger')
    .select('amount')
    .eq('business_id', businessId)
    .eq('type', 'message_usage')
    .gte('created_at', start.toISOString());
  return (data || []).reduce((s: number, r: any) => s + Math.abs(Number(r.amount) || 0), 0);
}

export function maskPhone(phone: string): string {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length < 6) return '***';
  return `+${d.slice(0, 3)} *** ${d.slice(-4)}`;
}
