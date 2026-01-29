'use client';

import { useUser, useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, collection, query, where, limit } from 'firebase/firestore';

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

interface AppUser {
  id: string;
  role?: 'Owner' | 'Staff' | 'Investor';
  businessId?: string;
  onboardingCompleted?: boolean; // Legacy, we now use business field
}

interface Business {
    plan?: string;
    onboardingCompleted?: boolean;
    businessType?: string;
    country?: string;
}

interface Subscription {
    status: 'trialing' | 'active' | 'past_due' | 'canceled';
    currentPeriodEnd: {
        toDate: () => Date;
    };
}


const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // --- Data Fetching ---
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const businessRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.businessId) return null;
    return doc(firestore, `businesses/${userProfile.businessId}`);
  }, [firestore, userProfile?.businessId]);
  const { data: businessData, isLoading: isBusinessLoading } = useDoc<Business>(businessRef);

  const subscriptionQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, `users/${user.uid}/subscriptions`),
        where('status', 'in', ['trialing', 'active']),
        limit(1)
    );
  }, [firestore, user]);
  const { data: subscriptions, isLoading: isSubscriptionLoading } = useCollection<Subscription>(subscriptionQuery);
  const activeSubscription = subscriptions?.[0];

  // --- Combined Loading State ---
  const isDataLoading = isUserLoading || isProfileLoading || isBusinessLoading || isSubscriptionLoading;
  
  useEffect(() => {
    // Wait until all data has been fetched before making any routing decisions.
    if (isDataLoading) {
        return;
    }

    // 1. Not authenticated
    if (!user) {
        if (!pathname.startsWith('/login')) {
            router.replace('/login');
        }
        return;
    }

    // 2. Authenticated, but no profile or incorrect role.
    if (!userProfile || userProfile.role !== 'Owner') {
        if (userProfile?.role === 'Staff') {
            router.replace('/staff/home');
        } else if (userProfile?.role === 'Investor') {
            router.replace('/investor/dashboard');
        } else {
            router.replace('/login');
        }
        return;
    }
    
    // 3. Authenticated as Owner, handle onboarding flow.
    if (!businessData?.onboardingCompleted) {
        if (!businessData?.businessType || !businessData?.country) {
            if (pathname !== '/business-info') {
                router.replace('/business-info');
            }
        } else if (!businessData?.plan) {
             if (pathname !== '/owner/pricing') {
                router.replace('/owner/pricing');
            }
        } else {
             // Fallback: something is missing, send to start of onboarding
            if (pathname !== '/business-info') {
                router.replace('/business-info');
            }
        }
        return; // Important: Stop execution if in onboarding
    }

    // 4. Onboarding is complete, check subscription status.
    const hasActiveSub = activeSubscription && activeSubscription.currentPeriodEnd.toDate() > new Date();
    if (!hasActiveSub) {
        if (pathname !== '/owner/subscribe') {
            router.replace('/owner/subscribe');
        }
        return;
    }

    // 5. All checks passed, user is fully onboarded and has an active subscription/trial.
    // If they are on a subscription-related page, move them home.
    if (pathname === '/owner/subscribe' || pathname === '/owner/pricing' || pathname === '/business-info') {
        router.replace('/owner/home');
    }

  }, [isDataLoading, user, userProfile, businessData, activeSubscription, pathname, router]);

  // Render loading screen while waiting for data.
  if (isDataLoading) {
    return <LoadingScreen />;
  }

  // If user is present and all checks have passed (or are pending in useEffect), render children.
  // The useEffect handles the redirects away from here if necessary.
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
