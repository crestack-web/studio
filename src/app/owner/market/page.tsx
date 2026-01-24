'use client';

import { useState, useMemo, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Settings, Package, ShoppingCart, Users, ExternalLink, ArrowLeft, MoreHorizontal, User, Phone, MapPin, Loader2, FileUp, PackageCheck, Menu } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';

// #region --- TYPES ---
interface AppUser { businessId?: string }
interface Variant { id: string; name: string; price: number; cost?: number; quantity: number; image?: string; }
interface Product { id: string; name: string; price: number; quantity: number; hasVariants: boolean; variants: Variant[]; isPublishedToMarket: boolean; images: string[]; description: string; category: string; hint?: string; oldPrice?: number; }
type MarketSettings = { isStoreActive: boolean; payment: { allowBankTransfer: boolean; allowPayOnDelivery: boolean; bankName: string; accountNumber: string; paymentInstructions: string; }; delivery: { allowDelivery: boolean; allowPickup: boolean; deliveryFee: number; deliveryDays: string[]; }; };
interface Business { businessName: string; currency: string; plan: string; businessType: string; marketDescription?: string; marketSettings?: MarketSettings; }
interface Customer { id: string; name: string; phone: string; totalOrders: number; totalSpent: number; lastOrder: Date; }
interface Order { id: string; customer: { name: string; phone: string; address?: string }; createdAt: { toDate: () => Date }; total: number; status: 'pending' | 'confirmed' | 'shipped' | 'fulfilled' | 'cancelled'; fulfillment: string; payment: string; items: { productName: string; variantName?: string; quantity: number; price: number }[]; }
// #endregion

// #region --- SETTINGS COMPONENT ---
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
                payment: { allowBankTransfer: true, allowPayOnDelivery: true, bankName: '', accountNumber: '', paymentInstructions: 'Please use your Order ID as the payment reference.' },
                delivery: { allowDelivery: true, allowPickup: true, deliveryFee: 1500, deliveryDays: ['Monday', 'Wednesday', 'Friday'] }
            });
            setDescription(businessData.marketDescription ?? `Welcome to ${businessData.businessName} on Busmo! We sell quality ${businessData.businessType} products.`);
        }
    }, [businessData]);
    
    const handleSettingsChange = (path: string, value: any) => {
        setSettings(prev => {
            if (!prev) return prev;
            const keys = path.split('.');
            const newSettings = JSON.parse(JSON.stringify(prev)); // Deep copy
            let current: any = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]] = current[keys[i]] || {};
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
    
    if (isLoadingBusiness || !settings) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
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
                            <p className="text-sm text-muted-foreground">{settings.isStoreActive ? 'Customers can find and purchase your products.' : 'Your store and products are hidden from the market.'}</p>
                        </div>
                        <Switch id="store-status" checked={settings.isStoreActive} onCheckedChange={(val) => handleSettingsChange('isStoreActive', val)} disabled={isSaving} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="store-description">Store Description</Label>
                        <Textarea id="store-description" placeholder="Describe your business for customers..." value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSaving}/>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Payment Methods</CardTitle><CardDescription>Choose how you want to accept payments for online orders.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="pay-on-delivery" className="flex-1 space-y-0.5"><p className="text-base">Accept Pay on Delivery</p><p className="text-sm text-muted-foreground">Customers can pay with cash or POS upon order arrival.</p></Label>
                        <Switch id="pay-on-delivery" checked={settings.payment.allowPayOnDelivery} onCheckedChange={(val) => handleSettingsChange('payment.allowPayOnDelivery', val)} disabled={isSaving} />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="bank-transfer" className="flex-1 space-y-0.5"><p className="text-base">Accept Bank Transfer</p><p className="text-sm text-muted-foreground">Customers will see your bank details to pay upfront.</p></Label>
                        <Switch id="bank-transfer" checked={settings.payment.allowBankTransfer} onCheckedChange={(val) => handleSettingsChange('payment.allowBankTransfer', val)} disabled={isSaving} />
                    </div>
                    {settings.payment.allowBankTransfer && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="bank-name">Bank Name</Label><Input id="bank-name" placeholder="e.g., Guaranty Trust Bank" value={settings.payment.bankName} onChange={(e) => handleSettingsChange('payment.bankName', e.target.value)} disabled={isSaving} /></div>
                                <div className="space-y-2"><Label htmlFor="account-number">Account Number</Label><Input id="account-number" placeholder="0123456789" value={settings.payment.accountNumber} onChange={(e) => handleSettingsChange('payment.accountNumber', e.target.value)} disabled={isSaving} /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="payment-instructions">Payment Instructions</Label><Textarea id="payment-instructions" placeholder="e.g., Please use your order ID as reference." value={settings.payment.paymentInstructions} onChange={(e) => handleSettingsChange('payment.paymentInstructions', e.target.value)} disabled={isSaving} /></div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Order Fulfillment</CardTitle><CardDescription>Set up how customers can receive their orders.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="allow-delivery" className="flex-1 space-y-0.5"><p className="text-base">Offer Delivery</p><p className="text-sm text-muted-foreground">Deliver orders directly to your customers.</p></Label>
                        <Switch id="allow-delivery" checked={settings.delivery.allowDelivery} onCheckedChange={(val) => handleSettingsChange('delivery.allowDelivery', val)} disabled={isSaving} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <Label htmlFor="allow-pickup" className="flex-1 space-y-0.5"><p className="text-base">Offer In-Store Pickup</p><p className="text-sm text-muted-foreground">Customers can pick up their order from your location.</p></Label>
                        <Switch id="allow-pickup" checked={settings.delivery.allowPickup} onCheckedChange={(val) => handleSettingsChange('delivery.allowPickup', val)} disabled={isSaving} />
                    </div>
                     {settings.delivery.allowDelivery && (
                        <div className="space-y-6 pt-4 border-t">
                            <div className="space-y-2"><Label htmlFor="delivery-fee">Flat Delivery Fee ({businessData?.currency})</Label><Input id="delivery-fee" type="number" placeholder="1500" value={settings.delivery.deliveryFee} onChange={(e) => handleSettingsChange('delivery.deliveryFee', parseFloat(e.target.value) || 0)} disabled={isSaving}/></div>
                            <div className="space-y-2"><Label>Delivery Days</Label><p className="text-sm text-muted-foreground">Select the days you are available for delivery.</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">{daysOfWeek.map(day => (<div key={day} className="flex items-center space-x-2"><Checkbox id={`day-${day}`} checked={settings.delivery.deliveryDays?.includes(day)} onCheckedChange={() => handleDayChange(day)} disabled={isSaving} /><Label htmlFor={`day-${day}`} className="font-normal">{day}</Label></div>))}</div></div>
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
// #endregion

// #region --- PRODUCTS COMPONENT ---
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
            const totalQuantity = product.hasVariants 
                ? product.variants.reduce((sum, v) => sum + v.quantity, 0)
                : product.quantity;

            const marketProductData = {
                productId: product.id,
                businessId: businessId,
                businessName: businessData.businessName,
                productName: product.name,
                price: product.price,
                oldPrice: product.oldPrice || null,
                description: product.description || '',
                category: product.category || 'other',
                availableQuantity: totalQuantity,
                images: product.images || [],
                hint: product.hint || product.name,
                hasVariants: product.hasVariants,
                variants: product.hasVariants ? product.variants.map(v => ({
                    id: v.id,
                    name: v.name,
                    price: v.price,
                    image: v.image || null,
                    availableQuantity: v.quantity
                })) : [],
                createdAt: new Date(), // Using client-side date for consistency
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
            <CardHeader><CardTitle>Your Products</CardTitle><CardDescription>Manage which of your products are visible on the public marketplace.</CardDescription></CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead className="text-right">List on Market</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {products && products.length > 0 ? products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Image src={product.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'} alt={product.name} width={40} height={40} className="rounded-md object-cover bg-muted" data-ai-hint={product.hint} />
                                        <span className="font-medium">{product.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{formatCurrency(product.price, businessData?.currency)}</TableCell>
                                <TableCell>{product.hasVariants ? product.variants.reduce((sum, v) => sum + v.quantity, 0) : product.quantity}</TableCell>
                                <TableCell><Badge variant={product.isPublishedToMarket ? 'default' : 'secondary'}>{product.isPublishedToMarket ? 'Listed' : 'Unlisted'}</Badge></TableCell>
                                <TableCell className="text-right"><Switch checked={product.isPublishedToMarket} onCheckedChange={(checked) => handleListingChange(product, checked)} /></TableCell>
                            </TableRow>
                        )) : (
                             <TableRow><TableCell colSpan={5} className="h-24 text-center">No products found. <Button variant="link" asChild><Link href="/add-product">Add your first product</Link></Button></TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
// #endregion

// #region --- ORDERS COMPONENT ---
const OrdersContent = () => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => businessId ? doc(firestore, `businesses/${businessId}`) : null, [firestore, businessId]);
    const { data: businessData } = useDoc<Business>(businessRef);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, 'orders'), where('sellerBusinessId', '==', businessId), orderBy('createdAt', 'desc'));
    }, [firestore, businessId]);
    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    const handleUpdateStatus = (orderId: string, status: Order['status']) => {
        if (!firestore) return;
        const orderRef = doc(firestore, 'orders', orderId);
        updateDocumentNonBlocking(orderRef, { status });
        toast({ title: 'Order Status Updated', description: `Order has been marked as ${status}.` });
    };
    
    const statusVariant: { [key in Order['status']]: "default" | "secondary" | "destructive" | "outline" } = {
        pending: 'destructive',
        confirmed: 'secondary',
        shipped: 'outline',
        fulfilled: 'default',
        cancelled: 'secondary',
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Incoming Orders</CardTitle>
                    <CardDescription>View and manage orders from your market store.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Incoming Orders</CardTitle>
                    <CardDescription>View and manage orders from your market store.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {orders && orders.length > 0 ? orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.customer.name}</TableCell>
                                    <TableCell>{order.createdAt.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell><Badge variant={statusVariant[order.status]}>{order.status}</Badge></TableCell>
                                    <TableCell>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(order.total, businessData?.currency)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setSelectedOrder(order)}>View Details</DropdownMenuItem>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmed')}>Mark as Confirmed</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'shipped')}>Mark as Shipped</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'fulfilled')}>Mark as Fulfilled</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="text-destructive">Cancel Order</DropdownMenuItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">No orders yet.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="sm:max-w-lg">
                    {selectedOrder && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Order #{selectedOrder.id.substring(0,6).toUpperCase()}</DialogTitle>
                                <DialogDescription>{selectedOrder.createdAt.toDate().toLocaleString()}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Card>
                                    <CardHeader className="p-4"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/>Customer Details</CardTitle></CardHeader>
                                    <CardContent className="p-4 pt-0 text-sm space-y-1">
                                        <p className="flex items-center gap-2"><Phone className="h-3 w-3"/> {selectedOrder.customer.phone}</p>
                                        {selectedOrder.fulfillment === 'delivery' && selectedOrder.customer.address && <p className="flex items-start gap-2"><MapPin className="h-3 w-3 mt-1"/> {selectedOrder.customer.address}</p>}
                                    </CardContent>
                                </Card>
                                <Card>
                                     <CardHeader className="p-4"><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-muted-foreground"/>Items Ordered</CardTitle></CardHeader>
                                     <CardContent className="p-4 pt-0 space-y-2">
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="text-sm flex justify-between">
                                                <span>{item.quantity} x {item.productName} {item.variantName && `(${item.variantName})`}</span>
                                                <span className="font-medium">{formatCurrency(item.quantity * item.price, businessData?.currency)}</span>
                                            </div>
                                        ))}
                                        <Separator />
                                        <div className="font-bold flex justify-between">
                                            <span>Total</span>
                                            <span>{formatCurrency(selectedOrder.total, businessData?.currency)}</span>
                                        </div>
                                     </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
// #endregion

// #region --- CUSTOMERS COMPONENT ---
const CustomersContent = () => {
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;
    const ordersQuery = useMemoFirebase(() => businessId ? query(collection(firestore, 'orders'), where('sellerBusinessId', '==', businessId)) : null, [firestore, businessId]);
    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    const customers = useMemo(() => {
        if (!orders) return [];
        const customerData: { [key: string]: Customer } = {};
        orders.forEach(order => {
            const customerId = order.customer.phone; // Use phone as unique ID
            if (!customerId) return;
            if (!customerData[customerId]) {
                customerData[customerId] = { id: customerId, name: order.customer.name, phone: order.customer.phone, totalOrders: 0, totalSpent: 0, lastOrder: order.createdAt.toDate() };
            }
            customerData[customerId].totalOrders += 1;
            customerData[customerId].totalSpent += order.total;
            if (order.createdAt.toDate() > customerData[customerId].lastOrder) {
                customerData[customerId].lastOrder = order.createdAt.toDate();
            }
        });
        return Object.values(customerData).sort((a,b) => b.totalSpent - a.totalSpent);
    }, [orders]);

     if (isLoading) {
        return <Card><CardHeader><CardTitle>Your Customers</CardTitle><CardDescription>A list of everyone who has ordered from your store.</CardDescription></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Orders</TableHead><TableHead>Last Order</TableHead><TableHead className="text-right">Total Spent</TableHead></TableRow></TableHeader><TableBody>{[...Array(3)].map((_, i) => <TableRow key={i}><TableCell><Skeleton className="h-8 w-32"/></TableCell><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell><Skeleton className="h-5 w-10"/></TableCell><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto"/></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader><CardTitle>Your Customers</CardTitle><CardDescription>A list of everyone who has ordered from your store.</CardDescription></CardHeader>
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
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No customers yet. Share your store link to get your first order!</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
// #endregion

// #region --- MAIN PAGE COMPONENT ---
export default function ManageMarketPage() {
    const [activeSection, setActiveSection] = useState('products');
    const router = useRouter();

    const menuItems = [
        { id: 'products', label: 'Products', icon: Package },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
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
            default: return <ProductsContent />;
        }
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-muted/30 text-foreground">
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
                    <header className="sticky top-0 z-10 flex h-auto min-h-16 flex-col items-start justify-center gap-1 border-b bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5"/></Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-full max-w-xs">
                                     <SidebarHeader>
                                        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
                                            <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/owner/home')}><ArrowLeft className="h-5 w-5" /><span>Back to Home</span></Button>
                                        </div>
                                    </SidebarHeader>
                                    <SidebarMenu className="flex-1 px-2 mt-4">
                                        {menuItems.map((item) => (
                                            <SidebarMenuItem key={item.id}>
                                                <SidebarMenuButton isActive={activeSection === item.id} onClick={() => setActiveSection(item.id)} tooltip={item.label} className="justify-start"><item.icon /> <span>{item.label}</span></SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SheetContent>
                            </Sheet>
                            <div><h1 className="text-xl font-headline font-semibold md:text-2xl">{activeMenuItem?.label}</h1></div>
                        </div>
                        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                            <Button variant="outline" asChild><Link href="/market" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />View Public Market</Link></Button>
                        </div>
                    </header>
                    <main className="flex-1 p-4 sm:p-6">{renderContent()}</main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
// #endregion
