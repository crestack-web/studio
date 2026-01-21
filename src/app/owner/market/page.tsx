'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Settings, Package, ShoppingCart, Users, ExternalLink, ArrowLeft, MoreHorizontal, User, Phone, MapPin, Loader2, FileUp } from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, writeBatch, orderBy } from 'firebase/firestore';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Types
interface AppUser { businessId?: string }
interface Product { id: string; name: string; price: number; quantity: number; isPublishedToMarket: boolean; image: string; description: string; category: string; hint?: string; oldPrice?: number; }
interface MarketOrder { id: string; customer: { name: string; phone: string; address?: string }; createdAt: { toDate: () => Date }; total: number; status: string; fulfillment: string; items: { productName: string; quantity: number; price: number }[]; }
type MarketSettings = { isStoreActive: boolean; payment: { allowBankTransfer: boolean; allowPayOnDelivery: boolean; bankName: string; accountNumber: string; paymentInstructions: string; }; delivery: { allowDelivery: boolean; allowPickup: boolean; deliveryFee: number; deliveryDays: string[]; }; };
interface Business { businessName: string; currency: string; plan: string; businessType: string; marketDescription?: string; marketSettings?: MarketSettings; }
interface Customer { id: string; name: string; phone: string; totalOrders: number; totalSpent: number; lastOrder: Date; }

const SettingsContent = () => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => businessId ? doc(firestore, `businesses/${businessId}`) : null, [firestore, businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<Business>(businessRef);

    const [settings, setSettings] = useState<MarketSettings | undefined>(undefined);
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (businessData) {
            setSettings(businessData.marketSettings ?? {
                isStoreActive: false,
                payment: { allowBankTransfer: true, allowPayOnDelivery: true, bankName: '', accountNumber: '', paymentInstructions: '' },
                delivery: { allowDelivery: true, allowPickup: false, deliveryFee: 1500, deliveryDays: ['Monday', 'Wednesday', 'Friday'] }
            });
            setDescription(businessData.marketDescription ?? '');
        }
    }, [businessData]);

    if (isLoadingBusiness || !settings) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    const handleSettingsChange = (path: string, value: any) => {
        setSettings(prev => {
            if (!prev) return prev;
            const keys = path.split('.');
            const newSettings = JSON.parse(JSON.stringify(prev)); // Deep copy
            let current = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    };
    
    const handleDayChange = (day: string) => {
        if (!settings) return;
        const currentDays = settings.delivery.deliveryDays || [];
        const newDays = currentDays.includes(day) ? currentDays.filter(d => d !== day) : [...currentDays, day];
        handleSettingsChange('delivery.deliveryDays', newDays);
    };

    const handleSaveChanges = async () => {
        if (!firestore || !businessId || !settings || !businessData) return;
        setIsSaving(true);
        try {
            const batch = writeBatch(firestore);
            const businessDocRef = doc(firestore, `businesses/${businessId}`);
            const businessProfileDocRef = doc(firestore, `businessProfiles/${businessId}`);

            const businessUpdate = { marketDescription: description, marketSettings: settings };
            const profileUpdate = {
                businessName: businessData.businessName,
                businessType: businessData.businessType,
                marketDescription: description,
                marketSettings: settings,
                currency: businessData.currency,
            };
            
            batch.update(businessDocRef, businessUpdate);
            batch.set(businessProfileDocRef, profileUpdate, { merge: true });
            
            await batch.commit();

            toast({ title: "Success", description: "Market settings saved successfully." });
        } catch (error) {
            console.error("Error saving market settings:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save settings." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Storefront</CardTitle>
                    <CardDescription>Manage your public presence on the Busmo Market.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="store-status" className="text-base font-medium">Your store is {settings.isStoreActive ? 'online' : 'offline'}</Label>
                            <p className="text-sm text-muted-foreground">{settings.isStoreActive ? 'Customers can find and purchase your products.' : 'Your store and products are hidden.'}</p>
                        </div>
                        <Switch id="store-status" checked={settings.isStoreActive} onCheckedChange={(val) => handleSettingsChange('isStoreActive', val)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="store-description">Store Description</Label>
                        <Textarea id="store-description" placeholder="Describe your business for customers..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Payment Methods</CardTitle><CardDescription>Choose how you want to accept payments for online orders.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="pay-on-delivery" className="flex-1 space-y-0.5"><p className="text-base">Accept Pay on Delivery</p><p className="text-sm text-muted-foreground">Customers can pay with cash or POS upon delivery.</p></Label>
                        <Switch id="pay-on-delivery" checked={settings.payment.allowPayOnDelivery} onCheckedChange={(val) => handleSettingsChange('payment.allowPayOnDelivery', val)} />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="bank-transfer" className="flex-1 space-y-0.5"><p className="text-base">Accept Bank Transfer</p><p className="text-sm text-muted-foreground">Customers will see your bank details at checkout.</p></Label>
                        <Switch id="bank-transfer" checked={settings.payment.allowBankTransfer} onCheckedChange={(val) => handleSettingsChange('payment.allowBankTransfer', val)} />
                    </div>
                    {settings.payment.allowBankTransfer && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="bank-name">Bank Name</Label><Input id="bank-name" placeholder="e.g., Guaranty Trust Bank" value={settings.payment.bankName} onChange={(e) => handleSettingsChange('payment.bankName', e.target.value)} /></div>
                                <div className="space-y-2"><Label htmlFor="account-number">Account Number</Label><Input id="account-number" placeholder="0123456789" value={settings.payment.accountNumber} onChange={(e) => handleSettingsChange('payment.accountNumber', e.target.value)} /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="payment-instructions">Payment Instructions (Optional)</Label><Textarea id="payment-instructions" placeholder="e.g., Please use your order ID as reference." value={settings.payment.paymentInstructions} onChange={(e) => handleSettingsChange('payment.paymentInstructions', e.target.value)} /></div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Order Fulfillment</CardTitle><CardDescription>Set up how customers can receive their orders.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="allow-delivery" className="flex-1 space-y-0.5"><p className="text-base">Offer Delivery</p><p className="text-sm text-muted-foreground">Deliver orders directly to your customers.</p></Label>
                        <Switch id="allow-delivery" checked={settings.delivery.allowDelivery} onCheckedChange={(val) => handleSettingsChange('delivery.allowDelivery', val)} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="allow-pickup" className="flex-1 space-y-0.5"><p className="text-base">Offer In-Store Pickup</p><p className="text-sm text-muted-foreground">Customers can come to your location to pick up their order.</p></Label>
                        <Switch id="allow-pickup" checked={settings.delivery.allowPickup} onCheckedChange={(val) => handleSettingsChange('delivery.allowPickup', val)} />
                    </div>
                     {settings.delivery.allowDelivery && (
                        <div className="space-y-6 pt-4 border-t">
                            <div className="space-y-2"><Label htmlFor="delivery-fee">Flat Delivery Fee (₦)</Label><Input id="delivery-fee" type="number" placeholder="1500" value={settings.delivery.deliveryFee} onChange={(e) => handleSettingsChange('delivery.deliveryFee', parseFloat(e.target.value) || 0)} /></div>
                            <div className="space-y-2"><Label>Delivery Days</Label><p className="text-sm text-muted-foreground">Select the days you are available for delivery.</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">{daysOfWeek.map(day => (<div key={day} className="flex items-center space-x-2"><Checkbox id={`day-${day}`} checked={settings.delivery.deliveryDays?.includes(day)} onCheckedChange={() => handleDayChange(day)} /><Label htmlFor={`day-${day}`} className="font-normal">{day}</Label></div>))}</div></div>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
            </Button>
        </div>
    );
};

const ProductsContent = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => businessId ? doc(firestore, `businesses/${businessId}`) : null, [firestore, businessId]);
    const { data: businessData } = useDoc<Business>(businessRef);

    const productsQuery = useMemoFirebase(() => businessId ? query(collection(firestore, `businesses/${businessId}/products`)) : null, [firestore, businessId]);
    const { data: products, isLoading } = useCollection<Product>(productsQuery);

    const handleListingChange = async (product: Product, isListed: boolean) => {
        if (!firestore || !businessId || !businessData) return;
        
        const productDocRef = doc(firestore, `businesses/${businessId}/products`, product.id);
        updateDocumentNonBlocking(productDocRef, { isPublishedToMarket: isListed });

        const marketProductDocRef = doc(firestore, 'marketProducts', product.id);
        if (isListed) {
            const marketProductData = {
                productId: product.id,
                businessId: businessId,
                businessName: businessData.businessName,
                productName: product.name,
                price: product.price,
                oldPrice: product.oldPrice,
                description: product.description,
                category: product.category,
                availableQuantity: product.quantity,
                image: product.image,
                hint: product.hint,
                createdAt: new Date(),
            };
            setDocumentNonBlocking(marketProductDocRef, marketProductData, { merge: true });
        } else {
            deleteDocumentNonBlocking(marketProductDocRef);
        }
    };
    
    if (isLoading) {
        return <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead className="text-right">List on Market</TableHead></TableRow></TableHeader><TableBody>{[...Array(3)].map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-8 w-48" /></TableCell><TableCell><Skeleton className="h-8 w-20" /></TableCell><TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell><TableCell className="text-right"><Skeleton className="h-6 w-10 ml-auto" /></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
    }
    
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead className="text-right">List on Market</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {products && products.length > 0 ? products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Image src={product.image || 'https://picsum.photos/seed/placeholder/100/100'} alt={product.name} width={40} height={40} className="rounded-md object-cover bg-muted" />
                                        <span className="font-medium">{product.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{formatCurrency(product.price, businessData?.currency)}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                                <TableCell><Badge variant={product.isPublishedToMarket ? 'default' : 'secondary'}>{product.isPublishedToMarket ? 'Listed' : 'Unlisted'}</Badge></TableCell>
                                <TableCell className="text-right"><Switch checked={product.isPublishedToMarket} onCheckedChange={(checked) => handleListingChange(product, checked)} /></TableCell>
                            </TableRow>
                        )) : (
                             <TableRow><TableCell colSpan={5} className="h-24 text-center">No products found. <Button variant="link" asChild><a href="/add-product">Add your first product.</a></Button></TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const OrdersContent = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;
    
    const ordersQuery = useMemoFirebase(() => businessId ? query(collection(firestore, `businesses/${businessId}/orders`), orderBy('createdAt', 'desc')) : null, [firestore, businessId]);
    const { data: orders, isLoading } = useCollection<MarketOrder>(ordersQuery);

    const [selectedOrder, setSelectedOrder] = useState<MarketOrder | null>(null);

    const handleStatusChange = (orderId: string, newStatus: string) => {
        if (!firestore || !businessId) return;
        const orderDocRef = doc(firestore, `businesses/${businessId}/orders`, orderId);
        updateDocumentNonBlocking(orderDocRef, { status: newStatus });
    };
    
    const getStatusVariant = (status: string) => ({ 'Delivered': 'default', 'Pending': 'destructive', 'Shipped': 'secondary', 'Cancelled': 'destructive' }[status] || 'outline') as any;
    
    if (isLoading) {
        return <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-[100px] text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{[...Array(3)].map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-5 w-20"/></TableCell><TableCell><Skeleton className="h-5 w-32"/></TableCell><TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell><TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto"/></TableCell><TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md"/></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
    }

    return (
        <>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Fulfillment</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-[100px] text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {orders && orders.length > 0 ? orders.map(order => (
                                <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                    <TableCell className="font-medium">#{order.id.substring(0, 6)}</TableCell>
                                    <TableCell>{order.customer.name}</TableCell>
                                    <TableCell>{order.createdAt.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(order.status)}>{order.status}</Badge></TableCell>
                                    <TableCell className="capitalize">{order.fulfillment}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Change Status</DropdownMenuLabel><DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'Shipped') }}>Mark as Shipped</DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'Delivered') }}>Mark as Delivered</DropdownMenuItem>
                                                <DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'Cancelled') }}>Cancel Order</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={7} className="h-24 text-center">No orders from your store yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Order #{selectedOrder?.id.substring(0,6)}</DialogTitle><DialogDescription>Details for the order placed by {selectedOrder?.customer.name}.</DialogDescription></DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2"><h4 className="font-semibold flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Customer Details</h4><div className="text-sm text-muted-foreground space-y-1 pl-6"><p>{selectedOrder.customer.name}</p><p>{selectedOrder.customer.phone}</p>{selectedOrder.fulfillment === 'delivery' && selectedOrder.customer.address && (<p className="flex items-start"><MapPin className="w-4 h-4 mr-2 mt-1 shrink-0" /> {selectedOrder.customer.address}</p>)}</div></div>
                            <Separator />
                            <div className="space-y-2"><h4 className="font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> Order Items</h4><div className="pl-6">{selectedOrder.items.map((item, index) => (<div key={index} className="flex justify-between items-center text-sm"><p>{item.productName} <span className="text-muted-foreground">x {item.quantity}</span></p><p>{formatCurrency(item.price * item.quantity)}</p></div>))}<Separator className="my-2" /><div className="flex justify-between items-center font-bold"><p>Total</p><p>{formatCurrency(selectedOrder.total)}</p></div></div></div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

const CustomersContent = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;
    const ordersQuery = useMemoFirebase(() => businessId ? query(collection(firestore, `businesses/${businessId}/orders`)) : null, [firestore, businessId]);
    const { data: orders, isLoading } = useCollection<MarketOrder>(ordersQuery);

    const customers = useMemo(() => {
        if (!orders) return [];
        const customerData: { [key: string]: Customer } = {};
        orders.forEach(order => {
            const customerId = order.customer.phone; // Use phone as unique ID
            if (!customerData[customerId]) {
                customerData[customerId] = { id: customerId, name: order.customer.name, phone: order.customer.phone, totalOrders: 0, totalSpent: 0, lastOrder: order.createdAt.toDate() };
            }
            customerData[customerId].totalOrders += 1;
            customerData[customerId].totalSpent += order.total;
            if (order.createdAt.toDate() > customerData[customerId].lastOrder) {
                customerData[customerId].lastOrder = order.createdAt.toDate();
            }
        });
        return Object.values(customerData).sort((a,b) => b.lastOrder.getTime() - a.lastOrder.getTime());
    }, [orders]);

     if (isLoading) {
        return <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Orders</TableHead><TableHead>Last Order</TableHead><TableHead className="text-right">Total Spent</TableHead></TableRow></TableHeader><TableBody>{[...Array(3)].map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-8 w-32"/></TableCell><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell><Skeleton className="h-5 w-10"/></TableCell><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto"/></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Total Orders</TableHead><TableHead>Last Order</TableHead><TableHead className="text-right">Total Spent</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {customers.length > 0 ? customers.map(customer => (
                            <TableRow key={customer.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8"><AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                                        <span className="font-medium">{customer.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{customer.phone}</TableCell>
                                <TableCell>{customer.totalOrders}</TableCell>
                                <TableCell>{customer.lastOrder.toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">{formatCurrency(customer.totalSpent)}</TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No customers yet.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default function ManageMarketPage() {
    const [activeSection, setActiveSection] = useState('orders');
    const router = useRouter();

    const menuItems = [
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];
    
    const activeMenuItem = menuItems.find((item) => item.id === activeSection);
    
    const renderContent = () => {
        switch (activeSection) {
            case 'settings': return <SettingsContent />;
            case 'products': return <ProductsContent />;
            case 'orders': return <OrdersContent />;
            case 'customers': return <CustomersContent />;
            default: return <OrdersContent />;
        }
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-background text-foreground">
                <Sidebar>
                    <SidebarHeader>
                        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
                            <Button variant="ghost" className="justify-start gap-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-2" onClick={() => router.push('/owner/home')}><ArrowLeft className="h-5 w-5" /><span className="group-data-[collapsible=icon]:hidden">Back to Home</span></Button>
                            <SidebarTrigger className="hidden md:flex group-data-[collapsible=icon]:hidden" />
                        </div>
                    </SidebarHeader>

                    <SidebarMenu className="flex-1 px-2">
                        {menuItems.map((item) => (
                            <SidebarMenuItem key={item.id}>
                                <SidebarMenuButton isActive={activeSection === item.id} onClick={() => setActiveSection(item.id)} tooltip={item.label} className="justify-start group-data-[collapsible=icon]:justify-center"><item.icon /> <span className="group-data-[collapsible=icon]:hidden">{item.label}</span></SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </Sidebar>

                <SidebarInset>
                    <header className="sticky top-0 z-10 flex h-auto min-h-16 flex-col items-start justify-center gap-1 border-b bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3"><SidebarTrigger className="md:hidden"/><div><h1 className="text-xl font-headline font-semibold md:text-2xl">{activeMenuItem?.label}</h1></div></div>
                        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                            <Button variant="outline" asChild><a href="/market/store/my-store-id" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />View Public Store</a></Button>
                        </div>
                    </header>
                    <main className="flex-1 p-4 sm:p-6">{renderContent()}</main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
