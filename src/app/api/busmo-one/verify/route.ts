import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { BUSMO_ONE_CONFIG } from '@/lib/busmo-one/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const reference = String(body.reference || '').trim();
    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
    if (!secret) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 503 });
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    const verifyData = await verifyResponse.json().catch(() => ({}));

    if (!verifyData.status || verifyData?.data?.status !== 'success') {
      return NextResponse.json(
        { error: verifyData.message || 'Payment not successful' },
        { status: 400 }
      );
    }

    const transaction = verifyData.data;
    const metadata = transaction.metadata || {};
    const orderId = metadata.orderId || null;
    const amountNaira = Math.round(Number(transaction.amount || 0) / 100);

    const supabase = getSupabaseAdmin();

    if (orderId) {
      await supabase
        .from('busmo_one_preorders')
        .update({
          status: 'paid',
          metadata: {
            ...(typeof metadata === 'object' ? {} : {}),
            paymentReference: reference,
            paidAt: new Date().toISOString(),
            amountPaidNaira: amountNaira,
            paystack: {
              channel: transaction.channel,
              paid_at: transaction.paid_at,
            },
            scaleOffer: BUSMO_ONE_CONFIG.promotionLabel,
            scaleEntitlementActivated: false,
          },
        })
        .eq('id', orderId);
    } else {
      // Match by payment reference in metadata
      const { data: rows } = await supabase
        .from('busmo_one_preorders')
        .select('id, metadata')
        .order('created_at', { ascending: false })
        .limit(20);
      const match = (rows || []).find(
        (r: any) => r.metadata?.paymentReference === reference
      );
      if (match) {
        await supabase
          .from('busmo_one_preorders')
          .update({
            status: 'paid',
            metadata: {
              ...(match.metadata || {}),
              paymentReference: reference,
              paidAt: new Date().toISOString(),
              amountPaidNaira: amountNaira,
            },
          })
          .eq('id', match.id);
      }
    }

    return NextResponse.json({
      success: true,
      reference,
      amountNaira,
      product: BUSMO_ONE_CONFIG.productName,
      message: 'Payment confirmed. Our team will contact you about delivery and Scale entitlement.',
    });
  } catch (e: any) {
    console.error('[busmo-one/verify]', e?.message);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
