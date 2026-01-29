'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { redirect, usePathname } from 'next/navigation';
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

  // Show a loading screen while any data is being fetched.
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
  
  // From here, we know the user is authenticated.

  // 2. Authenticated, but essential profile or business data is missing.
  // This is an unrecoverable state, likely from an interrupted signup.
  if (!userProfile || !businessData) {
     console.error("User profile or business data not found for a logged-in user. This is a critical error state. Redirecting to login.");
     if (!pathname.startsWith('/login')) {
        toast({
            variant: "destructive",
            title: "Account Error",
            description: "We couldn't load your account details. Please try logging in again.",
        });
        redirect('/login');
     }
     return <LoadingScreen />;
  }

  // 3. User has data, check their role.
  if (userProfile.role !== 'Owner') {
    if (userProfile.role === 'Staff' && !pathname.startsWith('/staff')) return redirect('/staff/home');
    if (userProfile.role === 'Investor' && !pathname.startsWith('/investor')) return redirect('/investor/dashboard');
    if (userProfile.role === 'Admin' && !pathname.startsWith('/admin')) return redirect('/admin/dashboard');
    
    // Fallback for any other role
    if (!pathname.startsWith('/login')) redirect('/login');
    return <LoadingScreen />;
  }
  
  // --- From here, we know the user is an Owner with loaded profile and business data ---

  // 4. Check if onboarding is complete.
  if (businessData.onboardingCompleted) {
    // If onboarding is complete, but they are on an onboarding page, redirect them home.
    if (pathname === '/business-info' || pathname === '/owner/pricing' || pathname === '/owner/subscribe') {
        redirect('/owner/home');
    }
    return <>{children}</>;
  }
  
  // --- Onboarding is NOT complete. Guide them to the correct step. ---

  // Step 1: Business Info check.
  const isBusinessInfoIncomplete = !businessData.businessType || !businessData.country;
  if (isBusinessInfoIncomplete) {
    if (pathname !== '/business-info') {
      redirect('/business-info');
    }
    return <>{children}</>; // Render the business-info page
  }
  
  // Step 2: Pricing Plan check.
  const isPlanMissing = !businessData.plan;
  if (isPlanMissing) {
    if (pathname !== '/owner/pricing' && pathname !== '/owner/subscribe') {
      redirect('/owner/pricing');
    }
    return <>{children}</>; // Render the pricing or subscribe page
  }
  
  // This is a fallback, but if we get here, something is inconsistent.
  // We'll treat them as onboarded and let them access the app.
  return <>{children}</>;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
