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
    if (isUserLoading || (authUser && (isProfileLoading || isBusinessLoading))) {
      return;
    }

    if (!authUser) {
      redirect('/login');
      return;
    }
    
    if (userProfile && userProfile.role !== 'Owner') {
        // Not an owner, redirect to their respective dashboard
        if (userProfile.role === 'Staff') router.replace('/staff/home');
        else if (userProfile.role === 'Investor') router.replace('/investor/dashboard');
        else if (userProfile.role === 'Admin') router.replace('/admin/dashboard');
        else router.replace('/login'); // Fallback
        return;
    }

    if (!businessData) {
        if (userProfile?.businessId) {
            router.replace('/business-info');
        }
        return;
    }

    const { businessName, businessType, plan } = businessData;
    if (!businessName || !businessType || businessName === `${userProfile?.displayName}'s Business`) {
        router.replace('/business-info');
    } else if (!plan) {
        router.replace('/owner/pricing');
    }
  }, [isUserLoading, isProfileLoading, isBusinessLoading, authUser, userProfile, businessData, router]);

  if (isUserLoading || (authUser && (isProfileLoading || isBusinessLoading))) {
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
