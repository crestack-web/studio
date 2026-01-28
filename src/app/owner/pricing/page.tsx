'use client';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AlertCircle, Check, Loader2, X, Ticket } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { convertFromNgn, formatCurrency } from '@/lib/currency';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

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

interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive: boolean;
}

export default function PricingPage() {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<{ businessId?: string }>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, `businesses/${businessId}`);
    }, [firestore, businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<Business>(businessRef);

    const couponRef = useMemoFirebase(() => {
        if (!firestore || !couponCode) return null;
        return doc(firestore, 'coupons', couponCode.toUpperCase());
    }, [firestore, couponCode]);
    // We use a separate useDoc hook for the coupon so it can be fetched independently
    const { data: couponData, isLoading: isLoadingCoupon } = useDoc<Coupon>(couponRef);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast({ title: "Please enter a coupon code.", variant: "destructive" });
            return;
        }
        setIsVerifyingCoupon(true);
        // This will trigger the useDoc hook to fetch the coupon
        const couponDoc = await import('firebase/firestore').then(m => m.getDoc(couponRef!));
        
        if (couponDoc.exists() && couponDoc.data()?.isActive) {
            setAppliedCoupon(couponDoc.data() as Coupon);
            toast({ title: "Coupon Applied!", description: `Discount of ${couponDoc.data().discountType === 'percentage' ? `${couponDoc.data().discountValue}%` : formatCurrency(couponDoc.data().discountValue, businessData?.currency)} has been applied.` });
        } else {
            setAppliedCoupon(null);
            toast({ title: "Invalid Coupon", description: "The coupon code is either invalid or has expired.", variant: "destructive" });
        }
        setIsVerifyingCoupon(false);
    };

    const handleSelectPlan = (planId: string) => {
        let url = `/owner/subscribe?planId=${planId}&billingCycle=${billingCycle}`;
        if (appliedCoupon) {
            url += `&couponCode=${appliedCoupon.code}`;
        }
        router.push(url);
    };

    const getPlanPrice = (plan: typeof plans[0]) => {
        return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    };

    const getDiscountedPrice = (price: number) => {
        if (!appliedCoupon) return price;
        let discount = 0;
        if (appliedCoupon.discountType === 'percentage') {
            discount = price * (appliedCoupon.discountValue / 100);
        } else {
            discount = convertFromNgn(appliedCoupon.discountValue, businessData?.currency);
        }
        return Math.max(0, price - discount);
    };

    if (isLoadingBusiness) {
      return (
        <MainLayout title="Choose Your Plan">
          <div className="w-full max-w-7xl space-y-8">
            <Skeleton className="h-10 w-64 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map(i => <Skeleton key={i} className="h-96 w-full"/>)}
            </div>
          </div>
        </MainLayout>
      )
    }

  return (
    <MainLayout title="Choose Your Plan">
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
                <Card className="max-w-md mx-auto mt-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5"/> Have a coupon?</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2">
                        <Input placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                        <Button onClick={handleApplyCoupon} disabled={isVerifyingCoupon}>
                            {isVerifyingCoupon ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Apply'}
                        </Button>
                    </CardContent>
                </Card>
                <TabsContent value="monthly" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {plans.map((plan) => {
                            const originalPrice = convertFromNgn(plan.monthlyPrice, businessData?.currency);
                            const finalPrice = getDiscountedPrice(originalPrice);
                            return (
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
                                        <span className="text-4xl font-bold">{formatCurrency(finalPrice, businessData?.currency)}</span>
                                        <span className="text-muted-foreground">/ month</span>
                                    </div>
                                    {appliedCoupon && (
                                        <p className="text-sm text-muted-foreground line-through">{formatCurrency(originalPrice, businessData?.currency)}</p>
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
                                <CardFooter>
                                    <Button onClick={() => handleSelectPlan(plan.id)} className={cn("w-full h-12 text-lg", !plan.isPopular && "variant-secondary")}>Select Plan</Button>
                                </CardFooter>
                            </Card>
                        )})}
                    </div>
                </TabsContent>
                <TabsContent value="yearly" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {plans.map((plan) => {
                            const originalPrice = convertFromNgn(plan.yearlyPrice, businessData?.currency);
                             const finalPrice = getDiscountedPrice(originalPrice);
                            return (
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
                                        <span className="text-4xl font-bold">{formatCurrency(finalPrice, businessData?.currency)}</span>
                                        <span className="text-muted-foreground">/ year</span>
                                    </div>
                                    <p className="text-sm text-accent font-medium mt-1">
                                        {appliedCoupon ? `Discount applied (was ${formatCurrency(originalPrice, businessData?.currency)})` : 'Save ~17%!'}
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
                                    <Button onClick={() => handleSelectPlan(plan.id)} className={cn("w-full h-12 text-lg", !plan.isPopular && "variant-secondary")}>Select Plan</Button>
                                </CardFooter>
                            </Card>
                        )})}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    </MainLayout>
  );
}

