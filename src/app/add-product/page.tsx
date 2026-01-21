'use client';
import { useState, useMemo, useEffect, ChangeEvent } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Loader2, FileUp } from 'lucide-react';
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

interface Ingredient {
    name: string;
    cost: string;
}

interface AppUser {
    businessId?: string;
}

interface Business {
    businessName: string;
    plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
    currency?: string;
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
    
    const [imageUrl, setImageUrl] = useState('');

    const [productName, setProductName] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');
    const [initialQuantity, setInitialQuantity] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productCategory, setProductCategory] = useState('');

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

    useEffect(() => {
        if (!canManufacture) {
            setIsManufactured(false);
        }
    }, [canManufacture]);

    const totalIngredientCost = useMemo(() => {
        return ingredients.reduce((total, ing) => total + (parseFloat(ing.cost) || 0), 0);
    }, [ingredients]);
    
    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit file size to 500KB to avoid exceeding Firestore document limits
        if (file.size > 500 * 1024) {
            toast({
                variant: 'destructive',
                title: 'Image too large',
                description: 'Please upload an image smaller than 500KB.',
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

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
    
    const finalCostPrice = isManufactured ? totalIngredientCost : parseFloat(costPrice) || 0;

    const canAddProduct = useMemo(() => {
        const hasBaseInfo = productName && sellingPrice && initialQuantity && (isManufactured ? totalIngredientCost > 0 : costPrice);
        if (isListedOnMarket) {
            return hasBaseInfo && imageUrl && productDescription && productCategory;
        }
        return hasBaseInfo;
    }, [productName, sellingPrice, initialQuantity, isManufactured, costPrice, totalIngredientCost, isListedOnMarket, imageUrl, productDescription, productCategory]);

    const handleAddProduct = async () => {
        if (!canAddProduct || !firestore || !businessId || !businessData) return;

        setIsLoading(true);

        const productData = {
            name: productName,
            price: parseFloat(sellingPrice),
            cost: finalCostPrice,
            quantity: parseInt(initialQuantity),
            isPublishedToMarket: isListedOnMarket,
            description: productDescription,
            category: productCategory,
            createdAt: serverTimestamp(),
            image: imageUrl || null,
            hint: productCategory || productName.split(' ').slice(0, 2).join(' '),
        };

        const productsCollectionRef = collection(firestore, `businesses/${businessId}/products`);
        
        try {
            const newProductRef = await addDocumentNonBlocking(productsCollectionRef, productData);
            
            if (isListedOnMarket && imageUrl) {
                const marketProductData = {
                    productId: newProductRef.id,
                    businessId: businessId,
                    businessName: businessData.businessName,
                    productName: productData.name,
                    price: productData.price,
                    description: productData.description,
                    category: productData.category,
                    availableQuantity: productData.quantity,
                    createdAt: new Date(),
                    image: imageUrl,
                    hint: productCategory || productName.split(' ').slice(0, 2).join(' '),
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
        <MainLayout title="Add New Product" backHref="/add-inventory">
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
                                <Label htmlFor="selling-price">Selling Price</Label>
                                <Input id="selling-price" type="number" placeholder="0.00" className="h-12 text-base" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} disabled={isLoading} />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="quantity">Initial Quantity</Label>
                            <Input id="quantity" type="number" placeholder="0" className="h-12 text-base" value={initialQuantity} onChange={e => setInitialQuantity(e.target.value)} disabled={isLoading}/>
                        </div>
                         {canManufacture && (
                            <div className="flex items-center space-x-2">
                                <Switch id="manufacturing-mode" checked={isManufactured} onCheckedChange={setIsManufactured} disabled={isLoading}/>
                                <Label htmlFor="manufacturing-mode">This is a manufactured product</Label>
                            </div>
                         )}
                    </CardContent>
                </Card>

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

                        {isListedOnMarket && (
                            <>
                                <div className="space-y-2">
                                    <Label>Product Image</Label>
                                    <Input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={isLoading}
                                    />
                                    <Label
                                        htmlFor="image-upload"
                                        className={cn(
                                            "flex h-32 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-input bg-background text-muted-foreground hover:border-primary hover:text-primary",
                                            isLoading && "cursor-not-allowed opacity-50"
                                        )}
                                    >
                                        {imageUrl ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={imageUrl}
                                                    alt="Product image preview"
                                                    fill
                                                    className="object-contain p-2"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <FileUp className="h-8 w-8" />
                                                <span>Click to upload image</span>
                                            </div>
                                        )}
                                    </Label>
                                    {imageUrl && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => setImageUrl('')}
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove Image
                                        </Button>
                                    )}
                                    <p className="text-xs text-muted-foreground">You must provide an image to list on the market. Max file size: 500KB.</p>
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
