export {};

require('dotenv').config({ path: '.env.local' });
const adminSDK = require('firebase-admin');

const firebasePrivateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bizassistant2-62305643-adad7',
  private_key: firebasePrivateKey,
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@bizassistant2-62305643-adad7.iam.gserviceaccount.com',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@bizassistant2-62305643-adad7.iam.gserviceaccount.com'}`
};

adminSDK.initializeApp({
  credential: adminSDK.credential.cert(serviceAccount),
  projectId: 'bizassistant2-62305643-adad7'
});

const db = adminSDK.firestore();

async function main() {
  try {
    const idx = await db.collection('storeIndex').limit(20).get();
    console.log('storeIndex entries:', idx.size);
    idx.forEach((d: any) => console.log(' -', d.id, '→', d.data().businessId));
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

main();
