import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { processConfirmedOrder } from '@/lib/services/mo-sell-integration-bridge';
import type { CheckoutSession } from '@/types/mo-sell.types';

/**
 * POST /api/store/orders/confirm
 *
 * Called by /order/pending after Paystack redirects back.
 * 1. Loads the checkout session
 * 2. Verifies the Paystack transaction
 * 3. Validates amount matches
 * 4. Runs the Integration Bridge (atomic batch)
 * 5. Marks session completed
 * Returns { orderId }
 */
export async function POST(req: NextRequest) {
  let body: { paystackReference: string; sessionId: string; businessId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { paystackReference, sessionId, businessId } = body;
  if (!paystackReference || !sessionId || !businessId) {
    return NextResponse.json(
      { error: 'paystackReference, sessionId, and businessId are required' },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();

    // 1. Load and validate session
    const sessionRef = db
      .collection('businesses').doc(businessId)
      .collection('checkoutSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionSnap.data() as CheckoutSession;

    // Reject already-processed sessions
    if (session.status === 'completed') {
      // Idempotent — find the order and return it
      const orderSnap = await db
        .collection('businesses').doc(businessId)
        .collection('storeOrders')
        .where('paystackReference', '==', paystackReference)
        .limit(1)
        .get();
      const orderId = orderSnap.empty ? null : orderSnap.docs[0].id;
      return NextResponse.json({ orderId });
    }

    if (session.status !== 'payment_initiated') {
      return NextResponse.json(
        { error: `Session in unexpected state: ${session.status}` },
        { status: 400 }
      );
    }

    // Check session hasn't expired
    const expiresAt = (session.expiresAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? new Date(0);
    if (new Date() > expiresAt) {
      await sessionRef.update({ status: 'expired', updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ error: 'Checkout session expired' }, { status: 410 });
    }

    // 2. Verify with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackReference)}`,
      { headers: { Authorization: `Bearer ${paystackSecretKey}` } }
    );
    const verifyData = await verifyRes.json() as {
      status: boolean;
      data?: {
        status: string;
        amount: number;
        currency: string;
        reference: string;
        metadata: Record<string, unknown>;
      };
    };

    if (!verifyData.status || !verifyData.data) {
      return NextResponse.json({ error: 'Paystack verification failed' }, { status: 502 });
    }

    const txn = verifyData.data;

    // 3. Validate payment status
    if (txn.status !== 'success') {
      await sessionRef.update({
        status: 'expired',
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json(
        { error: `Payment not successful: ${txn.status}` },
        { status: 402 }
      );
    }

    // 4. Validate amount (kobo)
    const expectedKobo = Math.round(session.total * 100);
    if (txn.amount !== expectedKobo) {
      return NextResponse.json(
        { error: 'Payment amount does not match order total' },
        { status: 400 }
      );
    }

    // 5. Run Integration Bridge
    let bridgeResult: { orderId: string };
    try {
      bridgeResult = await processConfirmedOrder({
        businessId,
        sessionId,
        paystackData: {
          reference: txn.reference,
          status:    txn.status,
          amount:    txn.amount,
          currency:  txn.currency,
          metadata:  txn.metadata,
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'integration_failed', sessionId },
        { status: 202 }
      );
    }

    // 6. Mark session completed
    await sessionRef.update({
      status: 'completed',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ orderId: bridgeResult.orderId });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
