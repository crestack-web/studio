import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, isAdminInitialized } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { convertFromUsd, getCurrencyName } from '@/lib/currency';

export async function POST(request: NextRequest) {
  try {
    const { plan, userId, email, amount, currency, countryCode } = await request.json();

    if (!plan || !userId || !email || !amount) {
      console.error('Missing required fields for subscription payment:', { plan, userId, email, amount });
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

    // Convert amount from USD to local currency based on user's location
    const targetCurrency = currency || getCurrencyName(countryCode);
    const amountInLocalCurrency = convertFromUsd(amount, countryCode);

    // Paystack only supports NGN and GHS currencies
    // For unsupported currencies, default to NGN
    const paystackCurrency = (targetCurrency === 'NGN' || targetCurrency === 'GHS') ? targetCurrency : 'NGN';
    const paystackAmount = paystackCurrency === 'NGN' ? convertFromUsd(amount, 'NG') : convertFromUsd(amount, 'GH');

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
          plan: plan,
          userId: userId,
          payment_type: 'subscription',
          originalAmountUSD: amount,
          convertedAmount: paystackAmount,
          currency: paystackCurrency,
          countryCode: countryCode,
          requestedCurrency: targetCurrency, // Store the originally requested currency
        },
        callback_url: `${process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscribe/success`,
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
      console.error('Firebase not initialized for subscription payment');
      return NextResponse.json(
        { error: 'We are having issues processing your payment. Please try again later.' },
        { status: 500 }
      );
    }
    
    const db = getAdminDb();
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
      { error: 'We are having issues connecting with payment processors. Please try again later.' },
      { status: 500 }
    );
  }
}
