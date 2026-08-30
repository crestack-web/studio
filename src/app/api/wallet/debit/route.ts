import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../mo-sales/_auth';
import { debitWallet } from '@/lib/wallet/business-wallet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Debit central business wallet (payroll, credits, etc.).
 * Body: { businessId, amount (major units), purpose, description?, reference? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    const amountMajor = Number(body.amount);
    const purpose = String(body.purpose || 'adjustment').trim() || 'adjustment';
    const description = body.description != null ? String(body.description) : undefined;
    const reference =
      body.reference != null
        ? String(body.reference).trim()
        : `debit-${purpose}-${businessId.slice(0, 8)}-${Date.now()}`;

    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
    }

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const amountKobo = Math.round(amountMajor * 100);
    const result = await debitWallet({
      businessId,
      amountKobo,
      purpose,
      reference,
      description,
      userId: user.id,
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
    });

    if (!result.ok) {
      const status = result.error === 'insufficient_balance' ? 402 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      ok: true,
      balance: result.wallet.balanceMajor,
      balanceKobo: result.wallet.balanceKobo,
      currency: result.wallet.currency,
      reference,
    });
  } catch (e: any) {
    console.error('[wallet debit]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
