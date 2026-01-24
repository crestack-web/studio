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

    // Phase 3: Verify the user's role. This layout is for Owners only.
    if (userProfile.role !== 'Owner') {
      router.replace('/login'); 
      setAuthStatus('redirecting');
      return;
    }
    
    // At this point, we know we have a user with the 'Owner' role.

    // Phase 4: Check if the owner is fully onboarded.
    if (business?.onboardingCompleted) {
        // If onboarding is complete, authorize access to the dashboard.
        setAuthStatus('authorized');
        return;
    }

    // Phase 5: If onboarding is NOT complete, redirect to the correct step.
    if (businessId && business) {
        // Check in reverse order of onboarding steps.
        if (!business.plan) {
            router.replace('/plans');
        } else if (!business.currency) {
            router.replace('/currency');
        } else {
            // If plan and currency exist, but onboarding is still not complete,
            // something is wrong with the base info. Send them to step 1.
            router.replace('/business-info');
        }
        setAuthStatus('redirecting');
        return;
    }
    
    // Phase 6: Fallback for an Owner without a businessId (should trigger onboarding).
    if (!businessId) {
        router.replace('/business-info');
        setAuthStatus('redirecting');
        return;
    }

    // Final safety net if none of the above conditions are met.
    setAuthStatus('loading');

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
