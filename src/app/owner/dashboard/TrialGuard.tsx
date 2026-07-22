'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { BusmoLogoLoadingSpinner } from '@/components/BusmoLogoLoadingSpinner';

interface TrialGuardProps {
  children: React.ReactNode;
}

interface TrialInfo {
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  isExpired: boolean;
  trialEndDate: Date;
}

// Create context for trial info
const TrialContext = createContext<TrialInfo | null>(null);

export const useTrialInfo = () => useContext(TrialContext);

export const TrialGuard: React.FC<TrialGuardProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();

    const unsubscribe = onAuthStateChanged(auth, async (user: import('firebase/auth').User | null) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        
        if (!userDoc.exists()) {
          router.replace('/login');
          return;
        }

        const userData = userDoc.data();
        const trialEndDate = userData.trialEndDate?.toDate();
        const subscriptionStatus = userData.subscriptionStatus;
        const subscriptionEndDate = userData.subscriptionEndDate?.toDate();
        const userRole = userData.role;
        const lifetimeAccess = userData.lifetimeAccess;
        const now = new Date();

        // Users with lifetime access can bypass all subscription checks
        if (lifetimeAccess === true) {
          setIsLoading(false);
          return;
        }

        // Staff users don't need trial - they can access dashboard
        if (userRole === 'Staff') {
          setIsLoading(false);
          return;
        }

        // If user is in trial mode, check if trial is still valid
        if (subscriptionStatus === 'trial') {
          if (!trialEndDate) {
            // Trial status but no end date - set default 3-day trial
            const defaultTrialEnd = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000));
            await updateDoc(doc(firestore, 'users', user.uid), {
              trialEndDate: admin.firestore.FieldValue.serverTimestamp(),
              trialStartDate: admin.firestore.FieldValue.serverTimestamp(),
            });
            setIsLoading(false);
            return;
          }
          
          if (trialEndDate > now) {
            // Trial is still active
            const timeDiff = trialEndDate.getTime() - now.getTime();
            const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            setTrialInfo({
              daysRemaining,
              hoursRemaining,
              minutesRemaining,
              isExpired: false,
              trialEndDate,
            });
            setIsLoading(false);
            return;
          } else {
            // Trial has expired
            setIsExpired(true);
            await updateDoc(doc(firestore, 'users', user.uid), {
              subscriptionStatus: 'expired',
            });
            return;
          }
        }

        // If already subscribed, check if subscription is still valid
        if (subscriptionStatus === 'active') {
          if (subscriptionEndDate && subscriptionEndDate < now) {
            // Subscription has expired
            setIsExpired(true);
            await updateDoc(doc(firestore, 'users', user.uid), {
              subscriptionStatus: 'expired',
            });
            return;
          }
          // Subscription is still valid
          setIsLoading(false);
          return;
        }

        // If subscription is expired, show expired screen
        if (subscriptionStatus === 'expired') {
          setIsExpired(true);
          setIsLoading(false);
          return;
        }

        // If payment is pending, show expired screen
        if (subscriptionStatus === 'pending_payment') {
          setIsExpired(true);
          setIsLoading(false);
          return;
        }

        // If no subscription status and no trial end date, set up trial
        if (!subscriptionStatus && !trialEndDate) {
          const defaultTrialEnd = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000));
          await updateDoc(doc(firestore, 'users', user.uid), {
            trialEndDate: admin.firestore.FieldValue.serverTimestamp(),
            trialStartDate: admin.firestore.FieldValue.serverTimestamp(),
            subscriptionStatus: 'trial',
          });
          setIsLoading(false);
          return;
        }

        // If we have a trial end date but no subscription status, check if trial is valid
        if (trialEndDate && !subscriptionStatus) {
          const timeDiff = trialEndDate.getTime() - now.getTime();
          
          if (timeDiff > 0) {
            // Trial is still active
            const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            setTrialInfo({
              daysRemaining,
              hoursRemaining,
              minutesRemaining,
              isExpired: false,
              trialEndDate,
            });
            setIsLoading(false);
            return;
          } else {
            // Trial has expired
            setIsExpired(true);
            await updateDoc(doc(firestore, 'users', user.uid), {
              subscriptionStatus: 'expired',
            });
            return;
          }
        }

        // Default: allow access
        setIsLoading(false);
      } catch (error) {
        console.error('Trial guard error:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0]">
        <div className="text-center">
          <BusmoLogoLoadingSpinner size={120} />
          <h2 className="text-xl font-semibold text-[#0A0A0F] mb-2 mt-4">Loading Dashboard</h2>
          <p className="text-[#555568]">Please wait while we check your trial status...</p>
        </div>
      </div>
    );
  }

  // Show expired state with redirect option
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F8] to-[#E8E8F0] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" fill="#FEF3C7"/>
              <circle cx="40" cy="40" r="36" fill="none" stroke="#D97706" strokeWidth="2"/>
              <path d="M40 20v20M40 50v10" stroke="#D97706" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-headline text-[#0A0A0F] mb-3">
            Trial Expired
          </h2>
          <p className="text-[#555568] mb-6">
            Your 3-day free trial has ended. Subscribe to continue using Busmo and keep access to all your business data.
          </p>
          <button
            onClick={() => router.push('/subscribe')}
            className="w-full bg-[#6B3FE7] text-white font-semibold rounded-xl h-12 flex items-center justify-center text-base transition hover:bg-[#4B27B0]"
          >
            Choose Your Plan →
          </button>
          <p className="text-xs text-center text-[#8888A0] mt-4">
            Your data is safe and will be available after subscription
          </p>
        </div>
      </div>
    );
  }

  // Trial active - render children with trial info context
  return (
    <TrialContext.Provider value={trialInfo}>
      {children}
    </TrialContext.Provider>
  );
};

export default TrialGuard;

