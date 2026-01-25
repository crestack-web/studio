'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

interface UserProfile {
    role?: string;
    businessId?: string;
}

// Expanded Business interface to check onboarding progress
interface Business {
    onboardingCompleted?: boolean;
    currency?: string;
    plan?: string;
    businessName?: string;
    businessType?: string;
}

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading, auth } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const businessId = userProfile?.businessId;

  const businessRef = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return doc(firestore, 'businesses', businessId);
  }, [firestore, businessId]);
  const { data: business, isLoading: isBusinessLoading } = useDoc<Business>(businessRef);
  
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'redirecting'>('loading');
  
  useEffect(() => {
    const isStillLoading = isUserLoading || isProfileLoading || (user && !userProfile) || (userProfile?.businessId && isBusinessLoading);

    if (isStillLoading) {
      setAuthStatus('loading');
      return;
    }

    if (!user) {
      router.replace('/login');
      setAuthStatus('redirecting');
      return;
    }

    const isAuthorizedRole = userProfile?.role === 'Owner' || userProfile?.role === 'Staff';
    if (!isAuthorizedRole) {
      if (auth) signOut(auth);
      router.replace('/login'); 
      setAuthStatus('redirecting');
      return;
    }
    
    if (userProfile.role === 'Owner') {
        if (business?.onboardingCompleted) {
            setAuthStatus('authorized');
            return;
        }

        // Onboarding is not complete, figure out where to send them.
        setAuthStatus('redirecting');
        if (!businessId || !business) {
            router.replace('/business-info');
        } else if (!business.currency) {
            router.replace('/currency');
        } else if (!business.plan) {
            router.replace('/plans');
        } else {
            // This is an inconsistent state, default back to the start.
            router.replace('/business-info');
        }
    } else if (userProfile.role === 'Staff') {
      if (businessId) {
        setAuthStatus('authorized');
      } else {
        if (auth) signOut(auth);
        router.replace('/login');
        setAuthStatus('redirecting');
      }
    }

  }, [user, userProfile, business, isUserLoading, isProfileLoading, isBusinessLoading, businessId, router, auth]);

  if (authStatus !== 'authorized') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
