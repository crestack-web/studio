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
    const { plan, userId, email, amount } = await request.json();

    if (!plan || !userId || !email || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: plan, userId, email, amount' },
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

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: amount * 100, // Paystack expects amount in kobo (lowest currency unit)
        metadata: {
          plan: plan,
          userId: userId,
          payment_type: 'subscription',
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscribe/success`,
        channels: ['card', 'bank_transfer', 'ussd', 'qr', 'mobile_money'],
      }),
    });

    const data = await response.json();

    if (!data.status) {
      console.error('Paystack initialization error:', data);
      return NextResponse.json(
        { error: 'Failed to initialize payment' },
        { status: 400 }
      );
    }

    // Save payment reference to Firestore
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }
    
    const paymentRef = db.collection('subscriptionPayments').doc(data.data.reference);
    await paymentRef.set({
      reference: data.data.reference,
      access_code: data.data.access_code,
      authorization_url: data.data.authorization_url,
      plan: plan,
      userId: userId,
      email: email,
      amount: amount,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      status: 'success',
      data: data.data,
    });
  } catch (error) {
    console.error('Error initializing subscription payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
