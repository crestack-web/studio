import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../mo-sales/_auth';
import { ensureWallet } from '@/lib/wallet/business-wallet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Initialize Paystack checkout to fund the central business wallet.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    const amountMajor = Number(body.amount);
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    if (!Number.isFinite(amountMajor) || amountMajor < 100) {
      return NextResponse.json({ error: 'Minimum fund amount is ₦100' }, { status: 400 });
    }
    if (amountMajor > 5_000_000) {
      return NextResponse.json({ error: 'Amount too large' }, { status: 400 });
    }

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    await ensureWallet(businessId);

    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
    }

    const email =
      user.email ||
      String(body.email || '').trim() ||
      `owner+${businessId.slice(0, 8)}@busmo.io`;

    const amountKobo = Math.round(amountMajor * 100);
    const reference = `busmo-wallet-${businessId.slice(0, 8)}-${Date.now()}`;
    const callbackUrl =
      String(body.callbackUrl || '').trim() ||
      `${process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.busmo.io'}/owner/dashboard?walletFunded=1`;

    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        currency: 'NGN',
        reference,
        callback_url: callbackUrl,
        metadata: {
          purpose: 'business_wallet_fund',
          businessId,
          userId: user.id,
          amountKobo,
        },
      }),
    });

    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok || !initData?.data?.authorization_url) {
      return NextResponse.json(
        { error: initData?.message || 'Could not start payment' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      authorizationUrl: initData.data.authorization_url,
      accessCode: initData.data.access_code,
      reference,
      amount: amountMajor,
      amountKobo,
    });
  } catch (e: any) {
    console.error('[wallet fund]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
