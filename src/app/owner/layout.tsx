'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc } from 'firebase/firestore';
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
  const { user, isUserLoading } = useUser();
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
    // Phase 1: Wait for all essential data to load.
    const isStillLoading = isUserLoading || isProfileLoading || (user && !userProfile) || (userProfile?.businessId && isBusinessLoading);
    if (isStillLoading) {
      setAuthStatus('loading');
      return;
    }

    // Phase 2: If no user is logged in, redirect to the main login page.
    if (!user) {
      router.replace('/login');
      setAuthStatus('redirecting');
      return;
    }

    // Phase 3: Verify the user's role. This layout is for Owners or Staff.
    const isAuthorizedRole = userProfile.role === 'Owner' || userProfile.role === 'Staff';
    if (!isAuthorizedRole) {
      router.replace('/login'); 
      setAuthStatus('redirecting');
      return;
    }
    
    // At this point, we know we have a user with an authorized role.

    // Phase 4: If the user is an Owner, check if they are fully onboarded.
    if (userProfile.role === 'Owner') {
        if (business?.onboardingCompleted) {
            setAuthStatus('authorized');
            return;
        }

        // Onboarding is not complete, redirect to the correct step.
        if (businessId && business) {
            if (!business.plan) {
                router.replace('/plans');
            } else if (!business.currency) {
                router.replace('/currency');
            } else {
                router.replace('/business-info');
            }
            setAuthStatus('redirecting');
            return;
        }
        
        // Fallback for an Owner without a businessId (should trigger onboarding).
        if (!businessId) {
            router.replace('/business-info');
            setAuthStatus('redirecting');
            return;
        }
    } else {
      // If the user is Staff, they are authorized.
      setAuthStatus('authorized');
    }

  }, [user, userProfile, business, isUserLoading, isProfileLoading, isBusinessLoading, businessId, router]);

  if (authStatus !== 'authorized') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
