
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
    return (
       <div className="w-full max-w-7xl">
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mb-4">
                <Link href="/market" className="hover:text-primary">Market</Link>
                <ChevronRight className="w-4 h-4" />
                <Link href={`/market/search?q=${productData.category}`} className="capitalize hover:text-primary">{productData.category}</Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px] xl:grid-cols-[minmax(0,1.25fr)_380px] items-start">
                {/* Left column: gallery and mobile header */}
                <div className="space-y-6">
                    <div className="lg:hidden space-y-2">
                        <h1 className="text-2xl font-bold font-headline">{productName}</h1>
                        <div className="text-sm">
                            {businessData?.businessName && <span className="text-muted-foreground">Sold by <Link href={`/${businessData.slug || '#'}`} className="text-primary hover:underline font-medium">{businessData.businessName}</Link></span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={cn("w-4 h-4", averageRating > 0 && i < Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />)}</div>
                            <span className="text-sm text-muted-foreground">({reviewCount} ratings)</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="aspect-[4/5] sm:aspect-square w-full relative bg-card rounded-lg overflow-hidden border">
                            <Image src={selectedImage || 'https://picsum.photos/seed/placeholder/800/800'} alt={productName} fill className="object-contain transition-opacity duration-300 p-4" data-ai-hint={productData.hint || productName} key={selectedImage} />
                        </div>

                        {imageGallery.length > 1 && (
                            <div className="hidden lg:grid grid-cols-5 gap-3">
                                {imageGallery.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={cn(
                                            "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                                            selectedImage === img ? "border-primary" : "border-transparent hover:border-primary/50"
                                        )}
                                    >
                                        <Image src={img} alt={`Thumbnail ${i+1}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {imageGallery.length > 1 && (
                            <div className="lg:hidden flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                                {imageGallery.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={cn(
                                            "relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all",
                                            selectedImage === img ? "border-primary" : "border-transparent hover:border-primary/50"
                                        )}
                                    >
                                        <Image src={img} alt={`Thumbnail ${i+1}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column: purchase */}
                <div className="space-y-6 lg:sticky lg:top-24 self-start">
                    <div className="hidden lg:block space-y-2">
                        <h1 className="text-3xl font-bold font-headline">{productName}</h1>
                        <div className="text-sm">
                            {businessData?.businessName && <span className="text-muted-foreground">Sold by <Link href={`/${businessData.slug || '#'}`} className="text-primary hover:underline font-medium">{businessData.businessName}</Link></span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={cn("w-4 h-4", averageRating > 0 && i < Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />)}</div>
                            <span className="text-sm text-muted-foreground">({reviewCount} ratings)</span>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-foreground">{formatCurrency(displayPrice, market.country)}</p>
                            {displayOldPrice && displayOldPrice > displayPrice && <p className="text-lg text-muted-foreground line-through">{formatCurrency(displayOldPrice, market.country)}</p>}
                        </div>
                        {discountPercent > 0 && <Badge className="bg-destructive/10 text-destructive border-destructive/20">{discountPercent}% OFF</Badge>}
                        {isInStock ? <Badge variant="success" className="ml-2">In Stock</Badge> : <Badge variant="destructive">Out of Stock</Badge>}
                        {stockAvailable && stockAvailable <= 10 && isInStock && <p className="text-sm text-destructive font-semibold mt-1">Only {stockAvailable} left in stock!</p>}
                    </div>

                    <div className="flex items-center gap-4">
                        <Label>Quantity</Label>
                        <div className="flex items-center rounded-md border h-10">
                            <Button variant="ghost" size="icon" className="h-full" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}><Minus className="w-4 h-4"/></Button>
                            <span className="w-8 text-center font-bold">{quantity}</span>
                            <Button variant="ghost" size="icon" className="h-full" onClick={() => handleQuantityChange(1)} disabled={quantity >= (stockAvailable || 0) || !isInStock}><Plus className="w-4 h-4"/></Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button className="w-full h-12 text-base" disabled={!isInStock || isUserLoading} onClick={() => handlePurchaseAction('buyNow')}>{isUserLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Buy Now</Button>
                        <Button variant="outline" className="w-full h-12 text-base" disabled={!isInStock || isUserLoading} onClick={() => handlePurchaseAction('addToCart')}>{isUserLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}<ShoppingCart className="mr-2 h-5 w-5"/>Add to Cart</Button>
                    </div>

                    <Card>
                        <CardHeader className="p-3"><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4"/>Delivery & Returns</CardTitle></CardHeader>
                        <CardContent className="p-3 pt-0 text-sm text-muted-foreground space-y-1">
                            <p>Standard delivery: 2-4 business days.</p>
                            <p>7-day return policy for this item.</p>
                             <Link href="/help" className="text-primary underline">Learn more</Link>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Details */}
            <div className="mt-10 space-y-12">
                <Accordion type="multiple" defaultValue={['details', 'reviews']} className="w-full">
                    <AccordionItem value="details"><AccordionTrigger className="text-lg font-bold">Product Details</AccordionTrigger><AccordionContent className="pt-4 space-y-4 text-muted-foreground"><div className="prose dark:prose-invert max-w-none"><p>{productData.description || 'No description available.'}</p></div></AccordionContent></AccordionItem>
                    
                    <AccordionItem value="seller"><AccordionTrigger className="text-lg font-bold">Seller Information</AccordionTrigger>
                        <AccordionContent>
                            <Card className="bg-muted/50">
                                <CardContent className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    {businessData ? (
                                        <>
                                            <div className="space-y-1">
                                                <p className="font-bold text-lg">{businessData.businessName}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">{businessData.isVerified && <ShieldCheck className="h-4 w-4 text-success"/>} Verified Seller</p>
                                            </div>
                                            <Button asChild variant="secondary"><Link href={`/${businessData.slug || '#'}`}>Visit Store</Link></Button>
                                        </>
                                    ) : <Skeleton className="h-16 w-full" />}
                                </CardContent>
                            </Card>
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="reviews"><AccordionTrigger className="text-lg font-bold">Reviews & Ratings ({reviewCount})</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-8">
                            {user && (
                                <Card><CardHeader><CardTitle className="text-base">Write a Review</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2"><Label>Your Rating</Label><div className="flex items-center gap-1">{[...Array(5)].map((_, i) => (<button key={i} onClick={() => setReviewRating(i + 1)}><Star className={cn("w-6 h-6 transition-colors", i < reviewRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} /></button>))}</div></div>
                                        <div className="space-y-2"><Label htmlFor="review-comment">Your Review</Label><Textarea id="review-comment" placeholder="What did you like or dislike?" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} /></div>
                                        <Button onClick={handleSubmitReview} disabled={isSubmittingReview}>{isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Review</Button>
                                    </CardContent>
                                </Card>
                            )}
                            {isLoadingReviews ? <Skeleton className="h-40 w-full"/> : reviewCount > 0 ? (
                                reviewsData?.map(review => (
                                    <div key={review.id} className="flex gap-4"><Avatar><AvatarFallback><User /></AvatarFallback></Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between"><p className="font-semibold">{review.userName}</p><span className="text-xs text-muted-foreground">{review.createdAt?.toDate().toLocaleDateString()}</span></div>
                                            <div className="flex items-center gap-0.5 mt-1">{[...Array(5)].map((_, i) => (<Star key={i} className={cn("w-4 h-4", i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30")} />))}</div>
                                            <p className="mt-2 text-muted-foreground text-sm">{review.comment}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (<p className="text-muted-foreground text-sm py-8 text-center">No reviews yet. Be the first to leave one!</p>)}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="pt-4 border-t"><h2 className="text-2xl font-bold font-headline mb-6">You Might Also Like</h2>
                     {isLoadingReviews ? ( <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{[...Array(4)].map((_, i) => ( <Card key={i}><Skeleton className="aspect-square w-full" /><CardContent className="p-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-6 w-1/2 mt-2" /></CardContent></Card>))}</div>) 
                     : similarProducts.length > 0 ? (<div className="grid grid-cols-2 md:grid-cols-4 gap-6">{similarProducts.map(p => (<ProductCard key={p.id} product={p} />))}</div>) 
                     : (<p className="text-muted-foreground">No similar products found.</p>)}
                </div>
            </div>
            
            <Dialog open={isLoginPromptOpen} onOpenChange={setIsLoginPromptOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Log In to Continue</DialogTitle><DialogDescription>Please log in or create an account to purchase items.</DialogDescription></DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <Button asChild size="lg"><Link href={`/login?redirect=/market/product/${productId}`}>Log In</Link></Button>
                        <Button asChild variant="outline" size="lg"><Link href={`/signup?redirect=/market/product/${productId}`}>Create Account</Link></Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
