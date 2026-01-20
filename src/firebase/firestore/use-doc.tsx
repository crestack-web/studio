'use client';
    
// NOTE: This is a MOCKED implementation for UI/UX testing without a backend.

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * This is a MOCKED implementation that returns a static object for UI testing.
 */
export function useDoc<T = any>(
  memoizedDocRef: { path: string } | null | undefined,
): UseDocResult<T> {
  
  let mockData: WithId<any> | null = null;
  
  if (memoizedDocRef?.path) {
    const docId = memoizedDocRef.path.split('/').pop() || 'mock-id';

    if (memoizedDocRef.path.startsWith('users')) {
         mockData = {
            id: docId,
            displayName: 'Mock Owner',
            businessId: 'mock-business-id',
            role: 'Owner',
        };
    } else if (memoizedDocRef.path.startsWith('businesses')) {
        mockData = {
            id: docId,
            name: "Tunde's Mock Shop",
            currency: '₦',
            plan: 'supermarket', // Set a plan to bypass onboarding checks
        };
    }
  }

  return { data: mockData as WithId<T> | null, isLoading: false, error: null };
}
