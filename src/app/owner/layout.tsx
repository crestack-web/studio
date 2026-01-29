'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter(); // Use router for all client-side navigation
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

  const isLoading = isUserLoading || isProfileLoading || (userProfile && isBusinessLoading);

  const hasDataError = !isLoading && authUser && (!userProfile || !businessId || !businessData);

  useEffect(() => {
    // This effect handles all redirection logic to avoid calling router.replace during render.
    if (isLoading) return; // Don't do anything while loading

    // Not authenticated
    if (!authUser) {
      if (!pathname.startsWith('/login')) {
        router.replace('/login');
      }
      return;
    }

    // Authenticated but data is missing (error state)
    if (hasDataError) {
      toast({
        variant: "destructive",
        title: "Account Error",
        description: "We couldn't load your account details. Please try logging in again.",
      });
      if (!pathname.startsWith('/login')) {
        router.replace('/login');
      }
      return;
    }

    // This check should only run if userProfile and businessData are loaded.
    if (userProfile && businessData) {
      // Role-based redirects
      if (userProfile.role !== 'Owner') {
        if (userProfile.role === 'Staff' && !pathname.startsWith('/staff')) router.replace('/staff/home');
        else if (userProfile.role === 'Investor' && !pathname.startsWith('/investor')) router.replace('/investor/dashboard');
        else if (userProfile.role === 'Admin' && !pathname.startsWith('/admin')) router.replace('/admin/dashboard');
        else if (!pathname.startsWith('/login')) router.replace('/login'); // Fallback
        return;
      }

      // Onboarding redirects for Owners
      if (!businessData.onboardingCompleted) {
        const isBusinessInfoIncomplete = !businessData.businessType || !businessData.country;
        const isPlanMissing = !businessData.plan;

        if (isBusinessInfoIncomplete) {
          if (pathname !== '/business-info') router.replace('/business-info');
        } else if (isPlanMissing) {
          if (pathname !== '/owner/pricing' && pathname !== '/owner/subscribe') router.replace('/owner/pricing');
        }
      } else {
          // Onboarding is complete, redirect from onboarding pages
          if (pathname === '/business-info' || pathname === '/owner/pricing' || pathname === '/owner/subscribe') {
              router.replace('/owner/home');
          }
      }
    }

  }, [isLoading, authUser, userProfile, businessData, hasDataError, pathname, router, toast]);

  
  // Show loading screen until all data is resolved and useEffect has had a chance to run.
  if (isLoading || !authUser || hasDataError) {
    return <LoadingScreen />;
  }

  // If we reach here, the user is authenticated, has data, and is on the correct page.
  return <>{children}</>;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
