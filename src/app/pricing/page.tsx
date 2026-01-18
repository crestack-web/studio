'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShoppingCart, Store, Network, Building, Check, X } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';

export default function PricingPage() {
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo className="h-8" />
          <nav className="flex items-center gap-4">
            <Link href="/pricing" passHref>
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/login" passHref>
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup" passHref>
              <Button>Join the Waitlist</Button>
            </Link>
          </nav>
        </div>
      </header>
        
        <main className="flex-1 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Choose Your Plan</CardTitle>
                    <CardDescription>All plans start with a free trial. No credit card needed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <RadioGroup defaultValue="shop" className="grid grid-cols-1 gap-4">
                    <div>
                        <RadioGroupItem value="shop" id="shop" className="peer sr-only" />
                        <Label htmlFor="shop" className="block rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <ShoppingCart className="w-8 h-8 text-primary" />
                                    <div className="text-left">
                                        <p className="font-semibold">Shop</p>
                                        <p className="text-sm text-muted-foreground">For small retailers</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">₦1,500</p>
                                    <p className="text-sm text-muted-foreground">/month</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Record Sales, Expenses & Inventory</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Basic AI Insights</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>1 Staff Member</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Advanced Forecasting</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Multiple Branches</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Production Tracking</span></li>
                            </ul>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="supermarket" id="supermarket" className="peer sr-only" />
                        <Label htmlFor="supermarket" className="block rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                           <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <Store className="w-8 h-8 text-primary" />
                                    <div className="text-left">
                                        <p className="font-semibold">Supermarket</p>
                                        <p className="text-sm text-muted-foreground">For larger stores</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">₦10,000</p>
                                    <p className="text-sm text-muted-foreground">/month</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Everything in Shop</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Up to 5 Staff Members</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Advanced Forecasting</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Multiple Branches</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Production Tracking</span></li>
                            </ul>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="multi-branch" id="multi-branch" className="peer sr-only" />
                        <Label htmlFor="multi-branch" className="block rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <Network className="w-8 h-8 text-primary" />
                                    <div className="text-left">
                                        <p className="font-semibold">Multiple Branches</p>
                                        <p className="text-sm text-muted-foreground">For chains & franchises</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">₦30,000</p>
                                    <p className="text-sm text-muted-foreground">/month</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Everything in Supermarket</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Unlimited Staff Members</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Multiple Branches</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Production Tracking</span></li>
                            </ul>
                        </Label>
                    </div>
                     <div>
                      <RadioGroupItem value="company" id="company" className="peer sr-only" />
                      <Label htmlFor="company" className="block rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <Building className="w-8 h-8 text-primary" />
                                <div className="text-left">
                                    <p className="font-semibold">Company</p>
                                    <p className="text-sm text-muted-foreground">For production & enterprise</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold">Custom</p>
                                <p className="text-sm text-muted-foreground">Contact Us</p>
                            </div>
                        </div>
                        <Separator className="my-4" />
                        <ul className="space-y-2 text-sm text-muted-foreground">
                           <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Everything in Multi-Branch</span></li>
                           <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Production Tracking</span></li>
                           <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Custom Integrations</span></li>
                           <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Dedicated Support</span></li>
                        </ul>
                      </Label>
                    </div>
                </RadioGroup>
                <Link href="/signup" className="w-full">
                    <Button className="w-full h-14 text-lg">
                    Start Free Trial
                    </Button>
                </Link>
                </CardContent>
            </Card>
        </main>
      
      {/* Footer */}
      <footer className="bg-card border-t">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 items-center justify-between gap-4 py-8 px-4 text-center md:text-left">
          <Logo className="h-7 mx-auto md:mx-0" />
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Busmo. Business. Money. Clear.
          </p>
          <div className="flex items-center gap-4 mx-auto md:ml-auto md:mr-0">
            <Link href="#" className="text-sm hover:underline">Privacy</Link>
             <Link href="#" className="text-sm hover:underline">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
    );
}
