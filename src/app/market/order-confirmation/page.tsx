'use client';

import React, { सuspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/app/main-layout';
import { CheckCircle2, Landmark, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data
const mockProduct = { 
    id: '1', 
    name: 'Handmade Leather Bag', 
    price: 12000, 
};

const mockStore = {
    paymentSettings: {
        bankName: "Guaranty Trust Bank",
        accountNumber: "0123456789",
        paymentInstructions: "Please use your order number as the payment reference."
    },
    deliverySettings: {
        deliveryFee: 1500,
    }
};

const OrderConfirmationContent = () => {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const productId = searchParams.get('productId');
    const quantity = parseInt(searchParams.get('quantity') || '1', 10);
    const fulfillmentMethod = searchParams.get('fulfillment');
    const paymentMethod = searchParams.get('payment');
    const orderNumber = `#BM${Math.floor(1000 + Math.random() * 9000)}`;

    const subtotal = mockProduct.price * quantity;
    const deliveryFee = fulfillmentMethod === 'delivery' ? mockStore.deliverySettings.deliveryFee : 0;
    const total = subtotal + deliveryFee;
    
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied to clipboard!",
        });
    };

    if (!productId) {
        return <div>Invalid Order</div>;
    }

    return (
        <div className="w-full max-w-lg space-y-6">
            <Card className="text-center">
                <CardHeader>
                    <div className="flex justify-center">
                        <CheckCircle2 className="w-16 h-16 text-success" />
                    </div>
                    <CardTitle className="text-2xl pt-4">Order Placed Successfully!</CardTitle>
                    <CardDescription>Your order number is {orderNumber}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        {fulfillmentMethod === 'delivery'
                            ? 'Your order will be delivered soon.'
                            : 'Your order is ready for pickup.'}
                    </p>
                </CardContent>
            </Card>

            {paymentMethod === 'transfer' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Landmark className="h-5 w-5 text-primary" />
                           <span>Complete Payment</span>
                        </CardTitle>
                        <CardDescription>Please transfer the total amount to the account below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 rounded-md border p-4">
                             <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Amount to Pay</span>
                                <span className="font-bold text-lg">₦{total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Bank Name</span>
                                <span className="font-semibold">{mockStore.paymentSettings.bankName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Account Number</span>
                                <div className="flex items-center gap-2">
                                     <span className="font-semibold">{mockStore.paymentSettings.accountNumber}</span>
                                     <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(mockStore.paymentSettings.accountNumber)}>
                                        <Copy className="h-4 w-4" />
                                     </Button>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{mockStore.paymentSettings.paymentInstructions}</p>
                    </CardContent>
                </Card>
            )}

            <Link href="/market" className="w-full">
                <Button className="w-full h-12 text-lg">
                    Continue Shopping
                </Button>
            </Link>
        </div>
    );
};


export default function OrderConfirmationPage() {
    return (
        <MainLayout title="Order Confirmation" backHref="/market">
            <React.Suspense fallback={<div>Loading...</div>}>
                <OrderConfirmationContent />
            </React.Suspense>
        </MainLayout>
    );
}
