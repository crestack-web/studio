import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    console.log('🔍 [verify-subscription] Verifying payment with reference:', reference);

    // Verify payment with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('❌ [verify-subscription] PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Payment verification failed - configuration error' }, { status: 500 });
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const verifyData = await verifyResponse.json();
    console.log('📊 [verify-subscription] Paystack verification response:', verifyData);

    if (!verifyData.status) {
      console.error('❌ [verify-subscription] Paystack verification failed:', verifyData.message);
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    const transaction = verifyData.data;
    const metadata = transaction.metadata || {};
    const plan = metadata.plan || 'starter';
    const billing = metadata.billing || 'monthly';
    const userId = metadata.userId || transaction.customer?.customer_code;

    if (!userId) {
      console.error('❌ [verify-subscription] No userId in transaction metadata');
      return NextResponse.json({ error: 'Invalid payment - no user ID' }, { status: 400 });
    }

    console.log('✅ [verify-subscription] Payment verified, updating user plan:', { userId, plan, billing });

    // Update user's plan in Firestore
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error('❌ [verify-subscription] User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate subscription end date
    const subscriptionEndDate = new Date();
    if (billing === 'monthly') {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    } else {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    }

    // Update user document
    await updateDoc(userRef, {
      plan: plan,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: subscriptionEndDate,
      lastPaymentReference: reference,
      lastPaymentAmount: transaction.amount / 100, // Convert from kobo to Naira
      lastPaymentDate: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ [verify-subscription] User plan updated successfully');

    // Log the subscription payment
    await addDoc(collection(firestore, 'subscription_payments'), {
      userId: userId,
      reference: reference,
      plan: plan,
      billing: billing,
      amount: transaction.amount / 100,
      currency: transaction.currency,
      status: 'success',
      paidAt: transaction.paid_at ? new Date(transaction.paid_at * 1000) : new Date(),
      createdAt: new Date(),
    });

    console.log('✅ [verify-subscription] Payment logged successfully');

    return NextResponse.json({ 
      success: true, 
      plan: plan,
      billing: billing,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
    });

  } catch (error) {
    console.error('❌ [verify-subscription] Error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
