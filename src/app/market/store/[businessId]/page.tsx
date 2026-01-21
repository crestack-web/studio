'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/app/main-layout';
import { Star } from 'lucide-react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency';

interface BusinessProfile {
    businessName: string;
    marketDescription?: string;
    currency?: string;
}

interface MarketProduct {
    id: string;
    productName: string;
    price: number;
    image?: string; 
    hint?: string;
    category?: string;
    productId: string;
}


const StorePageContent = () => {
    const params = useParams();
    const businessId = params.businessId as string;
    const firestore = useFirestore();

    const businessProfileRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businessProfiles', businessId);
    }, [firestore, businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, 'marketProducts'), where('businessId', '==', businessId));
    }, [firestore, businessId]);
    const { data: productsData, isLoading: isLoadingProducts } = useCollection<MarketProduct>(productsQuery);

    if (isLoadingBusiness) {
        return (
             <MainLayout title="Loading Store..." backHref="/market">
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
            </MainLayout>
        );
    }

    if (!businessData) {
        return <MainLayout title="Store Not Found" backHref="/market">
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold">Store not found</h1>
                <p className="text-muted-foreground">The store you are looking for does not exist.</p>
                <Link href="/market"><Button variant="link" className="mt-4">Back to Market</Button></Link>
            </div>
        </MainLayout>;
    }

  return (
    <MainLayout title={businessData.businessName} backHref="/market">
        <div className="w-full max-w-6xl">
            <Card className="overflow-hidden mb-8">
                <div className="h-48 md:h-64 w-full relative">
                    <Image 
                        src={`https://picsum.photos/seed/${businessId}/1200/300`}
                        alt={`${businessData.businessName} banner`}
                        fill
                        className="object-cover"
                        data-ai-hint="business storefront"
                    />
                </div>
                <CardContent className="p-6">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">{businessData.businessName}</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">{businessData.marketDescription || 'Welcome to our store on Busmo Market!'}</p>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                        {/* Rating and reviews are static for now */}
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">4.8</span>
                        <span>(25 reviews)</span>
                    </div>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold font-headline mb-6">Products from {businessData.businessName}</h2>
            
            {isLoadingProducts && (
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
            )}

            {productsData && productsData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {productsData.map(product => (
                        <Link href={`/market/product/${product.id}`} key={product.id}>
                            <Card className="overflow-hidden group cursor-pointer h-full flex flex-col">
                                <div className="aspect-video overflow-hidden">
                                    <Image 
                                        src={product.image || `https://picsum.photos/seed/${product.id}/400/300`}
                                        alt={product.productName || 'Product image'}
                                        width={400}
                                        height={300}
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint={product.category || (product.productName || '').split(' ').slice(0,2).join(' ')}
                                    />
                                </div>
                                <CardContent className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-semibold text-lg flex-1">{product.productName || 'Unnamed Product'}</h3>
                                    <p className="font-bold text-xl mt-4">{formatCurrency(product.price, businessData?.currency)}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
            
             {productsData && productsData.length === 0 && !isLoadingProducts && (
                <div className="text-center py-20 border rounded-lg bg-card">
                    <p className="text-muted-foreground">This store has not listed any products yet.</p>
                </div>
            )}

        </div>
    </MainLayout>
  );
}


export default function StorePage() {
    return <StorePageContent />;
}
