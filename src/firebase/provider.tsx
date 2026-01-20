'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo } from 'react';

// Mock User type to avoid full Firebase import
type MockUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
};

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: any;
  firestore: any;
  auth: any;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: any;
  firestore: any;
  auth: any;
  user: MockUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: any;
  firestore: any;
  auth: any;
  user: MockUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser()
export interface UserHookResult {
  user: MockUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// Mock user for UI rendering without a backend.
const mockUser: MockUser = {
  uid: 'mock-user-id',
  email: 'owner@example.com',
  displayName: 'Mock Owner',
  emailVerified: true,
};

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 * This is a MOCKED implementation that provides a static user and null services.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  
  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable: false,
    firebaseApp: null,
    firestore: null,
    auth: null,
    user: mockUser,
    isUserLoading: false,
    userError: null,
  }), []);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Returns null for all services.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    // This case should ideally not be hit if the app is wrapped correctly
    return {
      firebaseApp: null,
      firestore: null,
      auth: null,
      user: mockUser,
      isUserLoading: false,
      userError: null,
    };
  }
  return context;
};

/** Hook to access Firebase Auth instance (returns null). */
export const useAuth = (): any => {
  return null;
};

/** Hook to access Firestore instance (returns null). */
export const useFirestore = (): any => {
  return null;
};

/** Hook to access Firebase App instance (returns null). */
export const useFirebaseApp = (): any => {
  return null;
};

/** Mock implementation of useMemoFirebase. */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * Returns a static mock user.
 */
export const useUser = (): UserHookResult => {
  return { user: mockUser, isUserLoading: false, userError: null };
};
