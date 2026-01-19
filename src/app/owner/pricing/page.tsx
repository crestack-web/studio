'use client';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertCircle, Check, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
  return (
    <MainLayout title="Choose Your Plan" backHref="/owner/home">
        <div className="w-full max-w-7xl space-y-8">
            <Alert variant="destructive" className="max-w-xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Your Free Trial Has Ended</AlertTitle>
                <AlertDescription>
                    Please choose a plan to continue using Busmo and access your data.
                </AlertDescription>
            </Alert>

             <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Upgrade Your Plan</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    All plans are billed monthly or yearly. You can cancel anytime.
                </p>
            </div>

             <Tabs defaultValue="monthly" className="w-full">
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
                                    <Link href="#" className="w-full">
                                        <Button className={cn("w-full h-12 text-lg", !plan.isPopular && "variant-secondary")}>Select Plan</Button>
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
                                    <Link href="#" className="w-full">
                                         <Button className={cn("w-full h-12 text-lg", !plan.isPopular && "variant-secondary")}>Select Plan</Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
             <div className="text-center pt-8">
                 <h3 className="text-lg font-semibold">Custom Needs?</h3>
                 <p className="text-muted-foreground">For custom integrations and dedicated support, contact our sales team.</p>
                 <Button variant="link" className="mt-2">Contact Sales</Button>
            </div>
        </div>
    </MainLayout>
  );
}
