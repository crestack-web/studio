'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const plans = [
    {
        id: 'shop',
        name: 'Shop',
        description: 'For small retailers',
        monthlyPrice: 1500,
        yearlyPrice: 15000,
    },
    {
        id: 'supermarket',
        name: 'Supermarket',
        description: 'For larger stores',
        monthlyPrice: 10000,
        yearlyPrice: 100000,
        isPopular: true,
    },
    {
        id: 'multi-branch',
        name: 'Multiple Branches',
        description: 'For chains & franchises',
        monthlyPrice: 30000,
        yearlyPrice: 300000,
    },
    {
        id: 'company',
        name: 'Company',
        description: 'For manufacturers',
        monthlyPrice: 50000,
        yearlyPrice: 500000,
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

export default function PlansPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState('supermarket'); // Default to popular plan

  return (
    <OnboardingLayout>
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Choose Your Plan</CardTitle>
          <CardDescription>All plans start with a 30-day free trial. No credit card needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex justify-center">
                 <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')} className="w-auto">
                    <TabsList className="grid grid-cols-2 p-1 h-auto">
                        <TabsTrigger value="monthly" className="px-6 py-1.5">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly" className="px-6 py-1.5 relative">
                            Yearly
                            <span className="absolute -top-2 -right-2.5 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">SAVE 17%</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="grid grid-cols-2 gap-4">
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
            
          <Link href="/owner/home" className="w-full">
            <Button className="w-full h-14 text-lg">
              Start Free Trial
            </Button>
          </Link>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
