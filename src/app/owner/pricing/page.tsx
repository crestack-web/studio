'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertCircle, Check, Loader2, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/currency';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';

const plans = [
    {
        id: 'shop',
        name: 'Shop',
        description: 'For small retailers',
        monthlyPrice: 1500,
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
        features: [
            'Everything in Multiple Branches',
            'Production Tracking (Cost of Goods)',
            'Access to Equity Investment',
        ],
        notIncluded: []
    }
];

const PlanCard = ({ plan, isSelected }: { plan: typeof plans[0], isSelected: boolean }) => {
    const price = plan.monthlyPrice;
    
    return (
        <Label 
            htmlFor={plan.id}
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
        </Label>
    )
}

export default function PricingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const firestore = useFirestore();

    const [selectedPlan, setSelectedPlan] = useState('supermarket');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
      if (!firestore || !authUser) return null;
      return doc(firestore, `users/${authUser.uid}`);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<{ businessId?: string }>(userProfileRef);
    const businessId = userProfile?.businessId;

    const handleStartTrial = async () => {
        if (!businessId || !firestore || !authUser) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `Could not find your business details. businessId: ${businessId}, firestore: ${!!firestore}, authUser: ${!!authUser}`
            });
            return;
        }

        setIsSubmitting(true);

        const businessDocRef = doc(firestore, `businesses/${businessId}`);
        const subscriptionRef = doc(collection(firestore, `users/${authUser.uid}/subscriptions`));

        const batch = writeBatch(firestore);

        // Update business with plan and onboarding completion
        batch.update(businessDocRef, {
            plan: selectedPlan,
            onboardingCompleted: true,
            updatedAt: serverTimestamp(),
        });

        // Create the trial subscription
        batch.set(subscriptionRef, {
            planId: selectedPlan,
            status: 'trialing',
            currentPeriodStart: serverTimestamp(),
            currentPeriodEnd: addDays(new Date(), 14),
            createdAt: serverTimestamp()
        });

        try {
            await batch.commit();
            router.push('/owner/home?onboarding=complete');
        } catch (error) {
            let errorMsg = 'Could not save your plan choice. Please try again.';
            if (error && typeof error === 'object') {
                if (error.message) errorMsg += `\nError: ${error.message}`;
                if (error.code) errorMsg += `\nCode: ${error.code}`;
                if (error.stack) errorMsg += `\nStack: ${error.stack}`;
            }
            console.error("Error starting trial:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: errorMsg });
            setIsSubmitting(false);
        }
    };
    
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
               
            <div className="mt-8">
                 <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" disabled={isSubmitting}>
                    {plans.map((plan) => (
                         <div key={plan.id}>
                            <RadioGroupItem value={plan.id} id={plan.id} className="peer sr-only" />
                            <PlanCard 
                                plan={plan}
                                isSelected={selectedPlan === plan.id}
                            />
                        </div>
                    ))}
                </RadioGroup>
            </div>
            
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
