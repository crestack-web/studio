'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { Search } from 'lucide-react';
import { useMarket } from '@/context/market-provider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface MarketCategory {
    id: string;
    name: string;
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

    const [category, setCategory] = useState('all');
    const [brand, setBrand] = useState('all');
    const [priceRange, setPriceRange] = useState('all');
    const [sortBy, setSortBy] = useState('relevance');

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketProducts'));
    }, [firestore]);
    const { data: allProducts, isLoading: isLoadingProducts } = useCollection<MarketProduct>(productsQuery);

    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketCategories'));
    }, [firestore]);
    const { data: categoriesData, isLoading: isLoadingCategories } = useCollection<MarketCategory>(categoriesQuery);

    const uniqueBrands = useMemo(() => {
        if (!allProducts) return [];
        const brands = new Set(allProducts.map(p => p.businessName));
        return Array.from(brands).sort();
    }, [allProducts]);

    const filteredAndSortedProducts = React.useMemo(() => {
        if (!allProducts) return [];

        // 1. Filter by search query
        let filtered = [];
        if(queryParam) {
            const lowercasedQuery = queryParam.toLowerCase();
            filtered = allProducts.filter(product =>
                product.productName.toLowerCase().includes(lowercasedQuery) ||
                product.businessName.toLowerCase().includes(lowercasedQuery) ||
                product.category.toLowerCase().includes(lowercasedQuery)
            );
        } else {
            filtered = allProducts;
        }

        // 2. Filter by category
        if (category !== 'all') {
            filtered = filtered.filter(product => product.category === category);
        }
        
        // 3. Filter by brand
        if (brand !== 'all') {
            filtered = filtered.filter(product => product.businessName === brand);
        }

        // 4. Filter by price range
        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number);
            filtered = filtered.filter(product => {
                if (max) {
                    return product.price >= min && product.price <= max;
                }
                // for 50000+
                return product.price >= min;
            });
        }


        // 5. Sort
        if (sortBy === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        }
        // 'relevance' is default, no specific sorting needed as Firestore doesn't provide it here

        return filtered;
    }, [allProducts, queryParam, category, brand, priceRange, sortBy]);


    if (isLoadingProducts || isLoadingCategories) {
        return (
             <div className="w-full max-w-7xl">
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-8 w-1/3" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
                     <aside className="hidden md:block">
                        <div className="space-y-6 sticky top-24">
                           <Skeleton className="h-6 w-24" />
                           <div className="space-y-4">
                                <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                                <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                                <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                           </div>
                        </div>
                     </aside>
                     <main>
                         <div className="flex justify-between items-center mb-4">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-10 w-48" />
                         </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <Card key={i} className="overflow-hidden h-full flex flex-col">
                                    <Skeleton className="aspect-square w-full" />
                                    <CardContent className="p-3 flex-1 flex flex-col">
                                        <Skeleton className="h-5 mt-2 w-3/4" />
                                        <Skeleton className="h-6 mt-2 w-1/2" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                     </main>
                 </div>
            </div>
        )
    }
    
    return (
        <div className="w-full max-w-7xl">
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold font-headline">
                    {queryParam ? (
                        <>Search results for: <span className="text-primary">"{queryParam}"</span></>
                    ) : (
                        "All Products"
                    )}
                </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
                <aside className="hidden md:block">
                    <div className="space-y-6 sticky top-24">
                        <h3 className="font-semibold text-lg">Filters</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="category-filter">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger id="category-filter"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {categoriesData?.map(cat => (
                                            <SelectItem key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brand-filter">Brand</Label>
                                <Select value={brand} onValueChange={setBrand}>
                                    <SelectTrigger id="brand-filter"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Brands</SelectItem>
                                        {uniqueBrands.map(b => (
                                            <SelectItem key={b} value={b}>{b}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price-filter">Price Range</Label>
                                <Select value={priceRange} onValueChange={setPriceRange}>
                                    <SelectTrigger id="price-filter"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any Price</SelectItem>
                                        <SelectItem value="0-5000">Under ₦5,000</SelectItem>
                                        <SelectItem value="5000-20000">₦5,000 - ₦20,000</SelectItem>
                                        <SelectItem value="20000-50000">₦20,000 - ₦50,000</SelectItem>
                                        <SelectItem value="50000-99999999">Over ₦50,000</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </aside>
                <main>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-muted-foreground">{filteredAndSortedProducts.length} results</span>
                         <div className="flex items-center gap-2">
                            <Label htmlFor="sort-by" className="text-sm">Sort by</Label>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger id="sort-by" className="w-48 h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="relevance">Relevance</SelectItem>
                                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     {filteredAndSortedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredAndSortedProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card flex flex-col items-center">
                            <Search className="h-12 w-12 text-muted-foreground" />
                            <h2 className="mt-6 text-xl font-semibold">No products found</h2>
                            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
             <div className="w-full max-w-7xl">
                <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-8 w-1/3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
                    <aside className="hidden md:block">
                        <div className="space-y-6 sticky top-24">
                        <Skeleton className="h-6 w-24" />
                        <div className="space-y-4">
                            <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                        </div>
                        </div>
                    </aside>
                    <main>
                        <div className="flex justify-between items-center mb-4">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-10 w-48" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <Card key={i} className="overflow-hidden h-full flex flex-col">
                                    <Skeleton className="aspect-square w-full" />
                                    <CardContent className="p-3 flex-1 flex flex-col">
                                        <Skeleton className="h-5 mt-2 w-3/4" />
                                        <Skeleton className="h-6 mt-2 w-1/2" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}
