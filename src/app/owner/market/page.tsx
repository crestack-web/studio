'use client';

import { useState } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

const mockProducts = [
    { id: '1', name: 'Bottled Water', price: 150, stock: 50, isListed: true, image: 'https://picsum.photos/seed/product-water/100/100' },
    { id: '2', name: 'Biscuits', price: 250, stock: 30, isListed: true, image: 'https://picsum.photos/seed/product-biscuit/100/100' },
    { id: '3', name: 'Soft Drink', price: 200, stock: 40, isListed: false, image: 'https://picsum.photos/seed/product-drink/100/100' },
    { id: '4', name: 'Bread', price: 500, stock: 20, isListed: true, image: 'https://picsum.photos/seed/product-bread/100/100' },
];

export default function ManageMarketPage() {
    const [isStoreActive, setIsStoreActive] = useState(true);
    const [storeDescription, setStoreDescription] = useState('Your one-stop shop for daily needs and groceries.');
    const [products, setProducts] = useState(mockProducts);

    const handleListingChange = (productId: string, isListed: boolean) => {
        setProducts(products.map(p => p.id === productId ? { ...p, isListed } : p));
    };

    return (
        <MainLayout title="My Market" backHref="/owner/home">
            <div className="w-full max-w-4xl space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Marketplace Settings</CardTitle>
                                <CardDescription>Manage your public store on Busmo Market.</CardDescription>
                            </div>
                             <Link href="/market/store/my-store-id" passHref>
                                <Button variant="outline">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View My Public Store
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="store-status" className="text-base font-medium">
                                    Your store is {isStoreActive ? 'online' : 'offline'}
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    {isStoreActive 
                                        ? 'Customers can find and purchase your products.' 
                                        : 'Your store and products are hidden from the marketplace.'}
                                </p>
                            </div>
                            <Switch
                                id="store-status"
                                checked={isStoreActive}
                                onCheckedChange={setIsStoreActive}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="store-description">Store Description</Label>
                            <Textarea
                                id="store-description"
                                placeholder="Describe your business for customers on the marketplace."
                                value={storeDescription}
                                onChange={(e) => setStoreDescription(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader>
                        <CardTitle>Product Listings</CardTitle>
                        <CardDescription>Choose which products to show on your public store.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">List on Market</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Image 
                                                    src={product.image}
                                                    alt={product.name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-md object-cover"
                                                />
                                                <span className="font-medium">{product.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>₦{product.price.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={product.isListed ? 'default' : 'secondary'}>
                                                {product.isListed ? 'Listed' : 'Unlisted'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Switch
                                                checked={product.isListed}
                                                onCheckedChange={(checked) => handleListingChange(product.id, checked)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </MainLayout>
    );
}

    