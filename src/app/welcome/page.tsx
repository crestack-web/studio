'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Activity, BarChart, Building, CheckCircle, HelpCircle, Landmark, Package, ShoppingCart, Store, TrendingUp, UtensilsCrossed, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useEffect, useRef } from 'react';
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { DashboardMockup } from '@/components/app/dashboard-mockup';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


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
             <Link href="/market" passHref>
              <Button variant="ghost">Market</Button>
            </Link>
            <Link href="/pricing" passHref>
              <Button variant="ghost">Pricing</Button>
            </Link>
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
            <div className="relative mx-auto w-full max-w-5xl h-[450px] md:h-[650px]">
                 <DashboardMockup />
            </div>
        </div>
        </section>
        
        {/* Marketplace Section */}
        <section className="bg-card/30 py-24 sm:py-32">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                 <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                    Sell Online with Busmo Market.
                    <br/>
                    <span className="text-muted-foreground">Your sales feed your insights.</span>
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Extend your reach. List your products on Busmo Market and turn every sale into an instant business insight. All sales sync automatically to your dashboard.
                </p>
                <ul className="mt-6 space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent"/>
                        <span>List products in seconds, right from your dashboard.</span>
                    </li>
                     <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent"/>
                        <span>Reach new customers searching for products like yours.</span>
                    </li>
                     <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-accent"/>
                        <span>Every sale automatically updates inventory, sales & profit.</span>
                    </li>
                </ul>
                 <Link href="/market" passHref>
                    <Button size="lg" className="mt-8 h-12 text-base">
                        Explore the Market
                    </Button>
                </Link>
              </div>
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <Image src="https://picsum.photos/seed/market-mockup/600/500" alt="Busmo Market Mockup" width={600} height={500} className="rounded-lg" data-ai-hint="marketplace mobile" />
                </CardContent>
              </Card>
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

        {/* Why Busmo Section */}
        <section className="py-24 sm:py-32">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">A Different Kind of Business Tool</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Busmo isn't accounting software. It's a decision-making tool built for the reality of your business.
                    </p>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Card className="bg-card/30">
                        <CardHeader>
                            <CardTitle className="text-center font-headline text-destructive">The Old Way: Accounting Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <XCircle className="w-6 h-6 text-destructive mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Complex & Overwhelming</h4>
                                    <p className="text-sm text-muted-foreground">Endless fields, confusing charts, and features you'll never use.</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <XCircle className="w-6 h-6 text-destructive mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Built for Accountants</h4>
                                    <p className="text-sm text-muted-foreground">They speak in jargon like "debits" and "credits," not "profit" and "loss."</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <XCircle className="w-6 h-6 text-destructive mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Focused on Reports</h4>
                                    <p className="text-sm text-muted-foreground">They give you long reports to dig through instead of immediate answers.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-accent shadow-accent/20 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center font-headline text-accent">The Busmo Way: Clarity Tool</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-6 h-6 text-accent mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Simple & Focused</h4>
                                    <p className="text-sm text-muted-foreground">Record a sale in seconds. See your profit instantly. That's it.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-6 h-6 text-accent mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Built for Owners</h4>
                                    <p className="text-sm text-muted-foreground">We speak your language. Ask "Did I make money?" and get a straight answer.</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <CheckCircle className="w-6 h-6 text-accent mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold">Focused on Answers</h4>
                                    <p className="text-sm text-muted-foreground">Your most important insights are always one tap—or one question—away.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 <div className="mt-20 text-center">
                    <h3 className="text-2xl font-bold tracking-tight font-headline">Who is Busmo for?</h3>
                     <p className="mt-2 text-muted-foreground max-w-xl mx-auto">If you sell products and want to know your numbers without the headache, Busmo is for you.</p>
                    <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        <div className="flex flex-col items-center gap-3">
                            <Store className="w-10 h-10 text-primary"/>
                            <p className="font-semibold">Retail Shops</p>
                        </div>
                         <div className="flex flex-col items-center gap-3">
                            <UtensilsCrossed className="w-10 h-10 text-primary"/>
                            <p className="font-semibold">Food & Drink Stalls</p>
                        </div>
                         <div className="flex flex-col items-center gap-3">
                            <ShoppingCart className="w-10 h-10 text-primary"/>
                            <p className="font-semibold">Grocers & Supermarkets</p>
                        </div>
                         <div className="flex flex-col items-center gap-3">
                            <Building className="w-10 h-10 text-primary"/>
                            <p className="font-semibold">Small Manufacturers</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-card/30 py-24 sm:py-32">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                </div>
                <Accordion type="single" collapsible className="w-full mt-12">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg font-semibold">Is Busmo another accounting app?</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
                        No. Busmo is designed for business clarity, not complex accounting. We focus on the key metrics you need to make decisions—daily profit, cash flow, and inventory—without the confusing jargon or features built for accountants.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger className="text-lg font-semibold">Can I use Busmo if I work offline?</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
                        Yes. Busmo is designed to be offline-first. You can record sales, track expenses, and manage inventory even without an internet connection. Your data will sync automatically and securely once you're back online.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger className="text-lg font-semibold">Is my business data safe?</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
                        Absolutely. We use industry-standard encryption and security protocols to protect your data. Your business information is yours alone, and we are committed to keeping it safe, secure, and private.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-4">
                        <AccordionTrigger className="text-lg font-semibold">What if I sell services, not products?</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
                        While Busmo is optimized for product-based businesses with inventory, you can absolutely use it to track all your income (sales) and expenses to understand your profitability. The inventory-specific features can simply be ignored.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
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

    