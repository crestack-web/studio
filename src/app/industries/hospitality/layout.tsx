import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  applicationName: 'Busmo Hospitality',
  title: {
    default: 'Busmo Hospitality',
    template: `%s · Busmo Hospitality`,
  },
  description: 'Reservations, rooms, guests and hotel operations — install as a desktop app.',
  manifest: '/manifests/hospitality.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Hospitality',
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
  themeColor: '#b45309',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
