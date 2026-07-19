import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { getPostHogClient } from '@/lib/posthog-server';

export async function POST(request: NextRequest) {
  try {
    const { referredId, referrerId, signupData } = await request.json();

    if (!referredId || !referrerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (referredId === referrerId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    
    // Verify referrer exists
    const referrerRef = doc(firestore, 'users', referrerId);
    const referrerDoc = await getDoc(referrerRef);
    
    if (!referrerDoc.exists()) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Check if referral already exists
    const referralRef = doc(collection(firestore, 'referrals'));
    const existingQuery = query(
      collection(firestore, 'referrals'),
      where('referredId', '==', referredId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      return NextResponse.json({ error: 'User already referred' }, { status: 400 });
    }

    // Create referral record
    await setDoc(doc(collection(firestore, 'referrals')), {
      referrerId: referrerId,
      referredId: referredId,
      referredEmail: signupData?.email || '',
      referredName: signupData?.name || '',
      status: 'pending', // pending, active, cancelled
      hasSubscribed: false,
      subscriptionPlan: null,
      subscriptionDate: null,
      commissionEarned: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update referrer's stats
    const referrerData = referrerDoc.data();
    const totalReferrals = (referrerData.totalReferrals || 0) + 1;
    
    await updateDoc(referrerRef, {
      totalReferrals: totalReferrals,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Referral tracked:', { referrerId, referredId });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: referrerId,
      event: 'referral_signup_tracked',
      properties: { referred_user_id: referredId },
    });
    await posthog.shutdown();

    return NextResponse.json({
      success: true,
      message: 'Referral tracked successfully'
    });

  } catch (error) {
    console.error('❌ Error tracking referral:', error);
    return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 });
  }
}