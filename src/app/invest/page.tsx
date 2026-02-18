
'use client';

import Link from 'next/link';
import { Logo } from '@/components/app/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Building, MapPin } from 'lucide-react';
import InvestorLayout from '@/components/app/investor-layout';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemo } from 'react';
import Image from 'next/image';
import { BagIcon, FarmIcon, PhoneIcon } from '@/components/icons/business';

interface BusinessProfile {
    id: string;
    businessName: string;
    marketDescription?: string;
    businessType: string;
    country: string;
    city: string;
    slug: string;
    marketSettings?: {
        logoImageUrl?: string;
    };
    isSeekingInvestment?: boolean;
}

const BusinessCard = ({ profile }: { profile: BusinessProfile }) => {
    return (
        <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border">
                        <AvatarImage src={profile.marketSettings?.logoImageUrl} alt={`${profile.businessName} logo`} />
                        <AvatarFallback>{profile.businessName?.split(' ').map(n => n[0]).join('').substring(0,2) || 'B'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{profile.businessName}</CardTitle>
                        <CardDescription className="capitalize flex items-center gap-1.5"><MapPin className="w-3 h-3"/>{profile.city}, {profile.country}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {profile.marketDescription || `A ${profile.businessType} business based in ${profile.city}.`}
                </p>
            </CardContent>
            <div className="p-4 pt-0 border-t mt-4">
                 <Link href={`/${profile.slug}`} className="block mt-4">
                    <Button className="w-full">View Details</Button>
                </Link>
            </div>
        </Card>
    );
};

const LoadingSkeleton = () => (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
             <Card key={i} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="space-y-2">
                             <Skeleton className="h-5 w-32" />
                             <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2 flex-1">
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-5/6" />
                </CardContent>
                 <div className="p-4 pt-0 border-t mt-4">
                    <Skeleton className="h-10 w-full mt-4" />
                </div>
            </Card>
        ))}
    </div>
);


export default function InvestPage() {
    const firestore = useFirestore();

    const profilesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'businessProfiles'));
    }, [firestore]);

    const { data: profiles, isLoading } = useCollection<BusinessProfile>(profilesQuery);
    
    // Only show businesses that have opted in to seek investment
    const filteredProfiles = useMemo(() => {
        if (!profiles) return [];
        return profiles.filter(p => p.isSeekingInvestment);
    }, [profiles]);


    return (
        <InvestorLayout>
            {/* Hero Section with App Logo and Hero Image */}
            <section className="relative bg-gradient-to-b from-background to-muted/20 py-16 sm:py-24">
                <div className="container mx-auto px-4 flex flex-col items-center text-center">
                    <div className="flex flex-col items-center gap-4 mb-8">
                        {/* App Logo */}
                        <div className="flex items-center gap-2">
                            {/* Use Logo component for brand consistency */}
                            <span className="inline-block"><Logo className="h-12 w-auto" /></span>
                            <span className="font-display font-extrabold text-2xl text-primary">Busmo</span>
                        </div>
                        {/* Hero Image from Seller page */}
                        <div className="relative w-full max-w-xl aspect-[3/2] rounded-2xl overflow-hidden border bg-muted/20 shadow-lg">
                            <Image src="/sell-hero.png" alt="Business owners using Busmo Seller Central" fill priority unoptimized sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline mb-4">
                        Invest in Africa's Growth Engine
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
                        Discover and fund the next generation of small and medium businesses, backed by real-time, trusted data from Busmo.
                    </p>
                </div>
            </section>

            {/* Features/Opportunities Section with SVG Icons */}
            <section className="container mx-auto px-4 py-12 sm:py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl shadow">
                        <span className="mb-3"><BagIcon className="h-10 w-10 text-primary" /></span>
                        <h3 className="font-bold text-lg mb-2">Discover Verified Opportunities</h3>
                        <p className="text-muted-foreground">Browse businesses verified through real Busmo activity data. Filter by industry, location, revenue range, and investment type.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl shadow">
                        <span className="mb-3"><FarmIcon className="h-10 w-10 text-primary" /></span>
                        <h3 className="font-bold text-lg mb-2">Backed by Real Data</h3>
                        <p className="text-muted-foreground">Every opportunity is backed by live sales, profit, cash flow, and inventory data — not just pitch decks. Reduce risk with transparency.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl shadow">
                        <span className="mb-3"><PhoneIcon className="h-10 w-10 text-primary" /></span>
                        <h3 className="font-bold text-lg mb-2">Invest Your Way</h3>
                        <p className="text-muted-foreground">Choose profit-sharing or equity-based deals. Track your returns and portfolio performance in one clear dashboard.</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            <span>Filter Opportunities</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Industry / Niche</label>
                            <Select disabled>
                                <SelectTrigger><SelectValue placeholder="All Industries" /></SelectTrigger>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Location</label>
                             <Select disabled>
                                <SelectTrigger><SelectValue placeholder="All Locations" /></SelectTrigger>
                            </Select>
                        </div>
                         <div className="space-y-2">
                             <label className="text-sm font-medium">Revenue Range (Annual)</label>
                             <Select disabled>
                                <SelectTrigger><SelectValue placeholder="Any Revenue" /></SelectTrigger>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Investment Type</label>
                             <Select disabled>
                                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {isLoading ? <LoadingSkeleton /> : (
                    filteredProfiles && filteredProfiles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProfiles.map(profile => (
                                <BusinessCard key={profile.id} profile={profile} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg">
                            <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Active Opportunities</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                We are currently building our network of verified businesses. Check back soon for investment opportunities.
                            </p>
                        </div>
                    )
                )}
            </section>
        </InvestorLayout>
    );
}
