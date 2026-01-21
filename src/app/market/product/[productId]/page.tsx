'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Store, Star } from 'lucide-react';
import MainLayout from '@/components/app/main-layout';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';

interface MarketProduct { 
    id: string; 
    productName: string; 
    price: number; 
    description?: string;
    image?: string;
    hint?: string;
    businessId: string;
    category?: string;
}

interface BusinessProfile {
    businessName: string;
    currency: string;
}

const ProductDetailContent = () => {
    const params = useParams();
    const productId = params.productId as string;
    const [quantity, setQuantity] = useState(1);
    const firestore = useFirestore();

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

    if (isLoadingProduct || (productData && isLoadingBusiness)) {
        return (
             <MainLayout title="Loading Product..." backHref="/market">
               <div className="w-full max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <Card className="overflow-hidden">
                                <Skeleton className="aspect-[4/3] w-full" />
                            </Card>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-10 w-1/2" />
                                <Skeleton className="h-5 w-full mt-2" />
                                <Skeleton className="h-5 w-5/6" />
                            </div>
                            <Separator />
                            <Card><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
                            <Skeleton className="h-14 w-full" />
                        </div>
                    </div>
               </div>
            </MainLayout>
        );
    }
    
    if (!productData) {
         return <MainLayout title="Product Not Found" backHref="/market">
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Product not found</h1>
                <p className="text-muted-foreground">The product you are looking for is not available in the market.</p>
                <Link href="/market"><Button variant="link" className="mt-4">Back to Market</Button></Link>
            </div>
        </MainLayout>;
    }
    
    const productName = productData.productName || "Unnamed Product";

    return (
        <MainLayout title={productName} backHref="/market">
           <div className="w-full max-w-4xl">
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <Card className="overflow-hidden">
                            <div className="aspect-[4/3] w-full relative">
                            <Image 
                                src={productData.image || `https://picsum.photos/seed/${productData.id}/800/600`}
                                alt={productName}
                                fill
                                className="object-cover"
                                data-ai-hint={productData.hint || productData.category || productName}
                            />
                            </div>
                        </Card>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div>
                            <h1 className="text-3xl font-bold font-headline">{productName}</h1>
                            <p className="text-3xl font-bold text-primary mt-2">{formatCurrency(productData.price, businessData?.currency)}</p>
                            <p className="text-muted-foreground mt-4">{productData.description || 'No description available for this product.'}</p>
                        </div>

                        <Separator />

                         {businessData && (
                             <Card>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg">Sold by</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-primary">{businessData.businessName}</p>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                {/* Static rating for now */}
                                                <span>4.8 (25 reviews)</span>
                                            </div>
                                        </div>
                                        <Link href={`/market/store/${productData.businessId}`}>
                                            <Button variant="secondary">
                                                <Store className="mr-2 h-4 w-4" />
                                                Visit Store
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                         )}

                        <div className="flex items-center gap-4">
                            <div className="w-24">
                                <Label htmlFor="quantity" className="sr-only">Quantity</Label>
                                <Input 
                                    id="quantity" 
                                    type="number" 
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1" 
                                    className="h-14 text-lg text-center"
                                />
                            </div>
                            <Link href={`/market/checkout?productId=${productData.id}&quantity=${quantity}`} className="w-full flex-1">
                                <Button className="w-full h-14 text-lg flex-1">
                                    <ShoppingCart className="mr-2 h-6 w-6"/>
                                    Proceed to Checkout
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
           </div>
        </MainLayout>
    );
}


export default function ProductDetailPage() {
    return <ProductDetailContent />
}
