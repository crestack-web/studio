'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Menu } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const categories = [
    {
        name: 'Fashion & Apparel',
        products: [
            { id: '1', name: 'Handmade Leather Bag', price: 12000, business: 'Aisha\'s Crafts', image: 'https://picsum.photos/seed/market-fashion-1/400/300', hint: 'leather bag' },
            { id: '2', name: 'Ankara Print Scarf', price: 3500, business: 'Tunde\'s Textiles', image: 'https://picsum.photos/seed/market-fashion-2/400/300', hint: 'ankara scarf' },
            { id: '3', name: 'Beaded Necklace', price: 5000, business: 'Jewels by Ada', image: 'https://picsum.photos/seed/market-fashion-3/400/300', hint: 'beaded necklace' },
            { id: '4', name: 'Men\'s Kaftan', price: 18000, business: 'Classic Gents', image: 'https://picsum.photos/seed/market-fashion-4/400/300', hint: 'mens kaftan' },
        ]
    },
    {
        name: 'Food & Groceries',
        products: [
            { id: '5', name: 'Organic Honey (500ml)', price: 4000, business: 'Femi\'s Farm', image: 'https://picsum.photos/seed/market-food-1/400/300', hint: 'organic honey' },
            { id: '6', name: 'Spicy Suya Kilishi', price: 2500, business: 'Mama\'s Kitchen', image: 'https://picsum.photos/seed/market-food-2/400/300', hint: 'spicy kilishi' },
            { id: '7', name: 'Freshly Ground Egusi', price: 1500, business: 'Everyday Needs', image: 'https://picsum.photos/seed/market-food-3/400/300', hint: 'ground egusi' },
            { id: '8', name: 'Aged Garri Ijebu', price: 2000, business: 'Market Direct', image: 'https://picsum.photos/seed/market-food-4/400/300', hint: 'garri ijebu' },
        ]
    },
    {
        name: 'Electronics',
        products: [
            { id: '9', name: 'Rechargeable Fan', price: 25000, business: 'City Electronics', image: 'https://picsum.photos/seed/market-electronics-1/400/300', hint: 'rechargeable fan' },
            { id: '10', name: 'Solar Power Bank', price: 15000, business: 'Gadget Hub', image: 'https://picsum.photos/seed/market-electronics-2/400/300', hint: 'solar powerbank' },
        ]
    }
];

export default function MarketPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
                <div className="container mx-auto flex h-20 items-center justify-between px-4">
                    <Link href="/welcome"><Logo className="h-8" /></Link>
                    
                    {/* Desktop Search */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-8">
                         <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Search for products..." className="pl-10 h-12 text-base" />
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login" passHref>
                            <Button variant="ghost">For Businesses</Button>
                        </Link>
                        <Button>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            Cart (0)
                        </Button>
                    </div>

                    {/* Mobile Nav */}
                    <div className="md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Menu</SheetTitle>
                                </SheetHeader>
                                <Logo className="h-8 mb-8" />
                                <div className="relative mb-8">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="Search for products..." className="pl-10 h-12 text-base" />
                                </div>
                                <nav className="flex flex-col gap-4">
                                    <Link href="/login" passHref>
                                        <Button variant="ghost" className="w-full justify-start text-lg">For Businesses</Button>
                                    </Link>
                                    <Button className="w-full justify-start text-lg">
                                        <ShoppingCart className="mr-2 h-5 w-5" />
                                        Cart (0)
                                    </Button>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                 <div className="container mx-auto px-4 py-8">
                     <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
                            Busmo Market
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                            Discover and buy from the best local businesses, all in one place.
                        </p>
                    </div>
                    
                    <div className="space-y-12">
                        {categories.map(category => (
                            <section key={category.name}>
                                <h2 className="text-2xl font-bold font-headline mb-6">{category.name}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {category.products.map(product => (
                                         <Link href={`/market/product/${product.id}`} key={product.id}>
                                            <Card className="overflow-hidden group cursor-pointer h-full flex flex-col">
                                                <div className="aspect-video overflow-hidden">
                                                    <Image 
                                                        src={product.image}
                                                        alt={product.name}
                                                        width={400}
                                                        height={300}
                                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                                        data-ai-hint={product.hint}
                                                    />
                                                </div>
                                                <CardContent className="p-4 flex-1 flex flex-col">
                                                    <h3 className="font-semibold text-lg flex-1">{product.name}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1">by {product.business}</p>
                                                    <p className="font-bold text-xl mt-4">₦{product.price.toLocaleString()}</p>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                 </div>
            </main>
        </div>
    );
}
