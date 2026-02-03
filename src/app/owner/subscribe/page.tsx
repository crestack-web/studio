
'use client';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addDays } from 'date-fns';
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, convertFromNgn } from '@/lib/currency';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    const router = useRouter();
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
    const { data: userProfile } = useDoc<{ businessId?: string }>(userProfileRef);
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
        if (!firestore || !authUser || !businessData || !planId || finalAmount === null) {
            toast({ title: "Error", description: "Missing required information. Please try again.", variant: "destructive" });
            return;
        }
        
        setIsProcessing(true);

        try {
            // 1. Create a pending subscription transaction document
            const transactionRef = await addDocumentNonBlocking(collection(firestore, 'subscriptionTransactions'), {
                userId: authUser.uid,
                planId: planId,
                amountPaid: finalAmount,
                currency: businessData.currency || 'NGN',
                couponUsed: appliedCoupon?.code || null,
                status: 'pending',
                createdAt: serverTimestamp(),
                billingCycle: billingCycle,
            });

            if (!transactionRef?.id) {
                throw new Error("Failed to create transaction record.");
            }
            
            // 2. Initialize payment with Paystack
            const reference = `SUB-${transactionRef.id}`;
            const callbackUrl = `${window.location.origin}/owner/home?subscription=success`;

            const response = await fetch('/initializePayment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: authUser.email,
                    amount: finalAmount,
                    reference: reference,
                    metadata: {
                        callback_url: callbackUrl,
                    },
                }),
            });

            const paymentData = await response.json();

            if (!response.ok || !paymentData.success) {
                // If initialization fails, delete the pending transaction
                const subTransactionDocRef = doc(firestore, 'subscriptionTransactions', transactionRef.id);
                await deleteDocumentNonBlocking(subTransactionDocRef);
                throw new Error(paymentData.error || 'Failed to initialize payment.');
            }
            
            // 3. Redirect to Paystack
            if (paymentData.data?.authorization_url) {
                window.location.href = paymentData.data.authorization_url;
            } else {
                 const subTransactionDocRef = doc(firestore, 'subscriptionTransactions', transactionRef.id);
                await deleteDocumentNonBlocking(subTransactionDocRef);
                throw new Error('Invalid payment initialization response.');
            }

        } catch (error: any) {
            console.error("Failed to process subscription:", error);
            toast({ title: "An Error Occurred", description: error.message || "Could not start your subscription payment. Please contact support.", variant: "destructive" });
            setIsProcessing(false);
        }
    };

    if (isLoading || isUserLoading || isLoadingBusiness) {
        return (
            <MainLayout title="Subscribe">
                <div className="w-full max-w-md space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-14 w-full" />
                </div>
            </MainLayout>
        );
    }
    
    if (!selectedPlan) {
         return (
            <MainLayout title="Error">
                <p>Could not find your selected plan. Please contact support.</p>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Subscribe to Continue">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Subscription</CardTitle>
                        <CardDescription>Your free trial has ended. Please subscribe to continue using Busmo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                            <span className="text-muted-foreground">Your Plan</span>
                            <span className="font-semibold text-lg">{selectedPlan.name}</span>
                        </div>
                        <Tabs value={billingCycle} onValueChange={(val) => setBillingCycle(val as 'monthly' | 'yearly')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                <TabsTrigger value="yearly">Yearly (Save 17%)</TabsTrigger>
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
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><Ticket className="h-5 w-5"/> Have a coupon?</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-2">
                        <Input placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                        <Button onClick={handleApplyCoupon} disabled={isVerifyingCoupon} variant="outline">
                            {isVerifyingCoupon ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Apply'}
                        </Button>
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
            <MainLayout title="Subscribe">
                 <div className="w-full max-w-md space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-14 w-full" />
                </div>
            </MainLayout>
        }>
            <SubscribePageContent />
        </Suspense>
    );
}
