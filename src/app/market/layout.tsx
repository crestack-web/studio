'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Menu, Search, ShoppingBag, Megaphone, Instagram, Facebook, Box, Tag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { useLanguage } from '@/context/language-provider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/cart-provider';
import { MarketSwitcher } from '@/components/app/market-switcher';
import { useMarket } from '@/context/market-provider';
import { formatCurrency } from '@/lib/currency';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit, where, orderBy } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";

interface MarketProduct {
    id: string;
    productName: string;
    images?: string[];
    price: number;
}
interface MarketCategory {
    id: string;
    name: string;
}

interface Announcement {
    id: string;
    text: string;
    href: string;
}

interface MarketTopBanner {
    id: string;
    imageUrl: string;
    linkUrl?: string;
    isActive?: boolean;
    createdAt: any;
}


export default function MarketLayout({ 
    children, 
}: { 
    children: React.ReactNode, 
}) {
    const { t } = useLanguage();
    const { totalItems } = useCart();
    const { market, searchQuery, setSearchQuery } = useMarket();
    const router = useRouter();
    const firestore = useFirestore();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
    const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
    const [stickyHeaderHeight, setStickyHeaderHeight] = useState<number>(160);
    
    // This state will help us avoid hydration errors
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Fetch a set of products to use for suggestions.
        return query(collection(firestore, 'marketProducts'), limit(100));
    }, [firestore]);
    const { data: allProducts } = useCollection<MarketProduct>(productsQuery);

    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Fetch all categories for suggestions
        return query(collection(firestore, 'marketCategories'));
    }, [firestore]);
    const { data: allCategories } = useCollection<{id: string, name: string}>(categoriesQuery);

     const { data: announcements } = useCollection<Announcement>(
        useMemoFirebase(() => {
            if (!firestore) return null;
            return query(collection(firestore, 'announcements'), where('isActive', '==', true), where('page', '==', 'market'));
        }, [firestore])
    );
    
    const { data: topAdBanners } = useCollection<MarketTopBanner>(
        useMemoFirebase(() => {
            if (!firestore) return null;
            return query(collection(firestore, 'marketTopBanners'), where('isActive', '==', true), orderBy('createdAt', 'desc'), limit(1));
        }, [firestore])
    );
    const topAdBanner = topAdBanners?.[0];

    const safeImageSrc = (src: unknown, fallback: string) => {
        if (typeof src !== 'string') return fallback;
        const trimmed = src.trim();
        return trimmed.length > 0 ? trimmed : fallback;
    };

    useEffect(() => {
        if (!stickyHeaderRef.current) return;

        const measure = () => {
            const el = stickyHeaderRef.current;
            if (!el) return;
            const nextHeight = Math.max(0, Math.round(el.getBoundingClientRect().height));
            if (nextHeight > 0) setStickyHeaderHeight(nextHeight);
        };

        measure();

        let ro: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => measure());
            ro.observe(stickyHeaderRef.current);
        }

        window.addEventListener('resize', measure);
        return () => {
            window.removeEventListener('resize', measure);
            ro?.disconnect();
        };
    }, [topAdBanner, announcements?.length]);

    const suggestions = useMemo(() => {
        if (!searchQuery) {
            return { products: [], categories: [] };
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        const products = (allProducts || [])
            .filter(p => (p.productName || '').toLowerCase().includes(lowercasedQuery))
            .slice(0, 5);
        const categories = (allCategories || [])
            .filter(c => (c.name || '').toLowerCase().includes(lowercasedQuery))
            .slice(0, 3);

        return { products, categories };
    }, [searchQuery, allProducts, allCategories]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setIsSearchOpen(!!query);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery) {
            setIsSearchOpen(false);
            e.currentTarget.blur();
            router.push(`/market/search?q=${searchQuery}`);
        }
    };
    
    const closeAndClear = () => {
        setIsSearchOpen(false);
    }

    return (
        <div
            className="flex flex-col min-h-screen bg-muted/20"
            style={{ ['--market-sticky-top' as any]: `${stickyHeaderHeight + 16}px` }}
        >
            <div ref={stickyHeaderRef} className="sticky top-0 z-40">
                {topAdBanner && (
                    <div className="bg-black text-white">
                        <Link href={topAdBanner.linkUrl || '#'} target="_blank" rel="noopener noreferrer">
                            <Image src={safeImageSrc(topAdBanner.imageUrl, 'https://picsum.photos/seed/top-ad/1200/80')} alt="Advertisement" width={1200} height={80} className="w-full h-auto" style={{ maxHeight: '60px', objectFit: 'cover' }} />
                        </Link>
                    </div>
                )}
                 {announcements && announcements.length > 0 && (
                    <div className="bg-primary text-primary-foreground">
                        <Carousel
                            plugins={[ Autoplay({ delay: 8000, stopOnInteraction: true }) ]}
                            opts={{ align: "start", loop: true }}
                            className="w-full"
                        >
                            <CarouselContent>
                                {announcements.map((announcement) => (
                                    <CarouselItem key={announcement.id}>
                                        <Link href={announcement.href || '#'}>
                                            <div className="flex items-center justify-center gap-2 text-center py-2 px-4 text-sm font-medium">
                                                <Megaphone className="h-4 w-4" />
                                                <span>{announcement.text}</span>
                                            </div>
                                        </Link>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </div>
                )}
                <header className="bg-white dark:bg-background border-b">
                    <div className="container mx-auto">
                        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-3 md:h-16 md:flex-nowrap md:py-0">
                            {/* Logo & Desktop Market Switcher */}
                            <div className="flex items-center gap-6">
                                <Link href="/market"><Logo className="h-8" /></Link>
                                <div className="hidden md:flex flex-col items-start gap-1 leading-none">
                                    <span className="text-xs text-muted-foreground">Deliver to</span>
                                    <div className="flex items-center gap-2">
                                        <MarketSwitcher />
                                        <span className="text-sm font-medium">
                                            {market.city}{market.country ? `, ${market.country}` : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Search bar */}
                            <div className="order-last w-full md:order-2 md:flex-1 md:max-w-xl">
                                {hasMounted ? (
                                    <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search products, stores, or categories"
                                                    className="pl-12 h-12 text-base rounded-md"
                                                    value={searchQuery}
                                                    onChange={handleSearchChange}
                                                    onKeyDown={handleKeyDown}
                                                />
                                            </div>
                                        </PopoverTrigger>
                                        <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[var(--radix-popover-trigger-width)] p-0">
                                            {searchQuery && (suggestions.products.length === 0 && suggestions.categories.length === 0) ? (
                                                <div className="p-4 text-sm text-center text-muted-foreground">No results found for "{searchQuery}"</div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    {suggestions.categories.length > 0 && (
                                                        <div className="p-2">
                                                            <h4 className="px-2 text-xs font-semibold text-muted-foreground">Categories</h4>
                                                            <div className="mt-1">
                                                                {suggestions.categories.map(cat => (
                                                                    <Link key={cat.id} href={`/market/search?q=${cat.name}`} onClick={closeAndClear} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                                                                        <Tag className="h-4 w-4 text-muted-foreground"/>
                                                                        <span className="text-sm font-medium">{cat.name}</span>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {suggestions.products.length > 0 && (
                                                        <div className="p-2">
                                                            <h4 className="px-2 text-xs font-semibold text-muted-foreground">Products</h4>
                                                            <div className="mt-1">
                                                                {suggestions.products.map(prod => (
                                                                    <Link key={prod.id} href={`/market/product/${prod.id}`} onClick={closeAndClear} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                                                                        <div className="relative h-10 w-10 shrink-0 rounded-md overflow-hidden bg-muted">
                                                                            <Image src={safeImageSrc(prod.images?.[0], `https://picsum.photos/seed/${prod.id}/100`)} alt={prod.productName || 'Product'} fill className="object-cover" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-sm font-medium line-clamp-1">{prod.productName}</p>
                                                                            <p className="text-xs text-muted-foreground">{formatCurrency(prod.price, market.country)}</p>
                                                                        </div>
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search products, stores, or categories"
                                            className="pl-12 h-12 text-base rounded-md"
                                            disabled
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 order-2 md:order-3">
                                <Link href="/market/checkout" passHref>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <ShoppingBag className="h-6 w-6" />
                                        {totalItems > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{totalItems}</Badge>}
                                        <span className="sr-only">Checkout</span>
                                    </Button>
                                </Link>
                                <LanguageSwitcher />
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button asChild variant="ghost"><Link href="/login">Log In</Link></Button>
                                    <Button asChild><Link href="/signup">Sign Up</Link></Button>
                                </div>
                                <div className="sm:hidden">
                                     {hasMounted ? (
                                        <Sheet>
                                            <SheetTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <Menu className="h-6 w-6" />
                                                </Button>
                                            </SheetTrigger>
                                            <SheetContent>
                                                <SheetHeader>
                                                    <SheetTitle className="sr-only">Menu</SheetTitle>
                                                    <SheetDescription className="sr-only">Login or sign up.</SheetDescription>
                                                </SheetHeader>
                                                <nav className="flex flex-col gap-4 mt-8">
                                                    <Link href="/login" passHref className="w-full">
                                                        <Button variant="outline" className="w-full justify-center text-lg h-12">Log In</Button>
                                                    </Link>
                                                    <Link href="/signup" passHref className="w-full">
                                                        <Button className="w-full justify-center text-lg h-12">Sign Up</Button>
                                                    </Link>
                                                </nav>
                                            </SheetContent>
                                        </Sheet>
                                     ) : (
                                        <Button variant="ghost" size="icon" disabled>
                                            <Menu className="h-6 w-6" />
                                        </Button>
                                     )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            </div>
            <main className="flex-1 flex flex-col items-center p-4 sm:p-6">{children}</main>
            <footer className="bg-card border-t">
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-4 py-8 px-4 text-center md:text-left">
                    <Logo className="h-7 mx-auto md:mx-0" />
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <Link href="/about" className="hover:underline">{t('footer.about')}</Link>
                        <Link href="/help" className="hover:underline">{t('footer.help')}</Link>
                        <a href="mailto:support@busmo.io" className="hover:underline">{t('footer.contact')}</a>
                        <Link href="/terms" className="hover:underline">{t('footer.privacy')}</Link>
                        <Link href="/terms" className="hover:underline">{t('footer.terms')}</Link>
                    </div>
                    <div className="flex items-center gap-4 mx-auto md:ml-auto md:mr-0">
                        <a href="https://x.com/busmohq" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)">
                            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground hover:text-foreground fill-current"><title>X</title><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                        </a>
                        <a href="https://instagram.com/busmo.io" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </a>
                        <a href="https://facebook.com/busmo.io" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </a>
                    </div>
                </div>
                <p className="text-center text-xs text-muted-foreground pb-4">&copy; {currentYear} busmo.</p>
            </footer>
        </div>
    );
}
