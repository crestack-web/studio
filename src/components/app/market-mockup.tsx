'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, MousePointer2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { Logo } from './logo';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

const mockProduct = { id: '1', name: 'Handmade Leather Bag', price: 12000, image: 'https://images.unsplash.com/photo-1473188588951-666fce8e7c68?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwYmFnfGVufDB8fHx8MTc2ODgyNTM3OXww&ixlib=rb-4.1.0&q=80&w=1080', hint: 'leather bag', business: "Aisha's Crafts" };

const otherProducts = [
    { id: '5', name: 'Organic Honey (500ml)', price: 4000, image: 'https://images.unsplash.com/photo-1645549826194-1956802d83c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwaG9uZXl8ZW58MHx8fHwxNzY4ODI1MzgwfDA&ixlib=rb-4.1.0&q=80&w=1080', hint: 'organic honey', business: "Femi's Farm" },
    { id: '9', name: 'Rechargeable Fan', price: 25000, image: 'https://images.unsplash.com/photo-1718815416565-c65944a5ec14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxyZWNoYXJnZWFibGUlMjBmYW58ZW58MHx8fHwxNzY4ODI1Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080', hint: 'rechargeable fan', business: "City Electronics" },
    { id: '2', name: 'Ankara Print Scarf', price: 3500, image: 'https://images.unsplash.com/photo-1701252498509-85c18de28d2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhbmthcmElMjBzY2FyZnxlbnwwfHx8fDE3Njg4MjUzODB8MA&ixlib=rb-4.1.0&q=80&w=1080', hint: 'ankara scarf', business: "Tunde's Textiles" },
];

type View = 'list' | 'product_detail' | 'checkout' | 'confirmation';


export function MarketMockup() {
    const [view, setView] = useState<View>('list');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [cursorPosition, setCursorPosition] = useState({ top: -100, left: -100 });
    const [isClicking, setIsClicking] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const elementsRef = useRef<{ [key: string]: HTMLElement | null }>({});

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let timeouts: NodeJS.Timeout[] = [];
        const clearTimeouts = () => {
            timeouts.forEach(clearTimeout);
            timeouts = [];
        };
        
        const animateStep = async (step: Function) => {
            return new Promise(resolve => {
                timeouts.push(setTimeout(() => {
                    step();
                    resolve(true);
                }, 0));
            });
        }

        const typeSearch = (text: string, duration = 150) => {
            return new Promise(resolve => {
                let i = 0;
                const interval = setInterval(() => {
                    if (i < text.length) {
                        setSearchValue(text.substring(0, i + 1));
                        i++;
                    } else {
                        clearInterval(interval);
                        resolve(true);
                    }
                }, duration);
                timeouts.push(interval as unknown as NodeJS.Timeout);
            });
        };
        
        const moveCursorTo = (elementKey: string, duration = 1500) => {
             return new Promise(resolve => {
                 const element = elementsRef.current[elementKey];
                 if (!element || !container) return resolve(false);
                 const containerRect = container.getBoundingClientRect();
                 const elemRect = element.getBoundingClientRect();
                 setCursorPosition({
                     top: elemRect.top - containerRect.top + elemRect.height / 2,
                     left: elemRect.left - containerRect.left + elemRect.width / 2,
                 });
                 timeouts.push(setTimeout(resolve, duration));
            });
        }

        const click = (duration = 400) => {
             return new Promise(resolve => {
                setIsClicking(true);
                timeouts.push(setTimeout(() => {
                    setIsClicking(false);
                    resolve(true);
                }, duration));
            });
        }

        const changeView = (newView: View) => {
             return new Promise(resolve => {
                setIsTransitioning(true);
                timeouts.push(setTimeout(() => {
                    setView(newView);
                    setIsTransitioning(false);
                    resolve(true);
                }, 600));
            });
        }

        const animationSequence = async () => {
            await animateStep(() => {
                setView('list');
                setSearchValue('');
                setCursorPosition({ top: -100, left: -100 });
            });

            await new Promise(resolve => timeouts.push(setTimeout(resolve, 2000)));

            // 1. Move to search bar and type
            await moveCursorTo('search');
            await click();
            await typeSearch('leather bag');
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 1500)));

            // 2. Move to product card and click
            await moveCursorTo('productCard');
            await click();
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 500)));
            await changeView('product_detail');
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 2000)));

            // 3. Move to checkout button and click
            await moveCursorTo('checkoutBtn');
            await click();
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 500)));
            await changeView('checkout');
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 2000)));

            // 4. Move to place order button and click
            await moveCursorTo('placeOrderBtn');
            await click();
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 500)));
            await changeView('confirmation');
            
            // 5. Reset
            timeouts.push(setTimeout(animationSequence, 5000));
        };

        timeouts.push(setTimeout(animationSequence, 3000));
        return clearTimeouts;

    }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-background rounded-xl overflow-hidden shadow-2xl border-8 border-foreground/10">
      <MousePointer2
        style={{
          top: cursorPosition.top,
          left: cursorPosition.left,
          opacity: isTransitioning ? 0 : 1,
          transform: `scale(${isClicking ? 0.9 : 1}) rotate(-15deg)`,
        }}
        className="absolute text-foreground transition-all duration-500 ease-in-out z-50 pointer-events-none h-5 w-5 -translate-x-1 -translate-y-1"
      />
      <header className="p-3 bg-card/80 border-b flex items-center justify-between">
        <Logo className="h-6 text-xl" />
        <div ref={el => elementsRef.current['search'] = el} className="relative w-3/5">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchValue} placeholder="Search..." className="pl-7 h-8 text-xs bg-background" readOnly />
        </div>
        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
      </header>
      <main className="p-3 overflow-y-auto bg-muted/20 h-full relative">
        <div className={cn("absolute inset-3 space-y-2 transition-all duration-300", !isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none')}>
            
            {/* List View */}
            {view === 'list' && (
                <>
                    <h2 className="text-sm font-bold font-headline">Top Products</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {[mockProduct, ...otherProducts].map((product, i) => (
                            <div key={product.id} ref={el => { if (i === 0) elementsRef.current['productCard'] = el}}>
                                <Card className="overflow-hidden group cursor-pointer h-full flex flex-col bg-card">
                                    <div className="aspect-square overflow-hidden relative">
                                        <Image src={product.image} alt={product.name} fill className="object-cover" data-ai-hint={product.hint} />
                                    </div>
                                    <CardContent className="p-2 flex-1 flex flex-col">
                                        <h3 className="font-semibold text-xs flex-1 leading-tight">{product.name}</h3>
                                        <p className="font-bold text-sm mt-1">₦{product.price.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Product Detail View */}
            {view === 'product_detail' && (
                <div className="space-y-3">
                    <Card className="overflow-hidden">
                         <div className="aspect-video relative">
                            <Image src={mockProduct.image} alt={mockProduct.name} fill className="object-cover" data-ai-hint={mockProduct.hint} />
                        </div>
                    </Card>
                    <h1 className="text-base font-bold">{mockProduct.name}</h1>
                    <p className="text-xs text-muted-foreground -mt-2">by {mockProduct.business}</p>
                    <p className="text-lg font-bold text-primary">₦{mockProduct.price.toLocaleString()}</p>
                     <Button ref={el => elementsRef.current['checkoutBtn'] = el} className="w-full h-9 text-sm">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Proceed to Checkout
                    </Button>
                </div>
            )}
            
            {/* Checkout View */}
            {view === 'checkout' && (
                <div className="space-y-3">
                    <h1 className="text-base font-bold">Checkout</h1>
                    <Card>
                        <CardContent className="p-2 space-y-2">
                             <div className="flex justify-between items-center text-xs">
                                <span>{mockProduct.name} (x1)</span>
                                <span className="font-semibold">₦{mockProduct.price.toLocaleString()}</span>
                            </div>
                            <Separator />
                             <div className="flex justify-between items-center text-sm font-bold">
                                <span>Total</span>
                                <span>₦{mockProduct.price.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                     <div className="space-y-1">
                        <Label className="text-xs">Full Name</Label>
                        <Input className="h-7 text-xs" value="Tunde Oladipo" readOnly />
                    </div>
                     <div className="space-y-1">
                        <Label className="text-xs">Delivery Address</Label>
                        <Input className="h-7 text-xs" value="123 Allen Avenue, Ikeja" readOnly />
                    </div>
                    <Button ref={el => elementsRef.current['placeOrderBtn'] = el} className="w-full h-9 text-sm">Place Order</Button>
                </div>
            )}

            {/* Confirmation View */}
            {view === 'confirmation' && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <CheckCircle2 className="w-12 h-12 text-success mb-2" />
                    <h1 className="text-lg font-bold">Order Placed!</h1>
                    <p className="text-xs text-muted-foreground">Your order for the {mockProduct.name} is confirmed.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
