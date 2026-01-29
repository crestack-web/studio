
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Menu, X, Globe } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/context/language-provider';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { convertFromNgn, formatCurrency } from '@/lib/currency';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const plans = [
    {
        name: 'Shop',
        id: 'shop',
        description: 'For small retailers',
        monthlyPrice: 1500,
        yearlyPrice: 15000,
        features: [
            'Record Sales, Expenses & Inventory',
            'Basic AI Insights',
            'Sell on Busmo Market',
        ],
        notIncluded: [
            'Manage Staff',
            'Advanced Forecasting',
            'Multiple Branches',
            'Production Tracking',
            'Access to Equity Investment',
        ]
    },
    {
        name: 'Supermarket',
        id: 'supermarket',
        description: 'For larger stores & growing businesses',
        monthlyPrice: 10000,
        yearlyPrice: 100000,
        isPopular: true,
        features: [
            'Everything in Shop',
            'Up to 5 Staff Members',
            'Advanced Forecasting',
        ],
        notIncluded: [
            'Multiple Branches',
            'Production Tracking',
            'Access to Equity Investment',
        ]
    },
    {
        name: 'Multiple Branches',
        id: 'multibranch',
        description: 'For chains & franchises',
        monthlyPrice: 30000,
        yearlyPrice: 300000,
        features: [
            'Everything in Supermarket',
            'Unlimited Staff Members',
            'Manage Multiple Branches',
        ],
        notIncluded: [
            'Production Tracking',
            'Access to Equity Investment',
        ]
    },
    {
        name: 'Company',
        id: 'company',
        description: 'For manufacturers & corporations',
        monthlyPrice: 50000,
        yearlyPrice: 500000,
        features: [
            'Everything in Multiple Branches',
            'Production Tracking (Cost of Goods)',
            'Access to Equity Investment',
        ],
        notIncluded: []
    }
];

const availableCountries = [
    { code: 'NG', name: 'Nigeria (NGN)' },
    { code: 'GH', name: 'Ghana (GHS)' },
    { code: 'NE', name: 'Niger (XOF)' },
    { code: 'CM', name: 'Cameroon (XAF)' },
];


export default function PricingPage() {
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
    const { language, t } = useLanguage();

    const [selectedCountry, setSelectedCountry] = useState('NG');

    useEffect(() => {
        if (language === 'fr') {
            setSelectedCountry('NE');
        } else {
            setSelectedCountry('NG');
        }
    }, [language]);
    
    const currencyCode = selectedCountry;


    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo className="h-8" />
          <nav className="hidden md:flex items-center gap-2">
             <Link href="/welcome" passHref>
              <Button variant="ghost">{t('nav.home')}</Button>
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
        
        <main className="flex-1 flex flex-col items-center p-4 py-12 sm:py-24">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">{t('pricing.title')}</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t('pricing.subtitle')}
                </p>
            </div>
            
            <div className="flex justify-center items-center gap-4 mt-8">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-48">
                             <Globe className="mr-2 h-4 w-4" />
                            <span>{availableCountries.find(c => c.code === selectedCountry)?.name}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {availableCountries.map(country => (
                            <DropdownMenuItem key={country.code} onSelect={() => setSelectedCountry(country.code)}>
                                {country.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs defaultValue="monthly" className="w-full max-w-7xl mx-auto mt-4">
                <div className="flex justify-center">
                    <TabsList className="grid grid-cols-2 p-1 h-auto">
                        <TabsTrigger value="monthly" className="px-8 py-2">{t('pricing.monthly')}</TabsTrigger>
                        <TabsTrigger value="yearly" className="px-8 py-2 relative">
                            {t('pricing.yearly')}
                            <span className="absolute -top-3 -right-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">{t('pricing.save_prefix')} 17% {t('pricing.save_suffix')}</span>
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="monthly" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {plans.map((plan) => {
                            const price = convertFromNgn(plan.monthlyPrice, currencyCode);
                            return (
                             <Card key={plan.name} className={cn("flex flex-col", plan.isPopular && "border-primary ring-2 ring-primary")}>
                                {plan.isPopular && (
                                    <div className="bg-primary text-primary-foreground text-center text-sm font-semibold py-1.5 rounded-t-lg">
                                        {t('pricing.most_popular')}
                                    </div>
                                )}
                                <CardHeader className="pt-8">
                                    <CardTitle className="font-headline">{t(`pricing.${plan.id}_name`)}</CardTitle>
                                    <CardDescription>{t(`pricing.${plan.id}_desc`)}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold">{formatCurrency(price, currencyCode)}</span>
                                        <span className="text-muted-foreground">/ {t('pricing.monthly').toLowerCase()}</span>
                                    </div>
                                     <ul className="mt-6 space-y-3 text-sm">
                                        {(t(`pricing.${plan.id}_features`, { returnObjects: true }) as unknown as string[]).map(feature => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-accent mt-0.5 shrink-0"/>
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                        {(t(`pricing.${plan.id}_not_included`, { returnObjects: true }) as unknown as string[]).map(feature => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <X className="w-5 h-5 text-muted-foreground/50 mt-0.5 shrink-0"/>
                                                <span className="text-muted-foreground/50">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link href="/signup" className="w-full">
                                        <Button className={cn("w-full h-12 text-lg", !plan.isPopular && "variant-secondary")}>{t('pricing.start_trial')}</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        )})}
                    </div>
                </TabsContent>
                <TabsContent value="yearly" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {plans.map((plan) => {
                            const price = convertFromNgn(plan.yearlyPrice, currencyCode);
                            return (
                             <Card key={plan.name} className={cn("flex flex-col", plan.isPopular && "border-primary ring-2 ring-primary")}>
                                 {plan.isPopular && (
                                    <div className="bg-primary text-primary-foreground text-center text-sm font-semibold py-1.5 rounded-t-lg">
                                        {t('pricing.most_popular')}
                                    </div>
                                )}
                                <CardHeader className="pt-8">
                                    <CardTitle className="font-headline">{t(`pricing.${plan.id}_name`)}</CardTitle>
                                    <CardDescription>{t(`pricing.${plan.id}_desc`)}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold">{formatCurrency(price, currencyCode)}</span>
                                        <span className="text-muted-foreground">/ {t('pricing.yearly').toLowerCase()}</span>
                                    </div>
                                    <p className="text-sm text-accent font-medium mt-1">
                                        {t('pricing.save_prefix')} ~17%!
                                    </p>
                                     <ul className="mt-6 space-y-3 text-sm">
                                        {(t(`pricing.${plan.id}_features`, { returnObjects: true }) as unknown as string[]).map(feature => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-accent mt-0.5 shrink-0"/>
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                        {(t(`pricing.${plan.id}_not_included`, { returnObjects: true }) as unknown as string[]).map(feature => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <X className="w-5 h-5 text-muted-foreground/50 mt-0.5 shrink-0"/>
                                                <span className="text-muted-foreground/50">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link href="/signup" className="w-full">
                                         <Button className={cn("w-full h-12 text-lg", !plan.isPopular && "variant-secondary")}>{t('pricing.start_trial')}</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        )})}
                    </div>
                </TabsContent>
            </Tabs>
             <div className="text-center pt-8">
                 <h3 className="text-lg font-semibold">{t('pricing.custom_needs')}</h3>
                 <p className="text-muted-foreground">{t('pricing.custom_desc')}</p>
                 <Button variant="link" className="mt-2">{t('pricing.contact_sales')}</Button>
            </div>
        </main>
      
      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-4 py-8 px-4 text-center md:text-left">
          <Logo className="h-7 mx-auto md:mx-0" />
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Busmo.
          </p>
          <div className="flex items-center gap-4 mx-auto md:ml-auto md:mr-0">
            <Link href="/terms" className="text-sm hover:underline">{t('investor_layout.footer_privacy')}</Link>
             <Link href="/terms" className="text-sm hover:underline">{t('investor_layout.footer_terms')}</Link>
          </div>
        </div>
      </footer>
    </div>
    );
}
