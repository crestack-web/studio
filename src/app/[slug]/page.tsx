'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, Mail, Phone, ShieldCheck, Check, Instagram, Facebook, Twitter } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
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
    const rawSlug = (params as any)?.slug as string | string[] | undefined;
    const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const { market } = useMarket();

    const safeHref = (href: unknown): string | undefined => {
        if (typeof href !== 'string') return undefined;
        const trimmed = href.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    };

    const safeOptionalImageSrc = (src: unknown): string | undefined => {
        if (typeof src !== 'string') return undefined;
        const trimmed = src.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    };

    const safeImageSrc = (src: unknown, fallback: string): string => {
        return safeOptionalImageSrc(src) ?? fallback;
    };

    // Firestore is initialized client-side; avoid returning 404 before it's ready.
    const isFirestoreReady = Boolean(firestore);

    const isSlugReady = typeof slug === 'string' && slug.trim().length > 0;
    const normalizedSlug = isSlugReady ? slug.trim() : '';
    const isReservedPath = isSlugReady ? RESERVED_PATHS.includes(normalizedSlug) : false;

    // 1. Fetch business profile by slug
    const businessProfileQuery = useMemoFirebase(() => {
        if (!firestore || !isSlugReady) return null;
        return query(collection(firestore, 'businessProfiles'), where('slug', '==', normalizedSlug), limit(1));
    }, [firestore, isSlugReady, normalizedSlug]);
    
    const { data: businessData, isLoading: isLoadingProfile, error: businessProfileError } = useCollection<BusinessProfile>(businessProfileQuery);
    const businessProfile = businessData?.[0];
    const businessId = businessProfile?.id;

    // NOTE: businessVerifications is protected by Security Rules for unauthenticated users.
    // The public storefront should not query it; use a public field on the profile instead.
    const isVerified = Boolean(businessProfile?.isVerified);

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

    const settings: any = businessProfile?.marketSettings || {};
    const currentCountry = market?.country || businessProfile?.currency || 'NG';
    const currencyName = getCurrencyName(currentCountry);
    const isLoading = isLoadingProducts;

    const theme = {
        ...FALLBACK_THEME,
        ...((settings && typeof settings.theme === 'object' && settings.theme) ? settings.theme : {}),
    };
    const productMap = useMemo(() => {
        const map: Record<string, MarketProduct> = {};
        (productsData || []).forEach(p => { map[p.id] = p; });
        return map;
    }, [productsData]);

    const featuredProductIds = useMemo(() => {
        return Array.isArray(settings?.featuredProductIds) ? settings.featuredProductIds : [];
    }, [settings?.featuredProductIds]);

    const featuredProducts = useMemo<MarketProduct[]>(() => {
        return featuredProductIds
            .map((id: any) => productMap[String(id)])
            .filter((product: MarketProduct | undefined): product is MarketProduct => Boolean(product));
    }, [featuredProductIds, productMap]);

    const collectionsWithProducts = useMemo<Array<{ id: string; name: string; products: MarketProduct[] }>>(() => {
        const collections = Array.isArray(settings?.collections) ? settings.collections : [];
        return collections.map((c: any, index: number) => {
            const productIds = Array.isArray(c?.productIds) ? c.productIds : [];

            const safeId = typeof c?.id === 'string' && c.id.trim().length > 0 ? c.id : `collection-${index}`;
            const safeName = typeof c?.name === 'string' && c.name.trim().length > 0 ? c.name : 'Collection';

            return {
                ...c,
                id: safeId,
                name: safeName,
                products: productIds
                    .map((id: any) => productMap[String(id)])
                    .filter((product: MarketProduct | undefined): product is MarketProduct => Boolean(product)),
            };
        });
    }, [settings?.collections, productMap]);

    const featuredIdsSet = new Set((featuredProductIds || []).map((id: any) => String(id)));
    const nonFeaturedProducts = useMemo(() => (productsData || []).filter(p => !featuredIdsSet.has(p.id)), [productsData, featuredIdsSet]);

    // Render branches (must be AFTER all hooks above)
    if (isReservedPath) {
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

    if (!isSlugReady || !isFirestoreReady || isLoadingProfile) {
        // Initial skeleton while fetching profile by slug (or while params/firestore are not ready)
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

    return (
        <div className="min-h-screen" style={{ backgroundColor: theme.background, color: theme.text }}>
            {Boolean(settings?.announcement && typeof settings.announcement === 'object' && settings.announcement.enabled && settings.announcement.text) && (
                <div className="w-full" style={{ backgroundColor: theme.primary, color: '#fff' }}>
                    <div className="mx-auto max-w-6xl px-4 py-2 text-sm flex justify-between gap-4">
                        <span>{settings.announcement.text}</span>
                            {safeHref(settings.announcement.link) && <Link href={safeHref(settings.announcement.link)!} className="underline">Learn more</Link>}
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">
                {/* Hero */}
                <section className="relative overflow-hidden rounded-3xl border shadow-sm" style={{ backgroundColor: theme.background }}>
                    {safeOptionalImageSrc(settings?.hero?.backgroundUrl) && (
                        <Image src={safeImageSrc(settings.hero.backgroundUrl, `https://picsum.photos/seed/${businessId || slug}/1200/600`)} alt="Store hero" fill className="object-cover opacity-70" />
                    )}
                    <div className="relative p-8 sm:p-12 backdrop-blur-sm bg-black/30 text-white" style={{ color: '#fff' }}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20 border-4 border-white/30 bg-white/10">
                                    <AvatarImage src={safeOptionalImageSrc(settings?.logoImageUrl)} alt={`${businessProfile.businessName || 'Business'} logo`} />
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
                                <Button
                                    onClick={handleSubscribe}
                                    variant="secondary"
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                                </Button>
                                {safeHref(settings?.socials?.instagram) && <Link href={safeHref(settings.socials.instagram)!} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="icon" className="bg-white/10 border-white/20 text-white"><Instagram className="h-4 w-4" /></Button></Link>}
                                {safeHref(settings?.socials?.facebook) && <Link href={safeHref(settings.socials.facebook)!} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="icon" className="bg-white/10 border-white/20 text-white"><Facebook className="h-4 w-4" /></Button></Link>}
                                {safeHref(settings?.socials?.twitter) && <Link href={safeHref(settings.socials.twitter)!} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="icon" className="bg-white/10 border-white/20 text-white"><Twitter className="h-4 w-4" /></Button></Link>}
                                {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`}><Button variant="secondary" size="icon" className="bg-white/10 border-white/20 text-white"><Mail className="h-4 w-4" /></Button></a>}
                                {settings?.contactPhone && <a href={`tel:${settings.contactPhone}`}><Button variant="secondary" size="icon" className="bg-white/10 border-white/20 text-white"><Phone className="h-4 w-4" /></Button></a>}
                            </div>
                        </div>
                        <div className="mt-8 max-w-3xl space-y-4">
                            <h2 className="text-3xl sm:text-4xl font-bold">{settings?.hero?.title || 'Discover our latest collections'}</h2>
                            <p className="text-lg text-white/85">{settings?.hero?.subtitle || businessProfile.marketDescription || 'Curated products from our store.'}</p>
                            {settings?.hero?.ctaText && safeHref(settings?.hero?.ctaUrl) && (
                                <Button asChild size="lg" style={{ backgroundColor: theme.primary, borderColor: theme.primary }}>
                                    <Link href={safeHref(settings.hero.ctaUrl)!}>{settings.hero.ctaText}</Link>
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
                                                        <Image src={safeImageSrc(product.images?.[0], `https://picsum.photos/seed/${product.id}/400/300`)} alt={product.productName || 'Product image'} fill className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
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
                                                        <Image src={safeImageSrc(product.images?.[0], `https://picsum.photos/seed/${product.id}/400/300`)} alt={product.productName || 'Product image'} fill className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
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
                                                        <Image src={safeImageSrc(product.images?.[0], `https://picsum.photos/seed/${product.id}/400/300`)} alt={product.productName || 'Product image'} fill className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105" />
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

            <div className="mx-auto max-w-6xl px-4 pb-10">
                <Card className="bg-muted/20">
                    <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-0.5">
                            <p className="text-xs sm:text-sm font-medium">Try Busmo free for 14 days</p>
                            <p className="text-xs text-muted-foreground">Track sales, expenses, and inventory.</p>
                        </div>
                        <Button size="sm" asChild style={{ backgroundColor: theme.primary, borderColor: theme.primary }}>
                            <Link
                                href={{
                                    pathname: '/signup',
                                    query: { from: 'storefront', store: normalizedSlug || '' },
                                }}
                            >
                                Start trial
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <footer className="border-t" style={{ backgroundColor: '#fff' }}>
                <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h4 className="font-semibold">{businessProfile.businessName}</h4>
                        <p className="text-sm text-muted-foreground">{businessProfile.marketDescription || 'Thanks for visiting our store.'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {safeHref(settings?.socials?.instagram) && <Link href={safeHref(settings.socials.instagram)!} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Instagram className="h-5 w-5" /></Link>}
                        {safeHref(settings?.socials?.facebook) && <Link href={safeHref(settings.socials.facebook)!} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Facebook className="h-5 w-5" /></Link>}
                        {safeHref(settings?.socials?.twitter) && <Link href={safeHref(settings.socials.twitter)!} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Twitter className="h-5 w-5" /></Link>}
                        {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="text-muted-foreground hover:text-foreground"><Mail className="h-5 w-5" /></a>}
                        {settings?.contactPhone && <a href={`tel:${settings.contactPhone}`} className="text-muted-foreground hover:text-foreground"><Phone className="h-5 w-5" /></a>}
                    </div>
                </div>
            </footer>
        </div>
    );
}
