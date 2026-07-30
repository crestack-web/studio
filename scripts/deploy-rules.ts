require('dotenv').config({ path: '.env.local' });
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const firebasePrivateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bizassistant2-62305643-adad7';
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@bizassistant2-62305643-adad7.iam.gserviceaccount.com';

const auth = new GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: projectId,
    private_key: firebasePrivateKey,
    client_email: clientEmail,
  },
  scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase'],
});

async function request(method, url, body) {
  const client = await auth.getClient();
  const res = await client.request({ method, url, data: body });
  return res.data;
}

async function deployFirestoreRules() {
  const content = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  console.log('Creating Firestore ruleset...');
  const ruleset = await request(
    'POST',
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    { source: { files: [{ name: 'firestore.rules', content }] } }
  );
  console.log(`  Created: ${ruleset.name}`);
  const releaseName = `projects/${projectId}/releases/cloud.firestore`;
  try {
    await request(
      'PATCH',
      `https://firebaserules.googleapis.com/v1/${releaseName}?updateMask=rulesetName`,
      { rulesetName: ruleset.name }
    );
  } catch (e) {
    // Release may not exist yet, try creating
    await request(
      'POST',
      `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`,
      { name: releaseName, rulesetName: ruleset.name }
    );
  }
  console.log('  Firestore rules deployed!');
}

async function deployStorageRules() {
  const content = fs.readFileSync(path.join(__dirname, '..', 'storage.rules'), 'utf8');
  console.log('Creating Storage ruleset...');
  const ruleset = await request(
    'POST',
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    { source: { files: [{ name: 'storage.rules', content }] } }
  );
  console.log(`  Created: ${ruleset.name}`);
  const releaseName = `projects/${projectId}/releases/firebase.storage`;
  try {
    await request(
      'PATCH',
      `https://firebaserules.googleapis.com/v1/${releaseName}?updateMask=rulesetName`,
      { rulesetName: ruleset.name }
    );
  } catch (e) {
    await request(
      'POST',
      `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`,
      { name: releaseName, rulesetName: ruleset.name }
    );
  }
  console.log('  Storage rules deployed!');
}

async function main() {
  try {
    await deployFirestoreRules();
  } catch (e) {
    console.error('Firestore error:', e.message);
  }
  try {
    await deployStorageRules();
  } catch (e) {
    console.error('Storage error:', e.message);
  }
  process.exit(0);
}

main();
