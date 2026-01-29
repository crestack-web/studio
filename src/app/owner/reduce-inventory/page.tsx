
'use client';
import { useState, useMemo } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { collection, doc, query, updateDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


interface AppUser {
    businessId?: string;
}

interface Variant {
    id: string;
    name: string;
    quantity: number;
}

interface Product {
    id: string;
    name: string;
    quantity: number;
    hasVariants?: boolean;
    variants?: Variant[];
}

export default function ReduceInventoryPage() {
    const { toast } = useToast();
    const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
    const [quantityReduced, setQuantityReduced] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, `users/${authUser.uid}`);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, `businesses/${businessId}/products`));
    }, [firestore, businessId]);
    const { data: productsData, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);
    
    const selectedProduct = productsData?.find(p => p.id === selectedProductId);

    const handleProductChange = (productId: string) => {
        setSelectedProductId(productId);
        setSelectedVariantId(undefined);
    };

    const handleUpdateInventory = async () => {
        if (!selectedProductId || !quantityReduced || parseInt(quantityReduced) <= 0 || !firestore || !businessId || !selectedProduct) {
            toast({
                variant: 'destructive',
                title: 'Invalid Input',
                description: 'Please select a product and enter a valid quantity to reduce.',
            });
            return;
        }
        
        const quantityToReduce = parseInt(quantityReduced);

        setIsLoading(true);
        const productRef = doc(firestore, `businesses/${businessId}/products`, selectedProductId);
        
        if (selectedProduct.hasVariants) {
            const selectedVariant = selectedProduct.variants?.find(v => v.id === selectedVariantId);
            if (!selectedVariant) {
                toast({ variant: 'destructive', title: 'Invalid Input', description: 'Please select a variant.' });
                setIsLoading(false);
                return;
            }

            if (quantityToReduce > (selectedVariant.quantity || 0)) {
                 toast({ variant: 'destructive', title: 'Invalid Quantity', description: `You cannot reduce more than the available stock of ${selectedVariant.quantity}.` });
                 setIsLoading(false);
                 return;
            }

            const newVariants = selectedProduct.variants?.map(v => 
                v.id === selectedVariantId 
                ? { ...v, quantity: (v.quantity || 0) - quantityToReduce }
                : v
            ) || [];

            updateDocumentNonBlocking(productRef, { variants: newVariants });
            toast({ title: 'Inventory Updated', description: `Reduced ${quantityReduced} from ${selectedProduct.name} (${selectedVariant.name}).` });
            
        } else {
             if (quantityToReduce > (selectedProduct.quantity || 0)) {
                 toast({ variant: 'destructive', title: 'Invalid Quantity', description: `You cannot reduce more than the available stock of ${selectedProduct.quantity}.` });
                 setIsLoading(false);
                 return;
            }

            const newQuantity = (selectedProduct.quantity || 0) - quantityToReduce;
            updateDocumentNonBlocking(productRef, { quantity: newQuantity });
            toast({ title: 'Inventory Updated', description: `Reduced ${quantityReduced} from ${selectedProduct.name}.` });
        }
        
        setSelectedProductId(undefined);
        setSelectedVariantId(undefined);
        setQuantityReduced('');
        setIsLoading(false);
    };
    
    const canUpdate = useMemo(() => {
        if (!selectedProduct || !quantityReduced) return false;
        if (selectedProduct.hasVariants && !selectedVariantId) return false;
        return true;
    }, [selectedProduct, quantityReduced, selectedVariantId]);

    return (
        <MainLayout title="Reduce Inventory" backHref="/owner/home">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Reduce Inventory</CardTitle>
                        <CardDescription>Reduce stock levels for reasons like spoilage, damage, or internal use.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="space-y-2">
                            <Label htmlFor="product">Product</Label>
                            <Select 
                                value={selectedProductId} 
                                onValueChange={handleProductChange} 
                                disabled={isLoadingProducts || isLoading}
                            >
                                <SelectTrigger id="product" className="h-12 text-base">
                                    <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select a product"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {productsData?.map((product) => (
                                         <SelectItem key={product.id} value={product.id}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedProduct?.hasVariants && (
                            <div className="space-y-2">
                                <Label htmlFor="variant">Variant</Label>
                                <Select 
                                    value={selectedVariantId} 
                                    onValueChange={setSelectedVariantId} 
                                    disabled={!selectedProduct || isLoading}
                                >
                                    <SelectTrigger id="variant" className="h-12 text-base">
                                        <SelectValue placeholder="Select a variant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedProduct.variants?.map((variant) => (
                                            <SelectItem key={variant.id} value={variant.id}>
                                                {variant.name} (Stock: {variant.quantity})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity to Reduce</Label>
                            <Input 
                                id="quantity" 
                                type="number" 
                                placeholder="0" 
                                className="h-12 text-base" 
                                value={quantityReduced}
                                onChange={(e) => setQuantityReduced(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg" onClick={handleUpdateInventory} disabled={isLoading || !canUpdate}>
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reduce Inventory
                </Button>
            </div>
        </MainLayout>
    );
}
