import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/app/theme-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LanguageProvider } from '@/context/language-provider';
import { CartProvider } from '@/context/cart-provider';
import { MarketProvider } from '@/context/market-provider';
import { ConditionalChatWidget } from '@/components/app/conditional-chat-widget';
import { PwaRegister } from '@/components/app/pwa-register';

export const metadata: Metadata = {
  title: 'Busmo',
  description: "The all-in-one workspace for African small businesses.",
  manifest: '/manifest.json',
  icons: {
     icon: [
       { url: '/favicon.ico' },
       { url: '/favicon.svg', type: 'image/svg+xml' },
     ],
  },
};

export const viewport: Viewport = {
  themeColor: '#5717ee',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className="font-body antialiased">
        <LanguageProvider>
          <FirebaseClientProvider>
            <MarketProvider>
              <CartProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  {children}
                  <PwaRegister />
                  <Toaster />
                  <ConditionalChatWidget />
                </ThemeProvider>
              </CartProvider>
            </MarketProvider>
          </FirebaseClientProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
