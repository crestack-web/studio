require('dotenv').config({ path: '.env.local' });
console.log('dotenv loaded');
const admin = require('firebase-admin');
console.log('firebase-admin loaded');

const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bizassistant2-62305643-adad7',
  private_key: privateKey,
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@bizassistant2-62305643-adad7.iam.gserviceaccount.com',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@bizassistant2-62305643-adad7.iam.gserviceaccount.com'}`
};

console.log('Initializing Firebase Admin...');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'bizassistant2-62305643-adad7'
});
console.log('Firebase Admin initialized');

const db = admin.firestore();
console.log('Got Firestore instance');

async function setMoCredits() {
  const email = 'taheeratorganic@gmail.com';

  try {
    console.log(`Querying for user: ${email}`);
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log(`No user found with email: ${email}`);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    console.log(`Found user: ${userId}`);

    await db.collection('users').doc(userId).update({
      moCreditsRemaining: 2000,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Successfully set 2000 MO credits for ${email}`);
  } catch (error) {
    console.error('Error setting MO credits:', error);
  } finally {
    process.exit(0);
  }
}

setMoCredits();
