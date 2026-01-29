'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { redirect, usePathname } from 'next/navigation';
import React from 'react';
import { Loader2 } from 'lucide-react';

interface AppUser {
  displayName?: string;
  businessId?: string;
  role?: string;
}

interface Business {
  businessName?: string;
  businessType?: string;
  plan?: string;
}

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  // 1. Define all data dependencies
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

  // 2. Consolidate loading state
  const isLoading = isUserLoading || isProfileLoading || (userProfile && isBusinessLoading);
  
  if (isLoading) {
    return <LoadingScreen />;
  }

  // --- Start checks AFTER loading is complete ---

  // Not logged in
  if (!authUser) {
    if (!pathname.startsWith('/login')) {
       redirect('/login');
    }
    return <LoadingScreen />;
  }

  // Logged in, but profile doesn't exist (error state)
  if (!userProfile) {
    console.error("User profile not found for logged-in user. Redirecting to login.");
    if (!pathname.startsWith('/login')) {
       redirect('/login');
    }
    return <LoadingScreen />;
  }
  
  // Check roles: must be 'Owner'
  if (userProfile.role !== 'Owner') {
    if (userProfile.role === 'Staff' && !pathname.startsWith('/staff')) return redirect('/staff/home');
    if (userProfile.role === 'Investor' && !pathname.startsWith('/investor')) return redirect('/investor/dashboard');
    if (userProfile.role === 'Admin' && !pathname.startsWith('/admin')) return redirect('/admin/dashboard');
    
    // If role is something else or not owner, and not on another role's page, redirect to login
    if (!pathname.startsWith('/login')) redirect('/login');
    return <LoadingScreen />;
  }

  // At this point, we know the user is an Owner. Check onboarding.
  
  // Business ID must exist for an owner.
  if (!businessId) {
      console.error("Owner profile is missing a businessId. This is an invalid state.");
      if (!pathname.startsWith('/login')) redirect('/login');
      return <LoadingScreen />;
  }
  
  // Business info (name, type) is incomplete.
  const isBusinessInfoIncomplete = !businessData?.businessName || !businessData?.businessType;
  if (isBusinessInfoIncomplete) {
    // Allow access only to the business-info page
    if (pathname !== '/business-info') {
      redirect('/business-info');
    }
    return <>{children}</>;
  }
  
  // Plan is missing.
  const isPlanMissing = !businessData.plan;
  if (isPlanMissing) {
    // Allow access only to the pricing/plans page and subscription confirmation
    if (pathname !== '/owner/pricing' && pathname !== '/owner/subscribe') {
      redirect('/owner/pricing');
    }
    return <>{children}</>;
  }

  // If all checks pass, the user is fully onboarded and can see any owner page.
  return <>{children}</>;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
