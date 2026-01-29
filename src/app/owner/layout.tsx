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


  const isLoading = isUserLoading || isProfileLoading || (userProfile && isBusinessLoading) || (userProfile && isLoadingSubscriptions);

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    // 1. Not authenticated
    if (!authUser) {
      if (!pathname.startsWith('/login')) {
        router.replace('/login');
      }
      return;
    }

    // 2. Authenticated, but data is missing (error state)
    if (!userProfile || !businessId) {
       toast({
        variant: "destructive",
        title: "Account Error",
        description: "We couldn't load your account details. Please log in again.",
      });
      if (!pathname.startsWith('/login')) {
        router.replace('/login');
      }
      return;
    }
    
    // 3. Role-based redirects
    if (userProfile.role !== 'Owner') {
      if (userProfile.role === 'Staff' && !pathname.startsWith('/staff')) router.replace('/staff/home');
      else if (userProfile.role === 'Investor' && !pathname.startsWith('/investor')) router.replace('/investor/dashboard');
      else if (userProfile.role === 'Admin' && !pathname.startsWith('/admin')) router.replace('/admin/dashboard');
      else if (!pathname.startsWith('/login')) router.replace('/login');
      return;
    }
    
    // At this point, user is an authenticated Owner.
    
    // 4. Handle onboarding flow
    if (!businessData?.onboardingCompleted) {
        if (!businessData.businessType || !businessData.country) {
            if (pathname !== '/business-info') router.replace('/business-info');
        } else if (!businessData.plan) {
            if (pathname !== '/owner/pricing') router.replace('/owner/pricing');
        }
        return;
    }

    // 5. Onboarding is complete. Handle subscription status.
    const hasActiveSubscription = subscriptions && subscriptions.length > 0;
    if (!hasActiveSubscription) {
        // If no active sub, they must go to the subscribe page.
        // Allow access only to subscribe or pricing pages.
        if (pathname !== '/owner/subscribe' && pathname !== '/owner/pricing') {
            toast({ title: "Your trial has ended", description: "Please subscribe to continue.", variant: "destructive" });
            router.replace('/owner/subscribe');
        }
    } else {
        // Has active subscription. Should not be on onboarding pages.
        if (pathname === '/business-info' || pathname === '/owner/pricing' || pathname === '/owner/subscribe') {
            router.replace('/owner/home');
        }
    }

  }, [isLoading, authUser, userProfile, businessData, subscriptions, businessId, pathname, router, toast]);

  
  // Show loading screen until all data is resolved and useEffect has had a chance to run.
  if (isLoading || !authUser || !userProfile || !businessId) {
    return <LoadingScreen />;
  }

  // If we reach here, the user is an authorized owner and on a valid page for their state.
  return <>{children}</>;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
