'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Activity, BarChart, CheckCircle, HelpCircle, Landmark, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useEffect, useRef } from 'react';
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { DashboardMockup } from '@/components/app/dashboard-mockup';

const testimonialsData = [
  {
    id: 'testimonial-food-vendor',
    quote: "For the first time, I can see my daily profit in seconds. No more counting cash and guessing. Busmo is my new business partner.",
    name: "Femi",
    business: "Femi's Suya Spot",
  },
  {
    id: 'testimonial-retail-shop',
    quote: "I used to run out of my best-selling fabrics. Now, Busmo tells me when to restock. My customers are happier, and my sales are up.",
    name: "Aisha",
    business: "Aisha's Textiles",
  },
  {
    id: 'testimonial-supermarket-owner',
    quote: "Managing expenses was a headache. With Busmo, I can see exactly where my money is going. It’s simple, powerful, and built for people like me.",
    name: "John",
    business: "Everyday Needs Grocers",
  },
];


// The new landing page component
export default function LandingPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const loadedTestimonials = testimonialsData.map(t => {
        const img = PlaceHolderImages.find(img => img.id === t.id);
        return {...t, imageUrl: img?.imageUrl, imageHint: img?.imageHint };
    });
    setTestimonials(loadedTestimonials);
    
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
              <Button>Join the Waitlist</Button>
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
              Stop guessing with notebooks and calculators. Busmo turns your daily activity into understanding—and understanding into growth.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup" passHref>
                <Button size="lg" className="h-14 text-lg px-8">
                  Join the Waitlist
                </Button>
              </Link>
            </div>
          </div>
           <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16">
            <div className="relative mx-auto w-full max-w-4xl h-[450px] md:h-[550px]">
                 <DashboardMockup />
            </div>
        </div>
        </section>

        {/* Features Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                What You Can Do With Busmo
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Busmo is built for the reality of your business. Simple, fast, and offline-first.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-start p-6 border rounded-lg bg-card/50">
                <Package className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold font-headline">Manage Products & Inventory</h3>
                <p className="mt-2 text-muted-foreground">
                  Add products with quantity & cost, track stock movement automatically, and know when to restock before it’s too late.
                </p>
              </div>
              <div className="flex flex-col items-start p-6 border rounded-lg bg-card/50">
                <ShoppingCart className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold font-headline">Record Sales (The Right Way)</h3>
                <p className="mt-2 text-muted-foreground">
                  See what product was sold, track quantity and profit, and understand which products actually make you money.
                </p>
              </div>
              <div className="flex flex-col items-start p-6 border rounded-lg bg-card/50">
                <BarChart className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold font-headline">Track Expenses</h3>
                <p className="mt-2 text-muted-foreground">
                  Record inventory costs and log daily business expenses to see how they affect your profit in real time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-card/30 py-24 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                Built for the Heart of African Commerce
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From street-side stalls to growing supermarkets, Busmo provides clarity and control.
              </p>
            </div>
            <div className="mt-16">
              <Carousel
                plugins={[
                  Autoplay({
                    delay: 4000,
                    stopOnInteraction: true,
                  }),
                ]}
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {testimonials.map((testimonial) => (
                    <CarouselItem key={testimonial.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <div className="h-full p-px">
                        <Card className="flex flex-col h-full shadow-lg">
                          <CardContent className="flex-1 flex flex-col p-6">
                            <p className="flex-1 text-muted-foreground italic">"{testimonial.quote}"</p>
                            <div className="mt-6 flex items-center gap-4">
                              {testimonial.imageUrl && <Image
                                src={testimonial.imageUrl}
                                alt={`Photo of ${testimonial.name}`}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                                data-ai-hint={testimonial.imageHint}
                              />}
                              <div>
                                <p className="font-semibold">{testimonial.name}</p>
                                <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </section>

        {/* AI Section */}
        <section className="py-24 sm:py-32">
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
        <section className="bg-card/30 py-24 sm:py-32">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                    Forecast Your Business.
                    <br/>
                    <span className="text-muted-foreground">Stop reacting. Start planning.</span>
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Busmo analyzes your sales trends so you can plan ahead with confidence. Your key forecasts appear right in your dashboard — no scrolling, no hunting, just insight.
                </p>
                <ul className="mt-6 space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent"/>
                        <span>Sales trends</span>
                    </li>
                     <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent"/>
                        <span>Profit predictions</span>
                    </li>
                     <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent"/>
                        <span>Inventory outlook</span>
                    </li>
                </ul>
              </div>
              <div className="space-y-4">
                <Card className="shadow-lg">
                    <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-accent"/>
                        <span>Weekly Profit Forecast</span>
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p className="text-success font-medium">Based on current trends, you're on track to make ₦42,000 in profit next week.</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-accent"/>
                        <span>Busiest Day Prediction</span>
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p className="text-primary font-medium">Expect your busiest day to be Saturday. Plan for extra stock to meet demand.</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-accent"/>
                        <span>Inventory Outlook</span>
                    </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <p className="text-warning font-medium">You are likely to run out of Bottled Water in 3 days. Consider reordering now.</p>
                    </CardContent>
                </Card>
              </div>
          </div>
        </section>

        {/* Funding Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                Turn Your Data Into Capital.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Good data is your most valuable asset. Busmo helps you build a trusted financial story that opens doors to funding opportunities, without the endless paperwork.
              </p>
              <ul className="mt-6 space-y-3 text-muted-foreground">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent"/>
                  <span>Build a verifiable business history.</span>
                </li>
                  <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent"/>
                  <span>Unlock loan offers from lenders.</span>
                </li>
                  <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent"/>
                  <span>Access capital based on performance, not paperwork.</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-accent"/>
                    <span>Sample Loan Offer</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-primary font-medium">Based on 3 months of consistent data, a business like yours could be eligible for up to <span className="font-bold text-xl">₦250,000</span>.</p>
                </CardContent>
              </Card>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent"/>
                    <span>Your Financial Health Score</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-success font-medium">Your score is <span className="font-bold">Strong</span>. Keep recording transactions to improve your eligibility for larger loans.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 sm:py-32 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
              The Future of Your Business Starts With Clarity.
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-lg text-primary-foreground/80">
              You don’t need more sales. You need better visibility. Join smart business owners in Africa who are building their future with Busmo.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/signup" passHref>
                <Button size="lg" variant="secondary" className="h-14 text-lg px-8">
                  Join the Waitlist
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-4 py-8 px-4 text-center md:text-left">
          <Logo className="h-7 mx-auto md:mx-0" />
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Busmo. Business. Money. Clear.
          </p>
          <div className="flex items-center gap-4 mx-auto md:ml-auto md:mr-0">
            <Link href="#" className="text-sm hover:underline">Privacy</Link>
             <Link href="#" className="text-sm hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
