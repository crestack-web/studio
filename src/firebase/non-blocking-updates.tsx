'use client';
    
// This file is gutted as Firebase backend is removed.

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: any, data: any, options: any) {
  // Do nothing. Backend is removed.
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: any, data: any) {
  // Do nothing, but return a resolved promise to avoid breaking chains
  return Promise.resolve({ id: 'mock-id' });
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: any, data: any) {
  // Do nothing. Backend is removed.
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: any) {
  // Do nothing. Backend is removed.
}
