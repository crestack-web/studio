'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
            '1 Staff Member',
            'Sell on Busmo Market',
        ],
        notIncluded: [
            'Advanced Forecasting',
            'Multiple Branches',
            'Production Tracking',
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
        ]
    }
];

const PlanCard = ({ plan, billingCycle, isSelected }: { plan: typeof plans[0], billingCycle: 'monthly' | 'yearly', isSelected: boolean }) => {
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    
    return (
        <Label 
            htmlFor={plan.id + '-' + billingCycle} 
            className={cn(
                "block rounded-lg border-2 p-4 cursor-pointer transition-all",
                isSelected ? "border-primary ring-2 ring-primary" : "border-muted hover:border-muted-foreground/50",
                plan.isPopular && isSelected && "border-primary",
                plan.isPopular && !isSelected && "border-gray-300"
            )}
        >
            {plan.isPopular && (
                <div className="bg-primary text-primary-foreground text-center text-xs font-semibold py-1 mb-4 rounded-md -mx-4 -mt-4 rounded-b-none">
                    Most Popular
                </div>
            )}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                 <div className="text-right">
                    <p className="text-lg font-bold">₦{price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">/ {billingCycle === 'monthly' ? 'month' : 'year'}</p>
                </div>
            </div>
            {billingCycle === 'yearly' && (
                 <p className="text-xs text-accent font-medium mt-1 text-right">
                    Save ₦{(plan.monthlyPrice * 12 - plan.yearlyPrice).toLocaleString()}!
                </p>
            )}

            <Separator className="my-4"/>

            <ul className="space-y-2 text-sm">
                {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-accent"/>
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
                {plan.notIncluded && plan.notIncluded.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                        <X className="w-4 h-4 text-muted-foreground/50"/>
                        <span className="text-muted-foreground/50">{feature}</span>
                    </li>
                ))}
            </ul>
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
                 <Tabs defaultValue="monthly" onValueChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')} className="w-auto">
                    <TabsList className="grid grid-cols-2 p-1 h-auto">
                        <TabsTrigger value="monthly" className="px-6 py-1.5">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly" className="px-6 py-1.5 relative">
                            Yearly
                            <span className="absolute -top-2 -right-2.5 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">SAVE 17%</span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {plans.map((plan) => (
                    <div key={plan.id}>
                        <RadioGroupItem value={plan.id} id={plan.id + '-' + billingCycle} className="peer sr-only" />
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
      <Card className="w-full max-w-4xl mt-6">
        <CardHeader>
            <CardTitle className="text-center">Need more power?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center text-center md:text-left justify-between gap-4">
            <div >
                <h3 className="font-semibold">Company Plan</h3>
                <p className="text-sm text-muted-foreground">For manufacturing, custom integrations, and dedicated support.</p>
            </div>
             <Button variant="outline">Contact Sales</Button>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
