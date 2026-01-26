'use client';
import { useState, useMemo, useEffect, ChangeEvent } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Loader2, FileUp, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

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

interface AppUser {
    businessId?: string;
}

interface Business {
    businessName: string;
    plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
    currency?: string;
    country?: string;
    deliveryType?: 'nationwide' | 'cities';
    deliveryCities?: string[];
}

export default function AddProductPage() {
    const { toast } = useToast();
    const router = useRouter();
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

    const canManufacture = businessData?.plan === 'company';
    const deliverySettingsConfigured = !!businessData?.deliveryType;


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
    
    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            if (file.size > 500 * 1024) {
                toast({
                    variant: 'destructive',
                    title: 'Image too large',
                    description: `${file.name} is larger than 500KB.`,
                });
                continue;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
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
    
    const finalCostPrice = isManufactured ? totalIngredientCost : parseFloat(costPrice) || 0;
    
    const totalInitialQuantity = useMemo(() => {
        if (!hasVariants) return parseInt(initialQuantity) || 0;
        return variants.reduce((total, v) => total + (parseInt(v.quantity) || 0), 0);
    }, [hasVariants, initialQuantity, variants]);

    const canAddProduct = useMemo(() => {
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
            if (!deliverySettingsConfigured) return false;
            return images.length > 0 && productDescription && productCategory;
        }
        return true;
    }, [productName, sellingPrice, initialQuantity, costPrice, hasVariants, variants, isManufactured, totalIngredientCost, isListedOnMarket, images, productDescription, productCategory, deliverySettingsConfigured]);

    const handleAddProduct = async () => {
        if (!canAddProduct || !firestore || !businessId || !businessData) return;

        setIsLoading(true);

        const productData = {
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
            createdAt: serverTimestamp(),
            images: images,
            hint: productCategory || productName.split(' ').slice(0, 2).join(' '),
        };

        const productsCollectionRef = collection(firestore, `businesses/${businessId}/products`);
        
        try {
            const newProductRef = await addDocumentNonBlocking(productsCollectionRef, productData);
            
            if (isListedOnMarket && images.length > 0 && deliverySettingsConfigured) {
                const marketProductData = {
                    productId: newProductRef.id,
                    businessId: businessId,
                    businessName: businessData.businessName,
                    productName: productData.name,
                    price: productData.price,
                    oldPrice: productData.oldPrice,
                    description: productData.description,
                    category: productData.category,
                    availableQuantity: productData.quantity,
                    createdAt: new Date(),
                    images: images,
                    hint: productData.hint,
                    hasVariants: productData.hasVariants,
                    variants: productData.variants.map(v => ({
                        id: v.id,
                        name: v.name,
                        price: v.price,
                        availableQuantity: v.quantity
                    })),
                    // Denormalize market data
                    country: businessData.country,
                    deliveryType: businessData.deliveryType,
                    deliveryCities: businessData.deliveryCities || [],
                };
                const marketProductsCollectionRef = collection(firestore, 'marketProducts');
                setDocumentNonBlocking(doc(marketProductsCollectionRef, newProductRef.id), marketProductData, {});
            }

            toast({
                title: 'Product Added!',
                description: `${productName} has been added to your inventory.`,
            });
            router.back();
        } catch (error) {
            console.error("Error adding product: ", error);
            toast({
                variant: 'destructive',
                title: 'Error adding product',
                description: 'There was an issue saving your product. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <MainLayout title="Add New Product" backHref="/owner/market">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>New Product</CardTitle>
                        <CardDescription>Add a new product to your inventory.</CardDescription>
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
                                                    Price: {formatCurrency(parseFloat(variant.price), businessData?.currency)} | Qty: {variant.quantity}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveVariant(variant.id)} disabled={isLoading}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Separator />
                            <div className="space-y-2">
                                <Label>Add Variant</Label>
                                <div className="space-y-2 rounded-md border p-3">
                                    <Input placeholder="Variant name (e.g., Small, Blue)" value={newVariantName} onChange={e => setNewVariantName(e.target.value)} disabled={isLoading} />
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input type="number" placeholder="Price" value={newVariantPrice} onChange={e => setNewVariantPrice(e.target.value)} disabled={isLoading} />
                                        <Input type="number" placeholder="Cost (opt.)" value={newVariantCost} onChange={e => setNewVariantCost(e.target.value)} disabled={isLoading} />
                                        <Input type="number" placeholder="Quantity" value={newVariantQuantity} onChange={e => setNewVariantQuantity(e.target.value)} disabled={isLoading} />
                                    </div>
                                    <Button size="sm" className="w-full" onClick={handleAddVariant} disabled={!newVariantName || !newVariantPrice || !newVariantQuantity || isLoading}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Variant
                                    </Button>
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
                                            <span className="text-muted-foreground">{formatCurrency(parseFloat(ing.cost), businessData?.currency)}</span>
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
                        
                        {!deliverySettingsConfigured && isListedOnMarket && (
                            <Alert variant="destructive">
                                <AlertTitle>Delivery Settings Required</AlertTitle>
                                <AlertDescription>
                                    You must configure your delivery settings before you can list products on the market.
                                    <Button asChild variant="link" className="p-0 h-auto ml-1"><Link href="/owner/market">Go to Settings</Link></Button>
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
                                    <p className="text-xs text-muted-foreground">You must provide at least one image to list on the market. Max file size: 500KB.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-description">Product Description</Label>
                                    <Textarea id="product-description" placeholder="Describe your product for customers..." value={productDescription} onChange={e => setProductDescription(e.target.value)} disabled={isLoading} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-category">Product Category</Label>
                                    <Select onValueChange={setProductCategory} value={productCategory} disabled={isLoading}>
                                        <SelectTrigger id="product-category">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="food">Food &amp; Groceries</SelectItem>
                                            <SelectItem value="fashion">Fashion &amp; Apparel</SelectItem>
                                            <SelectItem value="electronics">Electronics</SelectItem>
                                            <SelectItem value="health">Health &amp; Beauty</SelectItem>
                                            <SelectItem value="home">Home &amp; Garden</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>


                <Button className="w-full h-14 text-lg" disabled={!canAddProduct || isLoading} onClick={handleAddProduct}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Product
                </Button>
            </div>
        </MainLayout>
    );
}

    