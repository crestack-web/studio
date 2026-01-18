'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import MainLayout from '@/components/app/main-layout';
import { Banknote, Package, Truck, Landmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Mock product and store data, now including payment/delivery settings
const mockProduct = { 
    id: '1', 
    name: 'Handmade Leather Bag', 
    price: 12000, 
    image: 'https://picsum.photos/seed/market-fashion-1/400/300',
    hint: 'leather bag',
};

const mockStore = {
    id: 'biz1',
    name: "Aisha's Crafts",
    paymentSettings: {
        allowPayOnDelivery: true,
        allowBankTransfer: true,
        bankName: "Guaranty Trust Bank",
        accountNumber: "0123456789",
        paymentInstructions: "Please use your order number as the payment reference."
    },
    deliverySettings: {
        allowDelivery: true,
        allowPickup: true,
        deliveryFee: 1500,
        deliveryDays: ["Monday", "Wednesday", "Friday"],
    }
};

const CheckoutContent = () => {
    const searchParams = useSearchParams();
    const productId = searchParams.get('productId');
    const quantity = parseInt(searchParams.get('quantity') || '1', 10);

    const [fulfillmentMethod, setFulfillmentMethod] = useState(mockStore.deliverySettings.allowDelivery ? 'delivery' : 'pickup');
    const [paymentMethod, setPaymentMethod] = useState(mockStore.paymentSettings.allowPayOnDelivery ? 'delivery' : 'transfer');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');

    const subtotal = mockProduct.price * quantity;
    const deliveryFee = fulfillmentMethod === 'delivery' ? mockStore.deliverySettings.deliveryFee : 0;
    const total = subtotal + deliveryFee;
    
    const canPlaceOrder = customerName && customerPhone && (fulfillmentMethod === 'pickup' || (fulfillmentMethod === 'delivery' && customerAddress));


    if (!productId) {
        return (
            <div className="text-center">
                <p className="text-muted-foreground">No product selected.</p>
                <Link href="/market">
                    <Button variant="link">Return to Market</Button>
                </Link>
            </div>
        );
    }
    
    const confirmationLink = `/market/order-confirmation?productId=${productId}&quantity=${quantity}&fulfillment=${fulfillmentMethod}&payment=${paymentMethod}&name=${encodeURIComponent(customerName)}&phone=${encodeURIComponent(customerPhone)}&address=${encodeURIComponent(customerAddress)}`;

    return (
         <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Image 
                                src={mockProduct.image} 
                                alt={mockProduct.name}
                                width={80}
                                height={80}
                                className="rounded-md object-cover"
                                data-ai-hint={mockProduct.hint}
                            />
                            <div className="flex-1">
                                <p className="font-semibold">{mockProduct.name}</p>
                                <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
                            </div>
                            <p className="font-semibold">₦{subtotal.toLocaleString()}</p>
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>₦{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Delivery Fee</span>
                                <span>₦{deliveryFee.toLocaleString()}</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>₦{total.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Fulfillment and Payment */}
            <div className="space-y-8">
                 {/* Customer Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Your Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="Enter your full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" placeholder="Enter your phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                        </div>
                    </CardContent>
                </Card>
                
                {/* Fulfillment */}
                <Card>
                    <CardHeader>
                        <CardTitle>How would you like to get your order?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <RadioGroup value={fulfillmentMethod} onValueChange={setFulfillmentMethod} className="space-y-4">
                            {mockStore.deliverySettings.allowDelivery && (
                                <Label htmlFor="delivery" className="flex items-start rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <RadioGroupItem value="delivery" id="delivery" className="peer mt-1" />
                                    <div className="ml-4">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Truck className="h-5 w-5 text-primary" />
                                            <span>Home Delivery</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">Fee: ₦{mockStore.deliverySettings.deliveryFee.toLocaleString()}. Delivered on {mockStore.deliverySettings.deliveryDays.join(', ')}.</p>
                                    </div>
                                </Label>
                            )}
                             {mockStore.deliverySettings.allowPickup && (
                                 <Label htmlFor="pickup" className="flex items-start rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <RadioGroupItem value="pickup" id="pickup" className="peer mt-1" />
                                    <div className="ml-4">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Package className="h-5 w-5 text-primary" />
                                            <span>In-store Pickup</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">Pick up your order directly from {mockStore.name}. No extra fees.</p>
                                    </div>
                                </Label>
                            )}
                        </RadioGroup>
                        {fulfillmentMethod === 'delivery' && (
                            <div className="space-y-2 pt-4 border-t mt-4">
                                <Label htmlFor="address">Delivery Address</Label>
                                <Textarea id="address" placeholder="Enter your full street address, city, and state" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment */}
                <Card>
                    <CardHeader>
                        <CardTitle>How would you like to pay?</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                             {mockStore.paymentSettings.allowPayOnDelivery && (
                                 <Label htmlFor="pay-on-delivery" className="flex items-start rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <RadioGroupItem value="delivery" id="pay-on-delivery" className="peer mt-1" />
                                    <div className="ml-4">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Banknote className="h-5 w-5 text-primary" />
                                            <span>Pay on Delivery</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">Pay with cash or POS when your order arrives.</p>
                                    </div>
                                </Label>
                            )}
                             {mockStore.paymentSettings.allowBankTransfer && (
                                <Label htmlFor="bank-transfer" className="flex items-start rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <RadioGroupItem value="transfer" id="bank-transfer" className="peer mt-1" />
                                    <div className="ml-4">
                                         <div className="flex items-center gap-2 font-semibold">
                                            <Landmark className="h-5 w-5 text-primary" />
                                            <span>Bank Transfer</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">You'll receive account details after placing your order.</p>
                                    </div>
                                </Label>
                             )}
                        </RadioGroup>
                    </CardContent>
                </Card>

                 <Link href={confirmationLink}>
                    <Button className="w-full h-14 text-lg" disabled={!canPlaceOrder}>
                        Place Order (₦{total.toLocaleString()})
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <MainLayout title="Checkout" backHref="/market">
            <React.Suspense fallback={<div>Loading...</div>}>
                <CheckoutContent />
            </React.Suspense>
        </MainLayout>
    );
}
