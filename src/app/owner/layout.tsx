'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, limit, type Timestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AppUser {
  displayName?: string;
  businessId?: string;
  role?: string;
}

interface Business {
  businessName?: string;
  businessType?: string;
  plan?: string;
  country?: string;
  onboardingCompleted?: boolean;
}

interface Subscription {
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodEnd: Timestamp; // Firestore Timestamp
}


const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  // 1. Get Auth User
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  // 2. Get User Profile (depends on authUser)
  const userProfileRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return doc(firestore, `users/${authUser.uid}`);
  }, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  // 3. Get Business Data (depends on userProfile)
  const businessId = userProfile?.businessId;
  const businessRef = useMemoFirebase(() => {
    if (!businessId || !firestore) return null;
    return doc(firestore, `businesses/${businessId}`);
  }, [businessId, firestore]);
  const { data: businessData, isLoading: isBusinessLoading } = useDoc<Business>(businessRef);
  
  // 4. Get Subscription Data (depends on authUser)
  const subscriptionsQuery = useMemoFirebase(() => {
      if (!authUser || !firestore) return null;
      return query(collection(firestore, `users/${authUser.uid}/subscriptions`), limit(1));
  }, [authUser, firestore]);
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useCollection<Subscription>(subscriptionsQuery);

  // A single source of truth for our loading state.
  const isStillLoading = isUserLoading || (authUser && (isProfileLoading || (userProfile && (isBusinessLoading || isLoadingSubscriptions))));
  
  useEffect(() => {
    // Wait until ALL data fetching is complete before running any logic.
    if (isStillLoading) {
      return; 
    }

    // --- Start of Sequential Logic ---

    // 1. Check Authentication: If no user, redirect to login.
    if (!authUser) {
      if (!pathname.startsWith('/login')) {
        router.replace('/login');
      }
      return;
    }

    // 2. Check Profile: If user is authenticated but has no profile, it's an error.
    if (!userProfile) {
      toast({ variant: 'destructive', title: 'Account Error', description: "Could not load your user profile. Please log in again." });
      if (!pathname.startsWith('/login')) router.replace('/login');
      return;
    }
    
    // 3. Check Role: Ensure user is an 'Owner'.
    if (userProfile.role !== 'Owner') {
      let destination = '/login';
      if (userProfile.role === 'Staff') destination = '/staff/home';
      else if (userProfile.role === 'Investor') destination = '/investor/dashboard';
      else if (userProfile.role === 'Admin') destination = '/admin/dashboard';
      if (!pathname.startsWith(destination.split('/')[1])) router.replace(destination);
      return;
    }
    
    // 4. Check Business Data: If owner has no business data, it's an error.
    if (!businessData) {
        toast({ variant: 'destructive', title: 'Business Data Error', description: 'Could not load your business data. Please log in again.' });
        if (!pathname.startsWith('/login')) router.replace('/login');
        return;
    }

    // 5. Handle Onboarding Flow: If onboarding is not complete, guide the user.
    if (!businessData.onboardingCompleted) {
      if (!businessData.businessType || !businessData.country) {
        if (pathname !== '/business-info') router.replace('/business-info');
      } else if (!businessData.plan) {
        if (pathname !== '/owner/pricing') router.replace('/owner/pricing');
      }
      return; // Stop further checks during onboarding.
    }
    
    // At this point, onboarding is complete. Now, check subscription status.
    const activeSubscription = subscriptions?.[0];
    const isSubscriptionActive = activeSubscription && (activeSubscription.status === 'active' || activeSubscription.status === 'trialing') && activeSubscription.currentPeriodEnd.toDate() > new Date();

    // 6. Handle Subscription
    if (!isSubscriptionActive) {
      // No active subscription, user must subscribe.
      if (pathname !== '/owner/subscribe') {
        toast({ title: 'Subscription Required', description: 'Please subscribe to continue using Busmo.', variant: 'destructive' });
        router.replace('/owner/subscribe');
      }
    } else {
      // User has an active subscription, they should not be on onboarding/subscribe pages.
      const restrictedPaths = ['/business-info', '/owner/pricing', '/owner/subscribe'];
      if (restrictedPaths.includes(pathname)) {
        router.replace('/owner/home');
      }
    }

  }, [isStillLoading, authUser, userProfile, businessData, subscriptions, pathname, router, toast]);

  // Render loading screen until all data is resolved.
  if (isStillLoading) {
    return <LoadingScreen />;
  }
  
  // Only render children if data is ready AND user is authenticated.
  // This prevents content flashing on logout before redirect.
  if (!isStillLoading && authUser) {
    return <>{children}</>;
  }

  // Fallback loading screen during redirects or logout.
  return <LoadingScreen />;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
