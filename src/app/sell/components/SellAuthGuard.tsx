'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSell } from '../context/SellContext';
import { initializeFirebase } from '@/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

interface Props { children: React.ReactNode; }

export function SellAuthGuard({ children }: Props) {
  const router = useRouter();
  const { user, userLoading } = useSell();
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (userLoading || !user) return;

    async function checkAccess() {
      try {
        const { firestore } = initializeFirebase();
        const userDoc = await getDoc(doc(firestore, 'users', user!.id));
        const userData = userDoc.data();

        if (!userData) {
          setHasAccess(false);
          setSubscriptionChecked(true);
          return;
        }

        // Busmo users (have businessId) get 3 months free
        if (userData.businessId) {
          // Auto-activate free 3-month trial for Busmo users
          if (!userData.moSellSubscription) {
            setHasAccess(true); // First time — allow access, subscribe page will activate
            setSubscriptionChecked(true);
            return;
          }
          const moSellSub = userData.moSellSubscription;
          if (moSellSub.status === 'active') {
            const endDate = moSellSub.endDate?.toDate?.() ?? new Date(moSellSub.endDate);
            if (endDate > new Date()) {
              setHasAccess(true);
              setSubscriptionChecked(true);
              return;
            }
          }
          // Busmo user with expired subscription — still allow (they'll see subscribe page)
          setHasAccess(false);
          setSubscriptionChecked(true);
          return;
        }

        // Non-Busmo users need active moSellSubscription
        const moSellSub = userData.moSellSubscription;
        if (moSellSub?.status === 'active') {
          const endDate = moSellSub.endDate?.toDate?.() ?? new Date(moSellSub.endDate);
          if (endDate > new Date()) {
            setHasAccess(true);
            setSubscriptionChecked(true);
            return;
          }
        }

        // Check general subscription (owner plans include MO Sell)
        if (userData.subscriptionStatus === 'active') {
          const endDate = userData.subscriptionEndDate?.toDate?.() ?? new Date(userData.subscriptionEndDate);
          if (endDate > new Date()) {
            setHasAccess(true);
            setSubscriptionChecked(true);
            return;
          }
        }

        setHasAccess(false);
        setSubscriptionChecked(true);
      } catch (err) {
        console.error('[SellAuthGuard] Access check error:', err);
        setHasAccess(true); // Allow on error
        setSubscriptionChecked(true);
      }
    }

    checkAccess();
  }, [user, userLoading]);

  useEffect(() => {
    if (userLoading || !subscriptionChecked) return;
    if (!user) {
      router.replace('/sell-login');
    } else if (!hasAccess) {
      router.replace('/sell-subscribe');
    }
  }, [user, userLoading, subscriptionChecked, hasAccess, router]);

  if (userLoading || !subscriptionChecked) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#F0F9FF', gap: 16,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(14,165,233,0.30)',
          animation: 'sellPulse 1.4s ease-in-out infinite',
          overflow: 'hidden',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png"
            alt="MO Sell"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
        </div>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3D5A7A' }}>
          Loading MO Sell…
        </p>
        <style>{`
          @keyframes sellPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.75; transform: scale(0.96); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
