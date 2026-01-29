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

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
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

  const isLoading = isUserLoading || isProfileLoading || (userProfile?.businessId && isBusinessLoading);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // After all loading is complete, perform checks.
  if (!authUser || !userProfile) {
    return redirect('/login');
  }

  if (userProfile.role !== 'Owner') {
    if (userProfile.role === 'Staff') return redirect('/staff/home');
    if (userProfile.role === 'Investor') return redirect('/investor/dashboard');
    if (userProfile.role === 'Admin') return redirect('/admin/dashboard');
    return redirect('/login'); // Fallback for unknown roles
  }

  // At this point, we know the user is an Owner. Check their onboarding status.
  const isBusinessInfoIncomplete = !businessData || !businessData.businessName || !businessData.businessType || (userProfile.displayName && businessData.businessName === `${userProfile.displayName}'s Business`);
  
  if (isBusinessInfoIncomplete) {
    return redirect('/business-info');
  }
  
  if (!businessData.plan) {
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
