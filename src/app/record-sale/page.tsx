'use client';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/app/main-layout';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';

interface AppUser {
    businessId?: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface Business {
    currency: string;
}


export default function RecordSalePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [paymentType, setPaymentType] = useState('cash');

  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return { path: `users/${authUser.uid}` } as any;
  }, [firestore, authUser]);
  const { data: userProfile } = useDoc<AppUser>(userProfileRef);
  const businessId = userProfile?.businessId;

  const businessRef = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return { path: `businesses/${businessId}` } as any;
  }, [firestore, businessId]);
  const { data: businessData } = useDoc<Business>(businessRef);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return { path: 'products' } as any;
  }, [firestore, businessId]);
  const { data: productsData, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  const selectedProduct = productsData?.find(p => p.id === selectedProductId);
  const totalAmount = selectedProduct ? selectedProduct.price * quantity : 0;
  const currencySymbol = businessData?.currency || '₦';

  const handleConfirmSale = async () => {
    if (!selectedProduct || quantity <= 0) {
        toast({
            variant: 'destructive',
            title: 'Invalid Sale',
            description: 'Please select a product and enter a valid quantity.',
        });
        return;
    }
    
    if (quantity > selectedProduct.quantity) {
         toast({
            variant: 'destructive',
            title: 'Not enough stock',
            description: `You only have ${selectedProduct.quantity} units of ${selectedProduct.name} left.`,
        });
        return;
    }

    // MOCK BEHAVIOR
    toast({
      title: "Sale Recorded (Mock)",
      description: `Sold ${quantity} of ${selectedProduct.name} for ${currencySymbol}${totalAmount.toLocaleString()}.`,
    });
    router.back();
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
              <Select onValueChange={setSelectedProductId} value={selectedProductId} disabled={isLoadingProducts}>
                <SelectTrigger id="product" className="h-12 text-base">
                  <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select a product"} />
                </SelectTrigger>
                <SelectContent>
                  {productsData?.map(product => (
                    <SelectItem key={product.id} value={product.id} disabled={product.quantity <= 0}>
                      {`${product.name} (Stock: ${product.quantity})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                        max={selectedProduct?.quantity}
                        disabled={!selectedProduct}
                    />
                </div>
                <div className="text-right">
                    <Label>Total Amount</Label>
                    <div className="font-bold text-3xl h-12 flex items-center justify-end">
                        {currencySymbol}{totalAmount.toLocaleString()}
                    </div>
                </div>
            </div>
            
            <div className="space-y-3">
              <Label>Payment Type</Label>
              <RadioGroup defaultValue="cash" onValueChange={setPaymentType} className="grid grid-cols-3 gap-2">
                <div>
                  <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                  <Label htmlFor="cash" className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Cash
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="transfer" id="transfer" className="peer sr-only" />
                  <Label htmlFor="transfer" className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    Transfer
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pos" id="pos" className="peer sr-only" />
                  <Label htmlFor="pos" className="flex h-12 items-center justify-center rounded-md border-2 border-muted bg-popover hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                    POS
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
        
        <Button onClick={handleConfirmSale} className="w-full h-16 text-xl bg-accent text-accent-foreground hover:bg-accent/90" disabled={!selectedProduct || quantity > (selectedProduct?.quantity || 0)}>
          <Check className="mr-2 h-6 w-6" />
          Confirm Sale
        </Button>
      </div>
    </MainLayout>
  );
}
