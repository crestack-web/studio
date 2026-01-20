'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Gutted component to remove all Firebase initialization.
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return (
    <FirebaseProvider
      firebaseApp={{} as any}
      auth={{} as any}
      firestore={{} as any}
    >
      {children}
    </FirebaseProvider>
  );
}
