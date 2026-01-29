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

  // 1. Get user profile
  const userProfileRef = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return doc(firestore, `users/${authUser.uid}`);
  }, [authUser, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  // 2. Get business data if businessId exists
  const businessId = userProfile?.businessId;
  const businessRef = useMemoFirebase(() => {
    if (!businessId || !firestore) return null;
    return doc(firestore, `businesses/${businessId}`);
  }, [businessId, firestore]);
  const { data: businessData, isLoading: isBusinessLoading } = useDoc<Business>(businessRef);

  // --- Start checks ---
  
  // Show a loading screen while any of the core data is being fetched.
  const isLoading = isUserLoading || isProfileLoading || (userProfile && !businessData && isBusinessLoading);
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 1. Not authenticated: User must log in.
  if (!authUser) {
    if (!pathname.startsWith('/login')) {
      redirect('/login');
    }
    return <LoadingScreen />; // Show loader during redirect
  }
  
  // 2. Authenticated, but no profile found: This is an unrecoverable error state.
  if (!userProfile) {
    console.error("User profile document not found. Redirecting to login.");
    if (!pathname.startsWith('/login')) {
      redirect('/login');
    }
    return <LoadingScreen />;
  }
  
  // 3. User has a profile, check their role.
  if (userProfile.role !== 'Owner') {
    if (userProfile.role === 'Staff' && !pathname.startsWith('/staff')) return redirect('/staff/home');
    if (userProfile.role === 'Investor' && !pathname.startsWith('/investor')) return redirect('/investor/dashboard');
    if (userProfile.role === 'Admin' && !pathname.startsWith('/admin')) return redirect('/admin/dashboard');
    
    // If role is something else or doesn't match, default to login.
    if (!pathname.startsWith('/login')) redirect('/login');
    return <LoadingScreen />;
  }

  // --- From here, we know the user is an Owner ---
  
  // Onboarding Step 1: Business Info check.
  // This step is incomplete if the businessId is missing from the user profile,
  // the business document itself is missing, or the business document lacks essential fields.
  const isBusinessInfoIncomplete = !businessId || !businessData || !businessData.businessName || !businessData.businessType;
  if (isBusinessInfoIncomplete) {
    // If info is incomplete, they must be on the business-info page.
    if (pathname !== '/business-info') {
      redirect('/business-info');
    }
    return <>{children}</>; // Allow business-info page to render and fix the state.
  }
  
  // Onboarding Step 2: Pricing Plan check.
  const isPlanMissing = !businessData.plan;
  if (isPlanMissing) {
    // If the plan is missing, they must be on the pricing or subscribe page.
    if (pathname !== '/owner/pricing' && pathname !== '/owner/subscribe') {
      redirect('/owner/pricing');
    }
    return <>{children}</>; // Allow pricing/subscribe pages to render.
  }
  
  // All checks passed. User is a fully onboarded owner.
  return <>{children}</>;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
