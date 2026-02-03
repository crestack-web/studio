
'use client';
import { useState, useMemo, useEffect, ChangeEvent, Suspense } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Loader2, FileUp, X, FileEdit, Check, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, serverTimestamp, query } from 'firebase/firestore';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import imageCompression from 'browser-image-compression';

interface Ingredient {
    name: string;
    cost: string;
}

interface Variant {
    id: string;
    name: string;
    cost: string;
    price: string;
    quantity: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    oldPrice?: number | null;
    cost: number;
    quantity: number;
    hasVariants: boolean;
    variants: { id: string; name: string; price: number; cost: number; quantity: number; image?: string; }[];
    isPublishedToMarket: boolean;
    description: string;
    category: string;
    createdAt?: any;
    updatedAt?: any;
    images: string[];
    hint?: string;
}

interface AppUser {
    businessId?: string;
}

interface Business {
    businessName: string;
    plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
    currency?: string;
    country?: string;
    deliveryTargets?: string[];
}

interface MarketCategory {
    id: string;
    name: string;
}

interface BusinessVerification {
    status: 'unverified' | 'pending' | 'verified' | 'rejected';
}

function AddProductPageContent() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = searchParams.get('id');
    const isEditMode = !!productId;

    const [isLoading, setIsLoading] = useState(false);

    const [isManufactured, setIsManufactured] = useState(false);
    const [isListedOnMarket, setIsListedOnMarket] = useState(false);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [newIngredientName, setNewIngredientName] = useState('');
    const [newIngredientCost, setNewIngredientCost] = useState('');
    
    const [images, setImages] = useState<string[]>([]);

    const [productName, setProductName] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [oldPrice, setOldPrice] = useState('');
    const [initialQuantity, setInitialQuantity] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productCategory, setProductCategory] = useState('');
    
    const [hasVariants, setHasVariants] = useState(false);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [newVariantName, setNewVariantName] = useState('');
    const [newVariantCost, setNewVariantCost] = useState('');
    const [newVariantPrice, setNewVariantPrice] = useState('');
    const [newVariantQuantity, setNewVariantQuantity] = useState('');
    const [editingVariant, setEditingVariant] = useState<Variant | null>(null);


    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, `users/${authUser.uid}`);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, `businesses/${businessId}`);
    }, [firestore, businessId]);
    const { data: businessData } = useDoc<Business>(businessRef);

    const verificationRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, `businessVerifications/${businessId}`);
    }, [firestore, businessId]);
    const { data: verificationData, isLoading: isLoadingVerification } = useDoc<BusinessVerification>(verificationRef);
    const isBusinessVerified = verificationData?.status === 'verified';

    const productRef = useMemoFirebase(() => {
        if (!isEditMode || !firestore || !businessId) return null;
        return doc(firestore, `businesses/${businessId}/products/${productId}`);
    }, [isEditMode, firestore, businessId, productId]);

    const { data: productData, isLoading: isLoadingProduct } = useDoc<Product>(productRef);

    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketCategories'));
    }, [firestore]);
    const { data: categoriesData, isLoading: isLoadingCategories } = useCollection<MarketCategory>(categoriesQuery);

    const canManufacture = true;
    const deliverySettingsConfigured = !!businessData?.deliveryTargets && businessData.deliveryTargets.length > 0;

    useEffect(() => {
        if (isEditMode && productData) {
            setProductName(productData.name || '');
            setSellingPrice(productData.price?.toString() || '');
            setOldPrice(productData.oldPrice?.toString() || '');
            setCostPrice(productData.cost?.toString() || '');
            setInitialQuantity(productData.quantity?.toString() || '');
            setProductDescription(productData.description || '');
            setProductCategory(productData.category || '');
            setIsListedOnMarket(productData.isPublishedToMarket || false);
            setHasVariants(productData.hasVariants || false);
            setImages(productData.images || []);
            if (productData.hasVariants && productData.variants) {
                setVariants(productData.variants.map(v => ({
                    id: v.id,
                    name: v.name,
                    cost: v.cost?.toString() || '0',
                    price: v.price.toString(),
                    quantity: v.quantity.toString()
                })));
            }
        }
    }, [isEditMode, productData]);


    useEffect(() => {
        if (!canManufacture) {
            setIsManufactured(false);
        }
    }, [canManufacture]);
    
    useEffect(() => {
        if (hasVariants) {
            setIsManufactured(false);
        }
    }, [hasVariants]);
    
     useEffect(() => {
        if (isManufactured) {
            setHasVariants(false);
        }
    }, [isManufactured]);

    const totalIngredientCost = useMemo(() => {
        return ingredients.reduce((total, ing) => total + (parseFloat(ing.cost) || 0), 0);
    }, [ingredients]);
    
    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const compressionOptions = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
        };

        for (const file of Array.from(files)) {
            try {
                const compressedFile = await imageCompression(file, compressionOptions);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImages(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Image compression failed',
                    description: `Could not process ${file.name}. Please try a different image.`,
                });
            }
        }
    };
    
    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    }

    const handleAddIngredient = () => {
        if (newIngredientName.trim() && newIngredientCost.trim()) {
            setIngredients([...ingredients, { name: newIngredientName.trim(), cost: newIngredientCost.trim() }]);
            setNewIngredientName('');
            setNewIngredientCost('');
        }
    };

    const handleRemoveIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleAddVariant = () => {
        if (newVariantName.trim() && newVariantPrice.trim() && newVariantQuantity.trim()) {
            setVariants([
                ...variants,
                { 
                    id: new Date().getTime().toString(),
                    name: newVariantName.trim(), 
                    cost: newVariantCost.trim() || '0', 
                    price: newVariantPrice.trim(), 
                    quantity: newVariantQuantity.trim() 
                }
            ]);
            setNewVariantName('');
            setNewVariantCost('');
            setNewVariantPrice('');
            setNewVariantQuantity('');
        }
    };

    const handleRemoveVariant = (id: string) => {
        setVariants(variants.filter(v => v.id !== id));
    };

    const handleEditClick = (variant: Variant) => {
        setEditingVariant(variant);
        setNewVariantName(variant.name);
        setNewVariantCost(variant.cost || '0');
        setNewVariantPrice(variant.price);
        setNewVariantQuantity(variant.quantity);
    };

    const handleUpdateVariant = () => {
        if (!editingVariant) return;

        setVariants(variants.map(v => 
            v.id === editingVariant.id
            ? {
                ...v,
                name: newVariantName.trim(),
                cost: newVariantCost.trim() || '0',
                price: newVariantPrice.trim(),
                quantity: newVariantQuantity.trim(),
              }
            : v
        ));
        handleCancelEdit();
    };

    const handleCancelEdit = () => {
        setEditingVariant(null);
        setNewVariantName('');
        setNewVariantCost('');
        setNewVariantPrice('');
        setNewVariantQuantity('');
    }
    
    const finalCostPrice = isManufactured ? totalIngredientCost : parseFloat(costPrice) || 0;
    
    const totalInitialQuantity = useMemo(() => {
        if (!hasVariants) return parseInt(initialQuantity) || 0;
        return variants.reduce((total, v) => total + (parseInt(v.quantity) || 0), 0);
    }, [hasVariants, initialQuantity, variants]);

    const canSaveProduct = useMemo(() => {
        const hasBaseInfo = productName.trim() !== '';
        if (!hasBaseInfo) return false;
        
        if (hasVariants) {
            if (variants.length === 0) return false;
            if (variants.some(v => !v.name || !v.price || !v.quantity)) return false;
        } else {
            if (!sellingPrice || !initialQuantity || (costPrice === '' && !isManufactured)) return false;
            if(isManufactured && totalIngredientCost === 0) return false;
        }

        if (isListedOnMarket) {
            if (!isBusinessVerified) return false;
            if (!deliverySettingsConfigured) return false;
            return images.length > 0 && productDescription && productCategory;
        }
        return true;
    }, [productName, sellingPrice, initialQuantity, costPrice, hasVariants, variants, isManufactured, totalIngredientCost, isListedOnMarket, images, productDescription, productCategory, deliverySettingsConfigured, isBusinessVerified]);

    const handleSaveProduct = async () => {
        if (!canSaveProduct || !firestore || !businessId || !businessData) return;

        setIsLoading(true);

        const productPayload = {
            name: productName,
            price: hasVariants ? (variants.length > 0 ? parseFloat(variants[0].price) : 0) : parseFloat(sellingPrice),
            oldPrice: parseFloat(oldPrice) || null,
            cost: hasVariants ? 0 : finalCostPrice,
            quantity: hasVariants ? totalInitialQuantity : parseInt(initialQuantity),
            hasVariants,
            variants: hasVariants ? variants.map(v => ({
                id: v.id,
                name: v.name,
                price: parseFloat(v.price),
                cost: parseFloat(v.cost) || 0,
                quantity: parseInt(v.quantity)
            })) : [],
            isPublishedToMarket: isListedOnMarket,
            description: productDescription,
            category: productCategory,
            images: images,
            hint: productCategory || productName.split(' ').slice(0, 2).join(' '),
        };

        try {
            if (isEditMode && productId) {
                const docRef = doc(firestore, `businesses/${businessId}/products`, productId);
                const updatedProductData = {
                    ...productPayload,
                    updatedAt: serverTimestamp(),
                };
                updateDocumentNonBlocking(docRef, updatedProductData);
                
                const marketProductRef = doc(firestore, 'marketProducts', productId);
                if (isListedOnMarket && images.length > 0 && deliverySettingsConfigured && isBusinessVerified) {
                    setDocumentNonBlocking(marketProductRef, {
                        ...updatedProductData,
                        productId: productId,
                        businessId: businessId,
                        businessName: businessData.businessName,
                        availableQuantity: productPayload.quantity,
                        variants: productPayload.variants.map(v => ({
                            id: v.id, name: v.name, price: v.price, availableQuantity: v.quantity
                        })),
                        country: businessData.country,
                        currency: businessData.currency,
                        deliveryTargets: businessData.deliveryTargets || [],
                    }, { merge: true });
                } else {
                    deleteDocumentNonBlocking(marketProductRef);
                }
                toast({ title: 'Product Updated!', description: `${productName} has been updated.` });
            } else {
                const newProductData = { ...productPayload, createdAt: serverTimestamp() };
                const newProductRef = await addDocumentNonBlocking(collection(firestore, `businesses/${businessId}/products`), newProductData);
                
                if (isListedOnMarket && images.length > 0 && deliverySettingsConfigured && isBusinessVerified) {
                    const marketProductData = {
                        productId: newProductRef.id,
                        businessId: businessId,
                        businessName: businessData.businessName,
                        productName: newProductData.name,
                        price: newProductData.price,
                        oldPrice: newProductData.oldPrice,
                        description: newProductData.description,
                        category: newProductData.category,
                        availableQuantity: newProductData.quantity,
                        createdAt: new Date(),
                        images: images,
                        hint: newProductData.hint,
                        hasVariants: newProductData.hasVariants,
                        variants: newProductData.variants.map(v => ({
                            id: v.id, name: v.name, price: v.price, availableQuantity: v.quantity
                        })),
                        country: businessData.country,
                        currency: businessData.currency,
                        deliveryTargets: businessData.deliveryTargets || [],
                    };
                    setDocumentNonBlocking(doc(collection(firestore, 'marketProducts'), newProductRef.id), marketProductData, {});
                }
                toast({ title: 'Product Added!', description: `${productName} has been added.` });
            }
            router.back();
        } catch (error) {
            console.error("Error saving product: ", error);
            toast({ variant: 'destructive', title: 'Error saving product', description: 'There was an issue saving your product. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingProduct || isLoadingVerification) {
        return (
            <MainLayout title="Loading Product..." backHref="/owner/market">
                <div className="w-full max-w-md space-y-6">
                    <Card><CardContent className="p-6"><Loader2 className="mx-auto animate-spin" /></CardContent></Card>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title={isEditMode ? "Edit Product" : "Add New Product"} backHref="/owner/market">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{isEditMode ? "Edit Product" : "New Product"}</CardTitle>
                        <CardDescription>{isEditMode ? "Update the details for this product." : "Add a new product to your inventory."}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="product-name">Product Name</Label>
                            <Input id="product-name" placeholder="e.g., Bottled Water" className="h-12 text-base" value={productName} onChange={e => setProductName(e.target.value)} disabled={isLoading} />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch id="variants-mode" checked={hasVariants} onCheckedChange={setHasVariants} disabled={isLoading || isManufactured}/>
                            <Label htmlFor="variants-mode">This product has multiple variants (e.g., sizes, colors)</Label>
                        </div>
                        
                        {!hasVariants && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="selling-price">Selling Price</Label>
                                        <Input id="selling-price" type="number" placeholder="0.00" className="h-12 text-base" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} disabled={isLoading} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="old-price">Old Price (Optional)</Label>
                                        <Input id="old-price" type="number" placeholder="0.00" className="h-12 text-base" value={oldPrice} onChange={e => setOldPrice(e.target.value)} disabled={isLoading} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="cost-price">Production/Cost Price</Label>
                                        <Input 
                                            id="cost-price" 
                                            type="number" 
                                            placeholder="0.00" 
                                            className="h-12 text-base" 
                                            value={isManufactured ? totalIngredientCost.toFixed(2) : costPrice}
                                            onChange={e => !isManufactured && setCostPrice(e.target.value)}
                                            readOnly={isManufactured}
                                            disabled={isLoading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">Initial Quantity</Label>
                                        <Input id="quantity" type="number" placeholder="0" className="h-12 text-base" value={initialQuantity} onChange={e => setInitialQuantity(e.target.value)} disabled={isLoading}/>
                                    </div>
                                </div>
                                {canManufacture && (
                                    <div className="flex items-center space-x-2">
                                        <Switch id="manufacturing-mode" checked={isManufactured} onCheckedChange={setIsManufactured} disabled={isLoading || hasVariants}/>
                                        <Label htmlFor="manufacturing-mode">This is a manufactured product</Label>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {hasVariants && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Variants</CardTitle>
                            <CardDescription>Add each variant with its own price, cost, and quantity. The first variant's price will be shown as the default.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {variants.length > 0 && (
                                <div className="space-y-2">
                                    {variants.map((variant) => (
                                        <div key={variant.id} className="flex items-center gap-2 p-2 rounded-md border text-sm">
                                            <div className="flex-1">
                                                <p className="font-medium">{variant.name}</p>
                                                <p className="text-muted-foreground">
                                                    Price: {formatCurrency(parseFloat(variant.price), businessData?.country)} | Qty: {variant.quantity}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(variant)} disabled={isLoading}>
                                                <FileEdit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveVariant(variant.id)} disabled={isLoading}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Separator />
                            <div className="space-y-2">
                                <Label>{editingVariant ? 'Edit Variant' : 'Add Variant'}</Label>
                                <div className="space-y-2 rounded-md border p-3">
                                    <Input placeholder="Variant name (e.g., Small, Blue)" value={newVariantName} onChange={e => setNewVariantName(e.target.value)} disabled={isLoading} />
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input type="number" placeholder="Price" value={newVariantPrice} onChange={e => setNewVariantPrice(e.target.value)} disabled={isLoading} />
                                        <Input type="number" placeholder="Cost (opt.)" value={newVariantCost} onChange={e => setNewVariantCost(e.target.value)} disabled={isLoading} />
                                        <Input type="number" placeholder="Quantity" value={newVariantQuantity} onChange={e => setNewVariantQuantity(e.target.value)} disabled={isLoading} />
                                    </div>
                                    {editingVariant ? (
                                        <div className="flex gap-2">
                                            <Button size="sm" className="w-full" onClick={handleUpdateVariant} disabled={!newVariantName || !newVariantPrice || !newVariantQuantity || isLoading}>
                                                <Check className="mr-2 h-4 w-4" /> Update Variant
                                            </Button>
                                            <Button size="sm" variant="outline" className="w-full" onClick={handleCancelEdit} disabled={isLoading}>
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button size="sm" className="w-full" onClick={handleAddVariant} disabled={!newVariantName || !newVariantPrice || !newVariantQuantity || isLoading}>
                                            <Plus className="mr-2 h-4 w-4" /> Add Variant
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {isManufactured && canManufacture && (
                     <Card>
                        <CardHeader>
                            <CardTitle>Ingredients</CardTitle>
                            <CardDescription>Add the raw materials used to make this product. The total cost will be your production price.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ingredients.length > 0 && (
                                <div className="space-y-2">
                                    {ingredients.map((ing, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 rounded-md border">
                                            <span className="flex-1 font-medium">{ing.name}</span>
                                            <span className="text-muted-foreground">{formatCurrency(parseFloat(ing.cost), businessData?.country)}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveIngredient(index)} disabled={isLoading}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Separator />

                            <div className="space-y-2">
                                <Label>Add Ingredient</Label>
                                <div className="flex items-end gap-2">
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="ing-name" className="text-xs text-muted-foreground">Name</Label>
                                        <Input id="ing-name" placeholder="e.g., Flour" value={newIngredientName} onChange={e => setNewIngredientName(e.target.value)} disabled={isLoading}/>
                                    </div>
                                    <div className="w-28 space-y-1">
                                        <Label htmlFor="ing-cost" className="text-xs text-muted-foreground">Cost</Label>
                                        <Input id="ing-cost" type="number" placeholder="100" value={newIngredientCost} onChange={e => setNewIngredientCost(e.target.value)} disabled={isLoading}/>
                                    </div>
                                    <Button size="icon" onClick={handleAddIngredient} disabled={!newIngredientName || !newIngredientCost || isLoading}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                 <Card>
                    <CardHeader>
                        <CardTitle>Busmo Market</CardTitle>
                        <CardDescription>List this product on the public marketplace.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <Switch id="market-listing" checked={isListedOnMarket} onCheckedChange={setIsListedOnMarket} disabled={isLoading} />
                            <Label htmlFor="market-listing">List this product on Busmo Market</Label>
                        </div>
                        
                        {isListedOnMarket && !isBusinessVerified && (
                             <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Business Verification Required</AlertTitle>
                                <AlertDescription>
                                    You must verify your business to list products.
                                    <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/owner/market?section=verification">Go to Verification</Link></Button>
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        {!deliverySettingsConfigured && isListedOnMarket && (
                            <Alert variant="destructive">
                                <AlertTitle>Delivery Settings Required</AlertTitle>
                                <AlertDescription>
                                    You must configure your delivery settings before you can list products on the market.
                                    <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/owner/market?section=settings">Go to Settings</Link></Button>
                                </AlertDescription>
                            </Alert>
                        )}


                        {isListedOnMarket && (
                            <>
                                <div className="space-y-2">
                                    <Label>Product Images</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {images.map((url, index) => (
                                            <div key={index} className="relative aspect-square">
                                                <Image src={url} alt={`Product image ${index + 1}`} fill className="object-cover rounded-md border" />
                                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => handleRemoveImage(index)} disabled={isLoading}><X className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                        <Label htmlFor="image-upload" className={cn("flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-background text-muted-foreground hover:border-primary hover:text-primary", isLoading && "cursor-not-allowed opacity-50")}>
                                            <FileUp className="h-8 w-8" />
                                            <span>Upload</span>
                                        </Label>
                                    </div>
                                    <Input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isLoading} multiple />
                                    <p className="text-xs text-muted-foreground">You must provide at least one image to list on the market.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-description">Product Description</Label>
                                    <Textarea id="product-description" placeholder="Describe your product for customers..." value={productDescription} onChange={e => setProductDescription(e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-category">Product Category</Label>
                                    <Select onValueChange={setProductCategory} value={productCategory} disabled={isLoading || isLoadingCategories}>
                                        <SelectTrigger id="product-category">
                                            <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoriesData?.map(cat => (
                                                <SelectItem key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</SelectItem>
                                            ))}
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>


                <Button className="w-full h-14 text-lg" disabled={!canSaveProduct || isLoading || isLoadingVerification} onClick={handleSaveProduct}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? "Update Product" : "Add Product"}
                </Button>
            </div>
        </MainLayout>
    );
}

const AddProductPageSkeleton = () => (
    <MainLayout title="Loading..." backHref="/owner/market">
        <div className="w-full max-w-md space-y-6">
            <Card><CardContent className="p-6 flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>
        </div>
    </MainLayout>
);

export default function AddProductPage() {
  return (
    <Suspense fallback={<AddProductPageSkeleton />}>
      <AddProductPageContent />
    </Suspense>
  )
}
