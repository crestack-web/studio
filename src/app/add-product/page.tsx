'use client';
import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Upload, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface Ingredient {
    name: string;
    cost: string;
}

interface AppUser {
    businessId?: string;
}

interface Business {
    plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
}

export default function AddProductPage() {
    const [isManufactured, setIsManufactured] = useState(false);
    const [isListedOnMarket, setIsListedOnMarket] = useState(false);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [newIngredientName, setNewIngredientName] = useState('');
    const [newIngredientCost, setNewIngredientCost] = useState('');
    const [images, setImages] = useState<File[]>([]);
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
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businesses', businessId);
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

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newImages = Array.from(event.target.files);
            setImages(prev => [...prev, ...newImages].slice(0, 4));
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const canAddProduct = useMemo(() => {
        const hasBaseInfo = productName && sellingPrice && initialQuantity && (isManufactured || costPrice);
        if (isListedOnMarket) {
            return hasBaseInfo && images.length > 0 && productDescription && productCategory;
        }
        return hasBaseInfo;
    }, [productName, sellingPrice, initialQuantity, isManufactured, costPrice, isListedOnMarket, images, productDescription, productCategory]);


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
                            <Input id="product-name" placeholder="e.g., Bottled Water" className="h-12 text-base" value={productName} onChange={e => setProductName(e.target.value)} />
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="selling-price">Selling Price</Label>
                                <Input id="selling-price" type="number" placeholder="0.00" className="h-12 text-base" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="quantity">Initial Quantity</Label>
                            <Input id="quantity" type="number" placeholder="0" className="h-12 text-base" value={initialQuantity} onChange={e => setInitialQuantity(e.target.value)}/>
                        </div>
                         {canManufacture && (
                            <div className="flex items-center space-x-2">
                                <Switch id="manufacturing-mode" checked={isManufactured} onCheckedChange={setIsManufactured} />
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
                                            <span className="text-muted-foreground">₦{parseFloat(ing.cost).toLocaleString()}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveIngredient(index)}>
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
                                        <Input id="ing-name" placeholder="e.g., Flour" value={newIngredientName} onChange={e => setNewIngredientName(e.target.value)} />
                                    </div>
                                    <div className="w-28 space-y-1">
                                        <Label htmlFor="ing-cost" className="text-xs text-muted-foreground">Cost</Label>
                                        <Input id="ing-cost" type="number" placeholder="100" value={newIngredientCost} onChange={e => setNewIngredientCost(e.target.value)} />
                                    </div>
                                    <Button size="icon" onClick={handleAddIngredient} disabled={!newIngredientName || !newIngredientCost}>
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
                            <Switch id="market-listing" checked={isListedOnMarket} onCheckedChange={setIsListedOnMarket} />
                            <Label htmlFor="market-listing">List this product on Busmo Market</Label>
                        </div>

                        {isListedOnMarket && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="product-images">Product Images</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {images.map((file, index) => (
                                            <div key={index} className="relative aspect-square">
                                                <Image
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Product image ${index + 1}`}
                                                    layout="fill"
                                                    objectFit="cover"
                                                    className="rounded-md"
                                                />
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                    onClick={() => handleRemoveImage(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {images.length < 4 && (
                                            <Label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-muted">
                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground mt-1 text-center">Upload Image</span>
                                            </Label>
                                        )}
                                    </div>
                                    <Input id="image-upload" type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                                     <p className="text-xs text-muted-foreground">You must upload at least one image to list on the market.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-description">Product Description</Label>
                                    <Textarea id="product-description" placeholder="Describe your product for customers..." value={productDescription} onChange={e => setProductDescription(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="product-category">Product Category</Label>
                                    <Select onValueChange={setProductCategory} value={productCategory}>
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


                <Button className="w-full h-14 text-lg" disabled={!canAddProduct}>Add Product</Button>
            </div>
        </MainLayout>
    );
}

    