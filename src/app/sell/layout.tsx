'use client';

import React from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { SellProvider } from './context/SellContext';
import { SellAuthGuard } from './components/SellAuthGuard';
import './sell-tokens.css';

export default function SellLayout({ children }: { children: React.ReactNode }) {
  const firebase = initializeFirebase();

  return (
    <FirebaseProvider {...firebase}>
      <SellProvider>
        <SellAuthGuard>
          {children}
        </SellAuthGuard>
      </SellProvider>
    </FirebaseProvider>
  );
}
