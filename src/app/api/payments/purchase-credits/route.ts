import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Credit pricing tiers (in NGN)
const CREDIT_PACKS = {
  starter: { credits: 1500, amount: 7500, name: 'Starter Pack' },
  standard: { credits: 3000, amount: 15000, name: 'Standard Pack' },
  premium: { credits: 5000, amount: 22500, name: 'Premium Pack' },
};

export async function POST(request: NextRequest) {
  try {
    console.log('Credit purchase initialization request received');
    const { pack, userId, email, countryCode } = await request.json();

    console.log('Request data:', { pack, userId, email, countryCode });

    if (!pack || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: pack, userId, email' },
        { status: 400 }
      );
    }

    const creditPack = CREDIT_PACKS[pack as keyof typeof CREDIT_PACKS];
    if (!creditPack) {
      return NextResponse.json(
        { error: 'Invalid credit pack' },
        { status: 400 }
      );
    }

    console.log('Credit pack:', creditPack);

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      console.error('Paystack secret key not configured');
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      );
    }

    console.log('Paystack secret key configured');

    // Credit packs are priced in NGN
    const paystackCurrency = 'NGN';
    const paystackAmount = creditPack.amount;

    console.log('Paystack request:', { email, amount: paystackAmount * 100, currency: paystackCurrency });

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: paystackAmount * 100, // Paystack expects amount in kobo (lowest currency unit)
        currency: paystackCurrency, // Use Paystack-supported currency
        metadata: {
          pack: pack,
          credits: creditPack.credits,
          userId: userId,
          payment_type: 'credit_purchase',
          amount: paystackAmount,
          currency: paystackCurrency,
          countryCode: countryCode,
        },
        callback_url: `${process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://busmo.io'}/api/payments/credit-purchase-callback`,
        channels: ['card', 'bank_transfer', 'ussd', 'qr', 'mobile_money'],
      }),
    });

    console.log('Paystack response status:', response.status);
    const data = await response.json();
    console.log('Paystack response data:', data);

    if (!data.status) {
      console.error('Paystack initialization error:', data);
      return NextResponse.json(
        { error: 'We are having issues connecting with payment processors. Please try again later.' },
        { status: 400 }
      );
    }

    console.log('Paystack initialization successful');

    // Save payment reference to Firestore (optional - payment will work even if this fails)
    if (isAdminInitialized()) {
      try {
        console.log('Saving credit purchase to Firestore');
        const db = getAdminDb();
        const paymentRef = db.collection('creditPurchases').doc(data.data.reference);
        await paymentRef.set({
          reference: data.data.reference,
          access_code: data.data.access_code,
          authorization_url: data.data.authorization_url,
          pack: pack,
          credits: creditPack.credits,
          amount: paystackAmount,
          userId: userId,
          email: email,
          status: 'pending',
          createdAt: FieldValue.serverTimestamp(),
        });
        console.log('Credit purchase saved to Firestore');
      } catch (firestoreError) {
        console.error('Firestore save failed (non-critical):', firestoreError);
        // Don't fail the payment if Firestore save fails
      }
    } else {
      console.log('Skipping Firestore save - Firebase not initialized');
    }

    return NextResponse.json({
      data: data.data,
    });
  } catch (error) {
    console.error('Error initializing credit purchase payment:', error);
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

// GET endpoint to retrieve available credit packs
export async function GET() {
  return NextResponse.json({
    packs: CREDIT_PACKS,
  });
}
