const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

async function giveLifetimeAccess() {
  try {
    // Load environment variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.error('Missing Firebase Admin credentials. Check environment variables:');
      console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      console.error('- FIREBASE_ADMIN_PRIVATE_KEY');
      console.error('- FIREBASE_ADMIN_CLIENT_EMAIL');
      process.exit(1);
    }

    // Initialize Firebase Admin
    const serviceAccount = {
      projectId,
      privateKey,
      clientEmail,
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    const db = getFirestore();

    // Get email from command line argument
    const targetEmail = process.argv[2];

    if (!targetEmail) {
      console.error('Usage: node give-lifetime-access.js <targetEmail>');
      console.error('Example: node give-lifetime-access.js sxeedtxheer@gmail.com');
      process.exit(1);
    }

    console.log(`Giving lifetime access to user: ${targetEmail}`);

    // Find user by email
    const snapshot = await db.collection('users').where('email', '==', targetEmail).get();

    if (snapshot.empty) {
      console.error(`No user found with email: ${targetEmail}`);
      process.exit(1);
    }

    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`Found user: ${userData.name || userData.displayName} (${userId})`);
    console.log(`Current plan: ${userData.plan || 'free'}`);
    console.log(`Current subscription status: ${userData.subscriptionStatus || 'none'}`);

    // Update user to lifetime access
    await db.collection('users').doc(userId).update({
      plan: 'lifetime',
      subscriptionStatus: 'active',
      subscriptionPlan: 'lifetime',
      subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
      // No subscriptionEndDate for lifetime
      subscriptionEndDate: null,
      lifetimeAccess: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Successfully granted lifetime access to ${targetEmail}`);
    console.log(`User ID: ${userId}`);
    console.log(`Plan updated to: lifetime`);
    process.exit(0);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

giveLifetimeAccess();
