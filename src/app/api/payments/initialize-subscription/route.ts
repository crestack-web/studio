import { NextRequest, NextResponse } from 'next/server';
import { BUSMO_PLANS, getPlanById, type PlanId } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const planId = String(body.planId || body.plan || 'starter').toLowerCase() as PlanId;
    const billing =
      String(body.billing || 'monthly').toLowerCase() === 'yearly' ? 'yearly' : 'monthly';
    const userId = body.userId ? String(body.userId) : undefined;
    const callbackUrl = body.callbackUrl
      ? String(body.callbackUrl)
      : `${process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.busmo.io'}/pricing?paid=1`;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const plan = getPlanById(planId);
    if (!BUSMO_PLANS.some((p) => p.id === plan.id)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const amountNaira = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const amountKobo = Math.round(amountNaira * 100);

    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
    }

    const reference = `busmo-sub-${plan.id}-${billing}-${Date.now()}`;

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
          purpose: 'subscription',
          plan: plan.name,
          planId: plan.id,
          billing,
          amountNaira,
          userId: userId || null,
          email,
        },
      }),
    });

    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok || !initData?.status) {
      console.error('[initialize-subscription]', initData?.message || initRes.status);
      return NextResponse.json(
        { error: initData?.message || 'Could not start payment' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: true,
      message: 'Authorization URL created',
      data: {
        authorization_url: initData.data?.authorization_url,
        access_code: initData.data?.access_code,
        reference: initData.data?.reference || reference,
      },
      plan: {
        id: plan.id,
        name: plan.name,
        billing,
        amountNaira,
      },
    });
  } catch (e: any) {
    console.error('[initialize-subscription]', e?.message);
    return NextResponse.json({ error: 'Initialize failed' }, { status: 500 });
  }
}
