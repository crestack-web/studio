'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ShoppingCart, Menu, Star, Zap, ShieldCheck, Truck, PackageCheck, UtensilsCrossed, Shirt, Laptop, Armchair, Sparkles, Tag } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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

const heroBanners = [
    { id: 'banner-clearance', title: 'Clearance Sale', subtitle: 'Up to 50% Off Select Items', image: PlaceHolderImages.find(i => i.id === 'sale-banner-1'), buttonText: 'Shop Now' },
    { id: 'banner-new', title: 'New Arrivals', subtitle: 'Fresh Picks for the New Season', image: PlaceHolderImages.find(i => i.id === 'sale-banner-2'), buttonText: 'Discover More' },
    { id: 'banner-wholesale', title: 'Wholesale Deals', subtitle: 'Buy in Bulk and Save Big', image: PlaceHolderImages.find(i => i.id === 'sale-banner-3'), buttonText: 'View Deals' },
];

const categories = [
    { name: 'Groceries', icon: UtensilsCrossed },
    { name: 'Fashion', icon: Shirt },
    { name: 'Electronics', icon: Laptop },
    { name: 'Home & Office', icon: Armchair },
    { name: 'Beauty', icon: Sparkles },
    { name: 'SME Deals', icon: Tag },
    { name: 'Wholesale', icon: ShoppingCart },
];

const trustFeatures = [
    { text: 'Verified Sellers', icon: ShieldCheck },
    { text: 'Secure Payments', icon: PackageCheck },
    { text: 'Fast Delivery', icon: Truck },
    { text: 'SME Friendly', icon: Star },
];

const ProductCard = ({ product }: { product: MarketProduct }) => {
    // Mock data for UI purposes
    const oldPrice = product.price * 1.25;
    const discount = Math.round(((oldPrice - product.price) / oldPrice) * 100);

    return (
        <Link href={`/market/product/${product.id}`} key={product.id}>
            <Card className="overflow-hidden group cursor-pointer h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-square overflow-hidden relative">
                    <Image
                        src={product.image || `https://picsum.photos/seed/${product.id}/400/300`}
                        alt={product.productName || 'Product image'}
                        fill
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={product.hint || (product.productName || '').split(' ').slice(0, 2).join(' ')}
                    />
                    <Badge variant="destructive" className="absolute top-2 right-2">-{discount}%</Badge>
                </div>
                <CardContent className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm leading-snug flex-1 line-clamp-2">{product.productName || 'Unnamed Product'}</h3>
                    <div className="mt-2">
                        <p className="font-bold text-base">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-muted-foreground line-through">{formatCurrency(oldPrice)}</p>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-3 h-3", i < 4 ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />)}
                        <span className="text-xs text-muted-foreground ml-1">(25)</span>
                    </div>
                    <Button size="sm" className="w-full mt-3 h-9">Add to Cart</Button>
                </CardContent>
            </Card>
        </Link>
    );
};


export default function MarketPage() {
    const firestore = useFirestore();

    const marketProductsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketProducts'));
    }, [firestore]);

    const { data: productsData, isLoading: isLoadingProducts } = useCollection<MarketProduct>(marketProductsQuery);
    
    // Mock data for UI
    const flashDeals = useMemo(() => productsData?.slice(0, 6) || [], [productsData]);

    const [timeLeft, setTimeLeft] = useState({
        hours: '00',
        minutes: '00',
        seconds: '00',
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            // Set flash sale to end at midnight of the next day
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
            const difference = endOfDay.getTime() - now.getTime();

            let timeLeftData: { hours?: number; minutes?: number; seconds?: number } = {};

            if (difference > 0) {
                timeLeftData = {
                    hours: Math.floor((difference / (1000 * 60 * 60))),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }

            return timeLeftData;
        };
        
        const timer = setInterval(() => {
            const times = calculateTimeLeft();
            const format = (num: number) => String(num).padStart(2, '0');
            
            if (times.hours !== undefined && times.minutes !== undefined && times.seconds !== undefined) {
                setTimeLeft({
                    hours: format(times.hours),
                    minutes: format(times.minutes),
                    seconds: format(times.seconds),
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const renderProductSkeletons = (count: number = 12) => (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(count)].map((_, i) => (
                <Card key={i} className="overflow-hidden h-full flex flex-col">
                    <Skeleton className="aspect-square w-full" />
                    <CardContent className="p-3 flex-1 flex flex-col">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-9 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
                <div className="container mx-auto flex h-20 items-center justify-between px-4 gap-4">
                    <Link href="/welcome"><Logo className="h-8 hidden sm:flex" /></Link>
                    
                    <div className="flex-1 max-w-2xl">
                         <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Search products, stores, or categories" className="pl-10 h-12 text-base" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingCart className="h-6 w-6" />
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">0</Badge>
                            <span className="sr-only">Cart</span>
                        </Button>
                         <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle className="sr-only">Menu</SheetTitle>
                                    <SheetDescription className="sr-only">Main navigation links for the site.</SheetDescription>
                                </SheetHeader>
                                <Logo className="h-8 mb-8" />
                                <nav className="flex flex-col gap-4">
                                    <Link href="/login" passHref>
                                        <Button variant="ghost" className="w-full justify-start text-lg">For Businesses</Button>
                                    </Link>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                 <div className="container mx-auto px-4 py-8 space-y-12">
                     
                    {/* 1. Hero Banner */}
                    <section>
                        <Carousel
                            plugins={[ Autoplay({ delay: 5000, stopOnInteraction: true }) ]}
                            className="w-full"
                        >
                            <CarouselContent>
                                {heroBanners.map(banner => (
                                    <CarouselItem key={banner.id}>
                                        <div className="relative h-56 md:h-72 w-full rounded-lg overflow-hidden flex items-center justify-center p-8 bg-primary text-primary-foreground">
                                           {banner.image && <Image src={banner.image.imageUrl} alt={banner.title} fill className="object-cover opacity-20" data-ai-hint={banner.image.imageHint} />}
                                            <div className="relative text-center z-10">
                                                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{banner.title}</h1>
                                                <p className="text-lg md:text-xl mt-2 text-primary-foreground/80">{banner.subtitle}</p>
                                                <Button size="lg" variant="secondary" className="mt-6">{banner.buttonText}</Button>
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </section>

                    {/* 2. Quick Categories */}
                    <section>
                        <div className="flex justify-center overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
                            {categories.map(category => (
                                <Link href="#" key={category.name} className="shrink-0">
                                    <Card className="w-28 text-center p-4 hover:bg-accent hover:text-accent-foreground transition-colors group">
                                        <category.icon className="w-8 h-8 mx-auto text-primary group-hover:text-accent-foreground" />
                                        <p className="mt-2 text-sm font-medium">{category.name}</p>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                    
                    {/* 3. Deals & Promotions */}
                    <section>
                         <div className="flex flex-wrap justify-between items-baseline gap-y-2 mb-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold font-headline flex items-center gap-2"><Zap className="text-destructive" /> Flash Sales</h2>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <span className="text-muted-foreground hidden sm:inline">Ending in:</span>
                                    <span className="font-mono font-semibold bg-destructive/10 text-destructive border border-destructive/20 rounded-md px-2 py-1">{timeLeft.hours}</span>
                                    <span className="font-semibold text-destructive">:</span>
                                    <span className="font-mono font-semibold bg-destructive/10 text-destructive border border-destructive/20 rounded-md px-2 py-1">{timeLeft.minutes}</span>
                                    <span className="font-semibold text-destructive">:</span>
                                    <span className="font-mono font-semibold bg-destructive/10 text-destructive border border-destructive/20 rounded-md px-2 py-1">{timeLeft.seconds}</span>
                                </div>
                            </div>
                            <Button variant="link" asChild><Link href="#">See All</Link></Button>
                        </div>
                        {isLoadingProducts ? renderProductSkeletons(6) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {flashDeals.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 4. Product Grid (Core) */}
                    <section>
                         <h2 className="text-2xl font-bold font-headline mb-6">Recommended For You</h2>
                         {isLoadingProducts ? renderProductSkeletons(12) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {productsData?.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                        {!isLoadingProducts && productsData?.length === 0 && (
                             <div className="text-center py-20 border rounded-lg bg-card">
                                <h2 className="text-xl font-semibold">The Market is Empty</h2>
                                <p className="text-muted-foreground mt-2">No products have been listed for sale yet. Check back soon!</p>
                            </div>
                        )}
                    </section>

                    {/* 5. Trust & Value Strip */}
                     <section className="bg-card rounded-lg p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            {trustFeatures.map(feature => (
                                <div key={feature.text} className="flex flex-col items-center gap-2">
                                    <feature.icon className="h-8 w-8 text-primary" />
                                    <p className="font-semibold text-sm">{feature.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                 </div>
            </main>
            <footer className="bg-background border-t">
                <div className="container mx-auto py-8 px-4 text-center sm:text-left">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="font-semibold mb-4">Busmo</h4>
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="#" className="hover:underline">About Us</Link></li>
                                <li><Link href="/pricing" className="hover:underline">For Businesses</Link></li>
                                <li><Link href="/invest" className="hover:underline">For Investors</Link></li>
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-4">Help</h4>
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="#" className="hover:underline">Help Center</Link></li>
                                <li><Link href="#" className="hover:underline">Contact Us</Link></li>
                                <li><Link href="#" className="hover:underline">Terms & Conditions</Link></li>
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-4">Sell on Busmo</h4>
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/signup" className="hover:underline">Start Selling</Link></li>
                                <li><Link href="#" className="hover:underline">Seller FAQ</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
