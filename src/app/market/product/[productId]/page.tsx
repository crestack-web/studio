'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Store, Star } from 'lucide-react';
import MainLayout from '@/components/app/main-layout';


const mockProduct = { 
    id: '1', 
    name: 'Handmade Leather Bag', 
    price: 12000, 
    description: 'A beautifully crafted, durable leather bag made from locally sourced materials. Perfect for daily use, with multiple compartments for all your essentials.',
    image: 'https://picsum.photos/seed/market-fashion-1/800/600',
    hint: 'leather bag',
    business: {
        id: 'biz1',
        name: 'Aisha\'s Crafts',
        rating: 4.8,
        reviews: 25,
    }
};

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
    return (
        <MainLayout title="Product Details" backHref="/market">
           <div className="w-full max-w-4xl">
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <Card className="overflow-hidden">
                            <Image 
                                src={mockProduct.image}
                                alt={mockProduct.name}
                                width={800}
                                height={600}
                                className="object-cover w-full h-full"
                                data-ai-hint={mockProduct.hint}
                            />
                        </Card>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div>
                            <h1 className="text-3xl font-bold font-headline">{mockProduct.name}</h1>
                            <p className="text-3xl font-bold text-primary mt-2">₦{mockProduct.price.toLocaleString()}</p>
                            <p className="text-muted-foreground mt-4">{mockProduct.description}</p>
                        </div>

                        <Separator />

                         <Card>
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg">Sold by</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-primary">{mockProduct.business.name}</p>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span>{mockProduct.business.rating} ({mockProduct.business.reviews} reviews)</span>
                                        </div>
                                    </div>
                                    <Link href={`/market/store/${mockProduct.business.id}`}>
                                        <Button variant="secondary">
                                            <Store className="mr-2 h-4 w-4" />
                                            Visit Store
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center gap-4">
                            <div className="w-24">
                                <Label htmlFor="quantity" className="sr-only">Quantity</Label>
                                <Input id="quantity" type="number" defaultValue="1" min="1" className="h-14 text-lg text-center"/>
                            </div>
                            <Button className="w-full h-14 text-lg flex-1">
                                <ShoppingCart className="mr-2 h-6 w-6"/>
                                Add to Cart
                            </Button>
                        </div>
                    </div>
                </div>
           </div>
        </MainLayout>
    );
}

    