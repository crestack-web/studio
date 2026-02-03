'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Landmark, Copy, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';

type MarketSettings = { payment: { bankName?: string; accountNumber?: string; paymentInstructions?: string; }; };
interface BusinessProfile { marketSettings?: MarketSettings; currency?: string; }
interface Order { id: string; total: number; payment: string; fulfillment: string; sellerBusinessId: string; }

const OrderConfirmationContent = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const orderId = searchParams?.orderId as string;
    const businessId = searchParams?.businessId as string;
    const paystackRef = searchParams?.reference as string;
    
    const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed' | 'idle'>('idle');
    const [verificationMessage, setVerificationMessage] = useState('');

    useEffect(() => {
        const verifyPaymentUrl = process.env.NEXT_PUBLIC_VERIFY_PAYMENT_URL;
        if (paystackRef && verifyPaymentUrl) {
            setVerificationStatus('verifying');
            const verify = async () => {
                try {
                    const response = await fetch(`${verifyPaymentUrl}?reference=${paystackRef}`);
                    const result = await response.json();
                    if (result.success && result.data.status === 'success') {
                        setVerificationStatus('success');
                        setVerificationMessage('Your payment has been confirmed.');
                    } else {
                        setVerificationStatus('failed');
                        setVerificationMessage(result.data.gateway_response || 'Payment could not be confirmed.');
                    }
                } catch (error) {
                    setVerificationStatus('failed');
                    setVerificationMessage('An error occurred while verifying your payment.');
                }
            };
            verify();
        } else if (paystackRef) {
            console.error("Payment verification URL is not configured.");
        } else {
            setVerificationStatus('idle');
        }
    }, [paystackRef]);

    const orderRef = useMemoFirebase(() => (orderId && businessId) ? doc(firestore, `businesses/${businessId}/orders/${orderId}`) : null, [firestore, orderId, businessId]);
    const { data: order, isLoading: isLoadingOrder } = useDoc<Order>(orderRef);

    const businessProfileRef = useMemoFirebase(() => businessId ? doc(firestore, `businessProfiles/${businessId}`) : null, [firestore, businessId]);
    const { data: businessProfile, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);
    
    const isLoading = isLoadingOrder || isLoadingBusiness;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
    };

    if (isLoading) {
        return (
            <div className="w-full max-w-lg space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }
    
    if (!orderId || !order) {
        return <div>Invalid Order</div>;
    }
    
    const paymentSettings = businessProfile?.marketSettings?.payment;
    const orderNumber = `#${orderId.substring(0,6).toUpperCase()}`;
    const currency = businessProfile?.currency;
    
    const renderVerificationStatus = () => {
        switch (verificationStatus) {
            case 'verifying':
                return (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying payment...</span>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex items-center justify-center gap-2 text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Payment Confirmed</span>
                    </div>
                );
            case 'failed':
                return (
                     <div className="flex items-center justify-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>Payment Failed: {verificationMessage}</span>
                    </div>
                );
            default:
                return null;
        }
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

export default function OrderConfirmationPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Skeleton className="h-64 w-full max-w-lg"/></div>}>
            <OrderConfirmationContent searchParams={searchParams} />
        </Suspense>
    );
}
