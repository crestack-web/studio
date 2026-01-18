'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/app/main-layout';

// Mock data until we connect to Firebase
const products = [
    { id: 'prod1', name: 'Bottled Water', price: 150, stock: 50 },
    { id: 'prod2', name: 'Biscuits', price: 250, stock: 30 },
    { id: 'prod3', name: 'Soft Drink', price: 200, stock: 40 },
];

export default function RecordSalePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const totalAmount = selectedProduct ? selectedProduct.price * quantity : 0;

  const handleConfirmSale = () => {
    if (!selectedProduct || quantity <= 0) {
        toast({
            variant: 'destructive',
            title: 'Invalid Sale',
            description: 'Please select a product and enter a valid quantity.',
        });
        return;
    }
    toast({
      title: "Sale Recorded",
      description: `Sold ${quantity} of ${selectedProduct.name} for ₦${totalAmount.toLocaleString()}.`,
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
              <Select onValueChange={setSelectedProductId} value={selectedProductId}>
                <SelectTrigger id="product" className="h-12 text-base">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {`${product.name} (Stock: ${product.stock})`}
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
                        disabled={!selectedProduct}
                    />
                </div>
                <div className="text-right">
                    <Label>Total Amount</Label>
                    <div className="font-bold text-3xl h-12 flex items-center justify-end">
                        ₦{totalAmount.toLocaleString()}
                    </div>
                </div>
            </div>
            
            <div className="space-y-3">
              <Label>Payment Type</Label>
              <RadioGroup defaultValue="cash" className="grid grid-cols-3 gap-2">
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
        
        <Button onClick={handleConfirmSale} className="w-full h-16 text-xl bg-accent text-accent-foreground hover:bg-accent/90" disabled={!selectedProduct}>
          <Check className="mr-2 h-6 w-6" />
          Confirm Sale
        </Button>
      </div>
    </MainLayout>
  );
}
