'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Menu, X } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const plans = [
    {
        name: 'Shop',
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

export default function PricingPage() {
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo className="h-8" />
          <nav className="hidden md:flex items-center gap-4">
             <Link href="/invest" passHref>
              <Button variant="ghost">For Investors</Button>
            </Link>
            <Link href="/pricing" passHref>
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/login" passHref>
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup" passHref>
              <Button>Sign Up</Button>
            </Link>
          </nav>
           <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs">
                  <Logo className="h-8 mb-8" />
                  <nav className="flex flex-col items-start gap-4">
                      <Link href="/invest" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">For Investors</Button></Link>
                      <Link href="/pricing" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">Pricing</Button></Link>
                      <Link href="/login" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">Log In</Button></Link>
                      <Link href="/signup" passHref className="w-full"><Button className="w-full mt-4 text-lg h-12">Sign Up</Button></Link>
                  </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
        
        <main className="flex-1 flex flex-col items-center p-4 py-12 sm:py-24">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">Find the perfect plan for your business</h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    All plans start with a 30-day free trial. No credit card required. Cancel anytime.
                </p>
            </div>

            <Tabs defaultValue="monthly" className="w-full max-w-7xl mx-auto mt-12">
                <div className="flex justify-center">
                    <TabsList className="grid grid-cols-2 p-1 h-auto">
                        <TabsTrigger value="monthly" className="px-8 py-2">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly" className="px-8 py-2 relative">
                            Yearly
                            <span className="absolute -top-3 -right-3 bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">SAVE 17%</span>
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="monthly" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {plans.map((plan) => (
                             <Card key={plan.name} className={cn("flex flex-col", plan.isPopular && "border-primary ring-2 ring-primary")}>
                                {plan.isPopular && (
                                    <div className="bg-primary text-primary-foreground text-center text-sm font-semibold py-1.5 rounded-t-lg">
                                        Most Popular
                                    </div>
                                )}
                                <CardHeader className="pt-8">
                                    <CardTitle className="font-headline">{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold">₦{plan.monthlyPrice.toLocaleString()}</span>
                                        <span className="text-muted-foreground">/ month</span>
                                    </div>
                                     <ul className="mt-6 space-y-3 text-sm">
                                        {plan.features.map(feature => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-accent mt-0.5 shrink-0"/>
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                        {plan.notIncluded && plan.notIncluded.map(feature => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <X className="w-5 h-5 text-muted-foreground/50 mt-0.5 shrink-0"/>
                                                <span className="text-muted-foreground/50">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link href="/signup" className="w-full">
                                        <Button className={cn("w-full h-12 text-lg", !plan.isPopular && "variant-secondary")}>Start Trial</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="yearly" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {plans.map((plan) => (
                             <Card key={plan.name} className={cn("flex flex-col", plan.isPopular && "border-primary ring-2 ring-primary")}>
                                 {plan.isPopular && (
                                    <div className="bg-primary text-primary-foreground text-center text-sm font-semibold py-1.5 rounded-t-lg">
                                        Most Popular
                                    </div>
                                )}
                                <CardHeader className="pt-8">
                                    <CardTitle className="font-headline">{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold">₦{plan.yearlyPrice.toLocaleString()}</span>
                                        <span className="text-muted-foreground">/ year</span>
                                    </div>
                                    <p className="text-sm text-accent font-medium mt-1">
                                        Save ~17%!
                                    </p>
                                     <ul className="mt-6 space-y-3 text-sm">
                                        {plan.features.map(feature => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-accent mt-0.5 shrink-0"/>
                                                <span className="text-muted-foreground">{feature}</span>
                                            </li>
                                        ))}
                                        {plan.notIncluded && plan.notIncluded.map(feature => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <X className="w-5 h-5 text-muted-foreground/50 mt-0.5 shrink-0"/>
                                                <span className="text-muted-foreground/50">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Link href="/signup" className="w-full">
                                         <Button className={cn("w-full h-12 text-lg", !plan.isPopular && "variant-secondary")}>Start Trial</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <Separator className="my-24" />

            <div className="w-full max-w-5xl mx-auto space-y-12">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight font-headline sm:text-4xl">For Larger Businesses</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Need more? We offer custom plans for enterprise needs.
                    </p>
                </div>
                 <Card className="flex flex-col md:flex-row items-center gap-8 p-8">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold font-headline">Enterprise Plan</h3>
                        <p className="text-muted-foreground mt-2">A plan tailored to your specific needs. Get everything in our standard plans, plus:</p>
                        <ul className="mt-6 space-y-3">
                           <li className="flex items-center gap-2"><Check className="w-5 h-5 text-accent"/><span>Custom Integrations</span></li>
                           <li className="flex items-center gap-2"><Check className="w-5 h-5 text-accent"/><span>Dedicated Support & Onboarding</span></li>
                           <li className="flex items-center gap-2"><Check className="w-5 h-5 text-accent"/><span>Volume Discounts</span></li>
                        </ul>
                    </div>
                    <div>
                         <Button size="lg" className="h-12 text-lg">Contact Sales</Button>
                    </div>
                 </Card>
            </div>
        </main>
      
      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-4 py-8 px-4 text-center md:text-left">
          <Logo className="h-7 mx-auto md:mx-0" />
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Busmo. business money
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
