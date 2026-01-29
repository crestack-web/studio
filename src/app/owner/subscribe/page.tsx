'use client';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { addDays } from 'date-fns';
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, convertFromNgn } from '@/lib/currency';
import { Separator } from '@/components/ui/separator';

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
}

interface Business {
    currency?: string;
}

function SubscribePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: authUser, isUserLoading } = useUser();

    const [finalAmount, setFinalAmount] = useState<number | null>(null);
    const [originalAmount, setOriginalAmount] = useState<number | null>(null);
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const planId = searchParams.get('planId');
    const billingCycle = searchParams.get('billingCycle');
    const couponCode = searchParams.get('couponCode');
    
    const userProfileRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [firestore, authUser]);
    const { data: userProfile } = useDoc<{ businessId?: string }>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => businessId ? doc(firestore, `businesses/${businessId}`) : null, [firestore, businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<Business>(businessRef);

    const selectedPlan = useMemo(() => plans.find(p => p.id === planId), [planId]);

    useEffect(() => {
        if (!selectedPlan || !billingCycle || isLoadingBusiness) return;

        const calculatePrice = async () => {
            const priceNgn = billingCycle === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice;
            const price = convertFromNgn(priceNgn, businessData?.currency);
            setOriginalAmount(price);

            let finalPrice = price;
            let couponData: Coupon | null = null;

            if (couponCode && firestore) {
                const couponRef = doc(firestore, 'coupons', couponCode);
                const couponSnap = await getDoc(couponRef);
                if (couponSnap.exists() && couponSnap.data()?.isActive) {
                    couponData = couponSnap.data() as Coupon;
                    setAppliedCoupon(couponData);
                    if (couponData.discountType === 'percentage') {
                        finalPrice = price * (1 - couponData.discountValue / 100);
                    } else {
                        const discount = convertFromNgn(couponData.discountValue, businessData?.currency);
                        finalPrice = Math.max(0, price - discount);
                    }
                }
            }
            setFinalAmount(finalPrice);
            setIsLoading(false);
        };
        calculatePrice();
    }, [selectedPlan, billingCycle, couponCode, firestore, businessData, isLoadingBusiness]);

    const handlePayment = async () => {
        if (!firestore || !authUser || !businessId || !planId || !billingCycle || finalAmount === null) {
            toast({ title: "Error", description: "Missing required information. Please try again.", variant: "destructive" });
            return;
        }
        setIsProcessing(true);

        // Simulate Paystack call and verification
        await new Promise(resolve => setTimeout(resolve, 2000));
        const paystackReference = `mock_paystack_${Date.now()}`;

        try {
            const batch = writeBatch(firestore);

            // 1. Create subscription document
            const subscriptionId = `sub_${Date.now()}`;
            const subscriptionRef = doc(firestore, `users/${authUser.uid}/subscriptions`, subscriptionId);
            const periodEnd = billingCycle === 'monthly' ? addDays(new Date(), 30) : addDays(new Date(), 365);
            batch.set(subscriptionRef, {
                planId: planId,
                status: 'active',
                currentPeriodStart: serverTimestamp(),
                currentPeriodEnd: periodEnd,
                createdAt: serverTimestamp()
            });

            // 2. Create transaction document
            const transactionRef = doc(collection(firestore, 'subscriptionTransactions'));
            batch.set(transactionRef, {
                userId: authUser.uid,
                planId: planId,
                amountPaid: finalAmount,
                currency: businessData?.currency || 'NGN',
                couponUsed: appliedCoupon?.code || null,
                paystackReference: paystackReference,
                status: 'successful',
                createdAt: serverTimestamp()
            });

            // 3. Update business plan and mark onboarding as complete
            const businessDocRef = doc(firestore, 'businesses', businessId);
            batch.update(businessDocRef, { 
                plan: planId,
                onboardingCompleted: true 
            });

            await batch.commit();

            toast({ title: "Payment Successful!", description: "Your subscription has been activated." });
            router.push('/owner/home?onboarding=complete');

        } catch (error) {
            console.error("Failed to process subscription:", error);
            toast({ title: "An Error Occurred", description: "Could not activate your subscription. Please contact support.", variant: "destructive" });
            setIsProcessing(false);
        }
    };

    if (isLoading || isUserLoading || isLoadingBusiness) {
        return (
            <MainLayout title="Complete Your Subscription">
                <div className="w-full max-w-md space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-14 w-full" />
                </div>
            </MainLayout>
        );
    }
    
    if (!selectedPlan) {
         return (
            <MainLayout title="Error">
                <p>Invalid plan selected. Please go back and select a plan.</p>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Complete Your Subscription" backHref="/owner/pricing">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                        <CardDescription>Confirm your subscription details before payment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Plan</span>
                            <span className="font-semibold">{selectedPlan.name} ({billingCycle})</span>
                        </div>
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
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total Due Today</span>
                            <span>{formatCurrency(finalAmount ?? 0, businessData?.currency)}</span>
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg" onClick={handlePayment} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isProcessing ? 'Processing...' : `Pay with Paystack`}
                </Button>
            </div>
        </MainLayout>
    )
}

export default function SubscribePage() {
    return (
        <Suspense fallback={
            <MainLayout title="Complete Your Subscription">
                 <div className="w-full max-w-md space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-14 w-full" />
                </div>
            </MainLayout>
        }>
            <SubscribePageContent />
        </Suspense>
    );
}
