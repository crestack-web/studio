'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MarketLayout from '@/components/app/market-layout';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { Search } from 'lucide-react';
import { useMarket } from '@/context/market-provider';

// Re-using this interface from market page
interface MarketProduct {
    id: string;
    productName: string;
    businessName: string;
    price: number;
    category: string;
    images?: string[];
    hint?: string;
}

const ProductCard = ({ product }: { product: MarketProduct }) => {
    const { market } = useMarket();
    return (
        <Link href={`/market/product/${product.id}`} className="block group">
            <Card className="h-full flex flex-col overflow-hidden hover:border-primary transition-colors duration-200">
                <div className="aspect-square relative overflow-hidden">
                    <Image
                        src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/400`}
                        alt={product.productName}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        data-ai-hint={product.hint}
                    />
                </div>
                <CardContent className="p-3 flex-1 flex flex-col">
                    <h3 className="font-semibold text-sm leading-snug flex-1 line-clamp-2">{product.productName}</h3>
                    <p className="font-bold text-base mt-2">{formatCurrency(product.price, market.country)}</p>
                    <p className="text-xs text-muted-foreground">{product.businessName}</p>
                </CardContent>
            </Card>
        </Link>
    );
};


function SearchResults() {
    const searchParams = useSearchParams();
    const queryParam = searchParams.get('q') || '';
    
    const firestore = useFirestore();

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketProducts'));
    }, [firestore]);
    const { data: allProducts, isLoading: isLoadingProducts } = useCollection<MarketProduct>(productsQuery);

    const filteredProducts = React.useMemo(() => {
        if (!allProducts || !queryParam) return [];
        const lowercasedQuery = queryParam.toLowerCase();
        return allProducts.filter(product =>
            product.productName.toLowerCase().includes(lowercasedQuery) ||
            product.businessName.toLowerCase().includes(lowercasedQuery) ||
            product.category.toLowerCase().includes(lowercasedQuery)
        );
    }, [allProducts, queryParam]);

    if (isLoadingProducts) {
        return (
             <div className="w-full max-w-6xl">
                <Skeleton className="h-8 w-1/3 mb-6" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                         <Card key={i} className="overflow-hidden h-full flex flex-col">
                            <Skeleton className="aspect-square w-full" />
                            <CardContent className="p-3 flex-1 flex flex-col">
                                <Skeleton className="h-5 mt-2 w-3/4" />
                                <Skeleton className="h-6 mt-2 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }
    
    return (
        <div className="w-full max-w-6xl">
            <h1 className="text-2xl md:text-3xl font-bold font-headline mb-6">
                Search results for: <span className="text-primary">"{queryParam}"</span>
            </h1>
            
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card flex flex-col items-center">
                    <Search className="h-12 w-12 text-muted-foreground" />
                    <h2 className="mt-6 text-xl font-semibold">No products found for "{queryParam}"</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Try searching for something else, or check your spelling.</p>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <MarketLayout>
            <Suspense fallback={
                <div className="w-full max-w-6xl">
                    <Skeleton className="h-8 w-1/3 mb-6" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <Card key={i} className="overflow-hidden h-full flex flex-col">
                                <Skeleton className="aspect-square w-full" />
                                <CardContent className="p-3 flex-1 flex flex-col">
                                    <Skeleton className="h-5 mt-2 w-3/4" />
                                    <Skeleton className="h-6 mt-2 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            }>
                <SearchResults />
            </Suspense>
        </MarketLayout>
    );
}