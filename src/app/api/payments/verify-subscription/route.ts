import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      );
    }

    // Verify transaction with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      return NextResponse.json(
        { error: 'Transaction verification failed' },
        { status: 400 }
      );
    }

    const transactionData = data.data;
    const metadata = transactionData.metadata;

    // Update payment record in Firestore
    if (!isAdminInitialized()) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }
    
    const db = getAdminDb();
    
    // Check both subscriptionPayments and payments collections
    let paymentRef = db.collection('subscriptionPayments').doc(reference);
    let paymentDoc = await paymentRef.get();
    let paymentCollection = 'subscriptionPayments';

    // If not found in subscriptionPayments, check payments collection
    if (!paymentDoc.exists) {
      paymentRef = db.collection('payments').doc(reference);
      paymentDoc = await paymentRef.get();
      paymentCollection = 'payments';
    }

    if (paymentDoc.exists) {
      await paymentRef.update({
        status: 'success',
        verifiedAt: FieldValue.serverTimestamp(),
        transactionData: transactionData,
      });
    }

    // Update user subscription status
    // Get userId from metadata or from payment document
    let userId = metadata?.userId;
    
    // If userId not in metadata, try to get it from the payment document
    if (!userId && paymentDoc.exists) {
      const paymentData = paymentDoc.data();
      userId = paymentData?.userId;
    }

    if (userId) {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        // Get plan from metadata or payment document
        let plan = metadata?.plan;
        if (!plan && paymentDoc.exists) {
          const paymentData = paymentDoc.data();
          plan = paymentData?.plan;
        }
        
        // Get billing cycle from metadata or payment document
        let billing = metadata?.billing;
        if (!billing && paymentDoc.exists) {
          const paymentData = paymentDoc.data();
          billing = paymentData?.billing;
        }

        plan = plan || 'starter';
        const subscriptionEndDate = new Date();
        
        // Set subscription end date based on billing cycle
        if (billing === 'yearly') {
          subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
        } else {
          // Default to monthly
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        }

        await userRef.update({
          subscriptionStatus: 'active',
          subscriptionPlan: plan,
          subscriptionStartDate: FieldValue.serverTimestamp(),
          subscriptionEndDate: Timestamp.fromDate(subscriptionEndDate),
          lastPaymentReference: reference,
          lastPaymentAmount: transactionData.amount / 100,
          lastPaymentDate: FieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({
      data: transactionData,
    });
  } catch (error) {
    console.error('Error verifying subscription payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
