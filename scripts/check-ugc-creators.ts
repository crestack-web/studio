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

async function check() {
  try {
    const all = await db.collection('ugcCreators').limit(100).get();
    console.log(`Total ugcCreators docs: ${all.size}`);
    all.forEach((d: any) => {
      const data = d.data();
      console.log('---');
      console.log('id:', d.id);
      console.log('username:', data.username);
      console.log('displayName:', data.displayName);
      console.log('userId:', data.userId);
      console.log('isActive:', data.isActive);
      console.log('isBanned:', data.isBanned);
      console.log('price30s:', data.price30s);
      console.log('niches:', JSON.stringify(data.niches));
    });

    console.log('\n=== Composite index query test ===');
    try {
      const q = await db.collection('ugcCreators')
        .where('isActive', '==', true)
        .where('isBanned', '==', false)
        .limit(50)
        .get();
      console.log('Composite query returned:', q.size, 'creators');
      q.forEach((d: any) => console.log(' -', d.id, d.data().username, d.data().displayName));
    } catch (e: any) {
      console.error('Composite query FAILED:', e.message);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

check();
