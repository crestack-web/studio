'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// This component is now a simple pass-through to the (mocked) FirebaseProvider.
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
