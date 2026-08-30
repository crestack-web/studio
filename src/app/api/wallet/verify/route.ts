import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../mo-sales/_auth';
import { creditWallet } from '@/lib/wallet/business-wallet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const reference = String(body.reference || '').trim();
    const businessId = String(body.businessId || '').trim();
    if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 });
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    const verifyData = await verifyRes.json().catch(() => ({}));
    const data = verifyData?.data;
    if (!verifyRes.ok || data?.status !== 'success') {
      return NextResponse.json(
        { error: verifyData?.message || 'Payment not successful' },
        { status: 400 }
      );
    }

    const meta = data.metadata || {};
    if (meta.purpose && meta.purpose !== 'business_wallet_fund') {
      return NextResponse.json({ error: 'Not a wallet funding payment' }, { status: 400 });
    }
    if (meta.businessId && String(meta.businessId) !== businessId) {
      return NextResponse.json({ error: 'Business mismatch' }, { status: 400 });
    }

    const amountKobo = Number(data.amount) || Number(meta.amountKobo) || 0;
    if (amountKobo <= 0) {
      return NextResponse.json({ error: 'Invalid paid amount' }, { status: 400 });
    }

    const credited = await creditWallet({
      businessId,
      amountKobo,
      purpose: 'fund',
      reference,
      description: 'Wallet top-up via Paystack',
      userId: user.id,
      metadata: { channel: data.channel, paidAt: data.paid_at },
    });

    if (!credited.ok) {
      return NextResponse.json({ error: credited.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      balance: credited.wallet.balanceMajor,
      balanceKobo: credited.wallet.balanceKobo,
      currency: credited.wallet.currency,
      reference,
    });
  } catch (e: any) {
    console.error('[wallet verify]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
