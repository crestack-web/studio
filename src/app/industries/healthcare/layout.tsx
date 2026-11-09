import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  applicationName: 'Busmo Healthcare',
  title: {
    default: 'Busmo Healthcare',
    template: `%s · Busmo Healthcare`,
  },
  description: 'Patients, appointments, visits and clinic operations — install as a desktop app.',
  manifest: '/manifests/healthcare.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Healthcare',
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
  themeColor: '#0d9488',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
