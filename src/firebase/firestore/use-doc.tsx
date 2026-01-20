'use client';
    
import {
  DocumentReference,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * This is a MOCKED implementation that returns a static object.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef
 * @returns {UseDocResult<T>} Object with mocked data, not loading, and no error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  
  // MOCK DATA to ensure UI renders without a backend.
  const mockData: WithId<any> | null = memoizedDocRef ? {
    id: memoizedDocRef.id,
    // Add fields expected by components using this hook
    displayName: 'Mock Owner',
    businessId: 'mock-business-id',
    role: 'Owner',
    name: "Tunde's Mock Shop",
    currency: '₦',
    plan: 'supermarket',
  } : null;

  return { data: mockData as WithId<T> | null, isLoading: false, error: null };
}
