'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { Logo } from './logo';

const mockProducts = [
    { id: '1', name: 'Handmade Leather Bag', price: 12000, image: 'https://picsum.photos/seed/market-fashion-1/400/300', hint: 'leather bag' },
    { id: '5', name: 'Organic Honey (500ml)', price: 4000, image: 'https://picsum.photos/seed/market-food-1/400/300', hint: 'organic honey' },
    { id: '9', name: 'Rechargeable Fan', price: 25000, image: 'https://picsum.photos/seed/market-electronics-1/400/300', hint: 'rechargeable fan' },
    { id: '2', name: 'Ankara Print Scarf', price: 3500, image: 'https://picsum.photos/seed/market-fashion-2/400/300', hint: 'ankara scarf' },
];


export function MarketMockup() {
  return (
    <div className="relative w-full h-full bg-background rounded-xl overflow-hidden shadow-2xl border-8 border-foreground/10">
      <header className="p-3 bg-card/80 border-b flex items-center justify-between">
        <Logo className="h-6 text-xl" />
        <div className="relative w-3/5">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-7 h-8 text-xs bg-background" />
        </div>
        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
      </header>
      <main className="p-3 overflow-y-auto bg-muted/20 h-full">
        <h2 className="text-sm font-bold mb-3 font-headline">Top Products</h2>
        <div className="grid grid-cols-2 gap-3">
          {mockProducts.map(product => (
            <Card key={product.id} className="overflow-hidden group cursor-pointer h-full flex flex-col bg-card">
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
          ))}
        </div>
      </main>
    </div>
  );
}
