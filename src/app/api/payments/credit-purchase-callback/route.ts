import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin for server-side use
let db: ReturnType<typeof getFirestore> | null = null;
try {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    };
    
    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }
  db = getFirestore();
} catch (error) {
  console.warn('Firebase Admin not initialized for credit purchase callback:', error);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(new URL('/owner/dashboard?payment=error', request.url));
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.redirect(new URL('/owner/dashboard?payment=error', request.url));
    }

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!data.status || data.data.status !== 'success') {
      console.error('Payment verification failed:', data);
      return NextResponse.redirect(new URL('/owner/dashboard?payment=failed', request.url));
    }

    // Get payment details from Firestore
    if (!db) {
      return NextResponse.redirect(new URL('/owner/dashboard?payment=error', request.url));
    }

    const paymentDoc = await db.collection('creditPurchases').doc(reference).get();
    
    if (!paymentDoc.exists) {
      return NextResponse.redirect(new URL('/owner/dashboard?payment=error', request.url));
    }

    const paymentData = paymentDoc.data();

    if (!paymentData || !paymentData.userId || paymentData.credits === undefined) {
      return NextResponse.redirect(new URL('/owner/dashboard?payment=error', request.url));
    }

    // Check if payment is already completed to prevent duplicate credit allocation
    if (paymentData.status === 'completed') {
      console.log('Payment already completed, skipping duplicate processing:', reference);
      return NextResponse.redirect(new URL('/owner/dashboard?payment=success', request.url));
    }

    // Update payment status
    await db.collection('creditPurchases').doc(reference).update({
      status: 'completed',
      verifiedAt: FieldValue.serverTimestamp(),
    });

    // Add credits to user account
    const userId = paymentData.userId;
    const credits = paymentData.credits;

    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      moCreditsRemaining: FieldValue.increment(credits),
    });

    // If unlimited credits, also update plan to pro (removed since we no longer offer unlimited)
    // if (credits === -1) {
    //   await userRef.update({
    //     plan: 'pro',
    //   });
    // }

    return NextResponse.redirect(new URL('/owner/dashboard?payment=success', request.url));
  } catch (error) {
    console.error('Error processing credit purchase callback:', error);
    return NextResponse.redirect(new URL('/owner/dashboard?payment=error', request.url));
  }
}
