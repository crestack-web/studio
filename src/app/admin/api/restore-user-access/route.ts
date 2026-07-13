import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, plan } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Initialize Firebase Admin SDK only when needed
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'bizassistant2-62305643-adad7';
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
    }

    const db = admin.firestore();

    console.log('🔍 [restore-user-access] Attempting to restore access for email:', email);
    
    // Find user by email
    const usersSnapshot = await db.collection('users').where('email', '==', email).get();

    if (usersSnapshot.empty) {
      console.error('❌ [restore-user-access] User not found with email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log('✅ [restore-user-access] User found:', { userId, currentPlan: userData.plan });

    // Calculate subscription end date (default to 1 year from now)
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

    // Update user's plan
    const targetPlan = plan || userData.plan || 'standard';
    
    await db.collection('users').doc(userId).update({
      plan: targetPlan,
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      subscriptionEndDate: subscriptionEndDate,
      updatedAt: new Date(),
    });

    console.log('✅ [restore-user-access] User access restored successfully:', { userId, plan: targetPlan });

    return NextResponse.json({ 
      success: true, 
      userId: userId,
      email: email,
      plan: targetPlan,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
    });

  } catch (error) {
    console.error('❌ [restore-user-access] Error:', error);
    return NextResponse.json({ error: 'Failed to restore user access' }, { status: 500 });
  }
}
