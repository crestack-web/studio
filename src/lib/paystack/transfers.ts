const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';
const BASE = 'https://api.paystack.co';

async function paystack<T = any>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  if (!PAYSTACK_SECRET) {
    return { ok: false, error: 'PAYSTACK_SECRET_KEY is not configured' };
  }
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status === false) {
      return {
        ok: false,
        error: json.message || json.error || `Paystack error (${res.status})`,
        status: res.status,
      };
    }
    return { ok: true, data: json.data as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Paystack request failed' };
  }
}

export type PaystackBank = {
  name: string;
  code: string;
  active?: boolean;
  country?: string;
};

export async function listNigerianBanks(): Promise<
  { ok: true; banks: PaystackBank[] } | { ok: false; error: string }
> {
  const r = await paystack<PaystackBank[]>('/bank?country=nigeria&perPage=100');
  if (!r.ok) return r;
  const banks = (r.data || [])
    .filter((b) => b && b.code && b.name)
    .map((b) => ({ name: b.name, code: String(b.code), active: b.active, country: b.country }));
  banks.sort((a, b) => a.name.localeCompare(b.name));
  return { ok: true, banks };
}

export async function resolveAccount(accountNumber: string, bankCode: string) {
  const qs = new URLSearchParams({
    account_number: accountNumber.replace(/\D/g, '').slice(0, 10),
    bank_code: bankCode,
  });
  return paystack<{ account_number: string; account_name: string; bank_id?: number }>(
    `/bank/resolve?${qs.toString()}`
  );
}

export async function createTransferRecipient(opts: {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: string;
}) {
  return paystack<{ recipient_code: string; details?: any }>(
    '/transferrecipient',
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'nuban',
        name: opts.name,
        account_number: opts.accountNumber.replace(/\D/g, '').slice(0, 10),
        bank_code: opts.bankCode,
        currency: opts.currency || 'NGN',
      }),
    }
  );
}

export async function initiateTransfer(opts: {
  amountKobo: number;
  recipientCode: string;
  reason: string;
  reference: string;
}) {
  return paystack<{
    transfer_code: string;
    status: string;
    reference: string;
    amount: number;
  }>('/transfer', {
    method: 'POST',
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(opts.amountKobo),
      recipient: opts.recipientCode,
      reason: opts.reason.slice(0, 80),
      reference: opts.reference,
    }),
  });
}
