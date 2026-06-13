/**
 * Firebase Configuration
 * Initializes Firebase Admin SDK for Cloud Functions
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Export Firestore and Storage instances
export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();

// Export types for reuse
export type Firestore = admin.firestore.Firestore;
export type CollectionReference = admin.firestore.CollectionReference;
export type DocumentReference = admin.firestore.DocumentReference;
export type QuerySnapshot = admin.firestore.QuerySnapshot;
export type DocumentData = admin.firestore.DocumentData;
