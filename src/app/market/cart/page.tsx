'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import MarketLayout from '@/components/app/market-layout';
import { useCart } from '@/context/cart-provider';
import { formatCurrency } from '@/lib/currency';

export default function CartPage() {
    const { items, updateQuantity, removeItem, totalItems } = useCart();
    const router = useRouter();

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handleCheckout = () => {
        router.push('/market/checkout');
    };

    return (
        <MarketLayout>
            <div className="w-full max-w-4xl">
                <h1 className="text-3xl font-bold font-headline mb-8">Your Cart</h1>
                {items.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card">
                         <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h2 className="mt-6 text-xl font-semibold">Your cart is empty</h2>
                        <p className="mt-2 text-sm text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
                        <Button asChild className="mt-6">
                            <Link href="/market">Start Shopping</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-4">
                            {items.map(item => (
                                <Card key={`${item.id}-${item.variantId}`} className="overflow-hidden">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <Image 
                                            src={item.image || 'https://picsum.photos/seed/placeholder/100/100'} 
                                            alt={item.name}
                                            width={100}
                                            height={100}
                                            className="rounded-md object-cover bg-muted"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <p className="font-semibold">{item.name}</p>
                                            {item.variantName && <p className="text-sm text-muted-foreground">{item.variantName}</p>}
                                            <p className="font-bold text-lg">{formatCurrency(item.price)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center rounded-md border">
                                                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => updateQuantity(item.id, item.variantId, item.quantity - 1)}><Minus className="w-4 h-4"/></Button>
                                                <span className="w-8 text-center font-bold">{item.quantity}</span>
                                                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => updateQuantity(item.id, item.variantId, item.quantity + 1)}><Plus className="w-4 h-4"/></Button>
                                            </div>
                                             <Button variant="outline" size="icon" onClick={() => removeItem(item.id, item.variantId)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="lg:col-span-1 sticky top-24">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal ({totalItems} items)</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Delivery fees will be calculated at checkout.</p>
                                    <Button className="w-full h-12 text-lg" onClick={handleCheckout}>
                                        Proceed to Checkout
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </MarketLayout>
    );
}
