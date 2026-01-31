'use client';

import Link from 'next/link';
import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';
import MarketLayout from '@/components/app/market-layout';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { WithId } from '@/firebase';
import { Logo } from '@/components/app/logo';

// Interfaces
interface BusinessProfile {
    id: string; // useCollection adds this
    businessName: string;
    marketDescription?: string;
    currency?: string;
    address?: string;
    marketSettings?: {
        bannerImageUrl?: string;
        logoImageUrl?: string;
        contactPhone?: string;
        contactEmail?: string;
    }
}

interface MarketProduct {
    id: string;
    productName: string;
    price: number;
    images?: string[]; 
    hint?: string;
    category?: string;
    productId: string;
    averageRating?: number;
    reviewCount?: number;
}

// This component now fetches its own data, ensuring it's always fresh.
const StorePageContent = ({ businessId }: { businessId: string }) => {
    const firestore = useFirestore();

    const businessProfileRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businessProfiles', businessId);
    }, [firestore, businessId]);
    const { data: businessProfile, isLoading: isLoadingProfile } = useDoc<BusinessProfile>(businessProfileRef);

    const verificationRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businessVerifications', businessId);
    }, [firestore, businessId]);
    const { data: verificationData, isLoading: isLoadingVerification } = useDoc<{ status: string }>(verificationRef);
    const isVerified = verificationData?.status === 'verified';

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, 'marketProducts'), where('businessId', '==', businessId));
    }, [firestore, businessId]);
    const { data: productsData, isLoading: isLoadingProducts } = useCollection<MarketProduct>(productsQuery);
    
    if (isLoadingProfile || isLoadingVerification) {
        return (
             <div className="w-full max-w-6xl">
                 <Card className="overflow-hidden mb-8">
                    <Skeleton className="h-48 md:h-64 w-full" />
                    <CardContent className="p-6 space-y-2">
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-5 w-1/4" />
                    </CardContent>
                </Card>
                 <Skeleton className="h-8 w-1/3 mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                         <Card key={i} className="overflow-hidden h-full flex flex-col">
                            <Skeleton className="aspect-video w-full" />
                            <CardContent className="p-4 flex-1 flex flex-col">
                                <Skeleton className="h-6 mt-4 w-3/4" />
                                <Skeleton className="h-8 mt-2 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (!businessProfile) {
        // This can happen briefly or if the profile is deleted.
        // The parent component should handle notFound for initial load.
        notFound();
    }
    
    const settings = businessProfile.marketSettings;

    return (
        <MarketLayout>
            <div className="w-full max-w-6xl">
                 <Card className="overflow-hidden mb-8 shadow-md">
                    <div className="h-48 md:h-64 w-full relative bg-muted">
                        <Image 
                            src={settings?.bannerImageUrl || `https://picsum.photos/seed/${businessId}/1200/300`}
                            alt={`${businessProfile.businessName} banner`}
                            fill
                            className="object-cover"
                            data-ai-hint="business storefront"
                        />
                    </div>
                    <div className="bg-card p-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <Avatar className="h-28 w-28 border-4 border-card bg-muted shadow-lg -mt-20 sm:-mt-0">
                                <AvatarImage src={settings?.logoImageUrl} alt={`${businessProfile.businessName} logo`} />
                                <AvatarFallback className="text-3xl">
                                    {businessProfile.businessName?.split(' ').map(n => n[0]).join('').substring(0,2) || 'B'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1 text-center sm:text-left">
                                 <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <h1 className="text-3xl md:text-4xl font-bold font-headline">{businessProfile.businessName}</h1>
                                    {isVerified && <ShieldCheck className="h-7 w-7 text-success fill-success/20 shrink-0" />}
                                </div>
                                 {businessProfile.address && <p className="text-muted-foreground mt-1 flex items-center justify-center sm:justify-start gap-2"><MapPin className="w-4 h-4 shrink-0"/>{businessProfile.address}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                 {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`}><Button variant="outline" size="icon"><Mail className="h-4 w-4" /><span className="sr-only">Email</span></Button></a>}
                                 {settings?.contactPhone && <a href={`tel:${settings.contactPhone}`}><Button variant="outline" size="icon"><Phone className="h-4 w-4" /><span className="sr-only">Call</span></Button></a>}
                                 <Button variant="outline"><Mail className="mr-2 h-4 w-4" /> Subscribe</Button>
                            </div>
                        </div>
                         <p className="text-muted-foreground mt-4 max-w-2xl mx-auto sm:mx-0">{businessProfile.marketDescription || `Welcome to our store on Busmo Market!`}</p>
                    </div>
                </Card>

                <h2 className="text-2xl font-bold font-headline mb-6">Products from {businessProfile.businessName}</h2>
                
                {isLoadingProducts && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                             <Card key={i} className="overflow-hidden h-full flex flex-col">
                                <Skeleton className="aspect-square w-full" />
                                <CardContent className="p-3 flex-1 flex flex-col">
                                    <Skeleton className="h-5 mt-4 w-3/4" />
                                    <Skeleton className="h-6 mt-2 w-1/2" />
                                    <Skeleton className="h-9 mt-4 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {productsData && productsData.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {productsData.map(product => {
                            const rating = product.averageRating || 0;
                            const reviewCount = product.reviewCount || 0;
                            return (
                            <Link href={`/market/product/${product.id}`} key={product.id}>
                                <Card className="overflow-hidden group cursor-pointer h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300">
                                    <div className="aspect-square overflow-hidden relative">
                                        <Image 
                                            src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/300`}
                                            alt={product.productName || 'Product image'}
                                            fill
                                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                            data-ai-hint={product.category || (product.productName || '').split(' ').slice(0,2).join(' ')}
                                        />
                                    </div>
                                    <CardContent className="p-3 flex-1 flex flex-col">
                                        <h3 className="font-semibold text-sm leading-snug flex-1 line-clamp-2">{product.productName || 'Unnamed Product'}</h3>
                                        <div className="mt-2">
                                            <p className="font-bold text-base">{formatCurrency(product.price, businessProfile?.currency)}</p>
                                        </div>
                                        <div className="flex items-center gap-0.5 mt-1">
                                            {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-3 h-3", rating > 0 && i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />)}
                                            {reviewCount > 0 && <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>}
                                        </div>
                                        <Button size="sm" variant="outline" className="w-full mt-3 h-9">
                                           View Product
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        )})}
                    </div>
                )}
                
                 {productsData && productsData.length === 0 && !isLoadingProducts && (
                    <div className="text-center py-20 border rounded-lg bg-card">
                        <p className="text-muted-foreground">This store has not listed any products yet.</p>
                    </div>
                )}
            </div>
             <div className="w-full max-w-4xl mx-auto mt-16">
                <Card className="bg-muted/50">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">Powered by</p>
                            <Logo className="h-7" />
                        </div>
                        <Button asChild>
                            <Link href="/signup">
                                Start Selling on Busmo &rarr;
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </MarketLayout>
    );
};

// A list of reserved route names to prevent conflicts
const RESERVED_PATHS = [
    'add-inventory', 'add-product', 'admin', 'blog', 'business-info', 
    'currency', 'invest', 'investor', 'login', 'market', 'owner', 'page', 
    'plans', 'pricing', 'record-expense', 'record-sale', 'role', 
    'signup', 'welcome', 'public', 'assets', 'api', 'favicon.ico'
];

export default function StoreSlugPage() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();

    // Prevent this page from matching reserved routes like /login, /admin, etc.
    if (RESERVED_PATHS.includes(slug)) {
        notFound();
    }

    const businessProfileQuery = useMemoFirebase(() => {
        if (!firestore || !slug) return null;
        return query(collection(firestore, 'businessProfiles'), where('slug', '==', slug), limit(1));
    }, [firestore, slug]);
    
    const { data: businessData, isLoading } = useCollection<BusinessProfile>(businessProfileQuery);
    
    const businessProfile = businessData?.[0];

    if (isLoading) {
        return (
            <MarketLayout>
                <div className="w-full max-w-6xl">
                     <Card className="overflow-hidden mb-8">
                        <Skeleton className="h-48 md:h-64 w-full" />
                        <CardContent className="p-6 space-y-2">
                            <Skeleton className="h-10 w-1/2" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-5 w-1/4" />
                        </CardContent>
                    </Card>
                     <Skeleton className="h-8 w-1/3 mb-6" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                             <Card key={i} className="overflow-hidden h-full flex flex-col">
                                <Skeleton className="aspect-video w-full" />
                                <CardContent className="p-4 flex-1 flex flex-col">
                                    <Skeleton className="h-6 mt-4 w-3/4" />
                                    <Skeleton className="h-8 mt-2 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </MarketLayout>
        );
    }

    if (!businessProfile) {
        notFound();
    }

    return <StorePageContent businessId={businessProfile.id} />;
}
