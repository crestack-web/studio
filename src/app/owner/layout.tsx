'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useRouter, redirect } from 'next/navigation';
import React, { useEffect } from 'react';
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

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

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

  useEffect(() => {
    // Stage 1: Wait for auth and user profile to load.
    if (isUserLoading || isProfileLoading) {
      return;
    }

    // Stage 2: Check authentication and profile existence.
    if (!authUser) {
      redirect('/login');
      return;
    }
    
    if (!userProfile) {
      console.error("User profile not found for logged-in user. Redirecting to login.");
      redirect('/login');
      return;
    }

    // Stage 3: Wait for business data to load, if applicable.
    if (userProfile.businessId && isBusinessLoading) {
        return;
    }

    // Stage 4: Perform role and onboarding checks.
    if (userProfile.role !== 'Owner') {
        if (userProfile.role === 'Staff') router.replace('/staff/home');
        else if (userProfile.role === 'Investor') router.replace('/investor/dashboard');
        else if (userProfile.role === 'Admin') router.replace('/admin/dashboard');
        else router.replace('/login'); // Fallback for unknown roles
        return;
    }

    if (!businessData || !businessData.businessName || !businessData.businessType || businessData.businessName === `${userProfile?.displayName}'s Business`) {
        router.replace('/business-info');
        return;
    }
    
    if (!businessData.plan) {
        router.replace('/owner/pricing');
        return;
    }
    
  }, [isUserLoading, isProfileLoading, isBusinessLoading, authUser, userProfile, businessData, router]);

  // Render a loading spinner if any of the critical data is still loading.
  if (isUserLoading || isProfileLoading || (authUser && userProfile && isBusinessLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If all checks pass, render the children
  return <>{children}</>;
};


export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
