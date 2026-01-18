'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/app/main-layout';
import { Star } from 'lucide-react';

const mockStore = { 
    id: 'biz1',
    name: 'Aisha\'s Crafts',
    description: 'Beautifully handcrafted leather goods and accessories, made with love in Lagos.',
    rating: 4.8,
    reviews: 25,
    bannerImage: 'https://picsum.photos/seed/store-banner-1/1200/300',
    bannerHint: 'craft workshop',
    products: [
        { id: '1', name: 'Handmade Leather Bag', price: 12000, image: 'https://picsum.photos/seed/market-fashion-1/400/300', hint: 'leather bag' },
        { id: '11', name: 'Leather Wallet', price: 7500, image: 'https://picsum.photos/seed/market-fashion-5/400/300', hint: 'leather wallet' },
        { id: '12', name: 'Woven Keychain', price: 1500, image: 'https://picsum.photos/seed/market-fashion-6/400/300', hint: 'woven keychain' },
    ]
};

export default function StorePage({ params }: { params: { businessId: string } }) {
  return (
    <MainLayout title={mockStore.name} backHref="/market">
        <div className="w-full max-w-6xl">
            <Card className="overflow-hidden mb-8">
                <div className="h-48 md:h-64 w-full relative">
                    <Image 
                        src={mockStore.bannerImage}
                        alt={`${mockStore.name} banner`}
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint={mockStore.bannerHint}
                    />
                </div>
                <CardContent className="p-6">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">{mockStore.name}</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">{mockStore.description}</p>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{mockStore.rating}</span>
                        <span>({mockStore.reviews} reviews)</span>
                    </div>
                </CardContent>
            </Card>

            <h2 className="text-2xl font-bold font-headline mb-6">Products from {mockStore.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {mockStore.products.map(product => (
                    <Link href={`/market/product/${product.id}`} key={product.id}>
                        <Card className="overflow-hidden group cursor-pointer h-full flex flex-col">
                            <div className="aspect-video overflow-hidden">
                                <Image 
                                    src={product.image}
                                    alt={product.name}
                                    width={400}
                                    height={300}
                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                    data-ai-hint={product.hint}
                                />
                            </div>
                            <CardContent className="p-4 flex-1 flex flex-col">
                                <h3 className="font-semibold text-lg flex-1">{product.name}</h3>
                                <p className="font-bold text-xl mt-4">₦{product.price.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

        </div>
    </MainLayout>
  );
}

    