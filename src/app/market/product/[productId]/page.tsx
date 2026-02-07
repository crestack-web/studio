
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Store, Star, Minus, Plus, ShieldCheck, Truck, RotateCw, Loader2, User, ChevronRight, Tags, Info, Package } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, limit, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, convertCurrency, getCurrencyName } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/cart-provider';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMarket } from '@/context/market-provider';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// --- INTERFACES & HELPER COMPONENTS ---

interface Variant { 
    id: string; 
    name: string; 
    price: number; 
    availableQuantity: number; 
    image?: string;
}
interface MarketProduct { 
    id: string; 
    productName: string; 
    price: number;
    oldPrice?: number;
    currency?: string;
    description?: string;
    images?: string[];
    hint?: string;
    businessId: string;
    category?: string;
    hasVariants?: boolean;
    variants?: Variant[];
    availableQuantity?: number;
    reviewCount?: number;
    averageRating?: number;
}
interface BusinessProfile {
    businessName: string;
    currency: string;
    slug?: string;
    isVerified?: boolean;
}
interface Review {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: { toDate: () => Date; } | null;
}

const ProductCard = ({ product }: { product: MarketProduct }) => {
    const { market } = useMarket();
    const displayPrice = convertCurrency(product.price, product.currency, getCurrencyName(market.country));

    return (
        <Link href={`/market/product/${product.id}`} className="block group">
            <Card className="h-full flex flex-col overflow-hidden hover:border-primary transition-colors duration-200">
                <div className="aspect-square relative overflow-hidden">
                    <Image
                        src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/400`}
                        alt={product.productName || 'Product image'}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={product.hint || product.category}
                    />
                </div>
                <CardContent className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm leading-snug flex-1 line-clamp-2">{product.productName}</h3>
                    <p className="font-bold text-base mt-2">{formatCurrency(displayPrice, market.country)}</p>
                </CardContent>
            </Card>
        </Link>
    );
};

// --- MAIN PAGE COMPONENT ---

export default function ProductDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { productId } = params;
    const [quantity, setQuantity] = useState(1);
    const firestore = useFirestore();
    const { addItem } = useCart();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const { market } = useMarket();

    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
    const [selectedImage, setSelectedImage] = useState<string | undefined>();
    
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);

    const productRef = useMemoFirebase(() => {
        if (!firestore || !productId) return null;
        return doc(firestore, 'marketProducts', productId as string);
    }, [firestore, productId]);
    const { data: productData, isLoading: isLoadingProduct } = useDoc<MarketProduct>(productRef);

    const businessProfileRef = useMemoFirebase(() => {
        if (!firestore || !productData?.businessId) return null;
        return doc(firestore, 'businessProfiles', productData.businessId);
    }, [firestore, productData?.businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);
    
    const reviewsQuery = useMemoFirebase(() => {
        if (!firestore || !productId) return null;
        return query(collection(firestore, 'reviews'), where('productId', '==', productId));
    }, [firestore, productId]);
    const { data: reviewsData, isLoading: isLoadingReviews } = useCollection<Review>(reviewsQuery);

    const imageGallery = useMemo(() => {
        const images = new Set<string>();
        if (productData?.images) {
            productData.images.forEach(img => images.add(img));
        }
        if (productData?.variants) {
            productData.variants.forEach(v => {
                if (v.image) images.add(v.image);
            });
        }
        return Array.from(images);
    }, [productData]);

    useEffect(() => {
        if (productData) {
            if (productData.hasVariants && productData.variants && productData.variants.length > 0) {
                const firstAvailableVariant = productData.variants.find(v => (v.availableQuantity || 0) > 0);
                setSelectedVariantId(firstAvailableVariant?.id || productData.variants[0].id);
            }
            if (!selectedImage && imageGallery.length > 0) {
                setSelectedImage(imageGallery[0]);
            }
        }
    }, [productData, imageGallery, selectedImage]);
    
    const selectedVariant = useMemo(() => {
        if (!productData?.hasVariants || !selectedVariantId) return null;
        return productData.variants?.find(v => v.id === selectedVariantId);
    }, [productData, selectedVariantId]);
    
    const averageRating = productData?.averageRating || 0;
    const reviewCount = productData?.reviewCount || 0;

    useEffect(() => {
        if (selectedVariant?.image) {
            setSelectedImage(selectedVariant.image);
        } else if (!selectedImage && imageGallery.length > 0) {
            setSelectedImage(imageGallery[0]);
        }
    }, [selectedVariant, imageGallery, selectedImage]);

    const originalPrice = selectedVariant?.price ?? productData?.price;
    const oldPrice = productData?.oldPrice;
    
    const displayPrice = convertCurrency(originalPrice || 0, productData?.currency, getCurrencyName(market.country));
    const displayOldPrice = oldPrice ? convertCurrency(oldPrice, productData?.currency, getCurrencyName(market.country)) : undefined;

    const stockAvailable = selectedVariant ? selectedVariant.availableQuantity : productData?.availableQuantity;
    const isInStock = stockAvailable !== undefined && stockAvailable > 0;
    
    const buyNowUrl = useMemo(() => {
        let url = `/market/checkout?productId=${productId}&quantity=${quantity}`;
        if (selectedVariantId) url += `&variantId=${selectedVariantId}`;
        return url;
    }, [productId, quantity, selectedVariantId]);

    const handlePurchaseAction = (action: 'addToCart' | 'buyNow') => {
        if (!user && !isUserLoading) { setIsLoginPromptOpen(true); return; }
        if (isUserLoading) return;

        if (action === 'addToCart') {
            if (!productData) return;
            addItem({
                id: productData.id,
                name: productData.productName,
                price: displayPrice || 0,
                quantity: quantity,
                image: selectedImage || imageGallery[0],
                variantId: selectedVariant?.id,
                variantName: selectedVariant?.name,
                businessId: productData.businessId,
            });
            toast({ title: "Added to Cart", description: `${productData.productName} has been added.` });
        } else if (action === 'buyNow') {
            router.push(buyNowUrl);
        }
    };

    const handleSubmitReview = async () => {
        if (!user) { setIsLoginPromptOpen(true); return; }
        if (reviewRating === 0 || !reviewComment.trim()) { toast({ variant: 'destructive', title: 'Missing information' }); return; }
        if (!firestore || !productData) return;

        setIsSubmittingReview(true);
        const newReview = {
            productId: productData.id, businessId: productData.businessId, userId: user.uid,
            userName: user.displayName || 'Anonymous User', rating: reviewRating, comment: reviewComment.trim(),
            createdAt: serverTimestamp(),
        };

        try {
            await addDocumentNonBlocking(collection(firestore, 'reviews'), newReview);
            await runTransaction(firestore, async (transaction) => {
                const productDocRef = doc(firestore, "marketProducts", productData.id);
                const productSnap = await transaction.get(productDocRef);
                if (!productSnap.exists()) throw new Error("Product not found.");
                
                const currentData = productSnap.data();
                const newCount = (currentData.reviewCount || 0) + 1;
                const newAvg = ((currentData.averageRating || 0) * (currentData.reviewCount || 0) + reviewRating) / newCount;
                
                transaction.update(productDocRef, { reviewCount: newCount, averageRating: newAvg });
            });

            toast({ title: 'Review Submitted', description: 'Thank you for your feedback!' });
            setReviewRating(0); setReviewComment('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit review.' });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const similarProductsQuery = useMemoFirebase(() => {
        if (!firestore || !productData?.category) return null;
        return query(collection(firestore, 'marketProducts'), where('category', '==', productData.category), limit(5));
    }, [firestore, productData?.category]);
    const { data: similarProductsData } = useCollection<MarketProduct>(similarProductsQuery);
    const similarProducts = useMemo(() => similarProductsData?.filter(p => p.id !== productId).slice(0, 4) || [], [similarProductsData, productId]);
    
    const handleQuantityChange = (change: number) => setQuantity(prev => Math.max(1, Math.min(prev + change, stockAvailable || 1)));

    if (isLoadingProduct || (productData && isLoadingBusiness)) {
        return (
           <div className="w-full max-w-6xl"><div className="grid md:grid-cols-2 gap-12"><Skeleton className="aspect-square w-full rounded-lg" /><div className="space-y-6"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-12 w-1/2" /><Skeleton className="h-14 w-full" /></div></div></div>
        );
    }
    
    if (!productData) {
        return <div className="text-center py-20"><h1 className="text-2xl font-bold">Product not found</h1><Link href="/market"><Button variant="link" className="mt-4">Back to Market</Button></Link></div>;
    }
    
    const productName = productData.productName || "Unnamed Product";
    const discountPercent = displayOldPrice && displayPrice ? Math.round(((displayOldPrice - displayPrice) / displayOldPrice) * 100) : 0;

    return (
        <div className="w-full">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="pt-4 pb-3 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                    <Link href="/market" className="hover:text-primary">Market</Link>
                    <ChevronRight className="w-4 h-4" />
                    {productData.category ? (
                        <Link href={`/market/search?q=${productData.category}`} className="capitalize hover:text-primary">{productData.category}</Link>
                    ) : (
                        <span>Product</span>
                    )}
                </div>

                {/* Top: Gallery + Purchase */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 items-start">
                    {/* Gallery */}
                    <div className="lg:col-span-7 min-w-0">
                        <div className="lg:sticky lg:top-[var(--market-sticky-top)] space-y-4">
                            <div className="aspect-square w-full relative bg-card rounded-lg overflow-hidden border">
                                <Image
                                    src={selectedImage || 'https://picsum.photos/seed/placeholder/900/900'}
                                    alt={productName}
                                    fill
                                    className="object-contain p-4"
                                    data-ai-hint={productData.hint || productName}
                                    key={selectedImage}
                                />
                            </div>

                            {imageGallery.length > 1 && (
                                <div className="w-full">
                                    {/* Mobile: horizontal thumbnails */}
                                    <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
                                        {imageGallery.map((img, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedImage(img)}
                                                className={cn(
                                                    'relative h-16 w-16 shrink-0 rounded-md overflow-hidden border-2 transition-colors',
                                                    selectedImage === img ? 'border-primary' : 'border-transparent hover:border-primary/50'
                                                )}
                                            >
                                                <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Desktop/Tablet: carousel thumbnails */}
                                    <div className="hidden md:block">
                                        <Carousel opts={{ align: 'start', loop: false }} className="w-full">
                                            <CarouselContent className="-ml-2">
                                                {imageGallery.map((img, i) => (
                                                    <CarouselItem key={i} className="basis-1/6 lg:basis-1/5 pl-2">
                                                        <button
                                                            onClick={() => setSelectedImage(img)}
                                                            className={cn(
                                                                'aspect-square relative rounded-md overflow-hidden border-2 transition-colors block w-full',
                                                                selectedImage === img ? 'border-primary' : 'border-transparent hover:border-primary/50'
                                                            )}
                                                        >
                                                            <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                                                        </button>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            {imageGallery.length > 6 && (
                                                <>
                                                    <CarouselPrevious />
                                                    <CarouselNext />
                                                </>
                                            )}
                                        </Carousel>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Purchase + Info */}
                    <div className="lg:col-span-5 min-w-0">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-2xl sm:text-3xl font-bold font-headline break-words">{productName}</h1>
                                {businessData?.businessName && (
                                    <div className="text-sm text-muted-foreground">
                                        Sold by{' '}
                                        <Link href={`/${businessData.slug || '#'}`} className="text-primary hover:underline font-medium">
                                            {businessData.businessName}
                                        </Link>
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    'w-4 h-4',
                                                    averageRating > 0 && i < Math.round(averageRating)
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-muted-foreground/30'
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm text-muted-foreground">({reviewCount} ratings)</span>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    <p className="text-3xl font-bold text-foreground">{formatCurrency(displayPrice, market.country)}</p>
                                    {displayOldPrice && displayOldPrice > displayPrice && (
                                        <p className="text-lg text-muted-foreground line-through">{formatCurrency(displayOldPrice, market.country)}</p>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {discountPercent > 0 && (
                                        <Badge className="bg-destructive/10 text-destructive border-destructive/20">{discountPercent}% OFF</Badge>
                                    )}
                                    {isInStock ? <Badge variant="success">In Stock</Badge> : <Badge variant="destructive">Out of Stock</Badge>}
                                </div>
                                {stockAvailable && stockAvailable <= 10 && isInStock && (
                                    <p className="text-sm text-destructive font-semibold">Only {stockAvailable} left in stock!</p>
                                )}
                            </div>

                            {/* Variants */}
                            {productData.hasVariants && productData.variants && productData.variants.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Options</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {productData.variants.map((variant) => {
                                            const disabled = (variant.availableQuantity || 0) <= 0;
                                            const isSelected = selectedVariantId === variant.id;
                                            return (
                                                <Button
                                                    key={variant.id}
                                                    type="button"
                                                    variant={isSelected ? 'default' : 'outline'}
                                                    className="justify-start"
                                                    disabled={disabled}
                                                    onClick={() => setSelectedVariantId(variant.id)}
                                                >
                                                    <span className="truncate">{variant.name}</span>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="flex flex-wrap items-center gap-4">
                                <Label>Quantity</Label>
                                <div className="flex items-center rounded-md border h-10">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-full"
                                        onClick={() => handleQuantityChange(-1)}
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-10 text-center font-bold">{quantity}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-full"
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={quantity >= (stockAvailable || 0) || !isInStock}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full h-12 text-base"
                                    disabled={!isInStock || isUserLoading}
                                    onClick={() => handlePurchaseAction('buyNow')}
                                >
                                    {isUserLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Buy Now
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 text-base"
                                    disabled={!isInStock || isUserLoading}
                                    onClick={() => handlePurchaseAction('addToCart')}
                                >
                                    {isUserLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    Add to Cart
                                </Button>
                            </div>

                            {/* Info cards */}
                            <Card>
                                <CardHeader className="p-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Truck className="h-4 w-4" />Delivery & Returns
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0 text-sm text-muted-foreground space-y-1">
                                    <p>Standard delivery: 2-4 business days.</p>
                                    <p>7-day return policy for this item.</p>
                                    <Link href="/help" className="text-primary underline">Learn more</Link>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="p-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4" />Seller
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                    {businessData ? (
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate">{businessData.businessName}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    {businessData.isVerified && <ShieldCheck className="h-4 w-4 text-success" />} Verified Seller
                                                </p>
                                            </div>
                                            <Button asChild variant="secondary" className="shrink-0">
                                                <Link href={`/${businessData.slug || '#'}`}>Visit Store</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <Skeleton className="h-16 w-full" />
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Bottom: Details + Reviews */}
                <div className="mt-10 pb-12">
                    <div className="border-t pt-8">
                        <Accordion type="multiple" defaultValue={['details', 'reviews']} className="w-full">
                            <AccordionItem value="details">
                                <AccordionTrigger className="text-lg font-bold">Product Details</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4 text-muted-foreground">
                                    <div className="prose dark:prose-invert max-w-none break-words">
                                        <p>{productData.description || 'No description available.'}</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="reviews">
                                <AccordionTrigger className="text-lg font-bold">Reviews & Ratings ({reviewCount})</AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-8">
                                    {user && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Write a Review</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Your Rating</Label>
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <button key={i} onClick={() => setReviewRating(i + 1)}>
                                                                <Star
                                                                    className={cn(
                                                                        'w-6 h-6 transition-colors',
                                                                        i < reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
                                                                    )}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="review-comment">Your Review</Label>
                                                    <Textarea
                                                        id="review-comment"
                                                        placeholder="What did you like or dislike?"
                                                        value={reviewComment}
                                                        onChange={(e) => setReviewComment(e.target.value)}
                                                    />
                                                </div>
                                                <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                                                    {isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Submit Review
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {isLoadingReviews ? (
                                        <Skeleton className="h-40 w-full" />
                                    ) : reviewCount > 0 ? (
                                        <div className="space-y-6">
                                            {reviewsData?.map((review) => (
                                                <div key={review.id} className="flex gap-4 min-w-0">
                                                    <Avatar>
                                                        <AvatarFallback>
                                                            <User />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="font-semibold truncate">{review.userName}</p>
                                                            <span className="text-xs text-muted-foreground">{review.createdAt?.toDate().toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 mt-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={cn(
                                                                        'w-4 h-4',
                                                                        i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                        <p className="mt-2 text-muted-foreground text-sm break-words">{review.comment}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm py-8 text-center">No reviews yet. Be the first to leave one!</p>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    {/* Similar Products */}
                    <div className="pt-10">
                        <h2 className="text-2xl font-bold font-headline mb-6">You Might Also Like</h2>
                        {isLoadingReviews ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {[...Array(4)].map((_, i) => (
                                    <Card key={i}>
                                        <Skeleton className="aspect-square w-full" />
                                        <CardContent className="p-3">
                                            <Skeleton className="h-5 w-3/4" />
                                            <Skeleton className="h-6 w-1/2 mt-2" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : similarProducts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {similarProducts.map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No similar products found.</p>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Log In to Continue</DialogTitle>
                        <DialogDescription>Please log in or create an account to purchase items.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <Button asChild size="lg">
                            <Link href={`/login?redirect=/market/product/${productId}`}>Log In</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href={`/signup?redirect=/market/product/${productId}`}>Create Account</Link>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
