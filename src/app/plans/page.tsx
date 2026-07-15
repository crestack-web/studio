'use client';

import { useState, useEffect } from 'react';
import { SupportChatWidget } from '@/components/SupportChatWidget';

export default function PlansPage() {
  return (
    <main className="min-h-screen">
      <OnboardingLayout>
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
      </OnboardingLayout>

      {/* Support chat widget - connects to our admin support section */}
      <SupportChatWidget />
    </main>
  );
}

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

function PlansPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userProfileRef = useMemoFirebase(() => {
      if (!firestore || !authUser) return null;
      return doc(firestore, `users/${authUser.uid}`);
  }, [firestore, authUser]);
  const { data: userProfile } = useDoc<{ businessId?: string }>(userProfileRef);
  const businessId = userProfile?.businessId;


    const handleContinue = async () => {
        if (!selectedPlan) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please select a plan.',
            });
            return;
        }
        if (!businessId || !firestore || !authUser) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find your business details. Please log in again.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const businessDocRef = doc(firestore, `businesses/${businessId}`);
            const subscriptionRef = doc(collection(firestore, `users/${authUser.uid}/subscriptions`));
            const batch = writeBatch(firestore);
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
            toast({ variant: 'destructive', title: 'Save Failed', description: errorMsg });
            setIsSubmitting(false);
        }
    };

  const isButtonDisabled = isSubmitting;

  return (
    <OnboardingLayout>
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
    </OnboardingLayout>
  );
}
