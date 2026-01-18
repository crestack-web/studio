'use client';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Mock data until we connect to Firebase
const products = [
    { id: 'prod1', name: 'Bottled Water', price: 150, stock: 50 },
    { id: 'prod2', name: 'Biscuits', price: 250, stock: 30 },
    { id: 'prod3', name: 'Soft Drink', price: 200, stock: 40 },
];

export default function StartProductionPage() {
    return (
        <MainLayout title="Start Production" backHref="/owner/home">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Start a New Production Run</CardTitle>
                        <CardDescription>Record the start of a new batch of products being manufactured.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="space-y-2">
                            <Label htmlFor="product">Product to Manufacture</Label>
                            <Select>
                                <SelectTrigger id="product" className="h-12 text-base">
                                    <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(product => (
                                        <SelectItem key={product.id} value={product.id}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity to Produce</Label>
                            <Input id="quantity" type="number" placeholder="0" className="h-12 text-base" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Production Notes (Optional)</Label>
                            <Textarea id="notes" placeholder="e.g., Batch #A123, using new supplier" />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg">Start Production Run</Button>
            </div>
        </MainLayout>
    );
}
