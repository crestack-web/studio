'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Menu } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';

interface MarketProduct {
    id: string; // Document ID, which is the same as productId
    productName: string;
    businessName: string;
    price: number;
    category: string;
    description?: string;
    availableQuantity?: number;
    image?: string;
    hint?: string;
}

export default function MarketPage() {
    const firestore = useFirestore();

    const marketProductsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketProducts'));
    }, [firestore]);

    const { data: productsData, isLoading: isLoadingProducts } = useCollection<MarketProduct>(marketProductsQuery);

    const categories = useMemo(() => {
        if (!productsData) return [];

        const grouped: { [key: string]: MarketProduct[] } = {};

        productsData.forEach(product => {
            const categoryName = product.category || 'other';
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
            }
            grouped[categoryName].push(product);
        });

        const categoryMap: { [key: string]: string } = {
            'food': 'Food & Groceries',
            'fashion': 'Fashion & Apparel',
            'electronics': 'Electronics',
            'health': 'Health & Beauty',
            'home': 'Home & Garden',
            'other': 'Other'
        };

        return Object.keys(grouped).map(categoryKey => ({
            name: categoryMap[categoryKey] || categoryMap['other'],
            products: grouped[categoryKey]
        })).sort((a, b) => a.name.localeCompare(b.name));

    }, [productsData]);

    const renderSkeletons = () => (
        <section>
             <Skeleton className="h-8 w-1/3 mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="overflow-hidden group h-full flex flex-col">
                        <Skeleton className="aspect-video w-full" />
                        <CardContent className="p-4 flex-1 flex flex-col">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-4" />
                            <Skeleton className="h-8 w-1/3" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );

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
                                <SheetHeader>
                                    <SheetTitle className="sr-only">Menu</SheetTitle>
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
                        {isLoadingProducts ? (
                            <>
                                {renderSkeletons()}
                                {renderSkeletons()}
                            </>
                        ) : categories.length > 0 ? (
                            categories.map(category => (
                                <section key={category.name}>
                                    <h2 className="text-2xl font-bold font-headline mb-6">{category.name}</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {category.products.map(product => (
                                             <Link href={`/market/product/${product.id}`} key={product.id}>
                                                <Card className="overflow-hidden group cursor-pointer h-full flex flex-col">
                                                    <div className="aspect-video overflow-hidden">
                                                        <Image 
                                                            src={product.image || `https://picsum.photos/seed/${product.id}/400/300`}
                                                            alt={product.productName}
                                                            width={400}
                                                            height={300}
                                                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                                            data-ai-hint={product.hint || product.productName.split(' ').slice(0,2).join(' ')}
                                                        />
                                                    </div>
                                                    <CardContent className="p-4 flex-1 flex flex-col">
                                                        <h3 className="font-semibold text-lg flex-1">{product.productName}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1">by {product.businessName}</p>
                                                        <p className="font-bold text-xl mt-4">{formatCurrency(product.price)}</p>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            ))
                        ) : (
                             <div className="text-center py-20 border rounded-lg bg-card">
                                <h2 className="text-xl font-semibold">The Market is Empty</h2>
                                <p className="text-muted-foreground mt-2">No products have been listed for sale yet. Check back soon!</p>
                            </div>
                        )}
                    </div>
                 </div>
            </main>
        </div>
    );
}
