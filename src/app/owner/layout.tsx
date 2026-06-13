'use client';

import React from 'react';
import { AuthGuard } from './dashboard/AuthGuard';
import { AppProvider } from './dashboard/AppContext';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

export default function Layout({ children }: { children: React.ReactNode }) {
  const firebase = initializeFirebase();

  return (
    <FirebaseProvider {...firebase}>
      <AppProvider>
        <AuthGuard requiredRole="Owner">
          {children}
        </AuthGuard>
      </AppProvider>
    </FirebaseProvider>
  );
}