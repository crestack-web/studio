// src/app/layout.tsx — must be a Server Component so Next.js can emit
// a real <meta name="viewport"> for Safari. Client-only root layouts often
// leave Safari on the default ~980px layout width (desktop nav on phones).
import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { RootClientShell } from '@/components/app/RootClientShell';

export const metadata: Metadata = {
  title: 'Busmo — Business Control for Growing African Businesses',
  description:
    'Busmo helps growing businesses control sales, inventory, cash, staff and profit from one simple system.',
  icons: {
    icon: '/favicon.png',
    apple: '/icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Busmo',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#5717ee',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <RootClientShell>{children}</RootClientShell>
      </body>
    </html>
  );
}
