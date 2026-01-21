
'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import MainLayout from '@/components/app/main-layout';
import { Banknote, Package, Truck, Landmark, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';

interface MarketProduct { businessId: string; productName: string; price: number; image?: string; hint?: string; availableQuantity: number; }
type MarketSettings = { isStoreActive: boolean; payment: { allowBankTransfer: boolean; allowPayOnDelivery: boolean; bankName: string; accountNumber: string; paymentInstructions: string; }; delivery: { allowDelivery: boolean; allowPickup: boolean; deliveryFee: number; deliveryDays: string[]; }; };
interface BusinessProfile { businessName: string; marketSettings?: MarketSettings; currency?: string; }

const CheckoutContent = () => {
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    
    const productId = searchParams.get('productId');
    const quantity = parseInt(searchParams.get('quantity') || '1', 10);
    
    const fullRedirectUrl = useMemo(
        () => `/market/checkout?productId=${productId}&quantity=${quantity}`,
        [productId, quantity]
    );

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    
    const productRef = useMemoFirebase(() => productId ? doc(firestore, `marketProducts/${productId}`) : null, [firestore, productId]);
    const { data: productData, isLoading: isLoadingProduct } = useDoc<MarketProduct>(productRef);
    
    const businessProfileRef = useMemoFirebase(() => productData?.businessId ? doc(firestore, `businessProfiles/${productData.businessId}`) : null, [firestore, productData?.businessId]);
    const { data: businessProfile, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);
    
    const [fulfillmentMethod, setFulfillmentMethod] = useState('delivery');
    const [paymentMethod, setPaymentMethod] = useState('delivery');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    
    const settings = businessProfile?.marketSettings;

    useEffect(() => {
        if (!isUserLoading && !user) {
            toast({
                title: "Authentication Required",
                description: "You need to log in to place an order.",
                variant: "destructive"
            });
            router.push(`/login?redirect=${encodeURIComponent(fullRedirectUrl)}`);
        }
    }, [isUserLoading, user, router, toast, fullRedirectUrl]);

    useEffect(() => {
        if (settings) {
            setFulfillmentMethod(settings.delivery.allowDelivery ? 'delivery' : 'pickup');
            setPaymentMethod(settings.payment.allowPayOnDelivery ? 'delivery' : 'transfer');
        }
    }, [settings]);

    if (isLoadingProduct || isLoadingBusiness || isUserLoading) {
        return (
             <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6"><Skeleton className="h-48 w-full" /></div>
                <div className="space-y-8"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /><Skeleton className="h-14 w-full" /></div>
            </div>
        );
    }
    
    if (!productData || !businessProfile) {
        return (
            <div className="text-center">
                <p className="text-muted-foreground">Product or store not found.</p>
                <Link href="/market"><Button variant="link">Return to Market</Button></Link>
            </div>
        );
    }

    const subtotal = productData.price * quantity;
    const deliveryFee = fulfillmentMethod === 'delivery' ? settings?.delivery.deliveryFee || 0 : 0;
    const total = subtotal + deliveryFee;
    
    const canPlaceOrder = user && customerName && customerPhone && (fulfillmentMethod === 'pickup' || (fulfillmentMethod === 'delivery' && customerAddress));

    const handlePlaceOrder = async () => {
        if (!canPlaceOrder || !productData.businessId || !firestore || !productId || !user) return;
        
        setIsPlacingOrder(true);
        
        try {
            const batch = writeBatch(firestore);
            const ordersColRef = collection(firestore, 'orders');
            const newOrderRef = doc(ordersColRef);

            const orderData = {
                buyerId: user.uid,
                sellerBusinessId: productData.businessId,
                customer: { name: customerName, phone: customerPhone, address: fulfillmentMethod === 'delivery' ? customerAddress : '' },
                items: [{ productId, productName: productData.productName, quantity, price: productData.price }],
                subtotal, deliveryFee, total,
                status: 'pending',
                fulfillment: fulfillmentMethod,
                payment: paymentMethod,
                createdAt: serverTimestamp()
            };
            batch.set(newOrderRef, orderData);

            await batch.commit();

            router.push(`/market/order-confirmation?orderId=${newOrderRef.id}`);
            
        } catch (error) {
            console.error("Error placing order: ", error);
            toast({ variant: 'destructive', title: 'Error placing order', description: 'There was an issue placing your order. Please try again.' });
        } finally {
            setIsPlacingOrder(false);
        }
    };
    
    return (
         <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Image src={productData.image || 'https://picsum.photos/seed/placeholder/80/80'} alt={productData.productName} width={80} height={80} className="rounded-md object-cover bg-muted" data-ai-hint={productData.hint} />
                            <div className="flex-1"><p className="font-semibold">{productData.productName}</p><p className="text-sm text-muted-foreground">Qty: {quantity}</p></div>
                            <p className="font-semibold">{formatCurrency(subtotal, businessProfile.currency)}</p>
                        </div>
                        <Separator className="my-4" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal, businessProfile.currency)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>{formatCurrency(deliveryFee, businessProfile.currency)}</span></div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(total, businessProfile.currency)}</span></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                <Card><CardHeader><CardTitle>Your Details</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" placeholder="Enter your full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></div><div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" type="tel" placeholder="Enter your phone number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required /></div></CardContent></Card>
                <Card><CardHeader><CardTitle>How would you like to get your order?</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <RadioGroup value={fulfillmentMethod} onValueChange={setFulfillmentMethod} className="space-y-4">
                            {settings?.delivery.allowDelivery && (<Label htmlFor="delivery" className="flex items-start rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="delivery" id="delivery" className="peer mt-1" /><div className="ml-4"><div className="flex items-center gap-2 font-semibold"><Truck className="h-5 w-5 text-primary" /><span>Home Delivery</span></div><p className="text-sm text-muted-foreground mt-1">Fee: {formatCurrency(settings.delivery.deliveryFee, businessProfile.currency)}. Delivered on {settings.delivery.deliveryDays.join(', ')}.</p></div></Label>)}
                            {settings?.delivery.allowPickup && (<Label htmlFor="pickup" className="flex items-start rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="pickup" id="pickup" className="peer mt-1" /><div className="ml-4"><div className="flex items-center gap-2 font-semibold"><Package className="h-5 w-5 text-primary" /><span>In-store Pickup</span></div><p className="text-sm text-muted-foreground mt-1">Pick up your order directly from {businessProfile.businessName}. No extra fees.</p></div></Label>)}
                        </RadioGroup>
                        {fulfillmentMethod === 'delivery' && (<div className="space-y-2 pt-4 border-t mt-4"><Label htmlFor="address">Delivery Address</Label><Textarea id="address" placeholder="Enter your full street address, city, and state" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required /></div>)}
                    </CardContent>
                </Card>
                <Card><CardHeader><CardTitle>How would you like to pay?</CardTitle></CardHeader>
                    <CardContent>
                         <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                             {settings?.payment.allowPayOnDelivery && (<Label htmlFor="pay-on-delivery" className="flex items-start rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="delivery" id="pay-on-delivery" className="peer mt-1" /><div className="ml-4"><div className="flex items-center gap-2 font-semibold"><Banknote className="h-5 w-5 text-primary" /><span>Pay on Delivery</span></div><p className="text-sm text-muted-foreground mt-1">Pay with cash or POS when your order arrives.</p></div></Label>)}
                             {settings?.payment.allowBankTransfer && (<Label htmlFor="bank-transfer" className="flex items-start rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="transfer" id="bank-transfer" className="peer mt-1" /><div className="ml-4"><div className="flex items-center gap-2 font-semibold"><Landmark className="h-5 w-5 text-primary" /><span>Bank Transfer</span></div><p className="text-sm text-muted-foreground mt-1">You'll receive account details after placing your order.</p></div></Label>)}
                        </RadioGroup>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg" onClick={handlePlaceOrder} disabled={!canPlaceOrder || isPlacingOrder}>
                    {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Place Order ({formatCurrency(total, businessProfile.currency)})
                </Button>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <MainLayout title="Checkout" backHref="/market">
            <Suspense fallback={<div>Loading...</div>}>
                <CheckoutContent />
            </Suspense>
        </MainLayout>
    );
}

    