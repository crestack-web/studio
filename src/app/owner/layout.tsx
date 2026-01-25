'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface UserProfile {
    role?: string;
    businessId?: string;
}

interface Business {
    onboardingCompleted?: boolean;
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
  
  useEffect(() => {
    // 1. Wait for auth and profile data to load.
    if (isUserLoading || (user && isProfileLoading)) {
      return; // Still loading core user data, do nothing yet.
    }

    // 2. If no user is authenticated, redirect to login.
    if (!user) {
      router.replace('/login');
      return;
    }
    
    // 3. User is authenticated, but the profile document doesn't exist yet.
    // This is a transient state right after sign-up. Wait for the doc to be created.
    if (!userProfile) {
        return;
    }

    // 4. User profile exists. Check their role. This layout is for Owners.
    if (userProfile.role !== 'Owner') {
        // Redirect any other role away. For example, a Staff member trying to access an owner URL.
        if (userProfile.role === 'Staff') {
            router.replace('/staff/home');
        } else if (userProfile.role === 'Investor') {
            router.replace('/investor/dashboard');
        } else {
            router.replace('/login'); // Default redirect for any other case.
        }
        return;
    }

    // 5. User is an Owner. Now, check their onboarding status.
    // If they have a businessId, we must wait for the business doc to load.
    if (businessId && isBusinessLoading) {
        return; // Business data is still loading.
    }
    
    // If onboarding is complete, they are fully authorized and can stay.
    if (business?.onboardingCompleted) {
        return; 
    }
    
    // 6. Onboarding is NOT complete. Redirect the owner to the correct step.
    if (!businessId || !business) {
        router.replace('/business-info');
    } else if (!business.plan) { // The 'plan' is the last step of onboarding.
        router.replace('/plans');
    } else {
        // This is a fallback for any other inconsistent state during onboarding.
        router.replace('/business-info');
    }

  }, [user, userProfile, business, isUserLoading, isProfileLoading, isBusinessLoading, businessId, auth, router]);

  // Determine if the user is fully authorized to see the content of the /owner route.
  const isFullyAuthorized = user && userProfile?.role === 'Owner' && business?.onboardingCompleted;
  
  if (isFullyAuthorized) {
    return <>{children}</>;
  }

  // If not fully authorized, show a loading spinner. The useEffect above will handle redirection.
  return (
    <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
