'use client';

// This file is gutted as Firebase backend is removed.

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * A custom error class designed to be consumed by an LLM for debugging.
 * It structures the error information to mimic the request object
 * available in Firestore Security Rules.
 */
export class FirestorePermissionError extends Error {
  constructor(context: SecurityRuleContext) {
    super("Missing or insufficient permissions.");
    this.name = 'FirebaseError';
  }
}
