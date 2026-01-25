
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Zap, Truck, Store } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlaceHolderImages, CategoryImages } from '@/lib/placeholder-images';
import MarketLayout from '@/components/app/market-layout';
import { useCart } from '@/context/cart-provider';
import { useToast } from '@/hooks/use-toast';

interface MarketProduct {
    id: string; // Document ID, which is the same as productId
    productName: string;
    businessName: string;
    price: number;
    oldPrice?: number;
    category: string;
    description?: string;
    availableQuantity?: number;
    images?: string[];
    hint?: string;
    hasVariants: boolean;
    averageRating?: number;
    reviewCount?: number;
}

const heroBanners = [
    { id: 'banner-clearance', title: 'Clearance Sale', subtitle: 'Up to 50% Off Select Items', image: PlaceHolderImages.find(i => i.id === 'sale-banner-1'), buttonText: 'Shop Now', className: "bg-orange-500" },
    { id: 'banner-new', title: 'New Arrivals', subtitle: 'Fresh Picks for the New Season', image: PlaceHolderImages.find(i => i.id === 'sale-banner-2'), buttonText: 'Discover More', className: "bg-blue-500" },
];

const ProductCard = ({ product }: { product: MarketProduct }) => {
    const { addItem } = useCart();
    const { toast } = useToast();
    const router = useRouter();

    const oldPrice = product.oldPrice;
    const showDiscount = oldPrice && oldPrice > product.price;
    const discount = showDiscount ? Math.round(((oldPrice - product.price) / oldPrice) * 100) : 0;
    const imageUrl = product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/300`;
    
    const rating = product.averageRating || 0;
    const reviewCount = product.reviewCount || 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (product.hasVariants) {
            router.push(`/market/product/${product.id}`);
            return;
        }

        addItem({
            id: product.id,
            name: product.productName,
            price: product.price,
            quantity: 1,
            image: imageUrl,
            variantId: undefined,
            variantName: undefined,
        });

        toast({
            title: "Added to Cart",
            description: `${product.productName} has been added to your cart.`,
        });
    };

    return (
        <Link href={`/market/product/${product.id}`} key={product.id}>
            <Card className="overflow-hidden group cursor-pointer h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-square overflow-hidden relative">
                    <Image
                        src={imageUrl}
                        alt={product.productName || 'Product image'}
                        fill
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={product.hint || (product.productName || '').split(' ').slice(0, 2).join(' ')}
                    />
                    {showDiscount && <Badge variant="destructive" className="absolute top-2 right-2">-{discount}%</Badge>}
                </div>
                <CardContent className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm leading-snug flex-1 line-clamp-2">{product.productName || 'Unnamed Product'}</h3>
                    <div className="mt-2">
                        <p className="font-bold text-base">{formatCurrency(product.price)}</p>
                        {showDiscount && <p className="text-xs text-muted-foreground line-through">{formatCurrency(oldPrice)}</p>}
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-3 h-3", rating > 0 && i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />)}
                        {reviewCount > 0 && <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>}
                    </div>
                    <Button size="sm" className="w-full mt-3 h-9" onClick={handleAddToCart}>
                        {product.hasVariants ? 'Select Options' : 'Add to Cart'}
                    </Button>
                </CardContent>
            </Card>
        </Link>
    );
};


export default function MarketPage() {
    const firestore = useFirestore();
    const [saleEndTime] = useState(new Date(new Date().getTime() + 10 * 60 * 60 * 1000));
    const router = useRouter();

    const marketProductsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketProducts'));
    }, [firestore]);

    const { data: productsData, isLoading: isLoadingProducts } = useCollection<MarketProduct>(marketProductsQuery);
    
    const flashDeals = useMemo(() => {
        if (!productsData) return [];
        return productsData.filter(p => p.oldPrice && p.oldPrice > p.price).slice(0, 6);
    }, [productsData]);

    const [timeLeft, setTimeLeft] = useState({
        hours: '00',
        minutes: '00',
        seconds: '00',
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = saleEndTime.getTime() - now.getTime();

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
    }, [saleEndTime]);

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
        <MarketLayout>
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
                                    <div className={cn("relative h-56 md:h-72 w-full rounded-lg overflow-hidden flex items-center justify-center p-8 text-primary-foreground", banner.className)}>
                                        {banner.image && <Image src={banner.image.imageUrl} alt={banner.title} fill className="object-cover opacity-75" data-ai-hint={banner.image.imageHint} />}
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
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 md:gap-4">
                        {CategoryImages.map(category => (
                            <Link href="#" key={category.id} className="block group">
                                <div className="relative aspect-square overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
                                    <Image
                                        src={category.imageUrl}
                                        alt={category.name || ''}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint={category.imageHint}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <p className="absolute bottom-2 left-2 right-2 text-center text-sm font-bold text-white truncate">{category.name}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                 <section>
                    <Link href="#">
                        <div className="relative h-48 w-full rounded-lg overflow-hidden flex items-center justify-start p-8 bg-warning text-primary-foreground">
                            <Image 
                                src="https://images.unsplash.com/photo-1586528116311-06924151d683?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHx3YXJlaG91c2UlMjBib3hlc3xlbnwwfHx8fDE3NjkwOTgyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                                alt="Wholesale goods" 
                                fill 
                                className="object-cover object-center opacity-75" 
                                data-ai-hint="goods stock" 
                            />
                            <div className="relative z-10">
                                <p className="text-sm font-bold uppercase tracking-widest">Wholesale Deals</p>
                                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Buy in Bulk and Save Big</h2>
                                <Button size="lg" variant="secondary" className="mt-4">View Deals</Button>
                            </div>
                        </div>
                    </Link>
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
                        flashDeals.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {flashDeals.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 border rounded-lg bg-card">
                                <h2 className="text-lg font-semibold">No Flash Deals</h2>
                                <p className="text-muted-foreground mt-1 text-sm">Check back later for exciting offers!</p>
                            </div>
                        )
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

                {/* Utility Banners */}
                <section className="grid md:grid-cols-2 gap-4">
                    <Link href="/market/delivery">
                        <Card className="flex items-center p-4 bg-primary/5 border-primary/10 h-full hover:bg-primary/10 transition-colors">
                            <Truck className="w-8 h-8 text-primary mr-4" />
                            <div>
                                <h3 className="font-semibold">Nationwide Delivery</h3>
                                <p className="text-sm text-muted-foreground">Fast & reliable shipping to your doorstep.</p>
                            </div>
                        </Card>
                    </Link>
                    <Link href="/signup">
                        <Card className="flex items-center p-4 bg-accent/5 border-accent/10 h-full hover:bg-accent/10 transition-colors">
                            <Store className="w-8 h-8 text-accent mr-4" />
                            <div>
                                <h3 className="font-semibold">Become a Seller</h3>
                                <p className="text-sm text-muted-foreground">Reach thousands of new customers. <span className="underline text-accent">Start selling</span>.</p>
                            </div>
                        </Card>
                    </Link>
                </section>
            </div>
        </MarketLayout>
    );
}

    