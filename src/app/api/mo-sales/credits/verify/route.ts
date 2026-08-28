import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../_auth';
import { grantPurchaseCredits, listMoCreditPackages } from '@/lib/services/whatsapp/mo-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Verify Paystack payment server-side and grant MO credits.
 * Idempotent on payment reference.
 */
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
    if (!verifyData?.status || verifyData?.data?.status !== 'success') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
    }

    const tx = verifyData.data;
    const meta = tx.metadata || {};
    if (meta.purpose && meta.purpose !== 'mo_credits') {
      return NextResponse.json({ error: 'Not an MO credits payment' }, { status: 400 });
    }
    if (meta.businessId && String(meta.businessId) !== businessId) {
      return NextResponse.json({ error: 'Business mismatch' }, { status: 403 });
    }

    const packageId = String(meta.packageId || '').trim();
    const packages = await listMoCreditPackages();
    const pkg = packages.find((p) => p.id === packageId);
    const credits = Number(meta.credits) || pkg?.credits || 0;
    if (!credits || credits <= 0) {
      return NextResponse.json({ error: 'Invalid credit amount' }, { status: 400 });
    }

    const grant = await grantPurchaseCredits({
      businessId,
      credits,
      paymentReference: reference,
      packageId: packageId || undefined,
      amountKobo: Number(tx.amount) || undefined,
      currency: String(tx.currency || 'NGN'),
    });

    if (!grant.ok) {
      return NextResponse.json({ error: grant.error || 'Grant failed' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      credits,
      balance: grant.balance,
      duplicate: grant.duplicate || false,
      reference,
    });
  } catch (e: any) {
    console.error('[mo-sales/credits/verify]', e?.message);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
