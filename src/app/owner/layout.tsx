'use client';

import { useUser, useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { collection, query, Timestamp, doc, orderBy, limit } from 'firebase/firestore';

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
    return query(
      collection(firestore, `users/${user.uid}/subscriptions`),
      orderBy('currentPeriodEnd', 'desc'),
      limit(1)
    );
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
  const hasPlan = Boolean(businessProfile?.plan);
  const onboardingCompleted = Boolean(businessProfile?.onboardingCompleted);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (!pathname.startsWith('/login')) {
        router.replace('/login');
      }
      return;
    }

    const subscription = subscriptions?.[0];
    const isBillingRoute = pathname.startsWith('/owner/pricing') || pathname.startsWith('/owner/subscribe');

    if (!subscription) {
      // During onboarding, force plan selection.
      if (!onboardingCompleted && !hasPlan) {
        if (!isBillingRoute) {
          router.replace('/owner/pricing');
        }
        return;
      }

      // If onboarding is complete (or a plan exists) but the subscription doc is missing,
      // treat it as a billing issue and route to subscribe.
      if (!pathname.startsWith('/owner/subscribe')) {
        router.replace('/owner/subscribe');
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
      router.replace('/owner/home');
      return;
    }

    if (isInvalid && !isBillingRoute) {
      router.replace('/owner/subscribe');
      return;
    }
  }, [isLoading, user, subscriptions, pathname, router, hasPlan, onboardingCompleted]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <>{children}</>;
  }

  return <LoadingScreen />;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
