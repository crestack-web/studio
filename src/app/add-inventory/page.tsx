'use client';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddInventoryPage() {
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
                            <Select>
                                <SelectTrigger id="product" className="h-12 text-base">
                                    <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="product1">Product 1</SelectItem>
                                    <SelectItem value="product2">Product 2</SelectItem>
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
                            <Input id="quantity" type="number" placeholder="0" className="h-12 text-base" />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg">Update Inventory</Button>
            </div>
        </MainLayout>
    );
}
