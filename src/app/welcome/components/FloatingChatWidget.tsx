'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  createdAt: string;
}

export const FloatingChatWidget: React.FC = () => {
  const [userEmail, setUserEmail] = useState('visitor');
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || 'user');
        setUserId(user.uid);
        
        // Fetch user's business data
        try {
          const { firestore } = initializeFirebase();
          if (firestore) {
            const userDoc = await getDoc(doc(firestore, 'users', user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setBusinessId(data.businessId || null);
              setBusinessName(data.businessName || null);
            }
          }
        } catch (error) {
          console.error('Error fetching user business data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const openSupportSection = () => {
    // Find the SupportSection component's chat trigger and click it
    const chatButton = document.querySelector('[data-support-chat-trigger]') as HTMLButtonElement;
    if (chatButton) {
      chatButton.click();
    } else {
      // Fallback: navigate to help page
      window.location.href = '/welcome/help';
    }
  };

  return (
    <>
      {/* Floating Button - Primary Color */}
      <button
        onClick={openSupportSection}
        className="fixed bottom-6 right-6 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        style={{
          boxShadow: '0 4px 20px rgba(107, 63, 231, 0.4)',
        }}
        aria-label="Open chat support"
      >
        <MessageCircle size={28} />
      </button>
    </>
  );
};
