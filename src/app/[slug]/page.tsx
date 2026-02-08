'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, Mail, Phone, ShieldCheck, Check, Instagram, Facebook, Twitter } from 'lucide-react';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, convertCurrency, getCurrencyName } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { WithId } from '@/firebase';
import { Logo } from '@/components/app/logo';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMarket } from '@/context/market-provider';


// Interfaces
interface BusinessProfile {
    id: string; // useCollection adds this
    businessName: string;
    businessType?: string;
    marketDescription?: string;
    currency?: string;
    address?: string;
    isVerified?: boolean;
    slug?: string;
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
    currency?: string;
    images?: string[]; 
    hint?: string;
    category?: string;
    productId: string;
    averageRating?: number;
    reviewCount?: number;
}


// A list of reserved route names to prevent conflicts
const RESERVED_PATHS = [
    'add-inventory', 'add-product', 'admin', 'blog', 'business-info', 
    'currency', 'invest', 'investor', 'login', 'market', 'owner', 'page', 
    'plans', 'pricing', 'record-expense', 'record-sale', 'role', 
    'signup', 'welcome', 'public', 'assets', 'api', 'favicon.ico'
];

const FALLBACK_THEME = { primary: '#5717ee', background: '#f7f7fb', text: '#0f172a' };

export default function StoreSlugPage() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const { market } = useMarket();

    // Firestore is initialized client-side; avoid returning 404 before it's ready.
    const isFirestoreReady = Boolean(firestore);

    // Prevent this page from matching reserved routes like /login, /admin, etc.
    if (RESERVED_PATHS.includes(slug)) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: FALLBACK_THEME.background, color: FALLBACK_THEME.text }}>
                <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
                    <h1 className="text-2xl font-bold">Storefront not available</h1>
                    <p className="text-muted-foreground">Please use the market to browse stores.</p>
                    <Button asChild variant="outline"><Link href="/market">Back to Market</Link></Button>
                </div>
            </div>
        );
    }

    // 1. Fetch business profile by slug
    const businessProfileQuery = useMemoFirebase(() => {
        if (!firestore || !slug) return null;
        return query(collection(firestore, 'businessProfiles'), where('slug', '==', slug), limit(1));
    }, [firestore, slug]);
    
    const { data: businessData, isLoading: isLoadingProfile, error: businessProfileError } = useCollection<BusinessProfile>(businessProfileQuery);
    const businessProfile = businessData?.[0];
    const businessId = businessProfile?.id;

    // 2. Fetch related data once businessId is available
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

    const handleSubscribe = () => {
        if (!businessProfile) return;
        setIsSubscribed(true);
        toast({
            title: "Subscribed!",
            description: `You'll now hear about updates from ${businessProfile.businessName}.`,
        });
    };

    if (!isFirestoreReady || isLoadingProfile) {
        // Initial skeleton while fetching profile by slug
        return (
            <div className="min-h-screen" style={{ backgroundColor: FALLBACK_THEME.background }}>
                <div className="mx-auto max-w-6xl px-4 py-10">
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
            </div>
        );
    }

    if (businessProfileError) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: FALLBACK_THEME.background, color: FALLBACK_THEME.text }}>
                <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
                    <h1 className="text-2xl font-bold">Couldn't load this storefront</h1>
                    <p className="text-muted-foreground">Please try again in a moment.</p>
                    <Button asChild variant="outline"><Link href="/market">Back to Market</Link></Button>
                </div>
            </div>
        );
    }
    
    if (!businessProfile) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: FALLBACK_THEME.background, color: FALLBACK_THEME.text }}>
                <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
                    <h1 className="text-2xl font-bold">Storefront not found</h1>
                    <p className="text-muted-foreground">This store link may be incorrect or the store is offline.</p>
                    <Button asChild variant="outline"><Link href="/market">Back to Market</Link></Button>
                </div>
            </div>
        );
    }

    const settings = businessProfile.marketSettings;
    const currentCountry = market?.country || businessProfile?.currency || 'NG';
    const currencyName = getCurrencyName(currentCountry);
    const isLoading = isLoadingVerification || isLoadingProducts;

    const theme = { ...FALLBACK_THEME, ...(settings?.theme || {}) };
    const productMap = useMemo(() => {
        const map: Record<string, MarketProduct> = {};
        (productsData || []).forEach(p => { map[p.id] = p; });
        return map;
    }, [productsData]);

    const featuredProducts = useMemo(() => {
        const ids = settings?.featuredProductIds || [];
        return ids.map(id => productMap[id]).filter(Boolean);
    }, [settings?.featuredProductIds, productMap]);

    const collectionsWithProducts = useMemo(() => {
        const collections = settings?.collections || [];
        return collections.map(c => ({ ...c, products: c.productIds.map(id => productMap[id]).filter(Boolean) }));
    }, [settings?.collections, productMap]);

    const featuredIdsSet = new Set(settings?.featuredProductIds || []);
    const nonFeaturedProducts = useMemo(() => (productsData || []).filter(p => !featuredIdsSet.has(p.id)), [productsData, featuredIdsSet]);

    return (
        <div className="min-h-screen" style={{ backgroundColor: theme.background, color: theme.text }}>
            {settings?.announcement?.enabled && settings.announcement.text && (
                <div className="w-full" style={{ backgroundColor: theme.primary, color: '#fff' }}>
                    <div className="mx-auto max-w-6xl px-4 py-2 text-sm flex justify-between gap-4">
                        <span>{settings.announcement.text}</span>
                        {settings.announcement.link && <Link href={settings.announcement.link} className="underline">Learn more</Link>}
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
                {/* Hero */}
                <section className="relative overflow-hidden rounded-3xl border shadow-sm" style={{ backgroundColor: theme.background }}>
                    {settings?.hero?.backgroundUrl && (
                        <Image src={settings.hero.backgroundUrl} alt="Store hero" fill className="object-cover opacity-70" />
                    )}
                    <div className="relative p-8 sm:p-12 backdrop-blur-sm bg-black/30 text-white" style={{ color: '#fff' }}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20 border-4 border-white/30 bg-white/10">
                                    <AvatarImage src={settings?.logoImageUrl} alt={`${businessProfile.businessName} logo`} />
                                    <AvatarFallback className="text-2xl">{businessProfile.businessName?.[0] || 'B'}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-3xl sm:text-4xl font-bold font-headline">{businessProfile.businessName}</h1>
                                        {isVerified && <Badge className="flex items-center gap-1 bg-white/10 border-white/20 text-white"><ShieldCheck className="h-4 w-4" /> Verified</Badge>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
                                        {businessProfile.businessType && <Badge variant="secondary" className="bg-white/10 border-white/20 text-white">{businessProfile.businessType}</Badge>}
                                        {businessProfile.address && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {businessProfile.address}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {settings?.socials?.instagram && <Link href={settings.socials.instagram} target="_blank"><Button variant="secondary" size="icon" className="bg-white/10 border-white/20 text-white"><Instagram className="h-4 w-4" /></Button></Link>}
                                {settings?.socials?.facebook && <Link href={settings.socials.facebook} target="_blank"><Button variant="secondary" size="icon" className="bg-white/10 border-white/20 text-white"><Facebook className="h-4 w-4" /></Button></Link>}
                                {settings?.socials?.twitter && <Link href={settings.socials.twitter} target="_blank"><Button variant="secondary" size="icon" className="bg-white/10 border-white/20 text-white"><Twitter className="h-4 w-4" /></Button></Link>}
                                {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`}><Button variant="secondary" size="icon" className="bg-white/10 border-white/20 text-white"><Mail className="h-4 w-4" /></Button></a>}
                                {settings?.contactPhone && <a href={`tel:${settings.contactPhone}`}><Button variant="secondary" size="icon" className="bg-white/10 border-white/20 text-white"><Phone className="h-4 w-4" /></Button></a>}
                            </div>
                        </div>
                        <div className="mt-8 max-w-3xl space-y-4">
                            <h2 className="text-3xl sm:text-4xl font-bold">{settings?.hero?.title || 'Discover our latest collections'}</h2>
                            <p className="text-lg text-white/85">{settings?.hero?.subtitle || businessProfile.marketDescription || 'Curated products from our store.'}</p>
                            {settings?.hero?.ctaText && settings.hero.ctaUrl && (
                                <Button asChild size="lg" style={{ backgroundColor: theme.primary, borderColor: theme.primary }}>
                                    <Link href={settings.hero.ctaUrl}>{settings.hero.ctaText}</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Featured products */}
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={`sk-${i}`} className="overflow-hidden h-full flex flex-col">
                                <Skeleton className="aspect-square w-full" />
                                <CardContent className="p-3 flex-1 flex flex-col">
                                    <Skeleton className="h-5 mt-4 w-3/4" />
                                    <Skeleton className="h-6 mt-2 w-1/2" />
                                    <Skeleton className="h-9 mt-4 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {featuredProducts.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-headline font-semibold">Featured</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {featuredProducts.map(product => {
                                        const rating = product.averageRating || 0;
                                        const reviewCount = product.reviewCount || 0;
                                        const displayPrice = convertCurrency(product.price, product.currency, currencyName);
                                        return (
                                            <Link href={`/market/product/${product.id}`} key={`feat-${product.id}`}>
                                                <Card className="overflow-hidden group cursor-pointer h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300">
                                                    <div className="aspect-square overflow-hidden relative">
                                                        <Image src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.productName || 'Product image'} fill className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                                                    </div>
                                                    <CardContent className="p-3 flex-1 flex flex-col">
                                                        <h3 className="font-semibold text-sm leading-snug flex-1 line-clamp-2">{product.productName || 'Unnamed Product'}</h3>
                                                        <p className="font-bold text-base mt-2">{formatCurrency(displayPrice, currentCountry)}</p>
                                                        <div className="flex items-center gap-0.5 mt-1">
                                                            {[...Array(5)].map((_, i) => <Star key={i} className={cn('w-3 h-3', rating > 0 && i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')} />)}
                                                            {reviewCount > 0 && <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>}
                                                        </div>
                                                        <Button size="sm" className="w-full mt-3 h-9" style={{ backgroundColor: theme.primary, borderColor: theme.primary }}>View Product</Button>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {collectionsWithProducts.map((collection) => (
                            <div key={collection.id} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold">{collection.name}</h3>
                                    <span className="text-sm text-muted-foreground">{collection.products.length} items</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {collection.products.map(product => {
                                        const displayPrice = convertCurrency(product.price, product.currency, currencyName);
                                        return (
                                            <Link href={`/market/product/${product.id}`} key={`${collection.id}-${product.id}`}>
                                                <Card className="overflow-hidden group cursor-pointer h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300">
                                                    <div className="aspect-square overflow-hidden relative">
                                                        <Image src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.productName || 'Product image'} fill className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                                                    </div>
                                                    <CardContent className="p-3 flex-1 flex flex-col">
                                                        <h4 className="font-semibold text-sm leading-snug flex-1 line-clamp-2">{product.productName || 'Unnamed Product'}</h4>
                                                        <p className="font-bold text-base mt-2">{formatCurrency(displayPrice, currentCountry)}</p>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-headline font-semibold">All Products</h2>
                                <Badge variant="outline">{productsData?.length || 0} items</Badge>
                            </div>
                            {nonFeaturedProducts && nonFeaturedProducts.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {nonFeaturedProducts.map(product => {
                                        const rating = product.averageRating || 0;
                                        const reviewCount = product.reviewCount || 0;
                                        const displayPrice = convertCurrency(product.price, product.currency, currencyName);
                                        return (
                                            <Link href={`/market/product/${product.id}`} key={`all-${product.id}`}>
                                                <Card className="overflow-hidden group cursor-pointer h-full flex flex-col shadow-sm hover:shadow-lg transition-shadow duration-300">
                                                    <div className="aspect-square overflow-hidden relative">
                                                        <Image src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.productName || 'Product image'} fill className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
                                                    </div>
                                                    <CardContent className="p-3 flex-1 flex flex-col">
                                                        <h3 className="font-semibold text-sm leading-snug flex-1 line-clamp-2">{product.productName || 'Unnamed Product'}</h3>
                                                        <p className="font-bold text-base mt-2">{formatCurrency(displayPrice, currentCountry)}</p>
                                                        <div className="flex items-center gap-0.5 mt-1">
                                                            {[...Array(5)].map((_, i) => <Star key={i} className={cn('w-3 h-3', rating > 0 && i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')} />)}
                                                            {reviewCount > 0 && <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 border rounded-lg bg-card">
                                    <p className="text-muted-foreground">No products listed yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <footer className="border-t" style={{ backgroundColor: '#fff' }}>
                <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h4 className="font-semibold">{businessProfile.businessName}</h4>
                        <p className="text-sm text-muted-foreground">{businessProfile.marketDescription || 'Thanks for visiting our store.'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {settings?.socials?.instagram && <Link href={settings.socials.instagram} target="_blank" className="text-muted-foreground hover:text-foreground"><Instagram className="h-5 w-5" /></Link>}
                        {settings?.socials?.facebook && <Link href={settings.socials.facebook} target="_blank" className="text-muted-foreground hover:text-foreground"><Facebook className="h-5 w-5" /></Link>}
                        {settings?.socials?.twitter && <Link href={settings.socials.twitter} target="_blank" className="text-muted-foreground hover:text-foreground"><Twitter className="h-5 w-5" /></Link>}
                        {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="text-muted-foreground hover:text-foreground"><Mail className="h-5 w-5" /></a>}
                        {settings?.contactPhone && <a href={`tel:${settings.contactPhone}`} className="text-muted-foreground hover:text-foreground"><Phone className="h-5 w-5" /></a>}
                    </div>
                </div>
            </footer>
        </div>
    );
}
