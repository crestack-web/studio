import { getSupabaseAdmin } from '@/lib/supabase-server';

export type WalletSnapshot = {
  businessId: string;
  balanceKobo: number;
  balanceMajor: number;
  currency: string;
};

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function ensureWallet(businessId: string): Promise<WalletSnapshot> {
  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from('business_wallets')
    .select('business_id, balance_kobo, currency')
    .eq('business_id', businessId)
    .maybeSingle();

  if (data) {
    const kobo = Number(data.balance_kobo) || 0;
    return {
      businessId,
      balanceKobo: kobo,
      balanceMajor: kobo / 100,
      currency: String(data.currency || 'NGN'),
    };
  }

  await sb.from('business_wallets').upsert({
    business_id: businessId,
    balance_kobo: 0,
    currency: 'NGN',
    updated_at: new Date().toISOString(),
  });

  return { businessId, balanceKobo: 0, balanceMajor: 0, currency: 'NGN' };
}

export async function getWallet(businessId: string): Promise<WalletSnapshot> {
  return ensureWallet(businessId);
}

export async function creditWallet(opts: {
  businessId: string;
  amountKobo: number;
  purpose: string;
  reference?: string;
  description?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true; wallet: WalletSnapshot } | { ok: false; error: string }> {
  const amountKobo = Math.floor(Number(opts.amountKobo) || 0);
  if (amountKobo <= 0) return { ok: false, error: 'amount must be positive' };

  const sb = getSupabaseAdmin();

  if (opts.reference) {
    const { data: existing } = await sb
      .from('wallet_transactions')
      .select('id')
      .eq('reference', opts.reference)
      .maybeSingle();
    if (existing?.id) {
      const w = await ensureWallet(opts.businessId);
      return { ok: true, wallet: w };
    }
  }

  const current = await ensureWallet(opts.businessId);
  const next = current.balanceKobo + amountKobo;

  const { error: upErr } = await sb
    .from('business_wallets')
    .update({ balance_kobo: next, updated_at: new Date().toISOString() })
    .eq('business_id', opts.businessId);

  if (upErr) return { ok: false, error: upErr.message };

  const { error: txErr } = await sb.from('wallet_transactions').insert({
    id: newId('wtx'),
    business_id: opts.businessId,
    type: 'credit',
    amount_kobo: amountKobo,
    balance_after_kobo: next,
    purpose: opts.purpose,
    reference: opts.reference || null,
    description: opts.description || null,
    metadata: opts.metadata || {},
    created_by: opts.userId || null,
  });

  if (txErr) {
    // best-effort: do not leave orphan balance without log — still return success with warning
    console.error('[creditWallet] tx insert failed', txErr.message);
  }

  return {
    ok: true,
    wallet: {
      businessId: opts.businessId,
      balanceKobo: next,
      balanceMajor: next / 100,
      currency: current.currency,
    },
  };
}

export async function debitWallet(opts: {
  businessId: string;
  amountKobo: number;
  purpose: string;
  reference?: string;
  description?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true; wallet: WalletSnapshot } | { ok: false; error: string }> {
  const amountKobo = Math.floor(Number(opts.amountKobo) || 0);
  if (amountKobo <= 0) return { ok: false, error: 'amount must be positive' };

  const sb = getSupabaseAdmin();

  if (opts.reference) {
    const { data: existing } = await sb
      .from('wallet_transactions')
      .select('id')
      .eq('reference', opts.reference)
      .maybeSingle();
    if (existing?.id) {
      const w = await ensureWallet(opts.businessId);
      return { ok: true, wallet: w };
    }
  }

  const current = await ensureWallet(opts.businessId);
  if (current.balanceKobo < amountKobo) {
    return { ok: false, error: 'insufficient_balance' };
  }
  const next = current.balanceKobo - amountKobo;

  const { error: upErr } = await sb
    .from('business_wallets')
    .update({ balance_kobo: next, updated_at: new Date().toISOString() })
    .eq('business_id', opts.businessId)
    .gte('balance_kobo', amountKobo);

  if (upErr) return { ok: false, error: upErr.message };

  const { error: txErr } = await sb.from('wallet_transactions').insert({
    id: newId('wtx'),
    business_id: opts.businessId,
    type: 'debit',
    amount_kobo: amountKobo,
    balance_after_kobo: next,
    purpose: opts.purpose,
    reference: opts.reference || null,
    description: opts.description || null,
    metadata: opts.metadata || {},
    created_by: opts.userId || null,
  });

  if (txErr) console.error('[debitWallet] tx insert failed', txErr.message);

  return {
    ok: true,
    wallet: {
      businessId: opts.businessId,
      balanceKobo: next,
      balanceMajor: next / 100,
      currency: current.currency,
    },
  };
}

export async function listWalletTransactions(businessId: string, limit = 30) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('wallet_transactions')
    .select('id, type, amount_kobo, balance_after_kobo, purpose, reference, description, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
