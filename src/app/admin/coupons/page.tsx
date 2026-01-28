'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Plus, FileEdit, Trash2, Percent, BadgeDollarSign } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';

interface Coupon {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive: boolean;
    createdAt?: { toDate: () => Date };
}

export default function AdminCouponsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const [code, setCode] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    const couponsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'coupons'));
    }, [firestore]);

    const { data: coupons, isLoading: isLoadingCoupons } = useCollection<Coupon>(couponsQuery);
    
    const sortedCoupons = useMemo(() => {
        if (!coupons) return [];
        return [...coupons].sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });
    }, [coupons]);

    const resetForm = () => {
        setCode('');
        setDiscountType('percentage');
        setDiscountValue('');
        setIsActive(true);
    };

    const handleAddCoupon = async () => {
        if (!code || !discountValue) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out all fields.' });
            return;
        }
        if (!firestore) return;
        setIsLoading(true);

        const newCoupon = {
            code: code.toUpperCase(),
            discountType,
            discountValue: parseFloat(discountValue),
            isActive,
            createdAt: serverTimestamp(),
        };
        
        await setDocumentNonBlocking(doc(firestore, 'coupons', newCoupon.code), newCoupon, {});
        
        toast({ title: 'Coupon Added!', description: `"${newCoupon.code}" has been created.` });
        resetForm();
        setIsLoading(false);
    };
    
    const handleUpdateCoupon = async () => {
        if (!editingCoupon || !firestore) return;
        setIsLoading(true);

        const couponRef = doc(firestore, 'coupons', editingCoupon.id);
        const updatedData = { ...editingCoupon, updatedAt: serverTimestamp() };

        await updateDocumentNonBlocking(couponRef, updatedData);
        toast({ title: 'Coupon Updated', description: `"${editingCoupon.code}" has been saved.` });
        setEditingCoupon(null);
        setIsLoading(false);
    };

    const handleDeleteCoupon = async (couponId: string) => {
        if (!firestore) return;
        const couponRef = doc(firestore, 'coupons', couponId);
        await deleteDocumentNonBlocking(couponRef);
        toast({ title: 'Coupon Deleted', description: 'The coupon has been permanently removed.' });
    };

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Manage Coupons</h1>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Add New Coupon</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="code">Coupon Code</Label><Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., SAVE20" disabled={isLoading} /></div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="discount-type">Discount Type</Label>
                                    <Select value={discountType} onValueChange={(val: 'percentage' | 'fixed') => setDiscountType(val)} disabled={isLoading}>
                                        <SelectTrigger id="discount-type"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                     <Label htmlFor="discount-value">Value</Label>
                                    <Input id="discount-value" type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === 'percentage' ? '20' : '1000'} disabled={isLoading} />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2"><Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} disabled={isLoading} /><Label htmlFor="isActive">Activate coupon</Label></div>
                            <Button onClick={handleAddCoupon} disabled={isLoading} className="w-full">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add Coupon</Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader><CardTitle>Existing Coupons</CardTitle><CardDescription>View, edit, or delete subscription coupons.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingCoupons ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading coupons...</TableCell></TableRow>
                                    ) : sortedCoupons && sortedCoupons.length > 0 ? sortedCoupons.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-mono font-semibold">{cat.code}</TableCell>
                                            <TableCell>
                                                {cat.discountType === 'percentage' 
                                                    ? `${cat.discountValue}%` 
                                                    : formatCurrency(cat.discountValue)
                                                }
                                            </TableCell>
                                            <TableCell><Badge variant={cat.isActive ? 'default' : 'secondary'}>{cat.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingCoupon(cat)}><FileEdit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the coupon "{cat.code}".</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCoupon(cat.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                         <TableRow><TableCell colSpan={4} className="h-24 text-center">No coupons found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <Dialog open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Edit Coupon</DialogTitle><DialogDescription>Make changes to your coupon here. Click save when you're done.</DialogDescription></DialogHeader>
                    {editingCoupon && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2"><Label htmlFor="edit-code">Code</Label><Input id="edit-code" value={editingCoupon.code} readOnly disabled /></div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-discount-type">Discount Type</Label>
                                    <Select value={editingCoupon.discountType} onValueChange={(val: 'percentage' | 'fixed') => setEditingCoupon({...editingCoupon, discountType: val})} disabled={isLoading}>
                                        <SelectTrigger id="edit-discount-type"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                     <Label htmlFor="edit-discount-value">Value</Label>
                                    <Input id="edit-discount-value" type="number" value={editingCoupon.discountValue} onChange={(e) => setEditingCoupon({...editingCoupon, discountValue: parseFloat(e.target.value) || 0})} disabled={isLoading} />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2"><Switch id="edit-isActive" checked={editingCoupon.isActive} onCheckedChange={(checked) => setEditingCoupon({ ...editingCoupon, isActive: checked })} /><Label htmlFor="edit-isActive">Active</Label></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCoupon(null)}>Cancel</Button>
                        <Button onClick={handleUpdateCoupon} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}

