'use client';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, convertFromNgn } from '@/lib/currency';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const plans = [
  { id: 'shop', name: 'Shop', monthlyPrice: 1500, yearlyPrice: 15000 },
  { id: 'supermarket', name: 'Supermarket', monthlyPrice: 10000, yearlyPrice: 100000 },
  { id: 'multi-branch', name: 'Multiple Branches', monthlyPrice: 30000, yearlyPrice: 300000 },
  { id: 'company', name: 'Company', monthlyPrice: 50000, yearlyPrice: 500000 }
];

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive: boolean;
}

interface Business {
  currency?: string;
  plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
}

function SubscribePageContent() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const [originalAmount, setOriginalAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const userProfileRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
  const { data: userProfile } = useDoc<{ businessId?: string, email?: string }>(userProfileRef);
  const businessId = userProfile?.businessId;

  const businessRef = useMemoFirebase(() => businessId ? doc(firestore, `businesses/${businessId}`) : null, [firestore, businessId]);
  const { data: businessData, isLoading: isLoadingBusiness } = useDoc<Business>(businessRef);

  const planId = businessData?.plan;
  const selectedPlan = useMemo(() => plans.find(p => p.id === planId), [planId]);

  useEffect(() => {
    if (!selectedPlan || isLoadingBusiness) return;

    const priceNgn = billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;
    const price = convertFromNgn(priceNgn, businessData?.currency);
    setOriginalAmount(price);

    let finalPrice = price;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        finalPrice = price * (1 - appliedCoupon.discountValue / 100);
      } else {
        const discount = convertFromNgn(appliedCoupon.discountValue, businessData?.currency);
        finalPrice = Math.max(0, price - discount);
      }
    }

    setFinalAmount(finalPrice);
    setIsLoading(false);

  }, [selectedPlan, billingCycle, appliedCoupon, businessData, isLoadingBusiness]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !firestore) {
      toast({ title: "Please enter a coupon code.", variant: "destructive" });
      return;
    }
    setIsVerifyingCoupon(true);

    const couponRef = doc(firestore, 'coupons', couponCode.toUpperCase());
    const couponSnap = await getDoc(couponRef);

    if (couponSnap.exists() && couponSnap.data()?.isActive) {
      const couponData = couponSnap.data() as Coupon;
      setAppliedCoupon(couponData);
      toast({ title: "Coupon Applied!", description: `Discount has been applied.` });
    } else {
      setAppliedCoupon(null);
      toast({ title: "Invalid Coupon", description: "The coupon code is either invalid or has expired.", variant: "destructive" });
    }
    setIsVerifyingCoupon(false);
  };

  const handlePayment = async () => {
    if (!firestore || !authUser || !userProfile?.email || !businessId || !businessData || !planId || finalAmount === null || !selectedPlan) {
      toast({ title: "Error", description: "Missing required information. Please try again.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);

    try {
      // You may want to update this import if you move getFunctionUrl
      const { getFunctionUrl } = await import('@/lib/api');
      const initializePaymentUrl = getFunctionUrl('initializePayment');
      const callbackUrl = `${window.location.origin}/market/order-confirmation?source=subscription`;

      const response = await fetch(initializePaymentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          payload: {
            planId: planId,
            billingCycle: billingCycle,
            couponCode: appliedCoupon?.code,
          },
          userId: authUser.uid,
          businessId: businessId,
          email: userProfile.email,
          amount: finalAmount,
          callback_url: callbackUrl,
        }),
      });

      const paymentData = await response.json();

      const authorizationUrl =
        paymentData?.authorization_url || paymentData?.data?.authorization_url;
      const isSuccess =
        paymentData?.success === true || paymentData?.status === true;

      if (response.ok && isSuccess && authorizationUrl) {
        window.location.href = authorizationUrl;
      } else {
        throw new Error(
          paymentData?.error ||
          paymentData?.message ||
          'Failed to initialize subscription.'
        );
      }

    } catch (error: any) {
      console.error("Failed to process subscription:", error);
      toast({ title: "An Error Occurred", description: error.message || "Could not start your subscription payment. Please contact support.", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  if (isLoading || isUserLoading || isLoadingBusiness) {
    return (
      <div className="w-full max-w-sm mx-auto space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="w-full max-w-sm mx-auto">
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-lg font-semibold mb-2">Plan Not Found</div>
              <div className="text-muted-foreground">Could not find your selected plan. Please contact support.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col items-center mb-2">
            <div className="text-xl font-headline font-bold mb-1">Your Subscription</div>
            <div className="text-muted-foreground text-center text-sm">
              Your free trial has ended. Please subscribe to continue using Busmo.
            </div>
          </div>
          <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
            <span className="text-muted-foreground">Your Plan</span>
            <span className="font-semibold text-lg">{selectedPlan.name}</span>
          </div>
          <Tabs value={billingCycle} onValueChange={(val) => setBillingCycle(val as 'monthly' | 'yearly')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly <span className="ml-1 text-xs text-success">(Save 17%)</span></TabsTrigger>
            </TabsList>
          </Tabs>
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Price</span>
              <span>{formatCurrency(originalAmount ?? 0, businessData?.currency)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between items-center text-success">
                <span className="text-sm">Coupon: {appliedCoupon.code}</span>
                <span className="text-sm">-{formatCurrency((originalAmount ?? 0) - (finalAmount ?? 0), businessData?.currency)}</span>
              </div>
            )}
          </div>
          <Separator />
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total Due Today</span>
            <span>{formatCurrency(finalAmount ?? 0, businessData?.currency)}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-2 pt-6">
          <Ticket className="h-5 w-5 mr-2 text-muted-foreground" />
          <Input placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          <Button onClick={handleApplyCoupon} disabled={isVerifyingCoupon} variant="outline">
            {isVerifyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
          </Button>
        </CardContent>
      </Card>
      <Button className="w-full h-14 text-lg" onClick={handlePayment} disabled={isProcessing}>
        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isProcessing ? 'Processing...' : 'Complete Payment'}
      </Button>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <FirebaseClientProvider>
      <Suspense fallback={
        <div className="w-full max-w-sm mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      }>
        <SubscribePageContent />
      </Suspense>
    </FirebaseClientProvider>
  );
}

export const dynamic = 'force-dynamic';