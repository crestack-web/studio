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
  console.warn('Firebase Admin not initialized for Paystack:', error);
}

export async function POST(request: NextRequest) {
  try {
    const { plan, userId, email, amount, currency, billing, metadata } = await request.json();

    if (!plan || !email || !amount) {
      console.error('Missing required fields for payment:', { plan, email, amount });
      return NextResponse.json(
        { error: 'Unable to process payment request. Please try again.' },
        { status: 400 }
      );
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      console.error('Paystack secret key not configured');
      return NextResponse.json(
        { error: 'We are having issues connecting with payment processors. Please try again later.' },
        { status: 500 }
      );
    }

    // Amount is already in Naira, convert to kobo for Paystack
    const paystackAmount = Math.round(amount * 100);
    const paystackCurrency = currency || 'NGN';

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: paystackAmount,
        currency: paystackCurrency,
        metadata: {
          plan: plan,
          userId: userId || 'guest',
          payment_type: billing === 'yearly' ? 'yearly_subscription' : 'monthly_subscription',
          billing: billing || 'monthly',
          originalAmount: amount,
          currency: paystackCurrency,
          ...metadata,
        },
        callback_url: `${process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscribe/success`,
        channels: ['card', 'bank_transfer', 'ussd', 'qr'],
      }),
    });

    const data = await response.json();

    if (!data.status) {
      console.error('Paystack initialization error:', data);
      return NextResponse.json(
        { error: 'We are having issues connecting with payment processors. Please try again later.' },
        { status: 400 }
      );
    }

    // Save payment reference to Firestore if userId is provided
    if (db && userId) {
      const paymentRef = db.collection('payments').doc(data.data.reference);
      await paymentRef.set({
        reference: data.data.reference,
        access_code: data.data.access_code,
        authorization_url: data.data.authorization_url,
        plan: plan,
        userId: userId,
        email: email,
        amount: amount,
        currency: paystackCurrency,
        billing: billing || 'monthly',
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({
      data: data.data,
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { error: 'We are having issues connecting with payment processors. Please try again later.' },
      { status: 500 }
    );
  }
}
