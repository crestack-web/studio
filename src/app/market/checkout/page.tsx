
'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Banknote, Package, Truck, Landmark, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, serverTimestamp, runTransaction, addDoc, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';
import { useCart, CartItem } from '@/context/cart-provider';
import { useMarket } from '@/context/market-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Variant { id: string; name: string; price: number; availableQuantity: number; }
interface MarketProduct { businessId: string; productName: string; price: number; images?: string[]; hint?: string; availableQuantity: number; hasVariants?: boolean; variants?: Variant[]; }
type MarketSettings = { isStoreActive: boolean; payment: { allowBankTransfer: boolean; allowPayOnDelivery: boolean; bankName: string; accountNumber: string; paymentInstructions: string; }; delivery: { allowDelivery: boolean; allowPickup: boolean; deliveryFee: number; deliveryDays: string[]; }; };
interface BusinessProfile { businessName: string; marketSettings?: MarketSettings; currency?: string; }

type CheckoutItem = {
    productId: string;
    productName: string;
    variantId?: string;
    variantName?: string;
    quantity: number;
    price: number;
    image?: string;
    businessId: string;
};


const CheckoutContent = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const { items: cartItems, clearCart } = useCart();
    const { market } = useMarket();
    
    // State for checkout items
    const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(true);

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [fulfillmentMethod, setFulfillmentMethod] = useState('delivery');
    const [paymentMethod, setPaymentMethod] = useState('busmopay');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');

    // This effect determines what's in the checkout. It can be a single item ("Buy Now") or the whole cart.
    useEffect(() => {
        const productId = searchParams?.productId as string | undefined;
        const variantId = searchParams?.variantId as string | undefined;
        const quantityStr = searchParams?.quantity as string | undefined;

        const fetchProductData = async (pId: string, vId: string | null, qty: number) => {
            if (!firestore) return;
            setIsLoadingItems(true);
            const productRef = doc(firestore, 'marketProducts', pId);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                const productData = productSnap.data() as MarketProduct;
                const variant = vId ? productData.variants?.find(v => v.id === vId) : undefined;
                setCheckoutItems([{
                    productId: pId,
                    productName: productData.productName,
                    variantId: vId ?? undefined,
                    variantName: variant?.name,
                    quantity: qty,
                    price: variant?.price || productData.price,
                    image: productData.images?.[0],
                    businessId: productData.businessId
                }]);
            }
            setIsLoadingItems(false);
        };
        
        if (productId && quantityStr) { // "Buy Now" flow
            fetchProductData(productId, variantId || null, parseInt(quantityStr, 10));
        } else if (cartItems.length > 0) { // "Cart Checkout" flow
            const items: CheckoutItem[] = cartItems.map(item => ({
                productId: item.id,
                productName: item.name,
                variantId: item.variantId,
                variantName: item.variantName,
                quantity: item.quantity,
                price: item.price,
                image: item.image,
                businessId: '' // Will be fetched later or assumed to be the same
            }));
            // For now, assuming all items are from the same business for simplicity.
            // A more robust solution would fetch businessId for each item or group them.
            if (items.length > 0) {
                 const fetchBusinessId = async () => {
                     if (!firestore) return;
                     const productRef = doc(firestore, 'marketProducts', items[0].productId);
                     const productSnap = await getDoc(productRef);
                     if (productSnap.exists()) {
                        const businessId = (productSnap.data() as MarketProduct).businessId;
                        setCheckoutItems(items.map(it => ({ ...it, businessId })));
                     }
                     setIsLoadingItems(false);
                 }
                 fetchBusinessId();
            } else {
                 setIsLoadingItems(false);
            }
        } else {
             setIsLoadingItems(false);
        }
    }, [searchParams, cartItems, firestore]);

    const businessId = checkoutItems.length > 0 ? checkoutItems[0].businessId : null;
    
    const businessProfileRef = useMemoFirebase(() => businessId ? doc(firestore, `businessProfiles/${businessId}`) : null, [firestore, businessId]);
    const { data: businessProfile, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);

    const settings = businessProfile?.marketSettings;
    
    useEffect(() => {
        if (settings) {
            setFulfillmentMethod(settings.delivery.allowDelivery ? 'delivery' : 'pickup');
             if (market.country === 'NG') {
                setPaymentMethod('busmopay');
            } else {
                setPaymentMethod(settings.payment.allowPayOnDelivery ? 'delivery' : 'transfer');
            }
        }
    }, [settings, market.country]);

    const { subtotal, deliveryFee, total } = useMemo(() => {
        const sub = checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const fee = fulfillmentMethod === 'delivery' ? settings?.delivery.deliveryFee || 0 : 0;
        return { subtotal: sub, deliveryFee: fee, total: sub + fee };
    }, [checkoutItems, fulfillmentMethod, settings]);


    if (isLoadingItems || isLoadingBusiness || isUserLoading) {
        return (
             <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6"><Skeleton className="h-48 w-full" /></div>
                <div className="space-y-8"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /><Skeleton className="h-14 w-full" /></div>
            </div>
        );
    }
    
    if (!businessProfile || checkoutItems.length === 0) {
        return (
            <div className="text-center">
                <p className="text-muted-foreground">Your cart is empty or the store could not be found.</p>
                <Link href="/market"><Button variant="link">Return to Market</Button></Link>
            </div>
        );
    }
    
    const canPlaceOrder = user && customerName && customerPhone && (fulfillmentMethod === 'pickup' || (fulfillmentMethod === 'delivery' && customerAddress));

    const handlePlaceOrder = async () => {
        if (!canPlaceOrder || !businessId || !firestore || !user) return;
        
        setIsPlacingOrder(true);
        
        try {
            const orderData = {
                buyerId: user.uid,
                sellerBusinessId: businessId,
                customer: { name: customerName, phone: customerPhone, address: fulfillmentMethod === 'delivery' ? customerAddress : '' },
                items: checkoutItems.map(item => ({ 
                    productId: item.productId, 
                    productName: item.productName,
                    variantId: item.variantId || null,
                    variantName: item.variantName || null,
                    quantity: item.quantity, 
                    price: item.price 
                })),
                subtotal, 
                deliveryFee, 
                total,
                status: 'pending' as const,
                fulfillment: fulfillmentMethod,
                payment: paymentMethod,
                payoutStatus: 'unpaid' as const,
                createdAt: serverTimestamp(),
                currency: businessProfile?.currency || 'NGN',
            };

            const newOrderRef = await addDoc(collection(firestore, `businesses/${businessId}/orders`), orderData);

            if (market.country === 'NG' && user.email) {
                const functionUrl = process.env.NEXT_PUBLIC_PAYMENT_FUNCTION_URL;

                if (!functionUrl) {
                    await deleteDoc(newOrderRef);
                    throw new Error('Payment function URL is not configured.');
                }
                
                const response = await fetch(functionUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: newOrderRef.id,
                        amount: total,
                        email: user.email,
                    }),
                });

                if (!response.ok) {
                    await deleteDoc(newOrderRef);
                    throw new Error('Failed to initialize payment.');
                }

                const paymentData = await response.json();

                if (paymentData && paymentData.authorization_url) {
                    clearCart();
                    window.location.href = paymentData.authorization_url;
                } else {
                    await deleteDoc(newOrderRef);
                    throw new Error('Invalid payment initialization response.');
                }
            } else {
                clearCart();
                router.push(`/market/order-confirmation?orderId=${newOrderRef.id}&businessId=${businessId}`);
            }

        } catch (error) {
            console.error("Error placing order: ", error);
            toast({ variant: 'destructive', title: 'Error placing order', description: 'There was an issue placing your order. Please try again.' });
            setIsPlacingOrder(false);
        }
    };
    
    return (
         <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                        {checkoutItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <Image src={item.image || 'https://picsum.photos/seed/placeholder/80/80'} alt={item.productName} width={64} height={64} className="rounded-md object-cover bg-muted" />
                                <div className="flex-1"><p className="font-semibold text-sm">{item.productName} {item.variantName && `(${item.variantName})`}</p><p className="text-sm text-muted-foreground">Qty: {item.quantity}</p></div>
                                <p className="font-semibold text-sm">{formatCurrency(item.price * item.quantity, businessProfile.currency)}</p>
                            </div>
                        ))}
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
                         {market.country === 'NG' ? (
                            <div className="flex items-center rounded-md border-2 p-4 border-primary bg-primary/5">
                                <CreditCard className="h-5 w-5 text-primary mr-4" />
                                <div className="flex-1">
                                    <p className="font-semibold">Pay with BusmoPay</p>
                                    <p className="text-sm text-muted-foreground mt-1">Securely pay with Card, Bank Transfer, or USSD.</p>
                                </div>
                            </div>
                         ) : (
                             <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                                {settings?.payment.allowPayOnDelivery && (<Label htmlFor="pay-on-delivery" className="flex items-start rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="delivery" id="pay-on-delivery" className="peer mt-1" /><div className="ml-4"><div className="flex items-center gap-2 font-semibold"><Banknote className="h-5 w-5 text-primary" /><span>Pay on Delivery</span></div><p className="text-sm text-muted-foreground mt-1">Pay with cash or POS when your order arrives.</p></div></Label>)}
                                {settings?.payment.allowBankTransfer && (<Label htmlFor="bank-transfer" className="flex items-start rounded-md border-2 p-4 cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"><RadioGroupItem value="transfer" id="bank-transfer" className="peer mt-1" /><div className="ml-4"><div className="flex items-center gap-2 font-semibold"><Landmark className="h-5 w-5 text-primary" /><span>Bank Transfer</span></div><p className="text-sm text-muted-foreground mt-1">You'll receive account details after placing your order.</p></div></Label>)}
                            </RadioGroup>
                         )}
                    </CardContent>
                </Card>
                
                <Button className="w-full h-14 text-lg" onClick={handlePlaceOrder} disabled={!canPlaceOrder || isPlacingOrder}>
                    {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Place Order
                </Button>
            </div>
        </div>
    );
}

export default function CheckoutPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CheckoutContent searchParams={searchParams} />
        </Suspense>
    );
}
