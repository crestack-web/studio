'use client';

import '@/app/globals.css';
import { CurrencyProvider } from '@/contexts/currency-context';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { firebaseApp, firestore, auth } = initializeFirebase();

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/dashboard-logo.svg" />
        <link rel="shortcut icon" href="/dashboard-logo.svg" />
        <link rel="apple-touch-icon" href="/dashboard-logo.svg" />
      </head>
      <body>
        <FirebaseProvider firebaseApp={firebaseApp} firestore={firestore} auth={auth}>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
