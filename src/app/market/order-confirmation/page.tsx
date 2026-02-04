'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Landmark, Copy, Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, runTransaction, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';
import { getFunctionUrl } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-provider';

type MarketSettings = { payment: { bankName?: string; accountNumber?: string; paymentInstructions?: string; }; };
interface BusinessProfile { marketSettings?: MarketSettings; currency?: string; }
interface Order { id: string; total: number; payment: string; fulfillment: string; sellerBusinessId: string; }
interface Product { id: string; name: string; cost: number; price: number; quantity: number; hasVariants?: boolean; variants?: { id: string; name: string; price: number; cost?: number, quantity: number }[]; }

const OrderConfirmationContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { clearCart } = useCart();
    
    const initialOrderId = searchParams.get('orderId');
    const businessId = searchParams.get('businessId');
    const paystackRef = searchParams.get('reference');
    const source = searchParams.get('source');
    
    const [orderId, setOrderId] = useState<string | null>(initialOrderId);
    const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed' | 'idle'>('idle');
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);
    const [verificationMessage, setVerificationMessage] = useState('');

    useEffect(() => {
        if (paystackRef && !initialOrderId) { // Ensure this runs only for new Paystack orders
            setVerificationStatus('verifying');
            setIsProcessingOrder(true);

            const verifyAndCreateOrder = async () => {
                if (!firestore) {
                    setVerificationStatus('failed');
                    setVerificationMessage('Database connection failed.');
                    setIsProcessingOrder(false);
                    return;
                }
                try {
                    const verifyPaymentUrl = getFunctionUrl('verifyPayment');
                    const response = await fetch(`${verifyPaymentUrl}?reference=${paystackRef}`);
                    if (!response.ok) throw new Error('Payment verification service failed.');
                    const result = await response.json();
                    
                    if (result.success && result.data.status === 'success') {
                        setVerificationStatus('success');
                        setVerificationMessage('Your payment has been confirmed.');

                        const pendingOrderJSON = localStorage.getItem('pendingOrder');
                        if (!pendingOrderJSON) {
                            throw new Error(`Payment confirmed, but order data was lost. Please contact support with transaction reference: ${paystackRef}`);
                        }

                        const pendingOrder = JSON.parse(pendingOrderJSON);
                        
                        await runTransaction(firestore, async (transaction) => {
                            const newOrderRef = doc(collection(firestore, `businesses/${pendingOrder.sellerBusinessId}/orders`));
                            const orderData = {
                                ...pendingOrder,
                                paymentReference: paystackRef,
                                createdAt: serverTimestamp(),
                            };
                            transaction.set(newOrderRef, orderData);

                            for (const item of pendingOrder.items) {
                                const productRef = doc(firestore, `businesses/${pendingOrder.sellerBusinessId}/products`, item.productId);
                                const productSnap = await transaction.get(productRef);
                                
                                if (productSnap.exists()) {
                                    const productData = productSnap.data() as Product;
                                    if (item.variantId && productData.hasVariants) {
                                        const newVariants = productData.variants?.map(v => 
                                            v.id === item.variantId ? { ...v, quantity: v.quantity - item.quantity } : v
                                        );
                                        transaction.update(productRef, { variants: newVariants });
                                    } else {
                                        const newQuantity = productData.quantity - item.quantity;
                                        transaction.update(productRef, { quantity: newQuantity });
                                    }
                                }
                            }
                            setOrderId(newOrderRef.id);
                        });

                        localStorage.removeItem('pendingOrder');
                        clearCart();
                        
                    } else {
                        localStorage.removeItem('pendingOrder');
                        throw new Error(result.data?.gateway_response || 'Payment could not be confirmed.');
                    }
                } catch (error: any) {
                    console.error("Verification/Order Creation Error:", error);
                    setVerificationStatus('failed');
                    setVerificationMessage(error.message);
                } finally {
                    setIsProcessingOrder(false);
                }
            };
            verifyAndCreateOrder();
        } else if (initialOrderId) {
             setVerificationStatus('success');
        }
    }, [paystackRef, initialOrderId, source, toast, router, firestore, clearCart]);

    const orderRef = useMemoFirebase(() => (orderId && businessId) ? doc(firestore, `businesses/${businessId}/orders/${orderId}`) : null, [firestore, orderId, businessId]);
    const { data: order, isLoading: isLoadingOrder } = useDoc<Order>(orderRef);

    const businessProfileRef = useMemoFirebase(() => businessId ? doc(firestore, `businessProfiles/${businessId}`) : null, [firestore, businessId]);
    const { data: businessProfile, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);
    
    const isLoading = isLoadingOrder || isLoadingBusiness || isProcessingOrder;

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
    
    if (source === 'subscription' && verificationStatus !== 'verifying') {
         return (
            <div className="w-full max-w-lg space-y-6 text-center">
                <Card>
                    <CardHeader>
                        <div className="flex justify-center">
                            {verificationStatus === 'success' && <CheckCircle2 className="w-16 h-16 text-success" />}
                            {verificationStatus === 'failed' && <AlertCircle className="w-16 h-16 text-destructive" />}
                        </div>
                        <CardTitle className="text-2xl pt-4">
                            {verificationStatus === 'success' ? 'Payment Successful!' : 'Payment Failed'}
                        </CardTitle>
                        <CardDescription>
                            {verificationStatus === 'success' ? "Your subscription is now active. You'll be redirected shortly." : verificationMessage}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Button asChild><Link href="/owner/home">Go to Dashboard</Link></Button>
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
                        <CardDescription>We couldn't find any order details on this page.</CardDescription>
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
        switch (verificationStatus) {
            case 'verifying':
                return (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying payment...</span>
                    </div>
                );
            case 'success':
                 if (paystackRef) { // Only show if it was an online payment
                    return (
                        <div className="flex items-center justify-center gap-2 text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Payment Confirmed</span>
                        </div>
                    );
                 }
                 return null;
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

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Skeleton className="h-64 w-full max-w-lg"/></div>}>
            <OrderConfirmationContent />
        </Suspense>
    );
}
