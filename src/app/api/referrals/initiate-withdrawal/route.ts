import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getPostHogClient } from '@/lib/posthog-server';

const MINIMUM_WITHDRAWAL = 2000; // ₦2,000 minimum
const COMMISSION_RATE = 0.20; // 20% commission

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json();

    if (!userId || !amount) {
      return NextResponse.json({ error: 'User ID and amount are required' }, { status: 400 });
    }

    if (amount < MINIMUM_WITHDRAWAL) {
      return NextResponse.json({ 
        error: `Minimum withdrawal amount is ₦${MINIMUM_WITHDRAWAL.toLocaleString()}` 
      }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentBalance = userData.referralBalance || 0;

    if (currentBalance < amount) {
      return NextResponse.json({ 
        error: 'Insufficient balance',
        available: currentBalance
      }, { status: 400 });
    }

    // Validate bank details exist
    if (!userData.bankAccountNumber || !userData.bankCode || !userData.bankName) {
      return NextResponse.json({ 
        error: 'Please update your bank details in settings before withdrawing',
        needsBankDetails: true
      }, { status: 400 });
    }

    // Create withdrawal request
    const withdrawalRef = await addDoc(collection(firestore, 'referral_withdrawals'), {
      userId: userId,
      amount: amount,
      status: 'pending',
      createdAt: serverTimestamp(),
      processedAt: null,
      bankAccountNumber: userData.bankAccountNumber,
      bankCode: userData.bankCode,
      bankName: userData.bankName,
      accountName: userData.accountName || '',
    });

    // Deduct from user balance
    await updateDoc(userRef, {
      referralBalance: currentBalance - amount,
      pendingWithdrawal: (userData.pendingWithdrawal || 0) + amount,
    });

    // Log the withdrawal request
    console.log('💰 Withdrawal request created:', {
      userId,
      amount,
      withdrawalId: withdrawalRef.id,
      balance: currentBalance - amount
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: userId,
      event: 'referral_withdrawal_initiated',
      properties: {
        amount,
        currency: 'NGN',
        remaining_balance: currentBalance - amount,
      },
    });
    await posthog.shutdown();

    return NextResponse.json({
      success: true,
      withdrawalId: withdrawalRef.id,
      message: `Withdrawal request of ₦${amount.toLocaleString()} submitted successfully`
    });

  } catch (error) {
    console.error('❌ Withdrawal error:', error);
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}