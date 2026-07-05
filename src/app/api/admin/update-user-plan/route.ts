import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

const db = getAdminDb();

export async function POST(request: NextRequest) {
  try {
    const { email, plan } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    
    // Update user plan
    const updateData: any = {
      plan: plan || 'lifetime',
      planType: plan || 'lifetime',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (plan === 'lifetime') {
      updateData.lifetimeAccess = true;
    }
    
    await db.collection('users').doc(userId).update(updateData);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${email} to ${plan || 'lifetime'} access` 
    });
  } catch (error: any) {
    console.error('Error updating user plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
