export const metadata = {
  title: 'Busmo',
  description: 'The all-in-one workspace for African small businesses.',
  icons: {
    icon: '/dashboard-logo.svg',
    shortcut: '/dashboard-logo.svg',
    apple: '/dashboard-logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/dashboard-logo.svg" />
        <link rel="shortcut icon" href="/dashboard-logo.svg" />
        <link rel="apple-touch-icon" href="/dashboard-logo.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
