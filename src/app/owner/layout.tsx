
'use client';

import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { collection, query, Timestamp } from 'firebase/firestore';

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

  const isLoading = isUserLoading || isLoadingSubscriptions;

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

            // If subscription is cancelled, or if it's an expired active/trialing plan, block access
            if (subscription.status === 'cancelled' || (isActiveOrTrialing && isExpired)) {
              if (pathname !== '/owner/subscribe') {
                router.replace('/owner/subscribe');
              }
              return;
            }
        }
    }

  }, [isLoading, user, subscriptions, pathname, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is authenticated and subscription is valid, render children.
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
