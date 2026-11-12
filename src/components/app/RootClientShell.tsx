'use client';

import { ReactNode, Suspense } from 'react';
import { PwaRegister } from '@/components/app/pwa-register';
import { TikTokPixelProvider } from '@/components/analytics/TikTokPixelProvider';

export function RootClientShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <TikTokPixelProvider />
      </Suspense>
      <PwaRegister />
      {children}
    </>
  );
}
