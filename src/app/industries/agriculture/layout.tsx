import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  applicationName: 'Busmo Agriculture',
  title: {
    default: 'Busmo Agriculture',
    template: `%s · Busmo Agriculture`,
  },
  description:
    'Manage farms, plots, crops, field work, harvests, processing, packaging, stock, sales, exports and agribusiness finance from one connected workspace — install as a desktop app.',
  manifest: '/manifests/agriculture.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Agriculture',
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
  themeColor: '#0b7f4a',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
