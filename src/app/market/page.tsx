
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Zap, Truck, Store, ShoppingBag, ShieldCheck, CreditCard, Building, Shirt, Smartphone, Lamp, ShoppingBasket, HeartPulse, BookOpen, Puzzle, Car, Search, Menu, Megaphone, Instagram, Facebook } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import MarketLayout from '@/components/app/market-layout';
import { useCart } from '@/context/cart-provider';
import { useToast } from '@/hooks/use-toast';
import { useMarket } from '@/context/market-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/app/logo';

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

interface MarketBanner {
    id: string;
    title?: string;
    subtitle?: string;
    imageUrl: string;
    imageHint?: string;
    buttonText?: string;
    className?: string;
    isActive?: boolean;
}

interface MarketGifBanner {
    id: string;
    imageUrl: string;
    linkUrl?: string;
    isActive?: boolean;
}


interface MarketCategory {
    id: string;
    name: string;
    imageUrl: string;
    imageHint: string;
}

interface BusinessProfile {
    id: string;
    businessName: string;
    businessType: string;
    slug?: string;
    marketSettings?: {
        logoImageUrl?: string;
    };
}


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

const promoCategories = [
    { name: 'Fashion', icon: Shirt, href: '#' },
    { name: 'Electronics', icon: Smartphone, href: '#' },
    { name: 'Home Goods', icon: Lamp, href: '#' },
    { name: 'Groceries', icon: ShoppingBasket, href: '#' },
    { name: 'Health & Beauty', icon: HeartPulse, href: '#' },
    { name: 'Books', icon: BookOpen, href: '#' },
    { name: 'Toys & Games', icon: Puzzle, href: '#' },
    { name: 'Automotive', icon: Car, href: '#' },
];

export default function MarketPage() {
    const firestore = useFirestore();
    const { market, setMarket, availableMarkets } = useMarket();
    const [saleEndTime] = useState(new Date(new Date().getTime() + 10 * 60 * 60 * 1000));
    const [searchQuery, setSearchQuery] = useState('');
    
    // State for the location modal
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(market.country);
    const [selectedCity, setSelectedCity] = useState(market.city);

    // Query for banners
    const bannersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketBanners'), where('isActive', '==', true));
    }, [firestore]);
    const { data: heroBanners, isLoading: isLoadingBanners } = useCollection<MarketBanner>(bannersQuery);
    
    // Query for GIF banners
    const gifBannersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketGifBanners'), where('isActive', '==', true), limit(2));
    }, [firestore]);
    const { data: gifBanners, isLoading: isLoadingGifBanners } = useCollection<MarketGifBanner>(gifBannersQuery);

    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketCategories'));
    }, [firestore]);
    const { data: categories, isLoading: isLoadingCategories } = useCollection<MarketCategory>(categoriesQuery);

    const businessProfilesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'businessProfiles'), limit(6));
    }, [firestore]);
    const { data: businessProfiles, isLoading: isLoadingProfiles } = useCollection<BusinessProfile>(businessProfilesQuery);

    // Query for products available only in the specific city
    const cityProductsQuery = useMemoFirebase(() => {
        if (!firestore || !market.country || !market.city) return null;
        return query(
            collection(firestore, 'marketProducts'), 
            where('country', '==', market.country),
            where('deliveryCities', 'array-contains', market.city)
        );
    }, [firestore, market]);
    const { data: cityProducts, isLoading: isLoadingCity } = useCollection<MarketProduct>(cityProductsQuery);

    // Query for products available nationwide in the same country
    const nationwideProductsQuery = useMemoFirebase(() => {
        if (!firestore || !market.country) return null;
        return query(
            collection(firestore, 'marketProducts'),
            where('country', '==', market.country),
            where('deliveryType', '==', 'nationwide')
        );
    }, [firestore, market.country]);
    const { data: nationwideProducts, isLoading: isLoadingNationwide } = useCollection<MarketProduct>(nationwideProductsQuery);

    const isLoadingProducts = isLoadingCity || isLoadingNationwide;

    // Merge and deduplicate products
    const productsData = useMemo(() => {
        if (!cityProducts && !nationwideProducts) return [];
        const allProducts = new Map<string, MarketProduct>();
        (cityProducts || []).forEach(p => allProducts.set(p.id, p));
        (nationwideProducts || []).forEach(p => allProducts.set(p.id, p));
        return Array.from(allProducts.values());
    }, [cityProducts, nationwideProducts]);
    
    const filteredProducts = useMemo(() => {
        if (!searchQuery) {
            return productsData;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return productsData.filter(product => 
            (product.productName?.toLowerCase().includes(lowercasedQuery)) ||
            (product.businessName?.toLowerCase().includes(lowercasedQuery)) ||
            (product.category?.toLowerCase().includes(lowercasedQuery))
        );
    }, [productsData, searchQuery]);

    const flashDeals = useMemo(() => {
        if (!productsData) return [];
        return productsData.filter(p => p.oldPrice && p.oldPrice > p.price).slice(0, 6);
    }, [productsData]);
    
    const trustSignals = [
        { icon: ShieldCheck, text: 'Verified Sellers' },
        { icon: CreditCard, text: 'Secure Payments' },
        { icon: Truck, text: 'Local Delivery' },
        { icon: Store, text: 'Real Businesses' },
    ];

    const [timeLeft, setTimeLeft] = useState({
        hours: '00',
        minutes: '00',
        seconds: '00',
    });
    
    // --- Location Modal Logic ---
    const selectedCountryData = availableMarkets.find(c => c.code === selectedCountry);

    useEffect(() => {
        if (isLocationModalOpen) {
            setSelectedCountry(market.country);
            setSelectedCity(market.city);
        }
    }, [isLocationModalOpen, market]);

    useEffect(() => {
        if (selectedCountryData) {
            const cityExists = selectedCountryData.cities.includes(selectedCity);
            if (!cityExists) {
                setSelectedCity(selectedCountryData.cities[0]);
            }
        }
    }, [selectedCountry, selectedCity, selectedCountryData]);

    const handleUpdateMarket = () => {
        setMarket({ country: selectedCountry, city: selectedCity });
        setIsLocationModalOpen(false);
    };
    // --- End Location Modal Logic ---


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
    
    const renderBusinessSkeletons = (count: number = 6) => (
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(count)].map((_, i) => (
                <Card key={i} className="overflow-hidden h-full flex flex-col items-center justify-center p-4">
                    <Skeleton className="h-16 w-16 rounded-full mb-4" />
                    <Skeleton className="h-5 w-24" />
                </Card>
            ))}
        </div>
    )

    return (
        <MarketLayout searchValue={searchQuery} onSearchChange={setSearchQuery}>
            <div className="container mx-auto px-4 space-y-8">
                
                 {/* 1. Hero Section */}
                <section>
                    <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-6 items-stretch">
                        <div className="hidden lg:flex flex-col gap-6">
                           {isLoadingGifBanners ? (
                                <>
                                    <Skeleton className="h-[202px] w-full" />
                                    <Skeleton className="h-[202px] w-full" />
                                </>
                            ) : (
                                (gifBanners && gifBanners.length > 0 ? gifBanners : [null, null]).slice(0, 2).map((banner, i) => (
                                    <Link key={banner?.id || i} href={banner?.linkUrl || '#'}>
                                        <Card className="overflow-hidden h-[202px] relative group">
                                            <Image 
                                                src={banner?.imageUrl || `https://picsum.photos/seed/promo${i+1}/250/202`}
                                                alt={banner ? 'Promotional banner' : `Promotion ${i+1}`}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                data-ai-hint="sale banner"
                                                unoptimized={banner?.imageUrl?.endsWith('.gif')}
                                            />
                                        </Card>
                                    </Link>
                                ))
                            )}
                        </div>
                        <Carousel
                            plugins={[ Autoplay({ delay: 5000, stopOnInteraction: true }) ]}
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            className="w-full h-[250px] lg:h-[420px]"
                        >
                            <CarouselContent className="h-full">
                                {isLoadingBanners ? (
                                    <CarouselItem>
                                        <Skeleton className="h-full w-full" />
                                    </CarouselItem>
                                ) : (heroBanners && heroBanners.length > 0) ? (
                                    heroBanners.map((banner, index) => (
                                        <CarouselItem key={banner.id} className={cn("relative h-full overflow-hidden rounded-lg", banner.className)}>
                                            {banner.imageUrl && 
                                                <Image 
                                                    src={banner.imageUrl} 
                                                    alt={banner.title || 'Market banner'} 
                                                    fill 
                                                    className="object-cover" 
                                                    data-ai-hint={banner.imageHint || ''} 
                                                    priority={index === 0}
                                                />
                                            }
                                            
                                            {(banner.title || banner.subtitle || banner.buttonText) && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 p-4">
                                                    <div className="text-center text-white max-w-lg">
                                                        {banner.title && <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{banner.title}</h1>}
                                                        {banner.subtitle && <p className="text-lg md:text-xl mt-2">{banner.subtitle}</p>}
                                                        {banner.buttonText && <Button size="lg" variant="secondary" className="mt-6">{banner.buttonText}</Button>}
                                                    </div>
                                                </div>
                                            )}
                                        </CarouselItem>
                                    ))
                                ) : (
                                    <CarouselItem>
                                        <div className="h-full w-full bg-muted rounded-lg flex items-center justify-center">
                                            <p className="text-muted-foreground">Banners will appear here</p>
                                        </div>
                                    </CarouselItem>
                                )}
                            </CarouselContent>
                        </Carousel>
                        <div className="hidden lg:block">
                            <Card>
                                <CardHeader className="p-3 pb-1">
                                    <CardTitle className="text-base">Categories</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                    <div className="space-y-1">
                                        {promoCategories.map(category => (
                                            <Link href={category.href} key={category.name} className="block">
                                                <div className="flex items-center gap-2 hover:bg-muted/50 p-1.5 rounded-md transition-colors">
                                                    <category.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span className="font-medium text-sm">{category.name}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
                
                {/* 2. Quick Categories */}
                 {isLoadingCategories ? (
                     <section>
                        <Card>
                            <CardHeader className="p-4 pt-2">
                                <Skeleton className="h-5 w-40" />
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex gap-4">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="flex-shrink-0 w-24">
                                            <Skeleton className="aspect-square rounded-lg mb-2" />
                                            <Skeleton className="h-5 w-16 mx-auto" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                ) : (categories && categories.length > 0 &&
                    <section>
                        <Card>
                             <CardHeader className="p-2 pb-0">
                                <CardTitle className="text-lg">Shop by Category</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <Carousel
                                    opts={{
                                        align: "start",
                                        loop: false,
                                    }}
                                    className="w-full"
                                >
                                    <CarouselContent className="-ml-2">
                                        {categories.map(category => (
                                            <CarouselItem key={category.id} className="pl-2 basis-1/4 sm:basis-1/5 md:basis-1/8 lg:basis-[12%]">
                                                <Link href="#" className="block group text-center">
                                                    <div className="aspect-square relative overflow-hidden rounded-lg bg-card">
                                                        <Image
                                                            src={category.imageUrl}
                                                            alt={category.name || ''}
                                                            fill
                                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                            data-ai-hint={category.imageHint}
                                                        />
                                                    </div>
                                                    <p className="mt-2 text-sm font-semibold text-foreground truncate">{category.name}</p>
                                                </Link>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="hidden sm:flex" />
                                    <CarouselNext className="hidden sm:flex" />
                                </Carousel>
                            </CardContent>
                        </Card>
                    </section>
                )}
                
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
                
                {/* Trust Signals */}
                 <section>
                    <Card>
                        <CardContent className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            {trustSignals.map((signal) => (
                                <div key={signal.text} className="flex items-center justify-center gap-2">
                                    <signal.icon className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">{signal.text}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>
                
                {/* Featured Sellers */}
                 <section>
                    <h2 className="text-2xl font-bold font-headline mb-6">Featured Local Businesses</h2>
                    {isLoadingProfiles ? renderBusinessSkeletons() : (
                        businessProfiles && businessProfiles.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                {businessProfiles.map(profile => (
                                    <Link href={profile.slug ? `/${profile.slug}` : '#'} key={profile.id}>
                                    <Card className="overflow-hidden group cursor-pointer h-full flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-lg transition-shadow duration-300">
                                        <Avatar className="h-16 w-16 border mb-4">
                                            <AvatarImage src={profile.marketSettings?.logoImageUrl} alt={profile.businessName} />
                                            <AvatarFallback>{profile.businessName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-semibold text-sm text-center line-clamp-1">{profile.businessName}</h3>
                                        <p className="text-xs text-muted-foreground capitalize text-center">{profile.businessType}</p>
                                    </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <Card key={i} className="h-full flex flex-col items-center justify-center text-center p-4 border-dashed">
                                        <Building className="w-8 h-8 text-muted-foreground mb-2"/>
                                        <p className="text-xs text-muted-foreground">Your business could be featured here</p>
                                    </Card>
                                ))}
                            </div>
                        )
                    )}
                </section>

                {/* 4. Product Grid (Core) */}
                <section>
                        <h2 className="text-2xl font-bold font-headline mb-6">Recommended For You</h2>
                        {isLoadingProducts ? renderProductSkeletons(12) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {filteredProducts?.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                    {!isLoadingProducts && productsData?.length === 0 && (
                        <Card className="text-center py-16 border-2 border-dashed">
                            <CardHeader>
                                <div className="mx-auto bg-secondary p-3 rounded-full inline-block">
                                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <CardTitle className="mt-4">No products in your area yet</CardTitle>
                                <CardDescription>Businesses are joining daily. Check back soon or change your location.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-4 justify-center">
                                    <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button>Change Location</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Change Your Market</DialogTitle>
                                                <DialogDescription>Select your location to see products available for delivery in your area.</DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="country-select">Country</Label>
                                                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                                        <SelectTrigger id="country-select"><SelectValue placeholder="Select a country" /></SelectTrigger>
                                                        <SelectContent>
                                                            {availableMarkets.map(country => (<SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="city-select">City</Label>
                                                    <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedCountryData}>
                                                        <SelectTrigger id="city-select"><SelectValue placeholder="Select a city" /></SelectTrigger>
                                                        <SelectContent>{selectedCountryData?.cities.map(city => (<SelectItem key={city} value={city}>{city}</SelectItem>))}</SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsLocationModalOpen(false)}>Cancel</Button>
                                                <Button type="button" onClick={handleUpdateMarket}>Update Market</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Button asChild variant="secondary"><Link href="/signup">Become a Seller</Link></Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {!isLoadingProducts && productsData.length > 0 && filteredProducts.length === 0 && (
                        <div className="text-center py-20 border rounded-lg bg-card">
                            <h2 className="text-xl font-semibold">No Results Found for "{searchQuery}"</h2>
                            <p className="text-muted-foreground mt-2">Try a different search term.</p>
                        </div>
                    )}
                </section>
            </div>
        </MarketLayout>
    );
}
