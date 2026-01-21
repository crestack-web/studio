
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/app/main-layout';
import { CheckCircle2, Landmark, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';

type MarketSettings = { payment: { bankName?: string; accountNumber?: string; paymentInstructions?: string; }; };
interface BusinessProfile { marketSettings?: MarketSettings; currency?: string; }
interface Order { id: string; total: number; payment: string; fulfillment: string; sellerBusinessId: string; }

const OrderConfirmationContent = () => {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const firestore = useFirestore();
    
    const orderId = searchParams.get('orderId');
    
    const orderRef = useMemoFirebase(() => orderId ? doc(firestore, `orders/${orderId}`) : null, [firestore, orderId]);
    const { data: order, isLoading: isLoadingOrder } = useDoc<Order>(orderRef);

    const businessId = order?.sellerBusinessId;
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
        <MainLayout title="Order Confirmation" backHref="/market">
            <Suspense fallback={<div>Loading...</div>}>
                <OrderConfirmationContent />
            </Suspense>
        </MainLayout>
    );
}

    