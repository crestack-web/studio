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
    // 1. Wait until all initial data is loaded
    if (isUserLoading || (authUser && (isProfileLoading || (userProfile?.businessId && isBusinessLoading)))) {
      return;
    }

    // 2. If not logged in, go to login.
    if (!authUser) {
      redirect('/login');
      return;
    }
    
    // 3. If logged in, but profile document is missing, it's an error state. Redirect to login.
    if (!userProfile) {
      console.error("User profile not found for logged-in user. Redirecting to login.");
      redirect('/login');
      return;
    }

    // 4. Check role. If not an Owner, redirect to their correct dashboard.
    if (userProfile.role !== 'Owner') {
        if (userProfile.role === 'Staff') router.replace('/staff/home');
        else if (userProfile.role === 'Investor') router.replace('/investor/dashboard');
        else if (userProfile.role === 'Admin') router.replace('/admin/dashboard');
        else router.replace('/login'); // Fallback for unknown roles
        return;
    }

    // 5. Check business onboarding status.
    if (!businessData || !businessData.businessName || !businessData.businessType || businessData.businessName === `${userProfile?.displayName}'s Business`) {
        router.replace('/business-info');
        return;
    }
    
    // 6. Check if a plan has been selected.
    if (!businessData.plan) {
        router.replace('/plans');
        return;
    }
    
  }, [isUserLoading, isProfileLoading, isBusinessLoading, authUser, userProfile, businessData, router]);

  if (isUserLoading || (authUser && (isProfileLoading || (userProfile?.businessId && isBusinessLoading)))) {
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
