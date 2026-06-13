
'use client';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Loader2, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/app/main-layout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { collection, doc, query, serverTimestamp, runTransaction } from 'firebase/firestore';
import { formatCurrency } from '@/lib/currency';

interface AppUser {
    businessId?: string;
}

interface Variant {
    id: string;
    name: string;
    price: number;
    quantity: number;
    cost?: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    cost: number;
    quantity: number;
    hasVariants?: boolean;
    variants?: Variant[];
}

interface Business {
    businessName: string;
    currency?: string;
    country?: string;
}

interface SaleDetails {
    productName: string;
    variantName: string | null;
    quantity: number;
    pricePerItem: number;
    totalAmount: number;
    paymentType: string;
    businessName?: string;
    currency?: string;
    date: Date;
}


export default function RecordSalePage() {
  return (
    <FirebaseClientProvider>
      <RecordSalePageContent />
    </FirebaseClientProvider>
  );
}

function RecordSalePageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [paymentType, setPaymentType] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaleDetails, setLastSaleDetails] = useState<SaleDetails | null>(null);

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
  
  const resetForm = () => {
    setSelectedProductId(undefined);
    setSelectedVariantId(undefined);
    setQuantity(1);
    setPaymentType('cash');
  }

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

    try {
        await runTransaction(firestore, async (transaction) => {
            const productRef = doc(firestore, `businesses/${businessId}/products`, selectedProduct.id);
            const productSnap = await transaction.get(productRef);

            if (!productSnap.exists()) {
                throw new Error("Product not found in inventory.");
            }

            const productData = productSnap.data() as Product;
            
            if (selectedProduct.hasVariants && selectedVariant) {
                const variantIndex = productData.variants?.findIndex(v => v.id === selectedVariant.id);
                if (variantIndex === undefined || variantIndex < 0) {
                     throw new Error("Variant not found.");
                }
                const newVariants = [...(productData.variants || [])];
                newVariants[variantIndex].quantity -= quantity;
                transaction.update(productRef, { variants: newVariants });
            } else {
                const newQuantity = productData.quantity - quantity;
                transaction.update(productRef, { quantity: newQuantity });
            }

            // Now create the sale document
            const salesCollectionRef = collection(firestore, `businesses/${businessId}/sales`);
            const newSaleRef = doc(salesCollectionRef);
            transaction.set(newSaleRef, saleData);
        });

        toast({
          title: "Sale Recorded",
          description: `Sold ${quantity} of ${selectedProduct.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}.`,
        });
        
        setLastSaleDetails({
            productName: selectedProduct.name,
            variantName: selectedVariant?.name || null,
            quantity: quantity,
            pricePerItem: selectedVariant?.price ?? selectedProduct.price,
            totalAmount: totalAmount,
            paymentType: paymentType,
            businessName: businessData?.businessName,
            currency: businessData?.currency || businessData?.country,
            date: new Date(),
        });
    } catch (error: any) {
        console.error("Error recording sale:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Could not record sale. Please try again.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleNewSaleClick = () => {
    setLastSaleDetails(null);
    resetForm();
  };

  return (
    <MainLayout title={lastSaleDetails ? "Sale Recorded" : "Record Sale"}>
        {lastSaleDetails ? (
            <div className="w-full max-w-xs text-center">
                 <Card id="receipt-content" className="p-4 text-left bg-white text-black font-mono text-xs">
                    <div className="text-center space-y-1 mb-4">
                        <h3 className="font-bold text-sm">{lastSaleDetails.businessName}</h3>
                        <p>{lastSaleDetails.date.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1 border-t border-b border-dashed border-black py-2">
                        <div className="flex justify-between">
                            <span>{lastSaleDetails.productName} {lastSaleDetails.variantName ? `(${lastSaleDetails.variantName})` : ''}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{lastSaleDetails.quantity} x {formatCurrency(lastSaleDetails.pricePerItem, lastSaleDetails.currency)}</span>
                            <span>{formatCurrency(lastSaleDetails.totalAmount, lastSaleDetails.currency)}</span>
                        </div>
                    </div>
                    <div className="border-b border-dashed border-black py-2 font-bold text-sm">
                        <div className="flex justify-between">
                            <span>TOTAL</span>
                            <span>{formatCurrency(lastSaleDetails.totalAmount, lastSaleDetails.currency)}</span>
                        </div>
                    </div>
                    <div className="py-2 text-xs">
                        <p>Paid via: {lastSaleDetails.paymentType.toUpperCase()}</p>
                    </div>
                    <div className="text-center mt-4">
                        <p>Thank you for your patronage!</p>
                    </div>
                </Card>
                <div className="mt-6 space-y-2 print:hidden">
                    <Button onClick={() => window.print()} className="w-full">
                        <Printer className="mr-2 h-4 w-4" /> Print Receipt
                    </Button>
                    <Button variant="outline" onClick={handleNewSaleClick} className="w-full">
                        Record New Sale
                    </Button>
                </div>
            </div>
        ) : (
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
                                {formatCurrency(totalAmount, businessData?.country)}
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
        )}
    </MainLayout>
  );
}
