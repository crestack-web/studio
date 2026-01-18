'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { BarChart, CheckCircle, HelpCircle, Package, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useEffect } from 'react';


// The new landing page component
export default function LandingPage() {
  const [dashboardImage, setDashboardImage] = useState<string>('');
  const [forecastImage, setForecastImage] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const dashboard = PlaceHolderImages.find(img => img.id === 'landing-dashboard-preview');
    const forecast = PlaceHolderImages.find(img => img.id === 'landing-forecast-chart');
    if (dashboard) setDashboardImage(dashboard.imageUrl);
    if (forecast) setForecastImage(forecast.imageUrl);
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo className="h-8" />
          <nav className="flex items-center gap-4">
            <Link href="/login" passHref>
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup" passHref>
              <Button>Get Started Free</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32">
           <div
            aria-hidden="true"
            className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-20"
          >
            <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 dark:from-blue-700"></div>
            <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600"></div>
          </div>
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-headline">
              You sell every day. <br />
              <span className="text-accent">Do you know if you're making money?</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
              Stop guessing with notebooks and calculators. Busmo is your simple AI business assistant on your phone.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup" passHref>
                <Button size="lg" className="h-14 text-lg px-8">
                  Start Tracking for Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* App Preview Image Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative mx-auto border-foreground/20 bg-background/20 dark:border-foreground/10 border-[8px] rounded-t-xl w-full max-w-4xl h-[400px] md:h-[600px] shadow-2xl">
                 {dashboardImage && <Image
                    src={dashboardImage}
                    alt="Busmo dashboard preview"
                    fill
                    className="rounded-t-lg object-cover object-top"
                    data-ai-hint="app dashboard"
                />}
            </div>
        </section>


        {/* Features Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                Everything you need. Nothing you don’t.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Busmo is built for the reality of your business. Simple, fast, and offline-first.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-start p-6 border rounded-lg bg-card/50">
                <ShoppingCart className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold font-headline">Record Sales Fast</h3>
                <p className="mt-2 text-muted-foreground">
                  Quickly record each sale, whether it's with cash, POS, or transfer. Works even when you're offline.
                </p>
              </div>
              <div className="flex flex-col items-start p-6 border rounded-lg bg-card/50">
                <Package className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold font-headline">Track Inventory</h3>
                <p className="mt-2 text-muted-foreground">
                  Know exactly what you have in stock. Get alerts when items are running low so you never miss a sale.
                </p>
              </div>
              <div className="flex flex-col items-start p-6 border rounded-lg bg-card/50">
                <BarChart className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold font-headline">Monitor Expenses</h3>
                <p className="mt-2 text-muted-foreground">
                  Keep track of where your money is going, from rent to supplies, to see your true profit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Section */}
        <section className="py-24 sm:py-32 bg-card/30">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                Just ask. Busmo knows.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Your business data is now a conversation. Get instant, clear answers to your most important questions. No more digging through records.
              </p>
              <Link href="/signup" passHref>
                <Button size="lg" className="mt-8 h-12 text-base">
                  Ask Your First Question
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-accent"/>
                    <span>How many sales did I make today?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-primary font-medium">You've made 18 sales today, for a total of ₦45,000.</p>
                </CardContent>
              </Card>
               <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-accent"/>
                    <span>Did I make a profit this week?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-success font-medium">Yes. Your net profit for the week is ₦28,500.</p>
                </CardContent>
              </Card>
                 <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-accent"/>
                    <span>What product is running low?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-warning font-medium">Bottled Water is running low. You have 5 units left.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Forecasting Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="relative w-full max-w-md mx-auto">
                 {forecastImage && <Image
                    src={forecastImage}
                    alt="Busmo forecasting chart"
                    width={600}
                    height={600}
                    className="rounded-xl shadow-2xl"
                    data-ai-hint="analytics chart"
                />}
              </div>
              <div className="md:order-first">
                 <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                    See what's coming.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Busmo analyzes your sales trends to forecast future cash flow. Plan ahead with confidence, knowing what to expect next week and next month.
                </p>
                <ul className="mt-6 space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent"/>
                        <span>Predict your busiest days.</span>
                    </li>
                     <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent"/>
                        <span>Anticipate cash shortages.</span>
                    </li>
                     <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent"/>
                        <span>Make smarter inventory decisions.</span>
                    </li>
                </ul>
              </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 sm:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
              Take control of your business today.
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-lg text-primary-foreground/80">
              Join thousands of smart business owners in Africa who are building their future with Busmo.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup" passHref>
                <Button size="lg" variant="secondary" className="h-14 text-lg px-8">
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-8 px-4">
          <Logo className="h-7" />
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Busmo. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-sm hover:underline">Privacy</Link>
             <Link href="#" className="text-sm hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
