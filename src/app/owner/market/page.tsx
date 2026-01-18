'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Settings, Package, ShoppingCart, Users, CreditCard, Truck, ExternalLink, ArrowLeft, MoreHorizontal, User, Phone, MapPin } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';


const mockProducts = [
    { id: '1', name: 'Bottled Water', price: 150, stock: 50, isListed: true, image: 'https://picsum.photos/seed/product-water/100/100' },
    { id: '2', name: 'Biscuits', price: 250, stock: 30, isListed: true, image: 'https://picsum.photos/seed/product-biscuit/100/100' },
    { id: '3', name: 'Soft Drink', price: 200, stock: 40, isListed: false, image: 'https://picsum.photos/seed/product-drink/100/100' },
    { id: '4', name: 'Bread', price: 500, stock: 20, isListed: true, image: 'https://picsum.photos/seed/product-bread/100/100' },
];

const initialOrders = [
    { 
        id: '#BM1001', 
        customer: { name: 'Chioma Okoro', phone: '08012345678', address: '123 Allen Avenue, Ikeja, Lagos' }, 
        date: '2024-07-25', 
        total: '12,000', 
        status: 'Pending',
        fulfillment: 'delivery',
        items: [{ name: 'Handmade Leather Bag', quantity: 1, price: 12000 }]
    },
    { 
        id: '#BM1002', 
        customer: { name: 'David Adeleke', phone: '09087654321', address: '456 Victoria Island, Lagos' }, 
        date: '2024-07-24', 
        total: '3,500', 
        status: 'Shipped',
        fulfillment: 'delivery',
        items: [{ name: 'Ankara Print Scarf', quantity: 1, price: 3500 }]
    },
    { 
        id: '#BM1003', 
        customer: { name: 'Amina Bello', phone: '07098765432', address: '' }, 
        date: '2024-07-24', 
        total: '5,000', 
        status: 'Delivered',
        fulfillment: 'pickup',
        items: [{ name: 'Beaded Necklace', quantity: 1, price: 5000 }]
    },
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
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Store Status</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
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
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Store Description</CardTitle>
                    <CardDescription>This is shown to customers on your public store page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        id="store-description"
                        placeholder="Describe your business for customers on the marketplace."
                        value={storeDescription}
                        onChange={(e) => setStoreDescription(e.target.value)}
                    />
                </CardContent>
            </Card>
            <Button>Save Settings</Button>
        </div>
    );
};

const ProductsContent = () => {
    const [products, setProducts] = useState(mockProducts);
    const handleListingChange = (productId: string, isListed: boolean) => {
        setProducts(products.map(p => p.id === productId ? { ...p, isListed } : p));
    };

    return (
        <Card>
            <CardContent className="p-0">
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
    const [orders, setOrders] = useState(initialOrders);
    const [selectedOrder, setSelectedOrder] = useState<(typeof initialOrders)[0] | null>(null);

    const handleStatusChange = (orderId: string, newStatus: string) => {
        setOrders(orders.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
    };
    
    type Order = typeof initialOrders[number];

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'Delivered':
                return 'default';
            case 'Pending':
                return 'destructive';
            case 'Shipped':
                return 'secondary';
            default:
                return 'outline';
        }
    };


    return (
        <>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Fulfillment</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map(order => (
                                <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                    <TableCell className="font-medium">{order.id}</TableCell>
                                    <TableCell>{order.customer.name}</TableCell>
                                    <TableCell>{order.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status as any)}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{order.fulfillment}</TableCell>
                                    <TableCell className="text-right">₦{order.total}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleStatusChange(order.id, 'Shipped')}}>Mark as Shipped</DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => {e.stopPropagation(); handleStatusChange(order.id, 'Delivered')}}>Mark as Delivered</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={(e) => {e.stopPropagation(); handleStatusChange(order.id, 'Cancelled')}}>
                                                    Cancel Order
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Order {selectedOrder?.id}</DialogTitle>
                        <DialogDescription>
                            Details for the order placed by {selectedOrder?.customer.name}.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Customer Details</h4>
                                <div className="text-sm text-muted-foreground space-y-1 pl-6">
                                    <p>{selectedOrder.customer.name}</p>
                                    <p>{selectedOrder.customer.phone}</p>
                                    {selectedOrder.fulfillment === 'delivery' && selectedOrder.customer.address && (
                                        <p className="flex items-start"><MapPin className="w-4 h-4 mr-2 mt-1 shrink-0" /> {selectedOrder.customer.address}</p>
                                    )}
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> Order Items</h4>
                                 <div className="pl-6">
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm">
                                            <p>{item.name} <span className="text-muted-foreground">x {item.quantity}</span></p>
                                            <p>₦{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    ))}
                                    <Separator className="my-2" />
                                    <div className="flex justify-between items-center font-bold">
                                        <p>Total</p>
                                        <p>₦{selectedOrder.total}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

const CustomersContent = () => {
    return (
        <Card>
            <CardContent className="p-0">
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
    const [allowBankTransfer, setAllowBankTransfer] = useState(true);
    const [allowPayOnDelivery, setAllowPayOnDelivery] = useState(true);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Choose how you want to accept payments for online orders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="bank-transfer" className="text-base">Accept Bank Transfer</Label>
                            <p className="text-sm text-muted-foreground">
                                Customers will see your bank details at checkout.
                            </p>
                        </div>
                        <Switch id="bank-transfer" checked={allowBankTransfer} onCheckedChange={setAllowBankTransfer} />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="pay-on-delivery" className="text-base">Accept Pay on Delivery</Label>
                             <p className="text-sm text-muted-foreground">
                                Customers can pay with cash or POS upon delivery.
                            </p>
                        </div>
                        <Switch id="pay-on-delivery" checked={allowPayOnDelivery} onCheckedChange={setAllowPayOnDelivery} />
                    </div>
                </CardContent>
            </Card>
            {allowBankTransfer && (
                <Card>
                    <CardHeader>
                        <CardTitle>Bank Transfer Details</CardTitle>
                        <CardDescription>This information will be shown to customers who choose to pay via bank transfer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bank-name">Bank Name</Label>
                                <Input id="bank-name" placeholder="e.g., Guaranty Trust Bank" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account-number">Account Number</Label>
                                <Input id="account-number" placeholder="0123456789" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-instructions">Payment Instructions (Optional)</Label>
                            <Textarea id="payment-instructions" placeholder="e.g., Please send proof of payment to our WhatsApp." />
                        </div>
                    </CardContent>
                </Card>
            )}
             <Button>Save Payment Settings</Button>
        </div>
    );
};

const DeliveryContent = () => {
    const [allowDelivery, setAllowDelivery] = useState(true);
    const [allowPickup, setAllowPickup] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const handleDayChange = (day: string) => {
        setSelectedDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Order Fulfillment</CardTitle>
                    <CardDescription>Set up how customers can receive their orders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="allow-delivery" className="text-base">Offer Delivery</Label>
                            <p className="text-sm text-muted-foreground">
                                Deliver orders directly to your customers.
                            </p>
                        </div>
                        <Switch id="allow-delivery" checked={allowDelivery} onCheckedChange={setAllowDelivery} />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="allow-pickup" className="text-base">Offer In-Store Pickup</Label>
                             <p className="text-sm text-muted-foreground">
                                Customers can come to your location to pick up their order.
                            </p>
                        </div>
                        <Switch id="allow-pickup" checked={allowPickup} onCheckedChange={setAllowPickup} />
                    </div>
                </CardContent>
            </Card>
            
            {allowDelivery && (
                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Settings</CardTitle>
                        <CardDescription>Configure your delivery fee and schedule.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="delivery-fee">Flat Delivery Fee (₦)</Label>
                            <Input id="delivery-fee" type="number" placeholder="1500" />
                        </div>
                        <div className="space-y-2">
                            <Label>Delivery Days</Label>
                            <p className="text-sm text-muted-foreground">Select the days of the week you are available for delivery.</p>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                                {daysOfWeek.map(day => (
                                    <div key={day} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`day-${day}`} 
                                            checked={selectedDays.includes(day)}
                                            onCheckedChange={() => handleDayChange(day)}
                                        />
                                        <Label htmlFor={`day-${day}`} className="font-normal">{day}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
            <Button>Save Delivery Settings</Button>
        </div>
    );
};

export default function ManageMarketPage() {
    const [activeSection, setActiveSection] = useState('orders');
    const router = useRouter();

    const menuItems = [
        { id: 'settings', label: 'Settings', icon: Settings, description: 'Manage your public store on Busmo Market.' },
        { id: 'products', label: 'Products', icon: Package, description: 'Choose which products to show on your public store.' },
        { id: 'orders', label: 'Orders', icon: ShoppingCart, description: `Manage incoming orders. You have ${initialOrders.filter(o => o.status === 'Pending').length} pending orders.` },
        { id: 'customers', label: 'Customers', icon: Users, description: 'View customers who have purchased from your store.' },
        { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Configure how you receive payments.' },
        { id: 'delivery', label: 'Delivery', icon: Truck, description: 'Set up your delivery options and prices.' },
    ];
    
    const activeMenuItem = menuItems.find((item) => item.id === activeSection);


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
                        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
                            <Button variant="ghost" className="justify-start gap-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-2" onClick={() => router.push('/owner/home')}>
                                <ArrowLeft className="h-5 w-5" />
                                <span className="group-data-[collapsible=icon]:hidden">Back to Home</span>
                            </Button>
                            <SidebarTrigger className="hidden md:flex group-data-[collapsible=icon]:hidden" />
                        </div>
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
                    <header className="sticky top-0 z-10 flex h-auto min-h-16 flex-col items-start justify-center gap-1 border-b bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <SidebarTrigger className="md:hidden"/>
                            <div>
                                <h1 className="text-xl font-headline font-semibold md:text-2xl">
                                    {activeMenuItem?.label}
                                </h1>
                                {activeMenuItem?.description && <p className="text-sm text-muted-foreground">{activeMenuItem.description}</p>}
                            </div>
                        </div>
                        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                            <Link href="/market/store/my-store-id" passHref>
                                <Button variant="outline">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Public Store
                                </Button>
                            </Link>
                        </div>
                    </header>
                    <main className="flex-1 p-4 sm:p-6">
                        {renderContent()}
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
