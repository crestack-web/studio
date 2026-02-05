'use client';

import { useUser, useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { collection, query, Timestamp, doc } from 'firebase/firestore';

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'trialing' | 'cancelled' | 'past_due';
  currentPeriodEnd: Timestamp;
}

interface UserProfile {
  businessId?: string;
}

interface BusinessProfile {
  plan?: string;
  onboardingCompleted?: boolean;
}

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const subscriptionsQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, `users/${user.uid}/subscriptions`));
  }, [firestore, user]);
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useCollection<Subscription>(subscriptionsQuery);

  const userProfileRef = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<UserProfile>(userProfileRef);

  const businessProfileRef = useMemoFirebase(() => {
      if (!firestore || !userProfile?.businessId) return null;
      return doc(firestore, `businesses/${userProfile.businessId}`);
  }, [firestore, userProfile?.businessId]);
  const { data: businessProfile, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);

  const isLoading = isUserLoading || isLoadingSubscriptions || isLoadingUserProfile || isLoadingBusiness;

  useEffect(() => {
    // Wait until auth state is resolved
    if (isLoading) {
      return;
    }

    // 1. If user is not authenticated, redirect to login page.
    if (!user) {
        if (!pathname.startsWith('/login')) {
            router.replace('/login');
        }
        return;
    }

    // 2. If user is authenticated, check subscription status
    if (user) {
        const subscription = subscriptions?.[0];
        const isBillingRoute = pathname.startsWith('/owner/pricing') || pathname.startsWith('/owner/subscribe');
        const hasPlan = Boolean(businessProfile?.plan);
        const onboardingCompleted = Boolean(businessProfile?.onboardingCompleted);

        if (!subscription) {
            if (!onboardingCompleted && !hasPlan && !isBillingRoute) {
                router.replace('/owner/pricing');
                return;
            }

            if ((onboardingCompleted || hasPlan) && isBillingRoute) {
                // Block upgrading during active trial/onboarding
                router.replace('/owner/home');
                return;
            }

            return;
        }

        const isExpired = new Date() > subscription.currentPeriodEnd.toDate();
        const isTrialing = subscription.status === 'trialing';
        const isActive = subscription.status === 'active';
        const isInvalid = subscription.status === 'cancelled'
          || subscription.status === 'past_due'
          || ((isTrialing || isActive) && isExpired);

        if (isTrialing && !isExpired && isBillingRoute) {
            // Block upgrading during active trial
            router.replace('/owner/home');
            return;
        }

        if (isInvalid && !isBillingRoute) {
            router.replace('/owner/subscribe');
            return;
        }
    }

  }, [isLoading, user, subscriptions, pathname, router, businessProfile]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is authenticated and subscription is valid (or on a billing route), render children.
  if (user) {
    return <>{children}</>;
  }

  // Fallback while redirecting unauthenticated user.
  return <LoadingScreen />;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
'use client';

import { useUser, useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { collection, query, Timestamp, doc } from 'firebase/firestore';

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'trialing' | 'cancelled' | 'past_due';
  currentPeriodEnd: Timestamp;
}

interface UserProfile {
  businessId?: string;
}

interface BusinessProfile {
  plan?: string;
  onboardingCompleted?: boolean;
}

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const subscriptionsQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, `users/${user.uid}/subscriptions`));
  }, [firestore, user]);
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useCollection<Subscription>(subscriptionsQuery);


  const userProfileRef = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingUserProfile } = useDoc<UserProfile>(userProfileRef);

  const businessProfileRef = useMemoFirebase(() => {
      if (!firestore || !userProfile?.businessId) return null;
      return doc(firestore, `businesses/${userProfile.businessId}`);
  }, [firestore, userProfile?.businessId]);
  const { data: businessProfile, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);

  const isLoading = isUserLoading || isLoadingSubscriptions || isLoadingUserProfile || isLoadingBusiness;

  useEffect(() => {
    // Wait until auth state is resolved
    if (isLoading) {
      return;
    }

    // 1. If user is not authenticated, redirect to login page.
    if (!user) {
        if (!pathname.startsWith('/login')) {
            router.replace('/login');
        }
        return;
    }
    
    // 2. If user is authenticated, check subscription status
    if (user) {
        const subscription = subscriptions?.[0];
        
        // Allow access to onboarding/payment pages even without a full subscription
        const isBillingRoute = pathname.startsWith('/owner/pricing') || pathname.startsWith('/owner/subscribe');
        
        if (!subscription && !isBillingRoute) {
            router.replace('/owner/pricing');
            return;
        }

        if (subscription) {
            const isExpired = new Date() > subscription.currentPeriodEnd.toDate();
            const isActiveOrTrialing = subscription.status === 'active' || subscription.status === 'trialing';

            // A subscription is invalid if it's cancelled, past_due, or expired.
            const isInvalid = subscription.status === 'cancelled' 
              || subscription.status === 'past_due' 
              || (isActiveOrTrialing && isExpired);

            if (isInvalid && !isBillingRoute) {
                router.replace('/owner/subscribe');
                return;
            }
        }
    }

  }, [isLoading, user, subscriptions, pathname, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is authenticated and subscription is valid (or on a billing route), render children.
  if (user) {
    return <>{children}</>;
  }
  
  // Fallback while redirecting unauthenticated user.
  return <LoadingScreen />;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
