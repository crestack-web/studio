'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { getSupabase } from '@/lib/supabase';
import { initializeFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function PlansPage() {
  return <PlansPageContent />;
}

function PlansPageContent() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [firestoreInstance, setFirestoreInstance] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Initialize Supabase + Firestore on client side only
  useEffect(() => {
    const initData = async () => {
      try {
        const supabase = getSupabase();
        const { firestore } = initializeFirebase();
        
        setFirestoreInstance(firestore);
        
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        setCurrentUser(currentUser);
        
        if (currentUser) {
          const { getDoc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(firestore, `users/${currentUser.id}`));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data?.businessId) {
              setBusinessId(data.businessId);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  const plans = [
    {
        id: 'starter',
        name: 'Starter',
        description: 'For small retailers',
        monthlyPrice: 5000,
        yearlyPrice: 50000,
    },
    {
        id: 'standard',
        name: 'Standard',
        description: 'For growing businesses',
        monthlyPrice: 10000,
        yearlyPrice: 100000,
        isPopular: true,
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'For chains & franchises',
        monthlyPrice: 25000,
        yearlyPrice: 250000,
    }
];

const PlanCard = ({ plan, billingCycle, isSelected }: { plan: (typeof plans)[0], billingCycle: 'monthly' | 'yearly', isSelected: boolean }) => {
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    
    return (
        <Label 
            htmlFor={`${plan.id}-${billingCycle}`}
            className={cn(
                "block rounded-lg border-2 p-4 cursor-pointer transition-all h-full flex flex-col justify-between",
                isSelected ? "border-primary ring-2 ring-primary" : "border-muted hover:border-muted-foreground/50",
                plan.isPopular && "relative"
            )}
        >
            {plan.isPopular && (
                <div className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-xs font-semibold py-0.5 px-2 rounded-full">
                    Popular
                </div>
            )}
            <div>
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>
            <div className="mt-4 text-right">
                <p className="text-2xl font-bold">₦{price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">/ {billingCycle === 'monthly' ? 'month' : 'year'}</p>
                 {billingCycle === 'yearly' && (
                    <p className="text-xs text-accent font-medium mt-1">
                        Save ~17%!
                    </p>
                )}
            </div>
        </Label>
    )
}



    const handleContinue = async () => {
        if (!selectedPlan) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select a plan.',
            } as any);
            return;
        }
        if (!businessId || !firestoreInstance || !currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find your business details. Please log in again.' } as any);
            return;
        }
        setIsSubmitting(true);
        try {
            const businessDocRef = doc(firestoreInstance, `businesses/${businessId}`);
            const subscriptionRef = doc(collection(firestoreInstance, `users/${currentUser.id}/subscriptions`));
            const batch = writeBatch(firestoreInstance);
            batch.update(businessDocRef, {
                plan: selectedPlan,
                onboardingCompleted: true,
                updatedAt: serverTimestamp(),
            });
            batch.set(subscriptionRef, {
                planId: selectedPlan,
                status: 'trialing',
                currentPeriodStart: serverTimestamp(),
                currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                createdAt: serverTimestamp(),
            });
            await batch.commit();
            router.replace('/owner/home?onboarding=complete');
        } catch (error) {
            let errorMsg = 'Could not save your plan choice. Please try again.';
            if (error && typeof error === 'object') {
                const err = error as any;
                if (err.message) errorMsg += `\nError: ${err.message}`;
                if (err.code) errorMsg += `\nCode: ${err.code}`;
                if (err.stack) errorMsg += `\nStack: ${err.stack}`;
            }
            console.error('Error saving plan:', error);
            toast({ variant: 'destructive', title: 'Save Failed', description: errorMsg } as any);
            setIsSubmitting(false);
        }
    };

  const isButtonDisabled = isSubmitting;

  return (
    <div className="min-h-screen bg-background">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Choose Your Plan</CardTitle>
          <CardDescription>All plans start with a 3-day free trial. No credit card needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex justify-center">
                 <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')} className="w-auto">
                    <TabsList className="grid grid-cols-2 p-1 h-auto">
                        <TabsTrigger value="monthly" className="px-6 py-1.5" disabled={isSubmitting}>Monthly</TabsTrigger>
                        <TabsTrigger value="yearly" className="px-6 py-1.5 relative" disabled={isSubmitting}>
                            Yearly
                            <span className="absolute -top-2 -right-2.5 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">SAVE 17%</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="grid grid-cols-2 gap-4" disabled={isSubmitting}>
                 {plans.map((plan) => (
                    <div key={plan.id}>
                        <RadioGroupItem value={plan.id} id={`${plan.id}-${billingCycle}`} className="peer sr-only" disabled={isSubmitting} />
                        <PlanCard 
                            plan={plan}
                            billingCycle={billingCycle}
                            isSelected={selectedPlan === plan.id}
                        />
                    </div>
                ))}
            </RadioGroup>
            
            <Button className="w-full h-14 text-lg" onClick={handleContinue} disabled={isButtonDisabled}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Start Free Trial'}
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
