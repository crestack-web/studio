'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
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
  status: 'active' | 'cancelled' | 'past_due';
}


const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return doc(firestore, `users/${authUser.uid}`);
  }, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const businessId = userProfile?.businessId;
  const businessRef = useMemoFirebase(() => {
    if (!businessId || !firestore) return null;
    return doc(firestore, `businesses/${businessId}`);
  }, [businessId, firestore]);
  const { data: businessData, isLoading: isBusinessLoading } = useDoc<Business>(businessRef);
  
  const subscriptionsQuery = useMemoFirebase(() => {
      if (!authUser || !firestore) return null;
      return query(collection(firestore, `users/${authUser.uid}/subscriptions`), where('status', '==', 'active'), limit(1));
  }, [authUser, firestore]);
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useCollection<Subscription>(subscriptionsQuery);

  const isDataReady = !isUserLoading && !isProfileLoading && !(userProfile && isBusinessLoading) && !(userProfile && isLoadingSubscriptions);

  useEffect(() => {
    // This effect handles all redirects.
    // It waits for ALL loading to be false before making any decisions.
    if (!isDataReady) {
      return; 
    }

    // 1. Not authenticated? Go to login.
    if (!authUser) {
      if (!pathname.startsWith('/login')) {
        router.replace('/login');
      }
      return;
    }

    // 2. Authenticated, but data is missing? Unrecoverable. Go to login.
    if (!userProfile) {
      toast({ variant: 'destructive', title: 'Account Error', description: "Could not load your user profile. Please try again." });
      if (!pathname.startsWith('/login')) router.replace('/login');
      return;
    }
    
    // 3. Role check
    if (userProfile.role !== 'Owner') {
      if (userProfile.role === 'Staff' && !pathname.startsWith('/staff')) router.replace('/staff/home');
      else if (userProfile.role === 'Investor' && !pathname.startsWith('/investor')) router.replace('/investor/dashboard');
      else if (userProfile.role === 'Admin' && !pathname.startsWith('/admin')) router.replace('/admin/dashboard');
      else if (!pathname.startsWith('/login')) router.replace('/login');
      return;
    }
    
    // At this point, user is an authenticated Owner.
    if (!businessData) {
        toast({ variant: 'destructive', title: 'Business Data Error', description: 'Could not load your business data. Please log in again.' });
        if (!pathname.startsWith('/login')) router.replace('/login');
        return;
    }

    // 4. Onboarding flow
    if (!businessData.onboardingCompleted) {
      if (!businessData.businessType || !businessData.country) {
        if (pathname !== '/business-info') router.replace('/business-info');
      } else if (!businessData.plan) {
        if (pathname !== '/owner/pricing') router.replace('/owner/pricing');
      }
      return;
    }

    // 5. Onboarding is complete. Handle subscription.
    const hasActiveSubscription = subscriptions && subscriptions.length > 0;
    if (!hasActiveSubscription) {
      if (pathname !== '/owner/subscribe' && pathname !== '/owner/pricing') {
        toast({ title: 'Your trial has ended', description: 'Please subscribe to continue.', variant: 'destructive' });
        router.replace('/owner/subscribe');
      }
    } else {
      // Is subscribed, should not be on onboarding pages.
      if (pathname === '/business-info' || pathname === '/owner/pricing' || pathname === '/owner/subscribe') {
        router.replace('/owner/home');
      }
    }
  }, [isDataReady, authUser, userProfile, businessData, subscriptions, pathname, router, toast]);

  // Show loading screen if any data is still being fetched.
  if (!isDataReady) {
    return <LoadingScreen />;
  }
  
  // Only render children if data is ready AND user is authenticated.
  // This prevents content flashing on logout before redirect.
  if (isDataReady && authUser) {
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
