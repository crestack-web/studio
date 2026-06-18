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
    const { pack, userId, email, countryCode } = await request.json();

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

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Paystack secret key not configured' },
        { status: 500 }
      );
    }

    // Credit packs are priced in NGN
    const paystackCurrency = 'NGN';
    const paystackAmount = creditPack.amount;

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
        callback_url: `${process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/credit-purchase-callback`,
        channels: ['card', 'bank_transfer', 'ussd', 'qr', 'mobile_money'],
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

    // Save payment reference to Firestore
    if (!isAdminInitialized()) {
      console.error('Firebase not initialized for credit purchase');
      return NextResponse.json(
        { error: 'We are having issues processing your payment. Please try again later.' },
        { status: 500 }
      );
    }
    
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

    return NextResponse.json({
      data: data.data,
    });
  } catch (error) {
    console.error('Error initializing credit purchase payment:', error);
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
