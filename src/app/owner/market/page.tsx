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
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, ExternalLink, Package, ShoppingCart, Truck, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const mockProducts = [
    { id: '1', name: 'Bottled Water', price: 150, stock: 50, isListed: true, image: 'https://picsum.photos/seed/product-water/100/100' },
    { id: '2', name: 'Biscuits', price: 250, stock: 30, isListed: true, image: 'https://picsum.photos/seed/product-biscuit/100/100' },
    { id: '3', name: 'Soft Drink', price: 200, stock: 40, isListed: false, image: 'https://picsum.photos/seed/product-drink/100/100' },
    { id: '4', name: 'Bread', price: 500, stock: 20, isListed: true, image: 'https://picsum.photos/seed/product-bread/100/100' },
];

const mockOrders = [
    { id: '#BM1001', customer: 'Chioma Okoro', date: '2024-07-25', total: '12,000', status: 'Pending' },
    { id: '#BM1002', customer: 'David Adeleke', date: '2024-07-24', total: '3,500', status: 'Shipped' },
    { id: '#BM1003', customer: 'Amina Bello', date: '2024-07-24', total: '5,000', status: 'Delivered' },
];

const mockCustomers = [
    { id: 'cust1', name: 'Chioma Okoro', email: 'c.okoro@example.com', orders: 1, totalSpent: 12000 },
    { id: 'cust2', name: 'David Adeleke', email: 'd.adeleke@example.com', orders: 1, totalSpent: 3500 },
    { id: 'cust3', name: 'Amina Bello', email: 'a.bello@example.com', orders: 1, totalSpent: 5000 },
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
            <div className="w-full max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold font-headline">My Market</h1>
                    <Link href="/market/store/my-store-id" passHref>
                        <Button variant="outline">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Public Store
                        </Button>
                    </Link>
                </div>
                
                <Tabs defaultValue="settings" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                        <TabsTrigger value="products">Products</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                        <TabsTrigger value="customers">Customers</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                        <TabsTrigger value="delivery">Delivery</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="settings" className="mt-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Marketplace Settings</CardTitle>
                                <CardDescription>Manage your public store on Busmo Market.</CardDescription>
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
                    </TabsContent>
                    
                    <TabsContent value="products" className="mt-6">
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
                    </TabsContent>

                    <TabsContent value="orders" className="mt-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Orders</CardTitle>
                                <CardDescription>Manage incoming orders from Busmo Market.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockOrders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.id}</TableCell>
                                                <TableCell>{order.customer}</TableCell>
                                                <TableCell>{order.date}</TableCell>
                                                <TableCell>
                                                    <Badge variant={order.status === 'Delivered' ? 'default' : order.status === 'Pending' ? 'destructive' : 'secondary'}>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">₦{order.total}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="customers" className="mt-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Customers</CardTitle>
                                <CardDescription>View customers who have purchased from your store.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Orders</TableHead>
                                            <TableHead className="text-right">Total Spent</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockCustomers.map(customer => (
                                            <TableRow key={customer.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                          <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{customer.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{customer.email}</TableCell>
                                                <TableCell>{customer.orders}</TableCell>
                                                <TableCell className="text-right">₦{customer.totalSpent.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payments" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" />Payments</CardTitle>
                                <CardDescription>Configure how you receive payments from Busmo Market sales.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center py-12 text-muted-foreground">
                                <p>Payment settings are coming soon.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="delivery" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-primary" />Delivery</CardTitle>
                                <CardDescription>Set up your delivery options and prices for customers.</CardDescription>
                            </CardHeader>
                             <CardContent className="text-center py-12 text-muted-foreground">
                                <p>Delivery options are coming soon.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </MainLayout>
    );
}
