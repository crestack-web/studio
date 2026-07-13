// Script to restore user access directly via Firebase Admin SDK
// Run with: npx tsx scripts/restore-user-access-admin.ts

import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin with environment variables
if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bizassistant2-62305643-adad7';
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  console.log('🔑 Firebase Admin Config:', { projectId, clientEmail });

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    console.error('❌ Firebase Admin credentials not found in environment variables');
    console.log('FIREBASE_ADMIN_CLIENT_EMAIL:', clientEmail ? 'Found' : 'Missing');
    console.log('FIREBASE_ADMIN_PRIVATE_KEY:', privateKey ? 'Found' : 'Missing');
    process.exit(1);
  }
}

const db = admin.firestore();

async function restoreUserAccess(email: string, plan: string = 'standard', billing: string = 'monthly') {
  console.log('🔍 Restoring access for email:', email);
  
  // Find user by email
  const usersSnapshot = await db.collection('users').where('email', '==', email).get();

  if (usersSnapshot.empty) {
    console.error('❌ User not found with email:', email);
    console.log('📋 Searching for similar emails...');
    
    // Try to find similar emails
    const allUsers = await db.collection('users').limit(100).get();
    const similarUsers: any[] = [];
    allUsers.forEach(doc => {
      const userData = doc.data();
      if (userData.email && userData.email.includes('shehu')) {
        similarUsers.push({ id: doc.id, email: userData.email, plan: userData.plan });
      }
    });
    
    if (similarUsers.length > 0) {
      console.log('📋 Found similar users:', similarUsers);
    } else {
      console.log('📋 No similar users found. Listing recent users...');
      const recentUsers: any[] = [];
      allUsers.forEach(doc => {
        const userData = doc.data();
        recentUsers.push({ id: doc.id, email: userData.email, plan: userData.plan });
      });
      console.log('📋 Recent users:', recentUsers.slice(0, 10));
    }
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  console.log('✅ User found:', { userId, currentPlan: userData.plan });

  // Calculate subscription end date based on billing cycle
  const subscriptionEndDate = new Date();
  if (billing === 'yearly') {
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
  } else {
    // Monthly: 30 days from now
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
  }

  // Update user's plan
  await db.collection('users').doc(userId).update({
    plan: plan,
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date(),
    subscriptionEndDate: subscriptionEndDate,
    updatedAt: new Date(),
  });

  console.log('✅ User access restored successfully:', { 
    userId, 
    email, 
    plan, 
    billing,
    subscriptionEndDate: subscriptionEndDate.toISOString() 
  });
}

// Run the script
restoreUserAccess('shehubashir467@gmail.com', 'standard')
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
