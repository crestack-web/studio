'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Menu, Search, ShoppingCart, Megaphone, Instagram, Facebook, Box, Tag } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';
import { useLanguage } from '@/context/language-provider';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useCart } from '@/context/cart-provider';
import { MarketSwitcher } from './market-switcher';
import { useMarket } from '@/context/market-provider';
import { formatCurrency } from '@/lib/currency';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';

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

    const suggestions = useMemo(() => {
        if (!searchQuery) {
            return { products: [], categories: [] };
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        const products = (allProducts || [])
            .filter(p => p.productName.toLowerCase().includes(lowercasedQuery))
            .slice(0, 5);
        const categories = (allCategories || [])
            .filter(c => c.name.toLowerCase().includes(lowercasedQuery))
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
        <div className="flex flex-col min-h-screen bg-muted/20">
            <div className="sticky top-0 z-40">
                <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    <span>Free delivery for all orders over {formatCurrency(50000, market.country)}!</span>
                </div>
                <header className="bg-card border-b">
                    <div className="container mx-auto">
                        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-3 md:h-16 md:flex-nowrap md:py-0">
                            {/* Logo & Desktop Market Switcher */}
                            <div className="flex items-center gap-6">
                                <Link href="/market"><Logo className="h-8" /></Link>
                                <div className="hidden md:block">
                                    <MarketSwitcher />
                                </div>
                            </div>
                            
                            {/* Search bar */}
                            <div className="order-last w-full md:order-2 md:flex-1 md:max-w-xl">
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
                                                                        <Image src={prod.images?.[0] || `https://picsum.photos/seed/${prod.id}/100`} alt={prod.productName} fill className="object-cover" />
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
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 order-2 md:order-3">
                                <div className="md:hidden">
                                    <MarketSwitcher />
                                </div>
                                <Link href="/market/cart" passHref>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <ShoppingCart className="h-6 w-6" />
                                        {totalItems > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{totalItems}</Badge>}
                                        <span className="sr-only">Cart</span>
                                    </Button>
                                </Link>
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button asChild variant="ghost"><Link href="/login">Log In</Link></Button>
                                    <Button asChild><Link href="/signup">Sign Up</Link></Button>
                                </div>
                                <div className="sm:hidden">
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
                    <div className="flex items-center gap-4 justify-center text-sm text-muted-foreground">
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
