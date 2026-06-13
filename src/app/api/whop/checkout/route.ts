import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, planName, price } = body;

    if (!planId || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const whopApiKey = process.env.WHOP_PAYEMENT_API;
    if (!whopApiKey) {
      return NextResponse.json({ error: 'Whop API key not configured' }, { status: 500 });
    }

    const { auth, firestore } = initializeFirebase();
    const user = auth.currentUser;

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Update user's plan to pending_payment
    await updateDoc(doc(firestore, 'users', user.uid), {
      plan: planId,
      subscriptionStatus: 'pending_payment',
      updatedAt: new Date(),
    });

    // Create Whop checkout link
    const whopResponse = await fetch('https://api.whop.com/api/v2/checkout_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: price * 100, // Convert to cents
        currency: 'usd',
        metadata: {
          userId: user.uid,
          planId: planId,
          planName: planName,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/owner?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscribe?payment=cancelled`,
      }),
    });

    if (!whopResponse.ok) {
      const errorData = await whopResponse.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to create payment link' },
        { status: 500 }
      );
    }

    const whopData = await whopResponse.json();
    
    return NextResponse.json({
      success: true,
      checkoutUrl: whopData.checkout_url || whopData.url,
    });

  } catch (error) {
    console.error('Whop checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
