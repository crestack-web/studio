
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Landmark, Copy, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, runTransaction, collection, serverTimestamp, getDoc, query, where, limit, collectionGroup } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';
import { getFunctionUrl } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-provider';

type MarketSettings = { payment: { bankName?: string; accountNumber?: string; paymentInstructions?: string; }; };
interface BusinessProfile { marketSettings?: MarketSettings; currency?: string; }
interface Order { id: string; total: number; payment: string; fulfillment: string; sellerBusinessId: string; paymentReference: string; paymentStatus?: 'pending' | 'paid' | 'failed'; }

const OrderConfirmationContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { clearCart } = useCart();
    
    const paystackRef = searchParams.get('reference');
    const source = searchParams.get('source');

    const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed' | 'idle'>(paystackRef ? 'verifying' : 'idle');
    const [verificationMessage, setVerificationMessage] = useState(paystackRef ? 'Verifying your payment...' : '');

    // Query for the order using the Paystack reference
    const orderQuery = useMemoFirebase(() => {
        if (!firestore || !paystackRef) return null;
        return query(
            collectionGroup(firestore, 'orders'),
            where('paymentReference', '==', paystackRef),
            limit(1)
        );
    }, [firestore, paystackRef]);

    // Use useCollection because we're querying. We expect 0 or 1 result.
    const { data: ordersData, isLoading: isLoadingOrder } = useCollection<Order>(orderQuery);
    const order = ordersData?.[0];
    const orderId = order?.id;
    const businessId = order?.sellerBusinessId;

    const businessProfileRef = useMemoFirebase(() => businessId ? doc(firestore, `businessProfiles/${businessId}`) : null, [firestore, businessId]);
    const { data: businessProfile, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);

    useEffect(() => {
        if (paystackRef) {
            // If the order exists but payment isn't confirmed yet, keep waiting.
            if (!isLoadingOrder && order) {
                if (order.payment === 'busmopay' && order.paymentStatus === 'paid') {
                    setVerificationStatus('success');
                    setVerificationMessage('Payment confirmed. Your order has been placed!');
                    clearCart();
                    return;
                }
                if (order.payment === 'busmopay' && order.paymentStatus === 'failed') {
                    setVerificationStatus('failed');
                    setVerificationMessage('Your payment failed. Please try again.');
                    return;
                }

                setVerificationStatus('verifying');
                setVerificationMessage('Waiting for payment confirmation...');
            } else if (!isLoadingOrder && !order) {
                // If the component loads and there's no order yet, we wait.
                // A timeout is a fallback in case the webhook is delayed or fails.
                const timer = setTimeout(() => {
                    if (verificationStatus === 'verifying') {
                        setVerificationStatus('failed');
                        setVerificationMessage('We are still confirming your payment. Please check back in a few minutes or contact support if this persists.');
                        toast({
                            title: 'Payment Processing Delayed',
                            description: 'We are still waiting for confirmation from the payment provider.',
                            variant: 'default',
                        });
                    }
                }, 45000); // 45 seconds timeout

                return () => clearTimeout(timer);
            }
        }
    }, [paystackRef, order, isLoadingOrder, verificationStatus, clearCart, toast]);


    const isLoading = (paystackRef && isLoadingOrder) || (order && isLoadingBusiness);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
    };

    if (isLoading || verificationStatus === 'verifying') {
        return (
            <div className="w-full max-w-lg space-y-6 text-center">
                <Card>
                    <CardHeader>
                        <div className="flex justify-center"><Loader2 className="w-16 h-16 text-primary animate-spin" /></div>
                        <CardTitle className="text-2xl pt-4">Processing Your Order</CardTitle>
                        <CardDescription>{verificationMessage}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    if (source === 'subscription' && verificationStatus !== 'verifying') {
         return (
            <div className="w-full max-w-lg space-y-6 text-center">
                <Card>
                    <CardHeader>
                        <div className="flex justify-center">
                            <CheckCircle2 className="w-16 h-16 text-success" />
                        </div>
                        <CardTitle className="text-2xl pt-4">Payment Successful!</CardTitle>
                        <CardDescription>
                            Your subscription is now active. You will be redirected to your dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button asChild onClick={() => router.push('/owner/home')}>Go to Dashboard</Button>
                    </CardContent>
                </Card>
            </div>
         );
    }
    
    if (!orderId || !order) {
        return (
            <div className="w-full max-w-lg space-y-6 text-center">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-center"><ShoppingCart className="w-16 h-16 text-muted-foreground" /></div>
                        <CardTitle className="text-2xl pt-4">Looking for an order?</CardTitle>
                        <CardDescription>We couldn't find any order details for this transaction.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button asChild><Link href="/market">Continue Shopping</Link></Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    const paymentSettings = businessProfile?.marketSettings?.payment;
    const orderNumber = `#${orderId.substring(0,6).toUpperCase()}`;
    const currency = businessProfile?.currency;
    
    const renderVerificationStatus = () => {
        if (verificationStatus === 'success') {
            return (
                <div className="flex items-center justify-center gap-2 text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Payment Confirmed</span>
                </div>
            );
        }
        if (verificationStatus === 'failed') {
            return (
                <div className="flex items-center justify-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Payment Failed: {verificationMessage}</span>
                </div>
            );
        }
        return null;
    }


    return (
        <div className="w-full max-w-lg space-y-6">
            <Card className="text-center">
                <CardHeader>
                    <div className="flex justify-center"><CheckCircle2 className="w-16 h-16 text-success" /></div>
                    <CardTitle className="text-2xl pt-4">Order Placed Successfully!</CardTitle>
                    <CardDescription>Your order number is {orderNumber}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{order.fulfillment === 'delivery' ? 'Your order will be delivered soon.' : 'Your order is ready for pickup.'}</p>
                    <div className="mt-4 text-sm">{renderVerificationStatus()}</div>
                </CardContent>
            </Card>

            {order.payment === 'transfer' && paymentSettings && (
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" /><span>Complete Payment</span></CardTitle><CardDescription>Please transfer the total amount to the account below.</CardDescription></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 rounded-md border p-4">
                             <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Amount to Pay</span><span className="font-bold text-lg">{formatCurrency(order.total, currency)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Bank Name</span><span className="font-semibold">{paymentSettings.bankName}</span></div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Account Number</span>
                                <div className="flex items-center gap-2"><span className="font-semibold">{paymentSettings.accountNumber}</span><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(paymentSettings.accountNumber || '')}><Copy className="h-4 w-4" /></Button></div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{paymentSettings.paymentInstructions}</p>
                    </CardContent>
                </Card>
            )}

            <Link href="/market" className="w-full"><Button className="w-full h-12 text-lg">Continue Shopping</Button></Link>
        </div>
    );
};

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Skeleton className="h-64 w-full max-w-lg"/></div>}>
            <OrderConfirmationContent />
        </Suspense>
    );
}

    