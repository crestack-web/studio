'use client';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/app/main-layout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, serverTimestamp } from 'firebase/firestore';
import { formatCurrency } from '@/lib/currency';

interface AppUser {
    businessId?: string;
}

interface Variant {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    quantity: number;
    hasVariants?: boolean;
    variants?: Variant[];
}

interface Business {
    currency: string;
}


export default function RecordSalePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [paymentType, setPaymentType] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);

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

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return query(collection(firestore, `businesses/${businessId}/products`));
  }, [firestore, businessId]);
  const { data: productsData, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const selectedProduct = productsData?.find(p => p.id === selectedProductId);

  const selectedVariant = useMemo(() => {
    if (!selectedProduct?.hasVariants || !selectedVariantId) return undefined;
    return selectedProduct.variants?.find(v => v.id === selectedVariantId);
  }, [selectedProduct, selectedVariantId]);

  const totalAmount = useMemo(() => {
    if (!selectedProduct) return 0;
    const price = selectedProduct.hasVariants ? selectedVariant?.price : selectedProduct.price;
    return (price || 0) * quantity;
  }, [selectedProduct, selectedVariant, quantity]);

  const stockAvailable = useMemo(() => {
    if (!selectedProduct) return 0;
    const stock = selectedProduct.hasVariants ? selectedVariant?.quantity : selectedProduct.quantity;
    return stock || 0;
  }, [selectedProduct, selectedVariant]);
  
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedVariantId(undefined); // Reset variant when product changes
    const product = productsData?.find(p => p.id === productId);
    if (product?.hasVariants && product.variants && product.variants.length > 0) {
        setSelectedVariantId(product.variants[0].id);
    }
  };

  const handleConfirmSale = async () => {
    if (!firestore || !businessId || !selectedProduct || quantity <= 0) {
        toast({
            variant: 'destructive',
            title: 'Invalid Sale',
            description: 'Please select a product and enter a valid quantity.',
        });
        return;
    }
    
    if (selectedProduct.hasVariants && !selectedVariant) {
        toast({ variant: 'destructive', title: 'Invalid Sale', description: 'Please select a product variant.' });
        return;
    }
    
    if (quantity > stockAvailable) {
         toast({
            variant: 'destructive',
            title: 'Not enough stock',
            description: `You only have ${stockAvailable} units of ${selectedProduct.name} ${selectedVariant?.name || ''} left.`,
        });
        return;
    }

    setIsLoading(true);

    const saleData = {
        businessId,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        variantId: selectedVariant?.id || null,
        variantName: selectedVariant?.name || null,
        amount: totalAmount,
        quantity,
        paymentType,
        source: 'pos', // Point of Sale
        timestamp: serverTimestamp(),
    };

    const salesCollectionRef = collection(firestore, `businesses/${businessId}/sales`);
    
    try {
        addDocumentNonBlocking(salesCollectionRef, saleData);

        toast({
          title: "Sale Recorded",
          description: `Sold ${quantity} of ${selectedProduct.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}. Inventory will be updated shortly.`,
        });
        router.back();
    } catch (error) {
        console.error("Error recording sale:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not record sale. Please try again.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <MainLayout title="Record Sale">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>New Sale</CardTitle>
            <CardDescription>Select a product from your inventory to record a sale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select onValueChange={handleProductChange} value={selectedProductId} disabled={isLoadingProducts || isLoading}>
                <SelectTrigger id="product" className="h-12 text-base">
                  <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select a product"} />
                </SelectTrigger>
                <SelectContent>
                  {productsData?.map(product => (
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
                <Select onValueChange={setSelectedVariantId} value={selectedVariantId} disabled={!selectedProduct || isLoading}>
                  <SelectTrigger id="variant" className="h-12 text-base">
                    <SelectValue placeholder="Select a variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProduct.variants?.map(variant => (
                      <SelectItem key={variant.id} value={variant.id} disabled={variant.quantity <= 0}>
                        {variant.name} (Stock: {variant.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                        id="quantity" 
                        type="number" 
                        placeholder="1" 
                        className="h-12 text-base" 
                        value={quantity}
                        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        max={stockAvailable}
                        disabled={!selectedProduct || isLoading}
                    />
                </div>
                <div className="text-right">
                    <Label>Total Amount</Label>
                    <div className="font-bold text-3xl h-12 flex items-center justify-end">
                        {formatCurrency(totalAmount, businessData?.currency)}
                    </div>
                </div>
            </div>
            
            <div className="space-y-3">
              <Label>Payment Type</Label>
              <RadioGroup defaultValue="cash" onValueChange={setPaymentType} className="grid grid-cols-3 gap-2">
                <div>
                  <RadioGroupItem value="cash" id="cash" className="peer sr-only" disabled={isLoading} />
                  <Label htmlFor="cash" className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Cash
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="transfer" id="transfer" className="peer sr-only" disabled={isLoading} />
                  <Label htmlFor="transfer" className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Transfer
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pos" id="pos" className="peer sr-only" disabled={isLoading} />
                  <Label htmlFor="pos" className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    POS
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
        
        <Button onClick={handleConfirmSale} className="w-full h-16 text-xl bg-accent text-accent-foreground hover:bg-accent/90" disabled={!selectedProduct || quantity > stockAvailable || isLoading || (selectedProduct.hasVariants && !selectedVariant)}>
          {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Check className="mr-2 h-6 w-6" />}
          {isLoading ? 'Recording...' : 'Confirm Sale'}
        </Button>
      </div>
    </MainLayout>
  );
}
