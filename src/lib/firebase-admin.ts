/**
 * Firebase Admin SDK Initialization
 * Centralized initialization for server-side Firebase Admin operations
 */

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let db: ReturnType<typeof getFirestore> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;
let adminInitialized = false;

// Load environment variables explicitly
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

try {
  if (!admin.apps.length) {
    const serviceAccount = {
      projectId: projectId,
      privateKey: privateKey,
      clientEmail: clientEmail,
    };
    
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        ...(storageBucket ? { storageBucket } : {}),
      });
      adminInitialized = true;
    }
  } else {
    adminInitialized = true;
  }
  
  if (adminInitialized) {
    db = getFirestore();
    storage = getStorage();
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

export function getAdminDb() {
  if (!db) {
    throw new Error('Firebase Admin not initialized. Check environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL');
  }
  return db;
}

export function getAdminStorage() {
  if (!storage) {
    throw new Error('Firebase Admin Storage not initialized. Check environment variables.');
  }
  return storage;
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
