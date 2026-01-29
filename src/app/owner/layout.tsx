'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { redirect } from 'next/navigation';
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
  // The layout is loading if auth is loading, OR if auth is done but the profile is still loading, 
  // OR if the profile is done and we have a businessId but the business data is still loading.
  const isLoading = isUserLoading || (authUser && isProfileLoading) || (businessId && isBusinessLoading);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // 3. Perform checks *after* all loading is complete

  // If loading is finished and there's no authUser, they're not logged in.
  if (!authUser) {
    return redirect('/login');
  }

  // If loading is finished and there's no userProfile, the user doc is missing.
  if (!userProfile) {
    console.error("User profile not found for logged-in user. Redirecting to login.");
    redirect('/login');
    return null; // Return null after redirect
  }
  
  // Check roles
  if (userProfile.role !== 'Owner') {
    if (userProfile.role === 'Staff') return redirect('/staff/home');
    if (userProfile.role === 'Investor') return redirect('/investor/dashboard');
    if (userProfile.role === 'Admin') return redirect('/admin/dashboard');
    // Unknown role
    redirect('/login');
    return null;
  }

  // At this point, we know the user is an Owner. Check onboarding.
  // A businessId *must* exist for an owner. If not, that's an error state.
  if (!businessId) {
      console.error("Owner profile is missing a businessId. Redirecting to login.");
      redirect('/login');
      return null;
  }
  
  // Now check the business data itself.
  const isBusinessInfoIncomplete = !businessData || !businessData.businessName || !businessData.businessType;
  if (isBusinessInfoIncomplete) {
    return redirect('/business-info');
  }
  
  const isPlanMissing = !businessData.plan;
  if (isPlanMissing) {
    return redirect('/owner/pricing');
  }

  // If all checks pass, render the children.
  return <>{children}</>;
};


export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
