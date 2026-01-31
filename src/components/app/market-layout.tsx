'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Menu, Search, ShoppingCart, Megaphone, Instagram, Facebook } from 'lucide-react';
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

export default function MarketLayout({ 
    children, 
    searchValue, 
    onSearchChange 
}: { 
    children: React.ReactNode, 
    searchValue?: string, 
    onSearchChange?: (value: string) => void 
}) {
    const { t } = useLanguage();
    const { totalItems } = useCart();
    const { market } = useMarket();

    const isSearchControlled = searchValue !== undefined && onSearchChange !== undefined;

    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            <div className="sticky top-0 z-40">
                <div className="bg-primary text-primary-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    <span>Free delivery for all orders over {formatCurrency(50000, market.country)}!</span>
                </div>
                <header className="bg-background border-b">
                    <div className="container mx-auto">
                        {/* Mobile Header */}
                        <div className="md:hidden">
                            <div className="flex h-16 items-center justify-between px-4">
                                <div className="flex-1">
                                    <MarketSwitcher />
                                </div>
                                <Link href="/market" className="absolute left-1/2 -translate-x-1/2"><Logo className="h-8" /></Link>
                                <div className="flex flex-1 items-center justify-end gap-1">
                                    <Link href="/market/cart" passHref>
                                        <Button variant="ghost" size="icon" className="relative">
                                            <ShoppingCart className="h-6 w-6" />
                                            {totalItems > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{totalItems}</Badge>}
                                            <span className="sr-only">Cart</span>
                                        </Button>
                                    </Link>
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
                                                <SheetDescription className="sr-only">Main navigation links for the site.</SheetDescription>
                                            </SheetHeader>
                                            <Logo className="h-8 mb-8" />
                                            <nav className="flex flex-col gap-4">
                                                <Link href="/login" passHref><Button variant="outline" className="w-full justify-start text-lg">Log In</Button></Link>
                                                <Link href="/signup" passHref><Button className="w-full justify-start text-lg">Sign Up</Button></Link>
                                                <div className="flex items-center gap-2 mt-4">
                                                    <ThemeToggle />
                                                    <LanguageSwitcher />
                                                </div>
                                            </nav>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Header */}
                        <div className="hidden md:flex h-20 items-center justify-between px-4 gap-6">
                            <div className="flex items-center gap-6">
                                <Link href="/market"><Logo className="h-8" /></Link>
                                <MarketSwitcher />
                            </div>
                            <div className="flex-1 max-w-lg">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search products, stores, or categories" 
                                        className="pl-10 h-12 text-base"
                                        value={isSearchControlled ? searchValue : undefined}
                                        onChange={isSearchControlled ? (e) => onSearchChange!(e.target.value) : undefined}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href="/market/cart" passHref>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <ShoppingCart className="h-6 w-6" />
                                        {totalItems > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{totalItems}</Badge>}
                                        <span className="sr-only">Cart</span>
                                    </Button>
                                </Link>
                                <Button asChild variant="ghost"><Link href="/login">Log In</Link></Button>
                                <Button asChild><Link href="/signup">Sign Up</Link></Button>
                            </div>
                        </div>
                    </div>
                </header>
            </div>
            <main className="flex-1 flex flex-col items-center p-4 sm:p-6">{children}</main>
            <footer className="bg-background border-t">
                <div className="container mx-auto py-8 px-4 text-center sm:text-left">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="font-semibold mb-4">Busmo</h4>
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/about" className="hover:underline">About Us</Link></li>
                                <li><Link href="/pricing" className="hover:underline">For Businesses</Link></li>
                                <li><Link href="/invest" className="hover:underline">For Investors</Link></li>
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-4">Help</h4>
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/help" className="hover:underline">Help Center</Link></li>
                                <li><Link href="/help" className="hover:underline">Contact Us</Link></li>
                                <li><Link href="/terms" className="hover:underline">Terms & Conditions</Link></li>
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-4">Sell on Busmo</h4>
                             <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link href="/signup" className="hover:underline">Start Selling</Link></li>
                                <li><Link href="/help" className="hover:underline">Seller FAQ</Link></li>
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-4">Follow Us</h4>
                             <div className="flex items-center gap-4">
                                <a href="https://x.com/busmo_io" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)">
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
                    </div>
                </div>
            </footer>
        </div>
    );
}
