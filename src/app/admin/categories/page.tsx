'use client';
import { useState, useMemo, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, doc } from 'firebase/firestore';
import { Loader2, Plus, FileEdit, Trash2, FileUp, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

interface MarketCategory {
    id: string;
    name: string;
    imageUrl: string;
    imageHint: string;
    createdAt: any;
}

export default function AdminCategoriesPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const [name, setName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageHint, setImageHint] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [editingCategory, setEditingCategory] = useState<MarketCategory | null>(null);

    const categoriesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketCategories'));
    }, [firestore]);

    const { data: categories, isLoading: isLoadingCategories } = useCollection<MarketCategory>(categoriesQuery);

    const sortedCategories = useMemo(() => {
        if (!categories) return [];
        return [...categories].sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });
    }, [categories]);
    
    const resetForm = () => {
        setName('');
        setImageUrl('');
        setImageHint('');
    };

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 800,
            useWebWorker: true
        };

        try {
            const compressedFile = await imageCompression(file, options);
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
             toast({
                variant: 'destructive',
                title: 'Image compression failed',
                description: 'Please try again with a different image.',
            });
        }
    };

    const handleAddCategory = async () => {
        if (!name || !imageUrl) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out name and image.' });
            return;
        }
        setIsLoading(true);

        const newCategory = {
            name,
            imageUrl,
            imageHint,
            createdAt: serverTimestamp(),
        };
        
        await addDocumentNonBlocking(collection(firestore, 'marketCategories'), newCategory);

        toast({ title: 'Category Added!', description: `"${name}" has been created.` });
        resetForm();
        setIsLoading(false);
    };
    
    const handleUpdateCategory = async () => {
        if (!editingCategory || !firestore) return;
        setIsLoading(true);

        const categoryRef = doc(firestore, 'marketCategories', editingCategory.id);
        const updatedData = { ...editingCategory, updatedAt: serverTimestamp() };

        await updateDocumentNonBlocking(categoryRef, updatedData);
        toast({ title: 'Category Updated', description: `"${editingCategory.name}" has been saved.` });
        setEditingCategory(null);
        setIsLoading(false);
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!firestore) return;
        const categoryRef = doc(firestore, 'marketCategories', categoryId);
        await deleteDocumentNonBlocking(categoryRef);
        toast({ title: 'Category Deleted', description: 'The category has been permanently removed.' });
    };

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Manage Categories</h1>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Add New Category</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Fashion" disabled={isLoading} /></div>
                            
                            <div className="space-y-2">
                                <Label>Image</Label>
                                {imageUrl ? (
                                    <div className="relative aspect-video">
                                        <Image src={imageUrl} alt="Category image" fill className="object-cover rounded-md border" />
                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setImageUrl('')} disabled={isLoading}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <Label htmlFor="image-upload" className={cn("flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-background text-muted-foreground hover:border-primary hover:text-primary", isLoading && "cursor-not-allowed opacity-50")}>
                                        <FileUp className="h-8 w-8" />
                                        <span>Upload Image</span>
                                    </Label>
                                )}
                                <Input id="image-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setImageUrl)} className="hidden" disabled={isLoading} />
                            </div>

                            <div className="space-y-2"><Label htmlFor="imageHint">Image Hint</Label><Input id="imageHint" value={imageHint} onChange={(e) => setImageHint(e.target.value)} placeholder="e.g., fashion clothing" disabled={isLoading} /></div>
                            <Button onClick={handleAddCategory} disabled={isLoading} className="w-full">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add Category</Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader><CardTitle>Existing Categories</CardTitle><CardDescription>View, edit, or delete marketplace categories.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingCategories ? (
                                        <TableRow><TableCell colSpan={2} className="h-24 text-center">Loading categories...</TableCell></TableRow>
                                    ) : sortedCategories && sortedCategories.length > 0 ? sortedCategories.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Image src={cat.imageUrl} alt={cat.name} width={40} height={40} className="rounded-md object-cover bg-muted" />
                                                    <span className="font-medium">{cat.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingCategory(cat)}><FileEdit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the category "{cat.name}".</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(cat.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                         <TableRow><TableCell colSpan={2} className="h-24 text-center">No categories found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Edit Category</DialogTitle><DialogDescription>Make changes to your category here. Click save when you're done.</DialogDescription></DialogHeader>
                    {editingCategory && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2"><Label htmlFor="edit-name">Name</Label><Input id="edit-name" value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} /></div>
                            <div className="space-y-2">
                                <Label>Image</Label>
                                {editingCategory.imageUrl ? (
                                    <div className="relative aspect-video">
                                        <Image src={editingCategory.imageUrl} alt="Category image" fill className="object-cover rounded-md border" />
                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setEditingCategory({...editingCategory, imageUrl: ''})} disabled={isLoading}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <Label htmlFor="edit-image-upload" className={cn("flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-background text-muted-foreground hover:border-primary hover:text-primary", isLoading && "cursor-not-allowed opacity-50")}>
                                        <FileUp className="h-8 w-8" />
                                        <span>Upload Image</span>
                                    </Label>
                                )}
                                <Input id="edit-image-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (val) => setEditingCategory({...editingCategory!, imageUrl: val}))} className="hidden" disabled={isLoading} />
                            </div>
                            <div className="space-y-2"><Label htmlFor="edit-imageHint">Image Hint</Label><Input id="edit-imageHint" value={editingCategory.imageHint} onChange={(e) => setEditingCategory({ ...editingCategory, imageHint: e.target.value })} /></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                        <Button onClick={handleUpdateCategory} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
