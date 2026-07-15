'use client';

import '@/app/globals.css';
import { CurrencyProvider } from '@/contexts/currency-context';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import ChatwootWidget from '@/components/ChatwootWidget';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { firebaseApp, firestore, auth: firebaseAuth } = initializeFirebase();
  const [chatwootUser, setChatwootUser] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setChatwootUser({
              id: user.uid,
              name: data.name || user.email || 'User',
              email: user.email || '',
              businessName: data.businessName,
              businessId: data.businessId,
              subscriptionPlan: data.plan || 'free',
              workspaceId: data.businessId,
            });
          }
        } catch (error) {
          console.error('Error fetching user data for Chatwoot:', error);
        }
      } else {
        setChatwootUser(null);
      }
    });

    return () => unsubscribe();
  }, [firestore]);

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/dashboard-logo.svg" />
        <link rel="shortcut icon" href="/dashboard-logo.svg" />
        <link rel="apple-touch-icon" href="/dashboard-logo.svg" />
      </head>
      <body>
        <FirebaseProvider firebaseApp={firebaseApp} firestore={firestore} auth={firebaseAuth}>
          <CurrencyProvider>
            {children}
            <ChatwootWidget user={chatwootUser} />
          </CurrencyProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
