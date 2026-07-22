import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { processConfirmedOrder } from '@/lib/services/mo-sell-integration-bridge';
import type { CheckoutSession } from '@/app/sell/mo-sell.types';

/**
 * POST /api/store/webhook/paystack
 *
 * Receives Paystack charge.success events server-side.
 * This is the reliable fallback for when clients close the browser
 * before the /order/pending page finishes polling.
 *
 * Register this URL in your Paystack dashboard:
 *   Settings → API Keys & Webhooks → Webhook URL
 *   → https://yourdomain.com/api/store/webhook/paystack
 */
export async function POST(req: NextRequest) {
  // 1. Verify Paystack signature
  const signature = req.headers.get('x-paystack-signature');
  const secret    = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error('[webhook/paystack] PAYSTACK_SECRET_KEY not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const rawBody = await req.text();

  if (signature) {
    const expected = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      console.warn('[webhook/paystack] Invalid signature — request rejected');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let event: { event: string; data: Record<string, any> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 2. Only handle successful charges
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const txn       = event.data;
  const reference = txn?.reference as string | undefined;
  const metadata  = txn?.metadata as Record<string, any> | undefined;

  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  // 3. Extract sessionId + businessId from Paystack metadata
  //    (set when initiating checkout in /api/store/checkout/initiate)
  const sessionId  = metadata?.sessionId  as string | undefined;
  const businessId = metadata?.businessId as string | undefined;

  if (!sessionId || !businessId) {
    // Not a store order (could be a subscription payment) — ignore
    console.log('[webhook/paystack] No sessionId/businessId in metadata — skipping', { reference });
    return NextResponse.json({ received: true });
  }

  try {
    const db = getAdminDb();

    // 4. Load and validate session
    const sessionRef  = db
      .collection('businesses').doc(businessId)
      .collection('checkoutSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      console.warn('[webhook/paystack] Session not found', { sessionId, businessId });
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionSnap.data() as CheckoutSession;

    // 5. Idempotency — already processed by client polling
    if (session.status === 'completed') {
      console.log('[webhook/paystack] Session already completed — idempotent skip', { sessionId });
      return NextResponse.json({ received: true });
    }

    // 6. Validate payment status from event
    if (txn.status !== 'success') {
      console.warn('[webhook/paystack] Payment not successful', { status: txn.status, reference });
      return NextResponse.json({ received: true });
    }

    // 7. Validate amount (kobo)
    const expectedKobo = Math.round(session.total * 100);
    if (txn.amount !== expectedKobo) {
      console.error('[webhook/paystack] Amount mismatch', {
        expected: expectedKobo,
        received: txn.amount,
        sessionId,
      });
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // 8. Check session hasn't expired
    const expiresAt = (session.expiresAt as any)?.toDate?.() ?? new Date(0);
    if (new Date() > expiresAt) {
      await sessionRef.update({ status: 'expired', updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ error: 'Session expired' }, { status: 410 });
    }

    // 9. Run Integration Bridge (same as client-side confirm route)
    await processConfirmedOrder({
      businessId,
      sessionId,
      paystackData: {
        reference: txn.reference,
        status:    txn.status,
        amount:    txn.amount,
        currency:  txn.currency,
        metadata:  txn.metadata ?? {},
      },
    });

    // 10. Mark session completed
    await sessionRef.update({
      status:    'completed',
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('[webhook/paystack] Order processed successfully via webhook', { sessionId, businessId, reference });
    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('[webhook/paystack] Error processing order:', err);
    // Return 200 so Paystack doesn't retry indefinitely for Integration Bridge errors
    // The session is already marked payment_confirmed_integration_pending by the bridge
    return NextResponse.json({ received: true, note: 'integration_pending' });
  }
}
