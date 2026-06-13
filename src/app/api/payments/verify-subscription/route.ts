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
  console.warn('Firebase Admin not initialized for Paystack verification:', error);
}

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

    if (!data.status) {
      return NextResponse.json(
        { error: 'Transaction verification failed' },
        { status: 400 }
      );
    }

    const transactionData = data.data;
    const metadata = transactionData.metadata;

    // Update payment record in Firestore
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }
    
    const paymentRef = db.collection('subscriptionPayments').doc(reference);
    const paymentDoc = await paymentRef.get();

    if (paymentDoc.exists) {
      await paymentRef.update({
        status: 'success',
        verifiedAt: FieldValue.serverTimestamp(),
        transactionData: transactionData,
      });
    }

    // Update user subscription status
    if (metadata && metadata.userId) {
      const userRef = db.collection('users').doc(metadata.userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const plan = metadata.plan || 'starter';
        const subscriptionEndDate = new Date();
        
        // Set subscription end date based on plan
        if (plan === 'starter') {
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        } else if (plan === 'standard') {
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 6);
        } else if (plan === 'pro') {
          subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
        }

        await userRef.update({
          subscriptionStatus: 'active',
          subscriptionPlan: plan,
          subscriptionStartDate: FieldValue.serverTimestamp(),
          subscriptionEndDate: admin.firestore.Timestamp.fromDate(subscriptionEndDate),
          lastPaymentReference: reference,
          lastPaymentAmount: transactionData.amount / 100,
          lastPaymentDate: FieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({
      status: 'success',
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
