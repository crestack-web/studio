
'use client';

import { useState, useMemo, useEffect, type FormEvent, type ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Settings, Package, ShoppingCart, Users, ExternalLink, ArrowLeft, MoreHorizontal, User, Phone, Mail, Loader2, FileUp, PackageCheck, Menu, Image as ImageIcon, Contact, MapPin, CreditCard, Globe, Copy, FileEdit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, runTransaction, serverTimestamp, getDoc, deleteField } from 'firebase/firestore';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { formatCurrency, markets } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import imageCompression from 'browser-image-compression';


const createSlug = (name: string) => {
    if (!name) return Math.random().toString(36).substring(2, 12);
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .trim()
        .replace(/\s+/g, '-') // replace spaces with -
        .replace(/-+/g, '-');
};

// #region --- TYPES ---
interface AppUser { businessId?: string, displayName?: string; }
interface Variant { id: string; name: string; price: number; cost?: number; quantity: number; image?: string; }
interface Product { id: string; name: string; price: number; quantity: number; hasVariants: boolean; variants: Variant[]; isPublishedToMarket: boolean; images: string[]; description: string; category: string; hint?: string; oldPrice?: number; }
type MarketSettings = { isStoreActive: boolean; bannerImageUrl: string; logoImageUrl: string; contactPhone: string; contactEmail: string; payment: { allowBankTransfer: boolean; allowPayOnDelivery: boolean; bankName: string; accountNumber: string; paymentInstructions: string; }; delivery: { allowDelivery: boolean; allowPickup: boolean; deliveryFee: number; deliveryDays: string[]; }; };
interface Business { 
    businessName: string; 
    currency: string; 
    plan: string; 
    businessType: string; 
    slug?: string; 
    marketDescription?: string; 
    marketSettings?: MarketSettings; 
    country?: string;
    deliveryTargets?: string[];
}
interface SellerBankAccount {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    status: 'unverified' | 'pending' | 'verified' | 'failed';
}
interface Customer { id: string; name: string; phone: string; totalOrders: number; totalSpent: number; lastOrder: Date; }
interface Order { id: string; customer: { name: string; phone: string; address?: string }; createdAt: { toDate: () => Date }; total: number; status: 'pending' | 'confirmed' | 'shipped' | 'fulfilled' | 'cancelled'; fulfillment: string; payment: string; items: { productId: string; productName: string; variantId?: string; variantName?: string; quantity: number; price: number }[]; payoutStatus?: 'unpaid' | 'processing' | 'paid' }
// #endregion

// #region --- SETTINGS COMPONENT ---
const SettingsContent = () => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessProfileRef = useMemoFirebase(() => businessId ? doc(firestore, `businessProfiles/${businessId}`) : null, [firestore, businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<Business>(businessProfileRef);

    const [settings, setSettings] = useState<MarketSettings | undefined>(undefined);
    const [description, setDescription] = useState('');
    const [slug, setSlug] = useState('');
    type DeliveryType = 'none' | 'nationwide' | 'cities';
    const [deliveryConfig, setDeliveryConfig] = useState<Record<string, { type: DeliveryType; cities: string[] }>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (businessData) {
            // General settings
            const defaultSettings: MarketSettings = {
                isStoreActive: false,
                bannerImageUrl: '',
                logoImageUrl: '',
                contactPhone: '',
                contactEmail: '',
                payment: { allowBankTransfer: true, allowPayOnDelivery: true, bankName: '', accountNumber: '', paymentInstructions: 'Please use your Order ID as the payment reference.' },
                delivery: { allowDelivery: true, allowPickup: true, deliveryFee: 1500, deliveryDays: ['Monday', 'Wednesday', 'Friday'] }
            };
            const currentSettings = businessData.marketSettings || {};
            const mergedSettings: MarketSettings = {
                ...defaultSettings, ...currentSettings,
                payment: { ...defaultSettings.payment, ...(currentSettings.payment || {}) },
                delivery: { ...defaultSettings.delivery, ...(currentSettings.delivery || {}) }
            };
            setSettings(mergedSettings);
            setDescription(businessData.marketDescription ?? `Welcome to ${businessData.businessName} on Busmo! We sell quality ${businessData.businessType} products.`);
            setSlug(businessData.slug || createSlug(businessData.businessName));

            // Delivery settings
            const initialConfig: Record<string, { type: DeliveryType; cities: string[] }> = {};
            const targets = businessData.deliveryTargets || [];
            markets.forEach(market => {
                const countryCode = market.code;
                const nationwideTarget = `COUNTRY_${countryCode}`;
                const cityTargets = targets.filter(t => t.startsWith(`CITY_${countryCode}_`)).map(t => t.split('_')[2]);
                
                if (targets.includes(nationwideTarget)) {
                    initialConfig[countryCode] = { type: 'nationwide', cities: [] };
                } else if (cityTargets.length > 0) {
                    initialConfig[countryCode] = { type: 'cities', cities: cityTargets };
                } else {
                    initialConfig[countryCode] = { type: 'none', cities: [] };
                }
            });
            setDeliveryConfig(initialConfig);
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

    const handleDeliveryConfigChange = (countryCode: string, type: DeliveryType, cities?: string[]) => {
        setDeliveryConfig(prev => ({
            ...prev,
            [countryCode]: { type, cities: cities || (type === 'cities' ? prev[countryCode]?.cities || [] : []) }
        }));
    };

    const handleCityToggle = (countryCode: string, city: string) => {
        setDeliveryConfig(prev => {
            const currentCities = prev[countryCode]?.cities || [];
            const newCities = currentCities.includes(city) ? currentCities.filter(c => c !== city) : [...currentCities, city];
            return {
                ...prev,
                [countryCode]: { ...prev[countryCode], type: 'cities', cities: newCities }
            }
        });
    };

    const handleBrandingImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'logoImageUrl' | 'bannerImageUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };
        try {
            const compressedFile = await imageCompression(file, options);
            const reader = new FileReader();
            reader.onloadend = () => handleSettingsChange(imageType, reader.result as string);
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Image compression failed', description: 'Please try again with a different image.' });
        }
    };

    const handleSaveChanges = async () => {
        if (!settings || !businessId || !firestore) return;
        setIsSaving(true);
        try {
            const businessSlug = createSlug(slug);
            const businessDocRef = doc(firestore, 'businesses', businessId);
            const businessProfileDocRef = doc(firestore, 'businessProfiles', businessId);

            // Process delivery config into deliveryTargets
            const deliveryTargets: string[] = [];
            Object.entries(deliveryConfig).forEach(([countryCode, config]) => {
                if (config.type === 'nationwide') {
                    deliveryTargets.push(`COUNTRY_${countryCode}`);
                } else if (config.type === 'cities' && config.cities.length > 0) {
                    config.cities.forEach(city => deliveryTargets.push(`CITY_${countryCode}_${city}`));
                }
            });

            // Use non-blocking updates for a faster UI response.
            updateDocumentNonBlocking(businessProfileDocRef, {
                marketDescription: description,
                slug: businessSlug,
                marketSettings: settings,
                deliveryTargets: deliveryTargets,
                deliveryType: deleteField(),
                deliveryCities: deleteField(),
            });

            updateDocumentNonBlocking(businessDocRef, {
                slug: businessSlug,
                deliveryTargets: deliveryTargets,
                deliveryType: deleteField(),
                deliveryCities: deleteField(),
            });

            toast({ title: "Settings Saved", description: "Your market settings have been updated." });
        } catch (error) {
            console.error("Error saving market settings:", error);
            toast({ variant: "destructive", title: "Save Failed", description: "There was an issue saving your settings." });
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
                    <CardTitle>Your Public Storefront</CardTitle>
                    <CardDescription>This is the public URL for your store. Customize it to make it your own.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label htmlFor="store-slug">Store URL</Label>
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                            busmo.com/
                        </div>
                        <Input id="store-slug" value={slug} onChange={e => setSlug(e.target.value)} className="rounded-l-none" />
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                    <Button variant="outline" onClick={() => {
                        navigator.clipboard.writeText(`https://your-domain.com/${slug}`);
                        toast({ title: "Copied to clipboard!" });
                    }}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                    </Button>
                    <Button asChild><Link href={`/${slug}`} target="_blank"><ExternalLink className="mr-2 h-4 w-4" />View Store</Link></Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Storefront Details</CardTitle>
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
                    
                    <div className="space-y-4 pt-4 border-t">
                        <Label className="font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Branding</Label>
                        
                        <div className="space-y-2">
                            <Label>Store Banner</Label>
                            <Card className="aspect-[3/1] relative flex items-center justify-center border-2 border-dashed">
                                {settings.bannerImageUrl ? (
                                    <Image src={settings.bannerImageUrl} alt="Banner preview" fill className="object-cover rounded-md" />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <ImageIcon className="mx-auto h-8 w-8"/>
                                        <p>Upload a banner (1200x400 recommended)</p>
                                    </div>
                                )}
                                <Label htmlFor="banner-upload" className="absolute inset-0 cursor-pointer bg-black/20 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <FileUp className="h-8 w-8 text-white"/>
                                </Label>
                                <Input id="banner-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleBrandingImageUpload(e, 'bannerImageUrl')} disabled={isSaving} />
                            </Card>
                        </div>

                        <div className="space-y-2">
                            <Label>Store Logo</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-24 w-24 border bg-muted">
                                    {settings.logoImageUrl ? (
                                        <Image src={settings.logoImageUrl} alt="Logo preview" fill className="object-cover" />
                                    ) : (
                                        <AvatarFallback className="text-3xl bg-transparent">
                                            {businessData?.businessName?.split(' ').map(n => n[0]).join('').substring(0,2) || 'B'}
                                        </AvatarFallback>
                                    )}
                                </Avatar>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="logo-upload" className="cursor-pointer">
                                        <Button asChild variant="outline" className="pointer-events-none">
                                            <span>Upload Logo</span>
                                        </Button>
                                    </Label>
                                    <Input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleBrandingImageUpload(e, 'logoImageUrl')} disabled={isSaving} />
                                    <p className="text-xs text-muted-foreground">Recommended: Square image.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                     <div className="space-y-4 pt-4 border-t">
                        <Label className="font-semibold flex items-center gap-2"><Contact className="w-4 h-4"/> Public Contact</Label>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="contact-phone">Contact Phone</Label><Input id="contact-phone" type="tel" placeholder="+234..." value={settings.contactPhone} onChange={(e) => handleSettingsChange('contactPhone', e.target.value)} disabled={isSaving} /></div>
                            <div className="space-y-2"><Label htmlFor="contact-email">Contact Email</Label><Input id="contact-email" type="email" placeholder="help@..." value={settings.contactEmail} onChange={(e) => handleSettingsChange('contactEmail', e.target.value)} disabled={isSaving} /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Delivery Area</CardTitle>
                    <CardDescription>Define where you can deliver products to. This is required to list items on the market.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {markets.map(market => (
                        <div key={market.code} className="space-y-4 rounded-lg border p-4">
                            <Label className="text-base font-semibold flex items-center gap-2">
                                <Image src={`https://flagcdn.com/w20/${market.code.toLowerCase()}.png`} alt={`${market.name} flag`} width={20} height={15} className="rounded-sm" />
                                {market.name}
                            </Label>
                            <Select value={deliveryConfig[market.code]?.type || 'none'} onValueChange={(val: DeliveryType) => handleDeliveryConfigChange(market.code, val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Don't deliver to this country</SelectItem>
                                    <SelectItem value="nationwide">Nationwide Delivery</SelectItem>
                                    <SelectItem value="cities">Deliver to Specific Cities</SelectItem>
                                </SelectContent>
                            </Select>
                            {deliveryConfig[market.code]?.type === 'cities' && (
                                <div className="space-y-2 pt-2">
                                    <Label>Available Cities in {market.name}</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                                        {market.cities.map(city => (
                                            <div key={city} className="flex items-center space-x-2">
                                                <Checkbox id={`${market.code}-${city}`} checked={deliveryConfig[market.code]?.cities.includes(city)} onCheckedChange={() => handleCityToggle(market.code, city)} disabled={isSaving} />
                                                <Label htmlFor={`${market.code}-${city}`} className="font-normal">{city}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
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
const ProductsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
            <Card key={i}>
                <Skeleton className="aspect-square w-full" />
                <CardContent className="p-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-6 w-1/2 mt-2" />
                </CardContent>
                <CardFooter className="p-3 border-t">
                    <Skeleton className="h-6 w-full" />
                </CardFooter>
            </Card>
        ))}
    </div>
);


const OwnerProductCard = ({ product, onListingChange, currency }: { product: Product, onListingChange: (product: Product, isListed: boolean) => void, currency?: string }) => {
    const stock = product.hasVariants ? product.variants.reduce((sum, v) => sum + v.quantity, 0) : product.quantity;
    
    return (
        <Card className="overflow-hidden h-full flex flex-col">
            <div className="aspect-square overflow-hidden relative bg-muted">
                {product.images && product.images.length > 0 ? (
                    <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        fill 
                        className="object-cover" 
                        data-ai-hint={product.hint || product.name.split(' ').slice(0,2).join(' ')}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                        <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                )}
                <Badge variant={product.isPublishedToMarket ? 'default' : 'secondary'} className="absolute top-2 left-2">{product.isPublishedToMarket ? 'Listed' : 'Unlisted'}</Badge>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-8 w-8 bg-black/20 hover:bg-black/40 text-white hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/add-product?id=${product.id}`}>
                                <FileEdit className="mr-2 h-4 w-4"/>
                                <span>Edit Product</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" disabled>
                            <Trash2 className="mr-2 h-4 w-4"/>
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <CardContent className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold text-sm leading-snug flex-1 line-clamp-2">{product.name}</h3>
                <div className="mt-2 flex justify-between items-baseline">
                    <p className="font-bold text-base">{formatCurrency(product.price, currency)}</p>
                    <p className="text-xs text-muted-foreground">Stock: {stock}</p>
                </div>
            </CardContent>
            <CardFooter className="p-3 border-t bg-muted/30">
                 <div className="flex items-center justify-between w-full">
                    <Label htmlFor={`list-switch-${product.id}`} className="text-sm font-medium">
                        List on Market
                    </Label>
                    <Switch
                        id={`list-switch-${product.id}`}
                        checked={product.isPublishedToMarket}
                        onCheckedChange={(checked) => onListingChange(product, checked)}
                    />
                </div>
            </CardFooter>
        </Card>
    );
}

const ProductsContent = ({ setActiveSection }: { setActiveSection: (section: string) => void }) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => businessId ? doc(firestore, `businesses/${businessId}`) : null, [firestore, businessId]);
    const { data: businessData } = useDoc<Business>(businessRef);

    const verificationRef = useMemoFirebase(() => businessId ? doc(firestore, `businessVerifications/${businessId}`) : null, [firestore, businessId]);
    const { data: verificationData, isLoading: isLoadingVerification } = useDoc<{ status: string }>(verificationRef);
    const isBusinessVerified = verificationData?.status === 'verified';

    const productsQuery = useMemoFirebase(() => businessId ? query(collection(firestore, `businesses/${businessId}/products`)) : null, [firestore, businessId]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    const handleListingChange = async (product: Product, isListed: boolean) => {
        if (!firestore || !businessId || !businessData) return;

        if (isListed && !isBusinessVerified) {
            toast({
                variant: 'destructive',
                title: 'Business Not Verified',
                description: 'Please complete your business verification to list products.',
                action: <ToastAction altText="Verify Now" onClick={() => setActiveSection('verification')}>Verify</ToastAction>,
            });
            return;
        }

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
                deliveryTargets: businessData.deliveryTargets || [],
                createdAt: new Date(), // Using client-side date for consistency,
            };
            setDocumentNonBlocking(marketProductDocRef, marketProductData, { merge: true });
        } else {
            deleteDocumentNonBlocking(marketProductDocRef);
        }
    };
    
    if (isLoadingProducts || isLoadingVerification) {
        return <ProductsSkeleton />;
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold font-headline">Your Products</h2>
                    <p className="text-muted-foreground">Manage which of your products are visible on the public marketplace.</p>
                </div>
                <Button asChild>
                    <Link href="/add-product">Add New Product</Link>
                </Button>
            </div>
            {!isBusinessVerified && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Verification Required to Sell</AlertTitle>
                    <AlertDescription>
                        Your business must be verified to list products on the market. 
                        <Button variant="link" className="p-0 h-auto ml-1" onClick={() => setActiveSection('verification')}>
                            Complete Verification Now
                        </Button>
                    </AlertDescription>
                </Alert>
            )}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products && products.length > 0 ? products.map((product) => (
                    <OwnerProductCard 
                        key={product.id}
                        product={product} 
                        onListingChange={handleListingChange} 
                        currency={businessData?.currency}
                    />
                )) : (
                     <div className="sm:col-span-2 lg:col-span-3 xl:grid-cols-4">
                        <Card className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground border-dashed">
                            <CardContent className="p-6">
                                <p className="font-semibold">No products found.</p>
                                <p className="text-sm">Get started by adding your first product.</p>
                                <Button variant="link" asChild className="mt-2">
                                    <Link href="/add-product">Add Product</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
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
        return query(collection(firestore, `businesses/${businessId}/orders`));
    }, [firestore, businessId]);
    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    const sortedOrders = useMemo(() => {
        if (!orders) return [];
        return [...orders].sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });
    }, [orders]);

    const handleUpdateStatus = async (order: Order, status: Order['status']) => {
        if (!firestore || !businessId || !businessData) return;

        const orderRef = doc(firestore, `businesses/${businessId}/orders`, order.id);

        try {
            await runTransaction(firestore, async (transaction) => {
                // 1. Update order status
                transaction.update(orderRef, { status });

                // If fulfilling a Nigerian order, check for verified bank account and create payout record
                if (status === 'fulfilled' && order.payoutStatus !== 'paid' && businessData.country === 'NG') {
                    // Check for verified bank account
                    const bankAccountRef = doc(firestore, `businesses/${businessId}/bankAccount/primary`);
                    const bankAccountSnap = await transaction.get(bankAccountRef);

                    if (!bankAccountSnap.exists() || bankAccountSnap.data()?.status !== 'verified') {
                        throw new Error('Payout account is not verified. Please set up your bank account in the BusmoPay settings.');
                    }
                    
                    // If verified, proceed to create payout record
                    const payoutAmount = order.total * 0.90; // Deduct 10% commission
                    const payoutRef = doc(collection(firestore, `businesses/${businessId}/payouts`));
                    
                    transaction.set(payoutRef, {
                        orderId: order.id,
                        amount: payoutAmount,
                        currency: businessData.currency,
                        status: 'processing',
                        createdAt: serverTimestamp(),
                    });
                    
                    // Mark order as having a payout processing
                    transaction.update(orderRef, { payoutStatus: 'processing' });
                }


                // If confirming, deduct stock (example logic, adjust as needed)
                if (status === 'confirmed' && order.status === 'pending') {
                    for (const item of order.items) {
                        const productRef = doc(firestore, `businesses/${businessId}/products`, item.productId);
                        const marketProductRef = doc(firestore, 'marketProducts', item.productId);

                        const productSnap = await transaction.get(productRef);
                        if (!productSnap.exists()) {
                            throw new Error(`Product ${item.productName} not found in inventory.`);
                        }

                        const productData = productSnap.data() as Product;
                        let newTotalStock: number;
                        
                        if (item.variantId && productData.hasVariants) {
                            const newVariants = productData.variants.map(v => 
                                v.id === item.variantId ? { ...v, quantity: v.quantity - item.quantity } : v
                            );
                            newTotalStock = newVariants.reduce((sum, v) => sum + v.quantity, 0);
                            transaction.update(productRef, { variants: newVariants });
                            
                             const marketVariantsUpdate = newVariants.map(v => ({ id: v.id, name: v.name, price: v.price, availableQuantity: v.quantity, image: v.image || null }));
                             transaction.update(marketProductRef, { variants: marketVariantsUpdate, availableQuantity: newTotalStock });
                        } else {
                            newTotalStock = productData.quantity - item.quantity;
                            transaction.update(productRef, { quantity: newTotalStock });
                            transaction.update(marketProductRef, { availableQuantity: newTotalStock });
                        }
                    }
                }
            });

            toast({ title: 'Order Status Updated', description: `Order has been marked as ${status}.` });

        } catch (error: any) {
            console.error("Error updating order status:", error);
            toast({ variant: "destructive", title: "Update Failed", description: error.message || 'Could not update order.' });
        }
    };
    
    const statusVariant: { [key in Order['status']]: "default" | "secondary" | "destructive" | "outline" } = {
        pending: 'destructive',
        confirmed: 'secondary',
        shipped: 'outline',
        fulfilled: 'default',
        cancelled: 'secondary',
    };

    if (isLoading) {
        return <Card><CardHeader><CardTitle>Incoming Orders</CardTitle><CardDescription>View and manage orders from your market store.</CardDescription></CardHeader><CardContent className="p-0"><div className="relative w-full overflow-auto"><table className="w-full caption-bottom text-sm"><thead className="[&_tr]:border-b"><tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Customer</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Date</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Status</th><th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Total</th></tr></thead><tbody className="[&_tr:last-child]:border-0">{[...Array(3)].map((_, i) => <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><td className="p-4 align-middle [&:has([role=checkbox])]:pr-0"><Skeleton className="h-6 w-24" /></td><td className="p-4 align-middle [&:has([role=checkbox])]:pr-0"><Skeleton className="h-6 w-20" /></td><td className="p-4 align-middle [&:has([role=checkbox])]:pr-0"><Skeleton className="h-6 w-16 rounded-full" /></td><td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right"><Skeleton className="h-6 w-16 ml-auto" /></td></tr>)}</tbody></table></div></CardContent></Card>;
    }
    
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Incoming Orders</CardTitle>
                    <CardDescription>View and manage orders from your market store.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b"><tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Customer</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Date</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Status</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Items</th><th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Total</th><th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Actions</th></tr></thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {sortedOrders && sortedOrders.length > 0 ? sortedOrders.map((order) => (
                                    <tr key={order.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium">{order.customer.name}</td>
                                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">{order.createdAt.toDate().toLocaleDateString()}</td>
                                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0"><Badge variant={statusVariant[order.status]}>{order.status}</Badge></td>
                                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">{order.items.reduce((acc, item) => acc + item.quantity, 0)}</td>
                                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">{formatCurrency(order.total, businessData?.currency)}</td>
                                        <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setSelectedOrder(order)}>View Details</DropdownMenuItem>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent>
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'confirmed')}>Mark as Confirmed</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'shipped')}>Mark as Shipped</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'fulfilled')}>Mark as Fulfilled</DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'cancelled')} className="text-destructive">Cancel Order</DropdownMenuItem>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><td colSpan={6} className="p-4 align-middle [&:has([role=checkbox])]:pr-0 h-24 text-center">No orders yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
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
    const ordersQuery = useMemoFirebase(() => businessId ? query(collection(firestore, `businesses/${businessId}/orders`)) : null, [firestore, businessId]);
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
        return <Card><CardHeader><CardTitle>Your Customers</CardTitle><CardDescription>A list of everyone who has ordered from your store.</CardDescription></CardHeader><CardContent className="p-0"><div className="relative w-full overflow-auto"><table className="w-full caption-bottom text-sm"><thead className="[&_tr]:border-b"><tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Customer</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Phone</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Orders</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Last Order</th><th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Total Spent</th></tr></thead><tbody className="[&_tr:last-child]:border-0">{[...Array(3)].map((_, i) => <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><td className="p-4 align-middle [&:has([role=checkbox])]:pr-0"><Skeleton className="h-8 w-32"/></td><td className="p-4 align-middle [&:has([role=checkbox])]:pr-0"><Skeleton className="h-5 w-24"/></td><td className="p-4 align-middle [&:has([role=checkbox])]:pr-0"><Skeleton className="h-5 w-10"/></td><td className="p-4 align-middle [&:has([role=checkbox])]:pr-0"><Skeleton className="h-5 w-24"/></td><td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right"><Skeleton className="h-5 w-16 ml-auto"/></td></tr>)}</tbody></table></div></CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader><CardTitle>Your Customers</CardTitle><CardDescription>A list of everyone who has ordered from your store.</CardDescription></CardHeader>
            <CardContent className="p-0">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b"><tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Customer</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Phone</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Total Orders</th><th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Last Order</th><th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Total Spent</th></tr></thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {customers.length > 0 ? customers.map(customer => (
                                <tr key={customer.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8"><AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                                            <span className="font-medium">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">{customer.phone}</td>
                                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">{customer.totalOrders}</td>
                                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">{customer.lastOrder.toLocaleDateString()}</td>
                                    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">{formatCurrency(customer.totalSpent)}</td>
                                </tr>
                            )) : (
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"><td colSpan={5} className="p-4 align-middle [&:has([role=checkbox])]:pr-0 h-24 text-center">No customers yet. Share your store link to get your first order!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
// #endregion

// #region --- BusmoPaySettings ---
const BusmoPaySettings = () => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();

    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => (businessId ? doc(firestore, 'businesses', businessId) : null), [firestore, businessId]);
    const { data: businessData } = useDoc<{ country?: string }>(businessRef);

    const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
    const [isLoadingBanks, setIsLoadingBanks] = useState(true);

    const [bankCode, setBankCode] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const bankAccountRef = useMemoFirebase(() => {
        if (!businessId) return null;
        return doc(firestore, `businesses/${businessId}/bankAccount/primary`);
    }, [businessId]);
    const { data: bankAccountData, isLoading: isLoadingAccount } = useDoc<SellerBankAccount>(bankAccountRef);

    useEffect(() => {
        const fetchBanks = async () => {
            if (!businessData?.country) {
                setIsLoadingBanks(false);
                return;
            };
            const fetchBankListUrl = process.env.NEXT_PUBLIC_FETCH_BANK_LIST_URL;
            if (!fetchBankListUrl) {
                console.error('Bank list URL is not configured.');
                setIsLoadingBanks(false);
                return;
            }
            const countryName = markets.find((m) => m.code === businessData.country)?.name.toLowerCase() || 'nigeria';
            
            try {
                const response = await fetch(`${fetchBankListUrl}?country=${countryName}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const result = await response.json();
                if (result.success) {
                    setBanks(result.data);
                } else {
                    toast({ title: 'Error fetching banks', description: result.error, variant: 'destructive' });
                }
            } catch (error) {
                toast({ title: 'Error', description: 'Could not fetch bank list.', variant: 'destructive' });
            } finally {
                setIsLoadingBanks(false);
            }
        };

        if (businessData?.country) {
            fetchBanks();
        }
    }, [businessData?.country, toast]);

    useEffect(() => {
        if (bankAccountData) {
            setBankCode(bankAccountData.bankCode || '');
            setAccountNumber(bankAccountData.accountNumber || '');
        }
    }, [bankAccountData]);

    const handleVerifyAccount = async () => {
        if (!bankCode || !accountNumber) {
            toast({ title: 'Missing Details', description: 'Please select a bank and enter your account number.', variant: 'destructive' });
            return;
        }
        if (accountNumber.length < 8) {
            toast({ title: 'Invalid Account Number', description: 'Please enter a valid account number.', variant: 'destructive' });
            return;
        }
        
        const verifyBankAccountUrl = process.env.NEXT_PUBLIC_VERIFY_BANK_ACCOUNT_URL;
        if (!verifyBankAccountUrl) {
            console.error('Bank account verification URL is not configured.');
            toast({ variant: 'destructive', title: 'Configuration Error', description: 'Bank verification service is not set up.' });
            return;
        }
    
        setIsVerifying(true);
        
        try {
            const response = await fetch(verifyBankAccountUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
            });
            const result = await response.json();
            
            if (result.success) {
                toast({
                  title: 'Verification Successful',
                  description: `Account holder: ${result.data.account_name}`,
                });
                 if(bankAccountRef) {
                    const selectedBank = banks.find(b => b.code === bankCode);
                    await setDocumentNonBlocking(bankAccountRef, {
                        bankName: selectedBank?.name,
                        bankCode: bankCode,
                        accountNumber: accountNumber,
                        accountName: result.data.account_name,
                        status: 'verified'
                    }, { merge: true });
                }
            } else {
                toast({
                  title: 'Verification Failed',
                  description: result.error || 'The bank details could not be verified.',
                  variant: 'destructive',
                });
                if(bankAccountRef) {
                    await updateDocumentNonBlocking(bankAccountRef, { status: 'failed' });
                }
            }
        } catch (error: any) {
          console.error("Client-side verification error:", error);
          toast({
            title: 'Error',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
          });
        } finally {
          setIsVerifying(false);
        }
    };
    
    const isLoading = isLoadingAccount || isLoadingBanks;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Payout Settings (Nigeria)</CardTitle>
                    <CardDescription>Set up your bank account to receive payouts from your sales on Busmo Market.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-select">Bank</Label>
                            <Select value={bankCode} onValueChange={setBankCode} disabled={isVerifying || isLoading}>
                                <SelectTrigger id="bank-select"><SelectValue placeholder={isLoadingBanks ? 'Loading banks...' : 'Select your bank'} /></SelectTrigger>
                                <SelectContent>{banks.map(bank => (<SelectItem key={bank.code} value={bank.code}>{bank.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="account-number">Account Number</Label>
                            <Input id="account-number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0123456789" disabled={isVerifying || isLoading} />
                        </div>
                    </div>
                    
                    {!isLoading && bankAccountData && (
                        <Card className="bg-muted/50">
                            <CardHeader className="p-4 flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="text-base">Current Payout Account</CardTitle>
                                    <CardDescription className="text-xs">This is where your earnings will be sent.</CardDescription>
                                </div>
                                <Badge variant={bankAccountData.status === 'verified' ? 'default' : bankAccountData.status === 'pending' ? 'secondary' : 'destructive'} className="capitalize">{bankAccountData.status}</Badge>
                            </CardHeader>
                            {bankAccountData.status === 'verified' && (
                                <CardContent className="p-4 pt-0 text-sm space-y-1">
                                    <p className="font-semibold">{bankAccountData.accountName}</p>
                                    <p className="text-muted-foreground">{bankAccountData.accountNumber} - {bankAccountData.bankName}</p>
                                </CardContent>
                            )}
                             {bankAccountData.status === 'failed' && (
                                <CardContent className="p-4 pt-0 text-sm">
                                    <p className="text-destructive">Verification failed. Please check your details and try again.</p>
                                </CardContent>
                            )}
                        </Card>
                    )}
                </CardContent>
                <CardFooter>
                     <Button onClick={handleVerifyAccount} disabled={isVerifying || isLoading || !bankCode || !accountNumber}>
                        {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isVerifying ? 'Verifying...' : 'Save & Verify Account'}
                    </Button>
                </CardFooter>
            </Card>
            <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertTitle>How Payouts Work</AlertTitle>
                <AlertDescription>
                    Busmo collects payments from buyers on your behalf. After you fulfill an order, the earnings (minus a 10% commission) are automatically sent to your verified bank account within 24-48 hours.
                </AlertDescription>
            </Alert>
        </div>
    )
}
// #endregion

// #region --- VERIFICATION COMPONENT ---
const BusinessVerificationContent = () => {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;
    
    const verificationRef = useMemoFirebase(() => businessId ? doc(firestore, `businessVerifications/${businessId}`) : null, [firestore, businessId]);
    const { data: verificationData, isLoading: isLoadingVerification } = useDoc<{status: string, rejectionReason?: string, idImageUrl?: string, stockImageUrl?: string, storeImageUrl?: string}>(verificationRef);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [idImage, setIdImage] = useState<string | null>(null);
    const [stockImage, setStockImage] = useState<string | null>(null);
    const [storeImage, setStoreImage] = useState<string | null>(null);

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        try {
            const compressedFile = await imageCompression(file, options);
            const reader = new FileReader();
            reader.onloadend = () => setter(reader.result as string);
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Image Upload Failed', description: 'Could not process the image. Please try another file.' });
        }
    };
    
    const handleSubmit = async () => {
        if (!idImage || !stockImage || !storeImage) {
            toast({ variant: 'destructive', title: 'Missing Documents', description: 'Please upload all three required images.' });
            return;
        }
        if (!verificationRef) return;
        
        setIsSubmitting(true);
        try {
            await setDocumentNonBlocking(verificationRef, {
                businessId: businessId,
                status: 'pending',
                submittedAt: serverTimestamp(),
                idImageUrl: idImage,
                stockImageUrl: stockImage,
                storeImageUrl: storeImage,
            }, { merge: true });
            toast({ title: 'Documents Submitted!', description: 'Your verification application is now pending review.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'An error occurred. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const ImageUploader = ({ title, description, image, onImageUpload, isSubmitting }: any) => (
        <Card>
            <CardHeader><CardTitle className="text-base">{title}</CardTitle><CardDescription className="text-sm">{description}</CardDescription></CardHeader>
            <CardContent>
                <Label htmlFor={`${title}-upload`} className={cn("relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed bg-muted/50", isSubmitting && "cursor-not-allowed opacity-50")}>
                    <Input id={`${title}-upload`} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, onImageUpload)} disabled={isSubmitting} />
                    {image ? (
                        <Image src={image} alt={`${title} preview`} fill className="object-contain rounded-md p-2" />
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <FileUp className="mx-auto h-8 w-8" />
                            <span>Click to Upload</span>
                        </div>
                    )}
                </Label>
            </CardContent>
        </Card>
    );
    
    if (isLoadingVerification) {
        return <div className="space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
    }

    if (verificationData?.status === 'verified') {
        return (
            <Card className="text-center">
                <CardHeader>
                    <div className="flex justify-center"><CheckCircle className="w-16 h-16 text-success" /></div>
                    <CardTitle className="text-2xl pt-4">Business Verified!</CardTitle>
                    <CardDescription>Your business is verified and you can now sell products on the Busmo Market.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
     if (verificationData?.status === 'pending') {
        return (
            <Card className="text-center">
                <CardHeader>
                    <div className="flex justify-center"><Loader2 className="w-16 h-16 text-primary animate-spin" /></div>
                    <CardTitle className="text-2xl pt-4">Verification Pending</CardTitle>
                    <CardDescription>Your documents have been submitted and are awaiting review. This typically takes 24-48 hours.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
         <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Business Verification</CardTitle>
                    <CardDescription>To ensure a safe marketplace, please provide the following documents.</CardDescription>
                </CardHeader>
             </Card>
            {verificationData?.status === 'rejected' && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Verification Rejected</AlertTitle>
                    <AlertDescription>
                       Your previous submission was rejected. Reason: {verificationData.rejectionReason || 'No reason provided.'} Please re-upload your documents and submit again.
                    </AlertDescription>
                </Alert>
            )}
             <div className="grid md:grid-cols-3 gap-6">
                <ImageUploader title="Valid ID" description="e.g., National ID, Driver's License" image={idImage || verificationData?.idImageUrl} onImageUpload={setIdImage} isSubmitting={isSubmitting}/>
                <ImageUploader title="Proof of Stock" description="A photo showing your products/inventory" image={stockImage || verificationData?.stockImageUrl} onImageUpload={setStockImage} isSubmitting={isSubmitting}/>
                <ImageUploader title="Store/Shop Image" description="A photo of your physical shop or workspace" image={storeImage || verificationData?.storeImageUrl} onImageUpload={setStoreImage} isSubmitting={isSubmitting}/>
             </div>
             <Button size="lg" className="w-full h-14 text-lg" onClick={handleSubmit} disabled={isSubmitting || !idImage || !stockImage || !storeImage}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for Verification
            </Button>
         </div>
    )
}
// #endregion


// #region --- MAIN PAGE COMPONENT ---
export default function ManageMarketPage() {
    const searchParams = useSearchParams();
    const initialSection = searchParams.get('section') || 'products';
    const [activeSection, setActiveSection] = useState(initialSection);
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
    const router = useRouter();

    const firestore = useFirestore();
    const { user } = useUser();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => businessId ? doc(firestore, `businesses/${businessId}`) : null, [firestore, businessId]);
    const { data: businessData } = useDoc<Business>(businessRef);

    const menuItems = useMemo(() => {
        const items = [
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'verification', label: 'Verification', icon: PackageCheck },
            { id: 'settings', label: 'Store Settings', icon: Settings },
        ];
        if (businessData?.country === 'NG') {
            items.push({ id: 'busmopay', label: 'BusmoPay', icon: CreditCard });
        }
        return items;
    }, [businessData]);
    
    useEffect(() => {
        const section = searchParams.get('section');
        if (section && menuItems.find(item => item.id === section)) {
            setActiveSection(section);
        }
    }, [searchParams, menuItems]);
    
    const activeMenuItem = menuItems.find((item) => item.id === activeSection);
    
    const renderContent = () => {
        switch (activeSection) {
            case 'settings': return <SettingsContent />;
            case 'products': return <ProductsContent setActiveSection={setActiveSection} />;
            case 'orders': return <OrdersContent />;
            case 'customers': return <CustomersContent />;
            case 'busmopay': return <BusmoPaySettings />;
            case 'verification': return <BusinessVerificationContent />;
            default: return <ProductsContent setActiveSection={setActiveSection} />;
        }
    };
    
    const SidebarNavigation = () => (
         <>
            <SidebarHeader>
                <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center p-2">
                    <Button variant="ghost" className="justify-start gap-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:p-2" onClick={() => router.push('/owner/home')}><ArrowLeft className="h-5 w-5" /><span className="group-data-[collapsible=icon]:hidden">Back to Home</span></Button>
                </div>
            </SidebarHeader>

            <SidebarMenu className="flex-1 px-2">
                {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton 
                            isActive={activeSection === item.id} 
                            onClick={() => {
                                setActiveSection(item.id);
                                setIsMobileSheetOpen(false); // Close sheet on selection
                            }} 
                            tooltip={item.label} 
                            className="justify-start group-data-[collapsible=icon]:justify-center"
                        >
                            <item.icon /> <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </>
    )

    return (
        <SidebarProvider>
            <div className="flex min-h-screen bg-muted/30 text-foreground">
                <Sidebar>
                    <SidebarNavigation />
                </Sidebar>

                <SidebarInset>
                    <header className="sticky top-0 z-10 border-b bg-background">
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5"/></Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-full max-w-xs p-0">
                                        <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
                                          <SidebarNavigation />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <SidebarTrigger className="hidden md:flex" />
                                <div><h1 className="text-xl font-headline font-semibold md:text-2xl">{activeMenuItem?.label}</h1></div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" asChild><Link href="/market" target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />View Public Market</Link></Button>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 p-4 sm:p-6">{renderContent()}</main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

// #endregion
