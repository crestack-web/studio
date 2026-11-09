import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  applicationName: 'Busmo Professional',
  title: {
    default: 'Busmo Professional',
    template: `%s · Busmo Professional`,
  },
  description: 'Projects, clients and professional services — install as a desktop app.',
  manifest: '/manifests/professional.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Professional',
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
  themeColor: '#4338ca',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
