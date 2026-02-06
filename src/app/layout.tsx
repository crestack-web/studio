import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/app/theme-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LanguageProvider } from '@/context/language-provider';
import { CartProvider } from '@/context/cart-provider';
import { MarketProvider } from '@/context/market-provider';
import { ChatWidget } from '@/components/app/chat-widget';
import { PwaRegister } from '@/components/app/pwa-register';

export const metadata: Metadata = {
  title: 'Busmo',
  description: 'Your AI partner for managing your business money.',
  manifest: '/manifest.json',
  themeColor: '#5717ee',
  icons: {
    icon: '/icon.png',
  },
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
                  <ChatWidget />
                </ThemeProvider>
              </CartProvider>
            </MarketProvider>
          </FirebaseClientProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
