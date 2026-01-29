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
    // If auth state is still loading, do nothing.
    if (isUserLoading) {
      return;
    }

    // If loading is finished and there is no user, redirect to login.
    if (!user) {
      if (!pathname.startsWith('/login')) {
        router.replace('/login');
      }
      return;
    }

    // If user is authenticated, they can access the content.
    // All other Firestore-based checks are temporarily removed for flow validation.

  }, [isUserLoading, user, pathname, router]);

  // While checking auth state, show a loading screen.
  if (isUserLoading) {
    return <LoadingScreen />;
  }

  // If authenticated, show the content. The redirect logic is handled in useEffect.
  if (user) {
    return <>{children}</>;
  }
  
  // If not authenticated (and not loading), show loading screen while redirecting.
  return <LoadingScreen />;
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedOwnerLayout>{children}</ProtectedOwnerLayout>;
}
