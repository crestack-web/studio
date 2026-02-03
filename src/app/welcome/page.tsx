
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Activity, BarChart, Building, CheckCircle, HelpCircle, Landmark, Menu, MessageSquare, Package, Send, ShoppingCart, Store, TrendingUp, UtensilsCrossed, XCircle, ArrowLeft, CreditCard, Loader2, FileUp, ImageIcon, Instagram, Facebook, Megaphone, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState, useEffect, useRef, FormEvent, useMemo, ChangeEvent } from 'react';
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { DashboardMockup } from '@/components/app/dashboard-mockup';
import { MarketMockup } from '@/components/app/market-mockup';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { InvestorMockup } from '@/components/app/investor-mockup';
import { useLanguage } from '@/context/language-provider';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


const testimonialsDataRaw = [
  {
    id: 'testimonial-food-vendor',
    quoteKey: "welcome.testimonial_1_quote",
    nameKey: "welcome.testimonial_1_name",
    businessKey: "welcome.testimonial_1_biz",
  },
  {
    id: 'testimonial-retail-shop',
    quoteKey: "welcome.testimonial_2_quote",
    nameKey: "welcome.testimonial_2_name",
    businessKey: "welcome.testimonial_2_biz",
  },
  {
    id: 'testimonial-supermarket-owner',
    quoteKey: "welcome.testimonial_3_quote",
    nameKey: "welcome.testimonial_3_name",
    businessKey: "welcome.testimonial_3_biz",
  },
];

const testimonialsWithImages = testimonialsDataRaw.map(t => {
    const img = PlaceHolderImages.find(img => img.id === t.id);
    return {...t, imageUrl: img?.imageUrl, imageHint: img?.imageHint };
});

interface Announcement {
    id: string;
    text: string;
    href: string;
}

// The new landing page component
export default function LandingPage() {
  const [testimonials, setTestimonials] = useState<any[]>(testimonialsWithImages);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const { t } = useLanguage();
  const firestore = useFirestore();

  const { data: announcements } = useCollection<Announcement>(
    useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'announcements'), where('isActive', '==', true), where('page', '==', 'welcome'));
    }, [firestore])
  );


  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  const faqItems = [
    { value: 'item-1', question: t('welcome.faq_1_q'), answer: t('welcome.faq_1_a') },
    { value: 'item-2', question: t('welcome.faq_2_q'), answer: t('welcome.faq_2_a') },
    { value: 'item-3', question: t('welcome.faq_3_q'), answer: t('welcome.faq_3_a') },
    { value: 'item-4', question: t('welcome.faq_4_q'), answer: t('welcome.faq_4_a') },
  ];

  const whoIsItFor = [
    { name: t('welcome.who_1'), icon: Store },
    { name: t('welcome.who_2'), icon: UtensilsCrossed },
    { name: t('welcome.who_3'), icon: ShoppingCart },
    { name: t('welcome.who_4'), icon: Building },
  ];
  
  const whyBusmo = {
    old: [
      { title: t('welcome.why_old_1_title'), description: t('welcome.why_old_1_desc') },
      { title: t('welcome.why_old_2_title'), description: t('welcome.why_old_2_desc') },
      { title: t('welcome.why_old_3_title'), description: t('welcome.why_old_3_desc') },
    ],
    busmo: [
      { title: t('welcome.why_busmo_1_title'), description: t('welcome.why_busmo_1_desc') },
      { title: t('welcome.why_busmo_2_title'), description: t('welcome.why_busmo_2_desc') },
      { title: t('welcome.why_busmo_3_title'), description: t('welcome.why_busmo_3_desc') },
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      
      {announcements && announcements.length > 0 && (
        <div className="bg-primary text-primary-foreground">
            <Carousel
                plugins={[ Autoplay({ delay: 8000, stopOnInteraction: true }) ]}
                opts={{ align: "start", loop: true }}
                className="w-full"
            >
                <CarouselContent>
                    {announcements.map((announcement) => (
                        <CarouselItem key={announcement.id}>
                            <Link href={announcement.href || '#'} className="block">
                                <div className="flex items-center justify-center gap-2 text-center py-2 px-4 text-sm font-medium">
                                    <Megaphone className="h-4 w-4" />
                                    <span>{announcement.text}</span>
                                </div>
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo className="h-8" />
          <nav className="hidden md:flex items-center gap-2">
             <Link href="/welcome" passHref>
              <Button variant="ghost">{t('nav.home')}</Button>
            </Link>
             <Link href="/market" passHref>
              <Button variant="ghost">{t('nav.market')}</Button>
            </Link>
            <Link href="/market/delivery" passHref>
              <Button variant="ghost">{t('nav.busmogo')}</Button>
            </Link>
             <Link href="/invest" passHref>
              <Button variant="ghost">{t('nav.investors')}</Button>
            </Link>
            <Link href="/pricing" passHref>
              <Button variant="ghost">{t('nav.pricing')}</Button>
            </Link>
            <ThemeToggle />
            <LanguageSwitcher />
            <Separator orientation="vertical" className="h-8" />
            <Link href="/login" passHref>
              <Button variant="ghost">{t('nav.login')}</Button>
            </Link>
            <Link href="/signup" passHref>
              <Button>{t('nav.signup')}</Button>
            </Link>
          </nav>
           <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
             <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-xs">
                    <SheetHeader>
                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                      <SheetDescription className="sr-only">Main navigation links for the site.</SheetDescription>
                    </SheetHeader>
                    <Logo className="h-8 mb-8" />
                    <nav className="flex flex-col items-start gap-4">
                        <Link href="/welcome" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.home')}</Button></Link>
                        <Link href="/market" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.market')}</Button></Link>
                        <Link href="/market/delivery" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.busmogo')}</Button></Link>
                        <Link href="/invest" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.investors')}</Button></Link>
                        <Link href="/pricing" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.pricing')}</Button></Link>
                        <Link href="/login" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.login')}</Button></Link>
                        <Link href="/signup" passHref className="w-full"><Button className="w-full mt-4 text-lg h-12">{t('nav.signup')}</Button></Link>
                    </nav>
                </SheetContent>
              </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32 bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto px-4 text-center">
                 <h1 className="text-4xl font-bold tracking-tight sm:text-6xl font-headline" dangerouslySetInnerHTML={{ __html: t('welcome.title') }}></h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t('welcome.subtitle')}
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Link href="/signup" passHref>
                        <Button size="lg" className="h-14 text-lg">{t('welcome.cta')}</Button>
                    </Link>
                </div>
            </div>
        </section>

        {/* Mockup Section */}
        <section className="container mx-auto px-4 -mt-16 sm:-mt-24">
            <div className="relative w-full aspect-[4/3] sm:aspect-video lg:aspect-[2/1] max-w-6xl mx-auto">
                <DashboardMockup />
            </div>
        </section>

         {/* Features Section */}
        <section className="py-20 sm:py-32">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('welcome.features_title')}</h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        {t('welcome.features_subtitle')}
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
                         <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Package className="h-6 w-6 text-primary" />
                            </div>
                            <div className="mt-4 flex-auto">
                                <h3 className="text-xl font-semibold">{t('welcome.feature_1_title')}</h3>
                                <p className="mt-2 text-muted-foreground">{t('welcome.feature_1_desc')}</p>
                            </div>
                        </div>
                         <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <BarChart className="h-6 w-6 text-primary" />
                            </div>
                            <div className="mt-4 flex-auto">
                                <h3 className="text-xl font-semibold">{t('welcome.feature_2_title')}</h3>
                                <p className="mt-2 text-muted-foreground">{t('welcome.feature_2_desc')}</p>
                            </div>
                        </div>
                         <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                            <div className="mt-4 flex-auto">
                                <h3 className="text-xl font-semibold">{t('welcome.feature_3_title')}</h3>
                                <p className="mt-2 text-muted-foreground">{t('welcome.feature_3_desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

         {/* Market Section */}
        <section className="py-20 sm:py-32 bg-card border-y">
            <div className="container mx-auto px-4">
                 <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline" dangerouslySetInnerHTML={{ __html: t('welcome.market_title')}}></h2>
                        <p className="mt-6 text-lg text-muted-foreground">{t('welcome.market_subtitle')}</p>
                        <ul className="mt-8 space-y-4">
                            {(t('welcome.market_features', { returnObjects: true }) as unknown as string[]).map(feature => (
                                <li key={feature} className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-primary mt-1 shrink-0"/>
                                    <span className="text-muted-foreground">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-10">
                             <Link href="/market" passHref>
                                <Button size="lg" variant="secondary">{t('welcome.market_cta')}</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="relative w-full aspect-[4/3] sm:aspect-video lg:aspect-[1/1] max-w-2xl mx-auto">
                        <MarketMockup />
                    </div>
                </div>
            </div>
        </section>

        {/* BusmoPay Section */}
        <section className="py-20 sm:py-32 bg-muted/20 border-y">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                        <Logo variant="busmopay" className="text-5xl inline-block lg:inline" />
                        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl font-headline">Sell products & share profits with BusmoPay</h2>
                        <p className="mt-6 max-w-2xl mx-auto lg:mx-0 text-lg text-muted-foreground">
                            The integrated payment solution for the Busmo marketplace. Accept payments and automatically distribute profits to your investors.
                        </p>
                        <div className="mt-10">
                            <Link href="/busmopay">
                                <Button size="lg" variant="secondary">Learn more about BusmoPay</Button>
                            </Link>
                        </div>
                    </div>
                    <div className="relative h-full min-h-[250px] flex items-center justify-center">
                        <Card className="p-4 w-60 shadow-xl rotate-[-8deg] absolute left-0 sm:left-10 lg:left-0">
                            <p className="text-xs text-muted-foreground">Aisha's Crafts</p>
                            <p className="font-bold text-xl">₦12,000</p>
                            <div className="flex items-center gap-2 mt-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                <p className="font-semibold text-sm">**** **** **** 4242</p>
                            </div>
                        </Card>
                         <Card className="p-4 w-60 shadow-xl rotate-[6deg] z-10 relative">
                            <p className="text-xs text-muted-foreground">Tunde's Electronics</p>
                            <p className="font-bold text-xl">₦25,000</p>
                            <div className="flex items-center gap-2 mt-2">
                                 <Landmark className="w-5 h-5 text-primary" />
                                <p className="font-semibold text-sm">Bank Transfer</p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </section>

         {/* Testimonials */}
        <section className="py-20 sm:py-32">
            <div className="container mx-auto px-4 text-center">
                 <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('welcome.testimonials_title')}</h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t('welcome.testimonials_subtitle')}
                </p>
            </div>
            <div className="mt-16 w-full">
                <Carousel 
                    plugins={[ Autoplay({ delay: 5000, stopOnInteraction: true }) ]}
                    opts={{ align: "start", loop: true }}
                >
                    <CarouselContent>
                        {testimonials.map(testimonial => (
                            <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                                 <div className="p-4 h-full">
                                    <Card className="h-full flex flex-col p-6">
                                        <CardContent className="p-0 flex-1">
                                            <p className="text-muted-foreground">"{t(testimonial.quoteKey)}"</p>
                                        </CardContent>
                                        <div className="mt-6 flex items-center gap-4">
                                             <div className="w-14 h-14 relative rounded-full overflow-hidden bg-muted">
                                                {testimonial.imageUrl && (
                                                    <Image
                                                        src={testimonial.imageUrl}
                                                        alt={t(testimonial.nameKey)}
                                                        fill
                                                        className="object-cover"
                                                        data-ai-hint={testimonial.imageHint}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{t(testimonial.nameKey)}</p>
                                                <p className="text-sm text-muted-foreground">{t(testimonial.businessKey)}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>

         {/* AI Section */}
        <section className="py-20 sm:py-32 bg-card border-y">
            <div className="container mx-auto px-4">
                 <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="relative w-full aspect-[4/3] sm:aspect-video lg:aspect-[1/1] max-w-2xl mx-auto">
                            <InvestorMockup />
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline" dangerouslySetInnerHTML={{ __html: t('welcome.investor_title')}}></h2>
                        <p className="mt-6 text-lg text-muted-foreground">{t('welcome.investor_subtitle')}</p>
                        <ul className="mt-8 space-y-4">
                            {(t('welcome.investor_features', { returnObjects: true }) as unknown as string[]).map(feature => (
                                <li key={feature} className="flex items-start gap-3">
                                    <CheckCircle className="w-6 h-6 text-primary mt-1 shrink-0"/>
                                    <span className="text-muted-foreground">{feature}</span>
                                </li>
                            ))}
                        </ul>
                         <div className="mt-10">
                             <Link href="/invest" passHref>
                                <Button size="lg" variant="secondary">{t('welcome.investor_cta')}</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Why Busmo Section */}
        <section className="py-20 sm:py-32">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('welcome.why_title')}</h2>
                    <p className="mt-4 text-lg text-muted-foreground">{t('welcome.why_subtitle')}</p>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <Card className="bg-muted/30 border-destructive/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive"><XCircle className="w-6 h-6"/> {t('welcome.why_old_way')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {whyBusmo.old.map(item => (
                                <div key={item.title}>
                                    <h4 className="font-semibold">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card className="bg-card border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-primary"><CheckCircle className="w-6 h-6"/> {t('welcome.why_busmo_way')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {whyBusmo.busmo.map(item => (
                                <div key={item.title}>
                                    <h4 className="font-semibold">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* Who is it for Section */}
        <section className="py-20 sm:py-32 bg-card border-y">
             <div className="container mx-auto px-4">
                <div className="mx-auto max-w-2xl lg:text-center">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('welcome.who_title')}</h2>
                    <p className="mt-4 text-lg text-muted-foreground">{t('welcome.who_subtitle')}</p>
                </div>
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    {whoIsItFor.map(item => (
                        <div key={item.name} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                            <item.icon className="w-6 h-6 text-primary" />
                            <span className="font-medium">{item.name}</span>
                        </div>
                    ))}
                </div>
             </div>
        </section>

        {/* FAQ */}
         <section className="py-20 sm:py-32">
            <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl font-headline">{t('welcome.faq_title')}</h2>
                <Accordion type="single" collapsible className="w-full mt-12">
                     {faqItems.map(item => (
                        <AccordionItem key={item.value} value={item.value}>
                            <AccordionTrigger className="text-lg font-semibold text-left">{item.question}</AccordionTrigger>
                            <AccordionContent className="text-base text-muted-foreground">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>

         {/* Final CTA */}
        <section className="py-20 sm:py-32 bg-primary/5 border-t">
            <div className="container mx-auto px-4 text-center">
                 <h2 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">{t('welcome.final_cta_title')}</h2>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('welcome.final_cta_subtitle')}</p>
                 <div className="mt-10">
                     <Link href="/signup" passHref>
                        <Button size="lg" className="h-14 text-lg">{t('welcome.cta')}</Button>
                    </Link>
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-4 py-8 px-4 text-center md:text-left">
          <Logo className="h-7 mx-auto md:mx-0" />
          <div className="flex items-center gap-4 justify-center text-sm text-muted-foreground">
             <Link href="/terms" className="hover:underline">{t('footer.privacy')}</Link>
             <Link href="/terms" className="hover:underline">{t('footer.terms')}</Link>
          </div>
          <div className="flex items-center gap-4 mx-auto md:ml-auto md:mr-0">
             <a href="https://x.com/busmo_io" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)">
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground hover:text-foreground fill-current"><title>X</title><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
             </a>
             <a href="https://instagram.com/busmo.io" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground" />
             </a>
             <a href="https://facebook.com/busmo.io" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" />
             </a>
          </div>
        </div>
         <p className="text-center text-xs text-muted-foreground pb-4">&copy; {currentYear} busmo.</p>
      </footer>
    </div>
  );
}
