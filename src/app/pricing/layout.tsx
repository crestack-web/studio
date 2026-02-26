import type { Metadata } from 'next';

// ═══════════════════════════════════════════
//  Root layout — /app/layout.tsx
//
//  Keep this as a Server Component.
//  The 'use client' boundary lives inside
//  DashboardClient.tsx, not here.
// ═══════════════════════════════════════════

export const metadata: Metadata = {
  title: 'Busmo – Owner Dashboard',
  description: 'Run your business smarter with Busmo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      {/*
        data-theme="light" is the default — AppContext
        switches it to "dark" via JS when the user toggles.
        Setting it here avoids a flash of unstyled content.
      */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}