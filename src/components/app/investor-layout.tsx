'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { LanguageSwitcher } from './language-switcher';
import { ThemeToggle } from './theme-toggle';
import { Separator } from '../ui/separator';
import { useLanguage } from '@/context/language-provider';

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
    const { t } = useLanguage();

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-sm border-b">
                <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/welcome"><Logo className="h-8" /></Link>
                    <nav className="hidden md:flex items-center gap-2">
                        <Link href="/welcome" passHref><Button variant="ghost">{t('nav.home')}</Button></Link>
                        <Link href="/invest" passHref><Button variant="ghost">{t('nav.explore')}</Button></Link>
                        <Link href="/blog" passHref><Button variant="ghost">Blog</Button></Link>
                        <Link href="/pricing" passHref><Button variant="ghost">{t('nav.for_businesses')}</Button></Link>
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <Separator orientation='vertical' className='h-8' />
                        <Link href="/investor/login" passHref><Button variant="ghost">{t('nav.login')}</Button></Link>
                        <Link href="/investor/signup" passHref><Button>{t('nav.signup')}</Button></Link>
                    </nav>
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-full max-w-xs">
                                <SheetHeader>
                                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                    <SheetDescription className="sr-only">Main navigation links for the site.</SheetDescription>
                                </SheetHeader>
                                <Logo className="h-8 mb-8" />
                                <nav className="flex flex-col items-start gap-4">
                                    <Link href="/welcome" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.home')}</Button></Link>
                                    <Link href="/invest" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.explore')}</Button></Link>
                                    <Link href="/blog" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">Blog</Button></Link>
                                    <Link href="/pricing" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.for_businesses')}</Button></Link>
                                    <Link href="/investor/login" passHref className="w-full"><Button variant="ghost" className="w-full justify-start text-lg">{t('nav.login')}</Button></Link>
                                    <Link href="/investor/signup" passHref className="w-full"><Button className="w-full mt-4 text-lg h-12">{t('nav.signup')}</Button></Link>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 bg-muted/20">
                {children}
            </main>
            
            {/* Footer */}
            <footer className="bg-card border-t">
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-4 py-8 px-4 text-center md:text-left">
                    <Logo className="h-7 mx-auto md:mx-0" />
                    <p className="text-sm text-muted-foreground">
                        &copy; {currentYear} Busmo. business money
                    </p>
                    <div className="flex items-center gap-4 mx-auto md:ml-auto md:mr-0">
                        <Link href="#" className="text-sm hover:underline">{t('footer.privacy')}</Link>
                        <Link href="#" className="text-sm hover:underline">{t('footer.terms')}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
