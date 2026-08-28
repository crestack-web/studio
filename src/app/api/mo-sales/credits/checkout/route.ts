import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, assertBusinessAccess } from '../../_auth';
import { listMoCreditPackages, ensureTrialCredits } from '@/lib/services/whatsapp/mo-credits';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Creates a Paystack checkout for an MO credit package.
 * Credits are granted only after server-side verification (see /credits/verify).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const businessId = String(body.businessId || '').trim();
    const packageId = String(body.packageId || '').trim();
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 });

    const access = await assertBusinessAccess(user.id, businessId);
    if (!access.ok) return NextResponse.json({ error: access.reason }, { status: 403 });

    await ensureTrialCredits(businessId);

    const packages = await listMoCreditPackages();
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: 'Unknown package' }, { status: 400 });

    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
    }

    const email =
      user.email ||
      String(body.email || '').trim() ||
      `owner+${businessId.slice(0, 8)}@busmo.io`;

    const reference = `mo-cred-${businessId.slice(0, 8)}-${pkg.id}-${Date.now()}`;
    const callbackUrl =
      String(body.callbackUrl || '').trim() ||
      `${process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.busmo.io'}/owner/dashboard?moCredits=1`;

    const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: pkg.priceKobo,
        currency: pkg.currency || 'NGN',
        reference,
        callback_url: callbackUrl,
        metadata: {
          purpose: 'mo_credits',
          businessId,
          packageId: pkg.id,
          credits: pkg.credits,
          userId: user.id,
        },
      }),
    });

    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok || !initData?.status) {
      console.error(JSON.stringify({
        event: 'mo_credits_checkout_failed',
        error: initData?.message || `paystack_${initRes.status}`,
      }));
      return NextResponse.json({ error: 'Could not start payment' }, { status: 502 });
    }

    // Optional audit row (non-ledger) via ledger metadata only after verify
    const sb = getSupabaseAdmin();
    await sb.from('mo_credit_wallets').upsert(
      { business_id: businessId, updated_at: new Date().toISOString() },
      { onConflict: 'business_id' }
    );

    return NextResponse.json({
      ok: true,
      reference,
      authorizationUrl: initData.data?.authorization_url,
      accessCode: initData.data?.access_code,
      package: {
        id: pkg.id,
        name: pkg.name,
        credits: pkg.credits,
        priceKobo: pkg.priceKobo,
        currency: pkg.currency,
      },
    });
  } catch (e: any) {
    console.error('[mo-sales/credits/checkout]', e?.message);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
