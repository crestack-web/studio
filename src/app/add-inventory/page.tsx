'use client';
import { useState } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { collection, doc, query, updateDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


interface AppUser {
    businessId?: string;
}

interface Product {
    id: string;
    name: string;
    quantity: number;
}

export default function AddInventoryPage() {
    const { toast } = useToast();
    const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
    const [quantityAdded, setQuantityAdded] = useState('');
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

    const handleUpdateInventory = async () => {
        if (!selectedProductId || !quantityAdded || parseInt(quantityAdded) <= 0 || !firestore || !businessId) {
            toast({
                variant: 'destructive',
                title: 'Invalid Input',
                description: 'Please select a product and enter a valid quantity.',
            });
            return;
        }

        setIsLoading(true);
        const selectedProduct = productsData?.find(p => p.id === selectedProductId);

        if (selectedProduct) {
            const productRef = doc(firestore, `businesses/${businessId}/products`, selectedProductId);
            const newQuantity = (selectedProduct.quantity || 0) + parseInt(quantityAdded);
            
            updateDocumentNonBlocking(productRef, { quantity: newQuantity });
            
            toast({
                title: 'Inventory Updated',
                description: `Added ${quantityAdded} to ${selectedProduct?.name}.`,
            });
            setSelectedProductId(undefined);
            setQuantityAdded('');
        } else {
             toast({
                variant: 'destructive',
                title: 'Product not found',
                description: 'Could not update inventory for the selected product.',
            });
        }
        setIsLoading(false);
    };

    return (
        <MainLayout title="Add Inventory" backHref="/owner/home">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Add to Inventory</CardTitle>
                        <CardDescription>Update stock levels for your products.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="space-y-2">
                            <Label htmlFor="product">Product</Label>
                            <Select 
                                value={selectedProductId} 
                                onValueChange={setSelectedProductId} 
                                disabled={isLoadingProducts || isLoading}
                            >
                                <SelectTrigger id="product" className="h-12 text-base">
                                    <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select a product"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {productsData?.map((product) => (
                                         <SelectItem key={product.id} value={product.id}>
                                            {product.name} (Stock: {product.quantity})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="text-right">
                                <Link href="/add-product" passHref>
                                     <Button variant="link" className="text-sm">
                                        Or add a new product
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity Added</Label>
                            <Input 
                                id="quantity" 
                                type="number" 
                                placeholder="0" 
                                className="h-12 text-base" 
                                value={quantityAdded}
                                onChange={(e) => setQuantityAdded(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg" onClick={handleUpdateInventory} disabled={isLoading || !selectedProductId || !quantityAdded}>
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Inventory
                </Button>
            </div>
        </MainLayout>
    );
}
