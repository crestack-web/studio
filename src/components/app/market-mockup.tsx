'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, MousePointer2 } from 'lucide-react';
import Image from 'next/image';
import { Logo } from './logo';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';


const mockProducts = [
    { id: '1', name: 'Handmade Leather Bag', price: 12000, image: 'https://picsum.photos/seed/market-fashion-1/400/300', hint: 'leather bag' },
    { id: '5', name: 'Organic Honey (500ml)', price: 4000, image: 'https://picsum.photos/seed/market-food-1/400/300', hint: 'organic honey' },
    { id: '9', name: 'Rechargeable Fan', price: 25000, image: 'https://picsum.photos/seed/market-electronics-1/400/300', hint: 'rechargeable fan' },
    { id: '2', name: 'Ankara Print Scarf', price: 3500, image: 'https://picsum.photos/seed/market-fashion-2/400/300', hint: 'ankara scarf' },
];


export function MarketMockup() {
    const [searchValue, setSearchValue] = useState('');
    const [cursorPosition, setCursorPosition] = useState({ top: -100, left: -100 });
    const [cursorVisible, setCursorVisible] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isCardClicked, setIsCardClicked] = useState(false);

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

        const typeSearch = (text: string) => {
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
                }, 150);
                timeouts.push(interval as unknown as NodeJS.Timeout);
            });
        };
        
        const moveCursorTo = (elementKey: string, duration = 1000) => {
             return new Promise(resolve => {
                 const element = elementsRef.current[elementKey];
                 if (!element || !container) return resolve(false);
                 const containerRect = container.getBoundingClientRect();
                 const elemRect = element.getBoundingClientRect();
                 setCursorVisible(true);
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

        const animationSequence = async () => {
            setSearchValue('');
            setIsCardClicked(false);
            setCursorVisible(false);

            await new Promise(resolve => timeouts.push(setTimeout(resolve, 500)));

            // 1. Move to search bar
            await moveCursorTo('search');

            // 2. Click search bar and type
            await click();
            await typeSearch('leather bag');

            await new Promise(resolve => timeouts.push(setTimeout(resolve, 1500)));

            // 3. Move to product
            await moveCursorTo('productCard');

            // 4. Click product
            await click();
            setIsCardClicked(true);

            // 5. Hide cursor and reset
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 1000)));
            setCursorVisible(false);
            timeouts.push(setTimeout(animationSequence, 4000));
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
          opacity: cursorVisible ? 1 : 0,
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
      <main className="p-3 overflow-y-auto bg-muted/20 h-full">
        <h2 className="text-sm font-bold mb-3 font-headline">Top Products</h2>
        <div className="grid grid-cols-2 gap-3">
          {mockProducts.map((product, i) => (
            <div key={product.id} ref={el => { if (i === 0) elementsRef.current['productCard'] = el}}>
                <Card className={cn(
                    "overflow-hidden group cursor-pointer h-full flex flex-col bg-card transition-all duration-200",
                    isCardClicked && i === 0 && "ring-2 ring-primary"
                )}>
                    <div className="aspect-square overflow-hidden relative">
                        <Image 
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            data-ai-hint={product.hint}
                        />
                    </div>
                    <CardContent className="p-2 flex-1 flex flex-col">
                        <h3 className="font-semibold text-xs flex-1 leading-tight">{product.name}</h3>
                        <p className="font-bold text-sm mt-1">₦{product.price.toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
