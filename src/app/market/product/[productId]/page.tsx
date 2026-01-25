
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Store, Star, Minus, Plus, ShieldCheck, Truck, RotateCw, Loader2, User } from 'lucide-react';
import MarketLayout from '@/components/app/market-layout';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, limit, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/context/cart-provider';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const createSlug = (name: string) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .trim()
        .replace(/\s+/g, '-') // replace spaces with -
        .replace(/-+/g, '-'); // replace multiple hyphens with a single one
};

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
}

interface Review {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: {
        toDate: () => Date;
    } | null;
}


const ProductCard = ({ product, currency }: { product: MarketProduct, currency?: string }) => (
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
                <p className="font-bold text-base mt-2">{formatCurrency(product.price, currency)}</p>
            </CardContent>
        </Card>
    </Link>
);


const ProductDetailContent = () => {
    const params = useParams();
    const router = useRouter();
    const productId = params.productId as string;
    const [quantity, setQuantity] = useState(1);
    const firestore = useFirestore();
    const { addItem } = useCart();
    const { toast } = useToast();
    const { user } = useUser();

    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
    const [selectedImage, setSelectedImage] = useState<string | undefined>();
    
    // State for review form
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const productRef = useMemoFirebase(() => {
        if (!firestore || !productId) return null;
        return doc(firestore, 'marketProducts', productId);
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
        return productData?.images || [];
    }, [productData]);

    useEffect(() => {
        if (productData) {
            if (productData.hasVariants && productData.variants && productData.variants.length > 0) {
                const firstAvailableVariant = productData.variants.find(v => v.availableQuantity > 0);
                setSelectedVariantId(firstAvailableVariant?.id || productData.variants[0].id);
            }
            setSelectedImage(imageGallery[0]);
        }
    }, [productData, imageGallery]);
    
    const selectedVariant = useMemo(() => {
        if (!productData?.hasVariants || !selectedVariantId) return null;
        return productData.variants?.find(v => v.id === selectedVariantId);
    }, [productData, selectedVariantId]);
    
    const averageRating = useMemo(() => {
        if (!reviewsData || reviewsData.length === 0) return 0;
        return reviewsData.reduce((acc, review) => acc + review.rating, 0) / reviewsData.length;
    }, [reviewsData]);

    const reviewCount = reviewsData?.length || 0;

    // Update selected image when variant changes
    useEffect(() => {
        if (selectedVariant?.image) {
            setSelectedImage(selectedVariant.image);
        } else if (imageGallery.length > 0) {
            setSelectedImage(imageGallery[0]);
        }
    }, [selectedVariant, imageGallery]);


    const displayPrice = selectedVariant ? selectedVariant.price : productData?.price;
    const stockAvailable = selectedVariant ? selectedVariant.availableQuantity : productData?.availableQuantity;
    const isInStock = stockAvailable !== undefined && stockAvailable > 0;
    
    const buyNowUrl = useMemo(() => {
        let url = `/market/checkout?productId=${productId}&quantity=${quantity}`;
        if (selectedVariantId) {
            url += `&variantId=${selectedVariantId}`;
        }
        return url;
    }, [productId, quantity, selectedVariantId]);

    const handleAddToCart = () => {
        if (!productData) return;
        
        addItem({
            id: productData.id,
            name: productData.productName,
            price: displayPrice || 0,
            quantity: quantity,
            image: selectedImage || imageGallery[0],
            variantId: selectedVariant?.id,
            variantName: selectedVariant?.name,
        });

        toast({
            title: "Added to Cart",
            description: `${productData.productName} ${selectedVariant ? `(${selectedVariant.name})` : ''} has been added to your cart.`,
        });
    };

    const handleBuyNow = () => {
        router.push(buyNowUrl);
    };

    const handleSubmitReview = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Please log in', description: 'You must be logged in to leave a review.' });
            return;
        }
        if (reviewRating === 0 || !reviewComment.trim()) {
            toast({ variant: 'destructive', title: 'Missing information', description: 'Please provide a rating and a comment.' });
            return;
        }
        if (!firestore || !productData) return;

        setIsSubmittingReview(true);
        const newReview = {
            productId: productData.id,
            businessId: productData.businessId,
            userId: user.uid,
            userName: user.displayName || 'Anonymous User',
            rating: reviewRating,
            comment: reviewComment.trim(),
            createdAt: serverTimestamp(),
        };

        try {
            await addDocumentNonBlocking(collection(firestore, 'reviews'), newReview);

            // Denormalize: Update average rating on the market product
            const newReviewCount = (productData.reviewCount || 0) + 1;
            const newAverageRating = ((productData.averageRating || 0) * (productData.reviewCount || 0) + reviewRating) / newReviewCount;
            const marketProductRef = doc(firestore, 'marketProducts', productData.id);
            await updateDocumentNonBlocking(marketProductRef, {
                reviewCount: newReviewCount,
                averageRating: newAverageRating
            });

            toast({ title: 'Review Submitted', description: 'Thank you for your feedback!' });
            setReviewRating(0);
            setReviewComment('');
        } catch (error) {
            console.error("Error submitting review:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your review.' });
        } finally {
            setIsSubmittingReview(false);
        }
    };


    const similarProductsQuery = useMemoFirebase(() => {
        if (!firestore || !productData?.category) return null;
        return query(
            collection(firestore, 'marketProducts'),
            where('category', '==', productData.category),
            limit(5)
        );
    }, [firestore, productData?.category]);

    const { data: similarProductsData, isLoading: isLoadingSimilar } = useCollection<MarketProduct>(similarProductsQuery);

    const similarProducts = useMemo(() => {
        if (!similarProductsData) return [];
        return similarProductsData.filter(p => p.id !== productId).slice(0, 4);
    }, [similarProductsData, productId]);
    
    const handleQuantityChange = (change: number) => {
        setQuantity(prev => Math.max(1, Math.min(prev + change, stockAvailable || 1)));
    }
    
    const trustSignals = [
        { icon: Truck, text: 'Reliable Delivery' },
        { icon: ShieldCheck, text: 'Secure Payments' },
        { icon: RotateCw, text: 'Easy Returns' },
    ];
    
    const businessLink = businessData?.slug ? `/${businessData.slug}` : (businessData?.businessName ? `/${createSlug(businessData.businessName)}` : '#');


    if (isLoadingProduct || (productData && isLoadingBusiness)) {
        return (
             <MarketLayout>
               <div className="w-full max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Image Skeleton */}
                        <div>
                            <Skeleton className="aspect-square w-full rounded-lg" />
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                <Skeleton className="aspect-square w-full rounded-md" />
                                <Skeleton className="aspect-square w-full rounded-md" />
                                <Skeleton className="aspect-square w-full rounded-md" />
                                <Skeleton className="aspect-square w-full rounded-md" />
                            </div>
                        </div>
                        {/* Details Skeleton */}
                        <div className="flex flex-col gap-4">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-10 w-1/2" />
                            <Separator />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <div className="grid grid-cols-3 gap-2">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-14 w-32" />
                                <Skeleton className="h-14 flex-1" />
                            </div>
                        </div>
                    </div>
               </div>
            </MarketLayout>
        );
    }
    
    if (!productData) {
         return <MarketLayout>
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Product not found</h1>
                <p className="text-muted-foreground">The product you are looking for is not available in the market.</p>
                <Link href="/market"><Button variant="link" className="mt-4">Back to Market</Button></Link>
            </div>
        </MarketLayout>;
    }
    
    const productName = productData.productName || "Unnamed Product";

    return (
        <MarketLayout>
           <div className="w-full max-w-5xl">
                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* --- Image Column --- */}
                    <div className="space-y-4">
                        <div className="aspect-square w-full relative bg-card rounded-lg overflow-hidden border">
                            <Image 
                                src={selectedImage || 'https://picsum.photos/seed/placeholder/800/600'}
                                alt={productName}
                                fill
                                className="object-contain transition-opacity duration-300"
                                data-ai-hint={productData.hint || productData.category || productName}
                                key={selectedImage}
                            />
                        </div>
                        {imageGallery.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {imageGallery.map((img, i) => (
                                    <button key={i} onClick={() => setSelectedImage(img)} className={cn("aspect-square relative rounded-md overflow-hidden border-2 transition-all", selectedImage === img ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-primary/50")}>
                                        <Image src={img} alt={`Thumbnail ${i+1}`} fill className="object-cover"/>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* --- Details Column --- */}
                    <div className="flex flex-col gap-4">
                        <div>
                             {businessData && (
                                <Link href={businessLink} className="text-sm font-medium text-primary hover:underline">
                                    {businessData.businessName}
                                </Link>
                             )}
                            <h1 className="text-2xl lg:text-3xl font-bold font-headline mt-1">{productName}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map((_, i) => <Star key={i} className={cn("w-4 h-4", averageRating > 0 && i < Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />)}
                                </div>
                                <span className="text-sm text-muted-foreground">({reviewCount} ratings)</span>
                                <Separator orientation="vertical" className="h-4"/>
                                {isInStock ? (
                                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">In Stock</Badge>
                                ) : (
                                    <Badge variant="destructive">Out of Stock</Badge>
                                )}
                            </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                            <p className="text-3xl lg:text-4xl font-bold text-primary">{formatCurrency(displayPrice || 0, businessData?.currency)}</p>
                        </div>
                        
                        {productData.hasVariants && productData.variants && productData.variants.length > 0 && (
                            <div>
                                <Label className="font-semibold text-base">Select {productData.variants[0].name.match(/\d/)? 'Size' : 'Option'}</Label>
                                <RadioGroup value={selectedVariantId} onValueChange={setSelectedVariantId} className="mt-2 grid grid-cols-3 lg:grid-cols-4 gap-2">
                                    {productData.variants.map(variant => (
                                        <div key={variant.id}>
                                            <RadioGroupItem value={variant.id} id={variant.id} className="peer sr-only" disabled={variant.availableQuantity <= 0} />
                                            <Label htmlFor={variant.id} className={cn("flex flex-col items-center justify-center rounded-md border-2 p-3 text-sm font-medium cursor-pointer transition-colors hover:bg-accent/50", "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary", "peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-disabled:hover:bg-transparent")}>
                                                <span>{variant.name}</span>
                                                <span className="text-xs text-muted-foreground">{formatCurrency(variant.price, businessData?.currency)}</span>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}

                        <div className="flex items-center gap-4 pt-2">
                            <Label>Quantity</Label>
                            <div className="flex items-center rounded-md border">
                                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}><Minus className="w-4 h-4"/></Button>
                                <span className="w-8 text-center font-bold">{quantity}</span>
                                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => handleQuantityChange(1)} disabled={quantity >= (stockAvailable || 0)}><Plus className="w-4 h-4"/></Button>
                            </div>
                        </div>

                        
                        {/* --- Sticky CTA for Mobile --- */}
                        <div className="mt-auto pt-4 md:pt-0 sticky bottom-0 md:static bg-background md:bg-transparent py-4 md:p-0 border-t md:border-none -mx-4 px-4 md:mx-0">
                             <div className="flex flex-col sm:flex-row items-center gap-4">
                                <Button className="w-full h-12 text-lg" disabled={!isInStock} onClick={handleBuyNow}>
                                    Buy Now
                                </Button>
                                <Button variant="outline" className="w-full h-12 text-lg" disabled={!isInStock} onClick={handleAddToCart}>
                                    <ShoppingCart className="mr-2 h-5 w-5"/>
                                    Add to Cart
                                </Button>
                            </div>
                            {!isInStock && <p className="text-destructive text-sm text-center mt-2">This item is currently unavailable.</p>}
                        </div>

                        <Card className="bg-muted/30">
                            <CardContent className="p-4 grid grid-cols-3 gap-4 text-center">
                                {trustSignals.map(signal => (
                                    <div key={signal.text} className="flex flex-col items-center gap-2">
                                        <signal.icon className="w-6 h-6 text-muted-foreground"/>
                                        <p className="text-xs text-muted-foreground">{signal.text}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t">
                    <h2 className="text-2xl font-bold font-headline mb-6">Product Details</h2>
                    <p className="text-muted-foreground max-w-2xl">{productData.description || 'No description available for this product.'}</p>
                </div>
                
                 <div className="mt-16 pt-8 border-t">
                    <h2 className="text-2xl font-bold font-headline mb-6">Customer Reviews ({reviewCount})</h2>
                    {isLoadingReviews ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                             {user && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Write a Review</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Your Rating</Label>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <button key={i} onClick={() => setReviewRating(i + 1)}>
                                                        <Star className={cn("w-6 h-6 transition-colors", i < reviewRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="review-comment">Your Review</Label>
                                            <Textarea id="review-comment" placeholder="What did you like or dislike?" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                                        </div>
                                        <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>
                                            {isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Submit Review
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}

                            {reviewCount > 0 ? (
                                reviewsData?.map(review => (
                                    <div key={review.id} className="flex gap-4">
                                        <Avatar>
                                            <AvatarFallback><User /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">{review.userName}</p>
                                                <span className="text-xs text-muted-foreground">{review.createdAt?.toDate().toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-0.5 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={cn("w-4 h-4", i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />
                                                ))}
                                            </div>
                                            <p className="mt-2 text-muted-foreground">{review.comment}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground">No reviews yet. Be the first to leave one!</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-16 pt-8 border-t">
                    <h2 className="text-2xl font-bold font-headline mb-6">You Might Also Like</h2>
                    {isLoadingSimilar ? (
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
                            {similarProducts.map(product => (
                                <ProductCard key={product.id} product={product} currency={businessData?.currency} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No similar products found.</p>
                    )}
                </div>
           </div>
        </MarketLayout>
    );
}


export default function ProductDetailPage() {
    return <ProductDetailContent />
}
