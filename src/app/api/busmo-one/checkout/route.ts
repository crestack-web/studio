import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  BUSMO_ONE_CONFIG,
  getBusmoOneChargePrice,
} from '@/lib/busmo-one/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const fullName = String(body.fullName || body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const businessName = String(body.businessName || '').trim();
    const businessType = String(body.businessType || '').trim() || null;
    const cityOrState = String(body.cityOrState || '').trim() || null;
    const quantity = Math.min(50, Math.max(1, Number(body.quantity) || 1));
    const message = String(body.message || '').trim() || null;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!fullName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    const pricing = getBusmoOneChargePrice();
    const unitNaira = pricing.charge;
    const amountNaira = unitNaira * quantity;
    const amountKobo = Math.round(amountNaira * 100);

    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
    }

    const supabase = getSupabaseAdmin();
    const reference = `busmo-one-${Date.now()}`;

    // Persist pending order so we can mark paid after verify
    const { data: order, error: orderErr } = await supabase
      .from('busmo_one_preorders')
      .insert({
        full_name: fullName,
        business_name: businessName || null,
        phone,
        email,
        business_type: businessType,
        city_or_state: cityOrState,
        quantity,
        message,
        status: 'pending_payment',
        promotion_code: pricing.promoCode || BUSMO_ONE_CONFIG.promotionCode,
        promotion_eligible: true,
        understands_preorder: true,
        source: String(body.source || 'welcome_checkout').slice(0, 40),
        metadata: {
          paymentReference: reference,
          unitNaira,
          amountNaira,
          listUnitNaira: pricing.list,
          saleActive: pricing.saleActive,
          percentOff: pricing.percentOff,
          promoCode: pricing.promoCode,
          scaleOffer: BUSMO_ONE_CONFIG.promotionLabel,
          scaleEntitlementActivated: false,
        },
      })
      .select('id')
      .single();

    if (orderErr) {
      console.error('[busmo-one/checkout] order', orderErr);
      // Still allow payment if table write fails for status enum — try without pending_payment
      const fallback = await supabase
        .from('busmo_one_preorders')
        .insert({
          full_name: fullName,
          business_name: businessName || null,
          phone,
          email,
          business_type: businessType,
          city_or_state: cityOrState,
          quantity,
          message,
          status: 'submitted',
          promotion_code: pricing.promoCode || BUSMO_ONE_CONFIG.promotionCode,
          promotion_eligible: true,
          understands_preorder: true,
          source: String(body.source || 'welcome_checkout').slice(0, 40),
          metadata: {
            paymentReference: reference,
            unitNaira,
            amountNaira,
            awaitingPayment: true,
          },
        })
        .select('id')
        .single();
      if (fallback.error) {
        return NextResponse.json(
          { error: 'Could not create order. Please try again.' },
          { status: 500 }
        );
      }
    }

    const orderId = order?.id || null;
    const appUrl =
      process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.busmo.io';
    const callbackUrl = `${appUrl}/welcome?busmo_one_paid=1`;

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
          purpose: 'busmo_one_terminal',
          product: BUSMO_ONE_CONFIG.productName,
          orderId,
          quantity,
          unitNaira,
          amountNaira,
          fullName,
          phone,
          businessName: businessName || null,
          saleActive: pricing.saleActive,
          promoCode: pricing.promoCode,
          email,
        },
      }),
    });

    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok || !initData?.status) {
      console.error('[busmo-one/checkout] paystack', initData?.message);
      return NextResponse.json(
        { error: initData?.message || 'Could not start payment' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: true,
      data: {
        authorization_url: initData.data?.authorization_url,
        access_code: initData.data?.access_code,
        reference: initData.data?.reference || reference,
      },
      order: {
        id: orderId,
        amountNaira,
        unitNaira,
        quantity,
        saleActive: pricing.saleActive,
      },
    });
  } catch (e: any) {
    console.error('[busmo-one/checkout]', e?.message);
    return NextResponse.json({ error: e?.message || 'Checkout failed' }, { status: 500 });
  }
}
