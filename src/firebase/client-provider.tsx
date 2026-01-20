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
      firebaseApp={null as any}
      auth={null as any}
      firestore={null as any}
    >
      {children}
    </FirebaseProvider>
  );
}
