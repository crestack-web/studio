'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertCircle, Check, Loader2, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { convertFromNgn, formatCurrency } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const plans = [
    {
        id: 'shop',
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
        id: 'supermarket',
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
        id: 'multi-branch',
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
        id: 'company',
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

interface Business {
    currency?: string;
}

const PlanCard = ({ plan, billingCycle, isSelected }: { plan: typeof plans[0], billingCycle: 'monthly' | 'yearly', isSelected: boolean }) => {
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    
    return (
        <Label 
            htmlFor={`${plan.id}-${billingCycle}`}
            className={cn(
                "block rounded-lg border-2 p-4 cursor-pointer transition-all h-full flex flex-col",
                isSelected ? "border-primary ring-2 ring-primary" : "border-muted hover:border-muted-foreground/50",
                plan.isPopular && "relative"
            )}
        >
            {plan.isPopular && (
                <div className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-xs font-semibold py-0.5 px-2 rounded-full">
                    Popular
                </div>
            )}
            <CardHeader className="p-0">
                <CardTitle className="font-headline">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 mt-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{formatCurrency(price, 'NGN')}</span>
                    <span className="text-muted-foreground">/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'yearly' && (
                    <p className="text-sm text-accent font-medium mt-1">Save ~17%!</p>
                )}
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
        </Label>
    )
}

export default function PricingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [selectedPlan, setSelectedPlan] = useState('supermarket');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, `users/${authUser.uid}`);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<{ businessId?: string }>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, `businesses/${businessId}`);
    }, [firestore, businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<Business>(businessRef);

    const handleStartTrial = async () => {
        if (!selectedPlan) {
          toast({ variant: 'destructive', title: 'Please select a plan.' });
          return;
        }
        if (!businessId || !firestore || !authUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find your business details.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const batch = writeBatch(firestore);

            // 1. Update the business document
            const businessDocRef = doc(firestore, `businesses/${businessId}`);
            batch.update(businessDocRef, { 
                plan: selectedPlan,
                onboardingCompleted: true,
            });
            
            // 2. Create a trial subscription document
            const subscriptionId = `trial_${authUser.uid}`;
            const subscriptionRef = doc(firestore, `users/${authUser.uid}/subscriptions`, subscriptionId);
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial
            
            batch.set(subscriptionRef, {
                planId: selectedPlan,
                status: 'trialing',
                currentPeriodStart: serverTimestamp(),
                currentPeriodEnd: trialEndDate, // Set end date
                createdAt: serverTimestamp()
            });
            
            await batch.commit();

            toast({ title: "Free Trial Started!", description: `You're now on the ${selectedPlan} plan.` });
            router.push('/owner/home?onboarding=complete');
        } catch (error) {
            console.error("Error starting trial:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not start your free trial.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingBusiness) {
      return (
        <MainLayout title="Choose Your Plan">
          <div className="w-full max-w-7xl space-y-8">
            <Skeleton className="h-10 w-64 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((i) => <Skeleton key={i} className="h-96 w-full"/>)}
            </div>
          </div>
        </MainLayout>
      )
    }

  return (
    <MainLayout title="Choose Your Plan">
        <div className="w-full max-w-5xl space-y-8">
            <Alert variant="destructive" className="max-w-xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Last Step!</AlertTitle>
                <AlertDescription>
                    Choose a plan to start your 14-day free trial. No payment needed now.
                </AlertDescription>
            </Alert>

             <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-headline">Choose Your Plan</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    All plans start with a 14-day free trial. You can upgrade, downgrade, or cancel anytime.
                </p>
            </div>

             <Tabs value={billingCycle} onValueChange={(val) => setBillingCycle(val as 'monthly' | 'yearly')} className="w-full">
                <div className="flex justify-center">
                    <TabsList className="grid grid-cols-2 p-1 h-auto">
                        <TabsTrigger value="monthly" className="px-8 py-2">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly" className="px-8 py-2 relative">
                            Yearly
                            <span className="absolute -top-3 -right-3 bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded-full">SAVE 17%</span>
                        </TabsTrigger>
                    </TabsList>
                </div>
               
                <div className="mt-8">
                     <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" disabled={isSubmitting}>
                        {plans.map((plan) => (
                             <div key={plan.id}>
                                <RadioGroupItem value={plan.id} id={`${plan.id}-${billingCycle}`} className="peer sr-only" />
                                <PlanCard 
                                    plan={plan}
                                    billingCycle={billingCycle}
                                    isSelected={selectedPlan === plan.id}
                                />
                            </div>
                        ))}
                    </RadioGroup>
                </div>
            </Tabs>
             <div className="flex justify-center pt-8">
                <Button onClick={handleStartTrial} className="w-full max-w-md h-14 text-lg" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Start 14-Day Free Trial
                </Button>
            </div>
        </div>
    </MainLayout>
  );
}
