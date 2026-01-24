'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Menu, Search, ShoppingCart, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';
import { useLanguage } from '@/context/language-provider';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useCart } from '@/context/cart-provider';
import { useUser, useAuth, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';


interface UserProfile {
    role?: 'Owner' | 'Staff' | 'Admin' | 'Investor' | 'Buyer';
    displayName?: string;
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
    const { t } = useLanguage();
    const { totalItems } = useCart();
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const handleSignOut = async () => {
        if (auth) {
            await signOut(auth);
            router.push('/market');
        }
    };
    
    const isBusinessUser = userProfile?.role === 'Owner' || userProfile?.role === 'Staff' || userProfile?.role === 'Admin';
    const displayName = userProfile?.displayName || user?.email;

    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
                <div className="container mx-auto flex h-20 items-center justify-between px-4 gap-4">
                    <Link href="/market"><Logo className="h-8 hidden sm:flex" /></Link>
                    
                    <div className="flex-1 max-w-2xl">
                         <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="Search products, stores, or categories" className="pl-10 h-12 text-base" />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link href="/market/cart" passHref>
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart className="h-6 w-6" />
                                {totalItems > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{totalItems}</Badge>}
                                <span className="sr-only">Cart</span>
                            </Button>
                        </Link>
                        
                        {isUserLoading ? (
                             <Skeleton className="h-10 w-10 rounded-full" />
                        ) : user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                        <Avatar>
                                            <AvatarFallback>{displayName?.split(' ').map(n => n[0]).join('').substring(0,2) || 'U'}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {isBusinessUser && (
                                        <>
                                            <DropdownMenuItem onClick={() => router.push('/owner/home')}>
                                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                                <span>Business Dashboard</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem onClick={() => router.push('/market/orders')} disabled>My Orders</DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                             <div className="hidden md:flex items-center gap-2">
                                <Button asChild variant="ghost"><Link href="/market/login">Log In</Link></Button>
                                <Button asChild><Link href="/market/signup">Sign Up</Link></Button>
                            </div>
                        )}
                        
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
                                     {!user && (
                                        <>
                                             <Link href="/market/login" passHref><Button variant="outline" className="w-full justify-start text-lg">Log In</Button></Link>
                                             <Link href="/market/signup" passHref><Button className="w-full justify-start text-lg">Sign Up</Button></Link>
                                        </>
                                     )}
                                    <Link href="/login" passHref>
                                        <Button variant="ghost" className="w-full justify-start text-lg">For Businesses</Button>
                                    </Link>
                                    <div className="flex items-center gap-2 mt-4">
                                        <ThemeToggle />
                                        <LanguageSwitcher />
                                    </div>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>
            <main className="flex-1 flex flex-col items-center p-4 sm:p-6">{children}</main>
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
