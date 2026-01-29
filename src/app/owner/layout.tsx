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

  // 1. Wait for Firebase Auth to resolve
  if (isUserLoading) {
    return <LoadingScreen />;
  }

  // 2. If no user, redirect to login
  if (!authUser) {
    return redirect('/login');
  }

  // 3. User is logged in, now wait for their profile data
  if (isProfileLoading) {
    return <LoadingScreen />;
  }
  
  // 4. Profile has loaded (or failed to). If it doesn't exist, this is an error state.
  if (!userProfile) {
    console.error("User profile not found for logged-in user. Redirecting to login.");
    // This could happen if signup failed to create the user doc, or a brief race condition.
    // Redirecting is the safest fallback.
    redirect('/login');
    return null; // Return null after redirect
  }
  
  // 5. We have a profile. Check the role.
  if (userProfile.role !== 'Owner') {
    if (userProfile.role === 'Staff') return redirect('/staff/home');
    if (userProfile.role === 'Investor') return redirect('/investor/dashboard');
    if (userProfile.role === 'Admin') return redirect('/admin/dashboard');
    // Unknown role, redirect to login
    redirect('/login');
    return null;
  }

  // 6. Role is Owner. Now we need business data. Wait for it to load.
  // We only care about business loading if a businessId exists.
  if (userProfile.businessId && isBusinessLoading) {
      return <LoadingScreen />;
  }

  // 7. Business data is loaded. Check onboarding status.
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
