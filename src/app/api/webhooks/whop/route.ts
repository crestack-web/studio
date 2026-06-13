import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, data } = body;

    // Verify Whop webhook signature (recommended for production)
    const whopApiKey = process.env.WHOP_PAYEMENT_API;
    if (!whopApiKey) {
      return NextResponse.json({ error: 'Whop API key not configured' }, { status: 500 });
    }

    const { firestore } = initializeFirebase();

    // Handle different Whop events
    if (event === 'payment.completed' || event === 'checkout.completed') {
      const { metadata, amount, customer } = data;
      
      if (!metadata || !metadata.userId) {
        return NextResponse.json({ error: 'Missing userId in metadata' }, { status: 400 });
      }

      const userId = metadata.userId;
      const planId = metadata.planId;

      // Update user's subscription status to active
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        plan: planId,
        subscribedAt: new Date(),
        subscriptionAmount: amount,
        customerId: customer?.id,
        updatedAt: new Date(),
      });

      console.log(`Payment completed for user ${userId}, plan ${planId}`);
      
      return NextResponse.json({ success: true, message: 'Payment processed successfully' });
    }

    if (event === 'payment.failed' || event === 'checkout.failed') {
      const { metadata } = data;
      
      if (metadata && metadata.userId) {
        const userRef = doc(firestore, 'users', metadata.userId);
        await updateDoc(userRef, {
          subscriptionStatus: 'expired',
          paymentFailedAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return NextResponse.json({ success: true, message: 'Payment failure recorded' });
    }

    // Handle other events
    return NextResponse.json({ success: true, message: 'Event received' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
