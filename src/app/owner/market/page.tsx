'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Settings, Package, ShoppingCart, Users, CreditCard, Truck, ExternalLink, ArrowLeft } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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


const SettingsContent = () => {
    const [isStoreActive, setIsStoreActive] = useState(true);
    const [storeDescription, setStoreDescription] = useState('Your one-stop shop for daily needs and groceries.');
    return (
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
    );
};

const ProductsContent = () => {
    const [products, setProducts] = useState(mockProducts);
    const handleListingChange = (productId: string, isListed: boolean) => {
        setProducts(products.map(p => p.id === productId ? { ...p, isListed } : p));
    };

    return (
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
    );
};

const OrdersContent = () => {
    return (
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
    );
};

const CustomersContent = () => {
    return (
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
    );
};

const PaymentsContent = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" />Payments</CardTitle>
                <CardDescription>Configure how you receive payments from Busmo Market sales.</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12 text-muted-foreground">
                <p>Payment settings are coming soon.</p>
            </CardContent>
        </Card>
    );
};

const DeliveryContent = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-primary" />Delivery</CardTitle>
                <CardDescription>Set up your delivery options and prices for customers.</CardDescription>
            </CardHeader>
             <CardContent className="text-center py-12 text-muted-foreground">
                <p>Delivery options are coming soon.</p>
            </CardContent>
        </Card>
    );
};

export default function ManageMarketPage() {
    const [activeSection, setActiveSection] = useState('settings');
    const router = useRouter();

    const menuItems = [
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'delivery', label: 'Delivery', icon: Truck },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'settings':
                return <SettingsContent />;
            case 'products':
                return <ProductsContent />;
            case 'orders':
                return <OrdersContent />;
            case 'customers':
                return <CustomersContent />;
            case 'payments':
                return <PaymentsContent />;
            case 'delivery':
                return <DeliveryContent />;
            default:
                return <SettingsContent />;
        }
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-background text-foreground">
                <Sidebar>
                    <SidebarHeader>
                        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => router.push('/owner/home')}>
                            <ArrowLeft className="h-5 w-5" />
                            <span className="group-data-[collapsible=icon]:hidden">Back to Home</span>
                        </Button>
                    </SidebarHeader>

                    <SidebarMenu className="flex-1 px-2">
                        {menuItems.map((item) => (
                            <SidebarMenuItem key={item.id}>
                                <SidebarMenuButton
                                    isActive={activeSection === item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    tooltip={item.label}
                                    className="justify-start group-data-[collapsible=icon]:justify-center"
                                >
                                    <item.icon />
                                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </Sidebar>

                <SidebarInset>
                    <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-card">
                        <SidebarTrigger className="md:hidden"/>
                        <h1 className="text-xl font-headline font-semibold flex-1 md:text-2xl">
                            {menuItems.find((item) => item.id === activeSection)?.label}
                        </h1>
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="hidden md:flex" />
                            <Link href="/market/store/my-store-id" passHref>
                                <Button variant="outline">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Public Store
                                </Button>
                            </Link>
                        </div>
                    </header>
                    <main className="flex-1 p-4 sm:p-6 bg-muted/20">
                        <div className="w-full">
                            {renderContent()}
                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
