'use client';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AddProductPage() {
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
                            <Input id="product-name" placeholder="e.g., Bottled Water" className="h-12 text-base" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cost-price">Cost Price</Label>
                                <Input id="cost-price" type="number" placeholder="0.00" className="h-12 text-base" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="selling-price">Selling Price</Label>
                                <Input id="selling-price" type="number" placeholder="0.00" className="h-12 text-base" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="quantity">Initial Quantity</Label>
                            <Input id="quantity" type="number" placeholder="0" className="h-12 text-base" />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg">Add Product</Button>
            </div>
        </MainLayout>
    );
}
