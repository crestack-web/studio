import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('Payment initialization request received');
    const { plan, userId, email, amount, currency, billing, metadata } = await request.json();

    console.log('Request data:', { plan, userId, email, amount, currency, billing });

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

    console.log('Paystack secret key configured');

    // Amount is already in Naira, convert to kobo for Paystack
    const paystackAmount = Math.round(amount * 100);
    const paystackCurrency = currency || 'NGN';

    console.log('Paystack request:', { email, amount: paystackAmount, currency: paystackCurrency });

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
        callback_url: `${process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://busmo.io'}/subscribe/success`,
        channels: ['card', 'bank_transfer', 'ussd', 'qr'],
      }),
    });

    console.log('Paystack response status:', response.status);
    const data = await response.json();
    console.log('Paystack response data:', data);

    if (!data.status) {
      console.error('Paystack initialization error:', data);
      return NextResponse.json(
        { error: data.message || 'We are having issues connecting with payment processors. Please try again later.' },
        { status: 400 }
      );
    }

    console.log('Paystack initialization successful');

    // Save payment reference to Firestore if userId is provided and db is initialized
    // This is optional - payment will still work even if Firestore save fails
    if (isAdminInitialized() && userId) {
      try {
        console.log('Saving payment to Firestore');
        const db = getAdminDb();
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
        console.log('Payment saved to Firestore');
      } catch (firestoreError) {
        console.error('Firestore save failed (non-critical):', firestoreError);
        // Don't fail the payment if Firestore save fails
        // The payment will still work, we just won't have a record in Firestore
      }
    } else {
      console.log('Skipping Firestore save - db or userId missing', { db: isAdminInitialized(), userId });
    }

    return NextResponse.json({
      data: data.data,
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return NextResponse.json(
      { error: 'We are having issues connecting with payment processors. Please try again later.' },
      { status: 500 }
    );
  }
}
