/**
 * Firebase Admin SDK Initialization
 * Centralized initialization for server-side Firebase Admin operations
 */

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let db: ReturnType<typeof getFirestore> | null = null;
let adminInitialized = false;

// Load environment variables explicitly
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

console.log('🔍 Firebase Admin Environment Check:', {
  hasProjectId: !!projectId,
  hasPrivateKey: !!privateKey,
  hasClientEmail: !!clientEmail,
  projectId: projectId || 'missing',
  clientEmail: clientEmail || 'missing',
  privateKeyLength: privateKey?.length || 0
});

try {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: projectId,
      privateKey: privateKey,
      clientEmail: clientEmail,
    };
    
    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      adminInitialized = true;
      console.log('✅ Firebase Admin initialized');
    } else {
      console.warn('⚠️ Firebase Admin credentials missing:', {
        hasProjectId: !!serviceAccount.projectId,
        hasPrivateKey: !!serviceAccount.privateKey,
        hasClientEmail: !!serviceAccount.clientEmail,
      });
    }
  } else {
    adminInitialized = true;
    console.log('✅ Firebase Admin already initialized');
  }
  
  if (adminInitialized) {
    db = getFirestore();
    console.log('✅ Firestore initialized');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error);
}

export function getAdminDb() {
  if (!db) {
    throw new Error('Firebase Admin not initialized. Check environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL');
  }
  return db;
}

export function getAdminAuth() {
  if (!adminInitialized) {
    throw new Error('Firebase Admin not initialized. Check environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL');
  }
  return admin.auth();
}

export function isAdminInitialized() {
  return adminInitialized;
}
