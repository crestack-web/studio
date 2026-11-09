import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  applicationName: 'Busmo Education',
  title: {
    default: 'Busmo Education',
    template: `%s · Busmo Education`,
  },
  description: 'Students, classes, fees and school operations — install as a desktop app.',
  manifest: '/manifests/education.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Education',
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
  themeColor: '#c2410c',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
