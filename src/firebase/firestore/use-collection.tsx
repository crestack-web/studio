'use client';

// NOTE: This is a MOCKED implementation for UI/UX testing without a backend.

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: Error | null; // Error object, or null.
}

// Mock data to return for specific collections
const mockCollections: { [key: string]: any[] } = {
    products: [
        { id: 'prod1', name: 'Bottled Water', price: 150, quantity: 50 },
        { id: 'prod2', name: 'Biscuits', price: 250, quantity: 30 },
        { id: 'prod3', name: 'Soft Drink', price: 200, quantity: 0 },
    ],
    sales: [], // Return empty sales by default
    transactions: [], // Return empty transactions by default
};

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * This is a MOCKED implementation that returns static data for UI testing.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: { path: string } | null | undefined,
): UseCollectionResult<T> {
  
  let data: any[] | null = [];

  if (memoizedTargetRefOrQuery?.path) {
    // Find a matching mock collection based on the path
    const mockKey = Object.keys(mockCollections).find(key => memoizedTargetRefOrQuery.path.includes(key));
    if (mockKey) {
        data = mockCollections[mockKey];
    }
  }

  return { data, isLoading: false, error: null };
}
