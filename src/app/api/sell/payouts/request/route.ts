import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const COMMISSION_RATE = 0.05;

/**
 * POST /api/sell/payouts/request
 *
 * Creates a payout request for all available (unpaid) earnings.
 * Marks each included storeEarning as 'paid_out' (pending admin processing).
 *
 * Body: { businessId: string }
 */
export async function POST(req: NextRequest) {
  let body: { businessId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { businessId } = body;
  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    // 1. Load store config for bank details
    const configSnap = await db
      .collection('businesses').doc(businessId)
      .collection('store').doc('config')
      .get();

    if (!configSnap.exists) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const config = configSnap.data()!;

    if (!config.managedPayments) {
      return NextResponse.json({ error: 'Managed payments not enabled for this store' }, { status: 403 });
    }

    if (!config.payoutAccountNumber || !config.payoutBankName || !config.payoutAccountName) {
      return NextResponse.json({ error: 'Payout bank account details are incomplete. Update them in Settings.' }, { status: 400 });
    }

    // 2. Fetch all available earnings (status = 'available')
    const earningsSnap = await db
      .collection('businesses').doc(businessId)
      .collection('storeEarnings')
      .where('status', '==', 'available')
      .get();

    if (earningsSnap.empty) {
      return NextResponse.json({ error: 'No available earnings to pay out.' }, { status: 400 });
    }

    const earningIds = earningsSnap.docs.map(d => d.id);
    const totalNet = earningsSnap.docs.reduce((sum, d) => sum + (d.data().netAmount ?? 0), 0);
    const roundedNet = Math.round(totalNet * 100) / 100;

    const timestamp = FieldValue.serverTimestamp();
    const batch = db.batch();

    // 3. Create payout request
    const payoutRef = db
      .collection('businesses').doc(businessId)
      .collection('payoutRequests').doc();

    batch.set(payoutRef, {
      businessId,
      amount:          roundedNet,
      currency:        config.currency ?? 'NGN',
      bankName:        config.payoutBankName,
      accountNumber:   config.payoutAccountNumber,
      accountName:     config.payoutAccountName,
      commissionRate:  COMMISSION_RATE,
      earningIds,
      status:          'requested',
      rejectionReason: null,
      processedAt:     null,
      createdAt:       timestamp,
      updatedAt:       timestamp,
    });

    // 4. Mark each earning as requested (waiting for payout)
    for (const doc of earningsSnap.docs) {
      batch.update(doc.ref, {
        status:          'paid_out',
        payoutRequestId: payoutRef.id,
        updatedAt:       timestamp,
      });
    }

    await batch.commit();

    return NextResponse.json({
      payoutRequestId: payoutRef.id,
      amount:  roundedNet,
      currency: config.currency ?? 'NGN',
      earningsCount: earningIds.length,
    });

  } catch (err) {
    console.error('[payouts/request] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
