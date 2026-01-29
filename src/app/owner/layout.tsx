'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => (
    <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const ProtectedOwnerLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  
  useEffect(() => {
    // Wait until auth state is resolved
    if (isUserLoading) {
      return;
    }

    // 1. If user is not authenticated, redirect to login page.
    if (!user) {
        if (!pathname.startsWith('/login')) {
            router.replace('/login');
        }
        return;
    }
    
    // 2. If user is authenticated, route them to home.
    // Onboarding checks are temporarily disabled.
    if (pathname !== '/owner/home') {
        // Exception for pages that are part of the flow but temporarily lead home.
        const onboardingPages = ['/business-info', '/owner/pricing'];
        if (!onboardingPages.includes(pathname)) {
            // Uncomment the line below to enforce home redirect.
            // For now, we allow access to other pages to avoid breaking things.
            // router.replace('/owner/home');
        }
    }

  }, [isUserLoading, user, pathname, router]);

  if (isUserLoading) {
    return <LoadingScreen />;
  }

  // If user is authenticated, render the children.
  // The useEffect handles redirects away.
  if (user) {
    return <>{children}</>;
  }
  
  // Fallback while redirecting unauthenticated user.
  return <LoadingScreen />;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
