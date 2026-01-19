'use client';

import { useMemo } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle2, ShieldCheck, TrendingUp, Handshake, Building2, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

// Interfaces for Firestore data
interface AppUser {
    businessId?: string;
}

interface Business {
    plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
}

export default function AccessCapitalPage() {
    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businesses', businessId);
    }, [firestore, businessId]);
    const { data: businessData } = useDoc<Business>(businessRef);
    
    // Eligibility for equity is based on the company plan
    const canAccessEquity = businessData?.plan === 'company';

    return (
        <MainLayout title="Access Capital" backHref="/owner/home">
            <div className="w-full max-w-5xl space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline sm:text-4xl">Unlock Your Business's Growth Potential</h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        Busmo analyzes your business health to connect you with capital opportunities. Based on your data, here's what you might be eligible for.
                    </p>
                </div>

                {/* How It Works Section */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <TrendingUp className="w-6 h-6 text-primary" />
                                <span>Your Business Readiness Score</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-muted-foreground">We automatically calculate an internal score based on your real-time performance. Investors use this as a signal of business health.</p>
                            <ul className="text-sm space-y-2 text-muted-foreground">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Revenue consistency</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Profit margin health</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Inventory discipline</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Cash flow reliability</li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                <span>Privacy-First & Opt-In</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-muted-foreground">Your detailed business data is never shared. You must explicitly opt-in to show interest in an investment type.</p>
                            <p className="text-muted-foreground">Investors only see summarized metrics and signals, not your raw transaction data. Your privacy is paramount.</p>
                             <Button variant="secondary" disabled>
                                <LockKeyhole className="mr-2 h-4 w-4"/>
                                Manage Data Sharing (Coming Soon)
                             </Button>
                        </CardContent>
                    </Card>
                </div>


                {/* Capital Options Section */}
                 <div>
                    <h2 className="text-2xl font-bold font-headline text-center mb-6">Your Capital Options</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Profit Sharing Card */}
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 font-headline">
                                    <Handshake className="w-7 h-7 text-accent" />
                                    <span>Profit Sharing</span>
                                </CardTitle>
                                <CardDescription>Get a cash injection for growth. Repay with a small percentage of your future profits. Perfect for inventory, marketing, or small equipment.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="border rounded-lg p-4 bg-background">
                                     <p className="text-sm text-muted-foreground font-medium">Sample Offer</p>
                                     <p className="text-3xl font-bold font-headline text-primary">₦150,000</p>
                                     <p className="text-muted-foreground">for a <span className="font-semibold text-foreground">10% share</span> of net profits over <span className="font-semibold text-foreground">12 months</span>.</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" disabled>Learn More & Opt-In (Coming Soon)</Button>
                            </CardFooter>
                        </Card>
                        
                        {/* Equity Investment Card */}
                        <Card className={cn("flex flex-col", !canAccessEquity && "bg-muted/50 border-dashed")}>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-3 font-headline">
                                    <Building2 className="w-7 h-7 text-accent" />
                                    <span>Equity Investment</span>
                                </CardTitle>
                                <CardDescription>For registered companies ready for major growth. Access larger investments from venture partners in exchange for equity.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                               {canAccessEquity ? (
                                    <div className="border rounded-lg p-4 bg-background">
                                         <p className="text-sm text-muted-foreground font-medium">Example Opportunity</p>
                                         <p className="text-2xl font-bold font-headline text-primary">Valuation Estimate: ₦5M - ₦8M</p>
                                         <p className="text-muted-foreground">Access offers for up to <span className="font-semibold text-foreground">20% equity</span> to scale your operations.</p>
                                    </div>
                               ) : (
                                    <div className="text-center p-4 h-full flex flex-col justify-center items-center">
                                        <p className="text-muted-foreground font-medium">This feature is available on the <span className="text-primary font-bold">Company</span> plan.</p>
                                        <Link href="/owner/pricing">
                                            <Button variant="link">Upgrade Your Plan</Button>
                                        </Link>
                                    </div>
                               )}
                            </CardContent>
                            <CardFooter>
                                 <Button className="w-full" disabled>Explore Equity Options (Coming Soon)</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

                <div className="text-center text-muted-foreground text-sm pt-4">
                    <p>Busmo does not guarantee returns and is not a direct lender. We provide trusted data to reduce risk and increase transparency for both businesses and investors.</p>
                     <Link href="/owner/home" passHref>
                        <Button variant="link" className="mt-2">Back to Home</Button>
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
}
