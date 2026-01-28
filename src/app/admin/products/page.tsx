'use client';
import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, FileEdit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MarketProduct {
    id: string;
    productName: string;
    businessName: string;
    price: number;
    category: string;
    description: string;
    images?: string[];
}

export default function AdminProductsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [editingProduct, setEditingProduct] = useState<MarketProduct | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketProducts'));
    }, [firestore]);
    const { data: products, isLoading: isLoadingProducts } = useCollection<MarketProduct>(productsQuery);

    const handleUpdateProduct = async () => {
        if (!editingProduct || !firestore) return;
        setIsLoading(true);

        const productRef = doc(firestore, 'marketProducts', editingProduct.id);
        
        await updateDocumentNonBlocking(productRef, {...editingProduct});
        toast({ title: 'Product Updated', description: `"${editingProduct.productName}" has been saved.` });
        setEditingProduct(null);
        setIsLoading(false);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!firestore) return;
        // This is a "delist" action. It deletes the market-facing product.
        const productRef = doc(firestore, 'marketProducts', productId);
        await deleteDocumentNonBlocking(productRef);
        // Note: this does not delete the product from the business's own inventory.
        // It just removes it from the public market.
        toast({ title: 'Product Delisted', description: 'The product has been removed from the market.' });
    };

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Manage Market Products</h1>
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>All Market Products</CardTitle>
                        <CardDescription>View and manage all products listed on the Busmo Market.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Seller</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingProducts ? (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading products...</TableCell></TableRow>
                                ) : products && products.length > 0 ? products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Image src={product.images?.[0] || `https://picsum.photos/seed/${product.id}/40/40`} alt={product.productName} width={40} height={40} className="rounded-md object-cover bg-muted" />
                                                <div className="font-medium">{product.productName}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{product.businessName}</TableCell>
                                        <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                                        <TableCell className="text-right">
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditingProduct(product)}><FileEdit className="mr-2 h-4 w-4"/>Edit Details</DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delist Product</DropdownMenuItem></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>This will remove the product from the public market, but will NOT delete it from the seller's inventory.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-destructive hover:bg-destructive/90">Delist</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} className="h-24 text-center">No products found on the market.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Product: {editingProduct?.productName}</DialogTitle>
                        <DialogDescription>As an admin, you can override product details. These changes will be visible to all users.</DialogDescription>
                    </DialogHeader>
                    {editingProduct && (
                        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <div className="space-y-2"><Label htmlFor="edit-name">Product Name</Label><Input id="edit-name" value={editingProduct.productName} onChange={(e) => setEditingProduct({ ...editingProduct, productName: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-price">Price</Label><Input id="edit-price" type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-category">Category</Label><Input id="edit-category" value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" value={editingProduct.description} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} rows={4} /></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                        <Button onClick={handleUpdateProduct} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
