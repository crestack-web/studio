'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, doc } from 'firebase/firestore';
import { Loader2, Plus, FileEdit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface MarketBanner {
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    imageHint: string;
    buttonText: string;
    className: string;
    isActive: boolean;
    createdAt: any;
}

export default function AdminMarketPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageHint, setImageHint] = useState('');
    const [buttonText, setButtonText] = useState('');
    const [className, setClassName] = useState('bg-blue-500');
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [editingBanner, setEditingBanner] = useState<MarketBanner | null>(null);

    const bannersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketBanners'));
    }, [firestore]);

    const { data: banners, isLoading: isLoadingBanners } = useCollection<MarketBanner>(bannersQuery);
    
    const sortedBanners = useMemo(() => {
        if (!banners) return [];
        return [...banners].sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });
    }, [banners]);

    const resetForm = () => {
        setTitle('');
        setSubtitle('');
        setImageUrl('');
        setImageHint('');
        setButtonText('');
        setClassName('bg-blue-500');
        setIsActive(false);
    };

    const handleAddBanner = async () => {
        if (!title || !imageUrl) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out title and image URL.' });
            return;
        }
        setIsLoading(true);

        const newBanner = {
            title,
            subtitle,
            imageUrl,
            imageHint,
            buttonText,
            className,
            isActive,
            createdAt: serverTimestamp(),
        };
        
        await addDocumentNonBlocking(collection(firestore, 'marketBanners'), newBanner);

        toast({ title: 'Banner Added!', description: `"${title}" has been created.` });
        resetForm();
        setIsLoading(false);
    };
    
    const handleUpdateBanner = async () => {
        if (!editingBanner || !firestore) return;
        setIsLoading(true);

        const bannerRef = doc(firestore, 'marketBanners', editingBanner.id);
        
        await updateDocumentNonBlocking(bannerRef, { ...editingBanner });
        toast({ title: 'Banner Updated', description: `"${editingBanner.title}" has been saved.` });
        setEditingBanner(null);
        setIsLoading(false);
    };

    const handleDeleteBanner = async (bannerId: string) => {
        if (!firestore) return;
        const bannerRef = doc(firestore, 'marketBanners', bannerId);
        await deleteDocumentNonBlocking(bannerRef);
        toast({ title: 'Banner Deleted', description: 'The banner has been permanently removed.' });
    };

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Manage Market Banners</h1>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Add New Banner</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Clearance Sale" disabled={isLoading} /></div>
                            <div className="space-y-2"><Label htmlFor="subtitle">Subtitle</Label><Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g., Up to 50% Off" disabled={isLoading} /></div>
                            <div className="space-y-2"><Label htmlFor="imageUrl">Image URL</Label><Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://images.unsplash.com/..." disabled={isLoading} /></div>
                             <div className="space-y-2"><Label htmlFor="imageHint">Image Hint</Label><Input id="imageHint" value={imageHint} onChange={(e) => setImageHint(e.target.value)} placeholder="e.g., abstract background" disabled={isLoading} /></div>
                             <div className="space-y-2"><Label htmlFor="buttonText">Button Text</Label><Input id="buttonText" value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g., Shop Now" disabled={isLoading} /></div>
                             <div className="space-y-2"><Label htmlFor="className">Background Class</Label><Input id="className" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g., bg-orange-500" disabled={isLoading} /></div>
                            <div className="flex items-center space-x-2"><Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} disabled={isLoading} /><Label htmlFor="isActive">Activate banner</Label></div>
                            <Button onClick={handleAddBanner} disabled={isLoading} className="w-full">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add Banner</Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader><CardTitle>Existing Banners</CardTitle><CardDescription>View, edit, or delete existing market banners.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingBanners ? (
                                        <TableRow><TableCell colSpan={3} className="h-24 text-center">Loading banners...</TableCell></TableRow>
                                    ) : sortedBanners && sortedBanners.length > 0 ? sortedBanners.map((banner) => (
                                        <TableRow key={banner.id}>
                                            <TableCell className="font-medium">{banner.title}</TableCell>
                                            <TableCell><Badge variant={banner.isActive ? 'default' : 'secondary'}>{banner.isActive ? 'Active' : 'Draft'}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingBanner(banner)}><FileEdit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the banner titled "{banner.title}".</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteBanner(banner.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                         <TableRow><TableCell colSpan={3} className="h-24 text-center">No banners found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <Dialog open={!!editingBanner} onOpenChange={(open) => !open && setEditingBanner(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader><DialogTitle>Edit Banner</DialogTitle><DialogDescription>Make changes to your banner here. Click save when you're done.</DialogDescription></DialogHeader>
                    {editingBanner && (
                        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <div className="space-y-2"><Label htmlFor="edit-title">Title</Label><Input id="edit-title" value={editingBanner.title} onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-subtitle">Subtitle</Label><Input id="edit-subtitle" value={editingBanner.subtitle} onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-imageUrl">Image URL</Label><Input id="edit-imageUrl" value={editingBanner.imageUrl} onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-imageHint">Image Hint</Label><Input id="edit-imageHint" value={editingBanner.imageHint} onChange={(e) => setEditingBanner({ ...editingBanner, imageHint: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-buttonText">Button Text</Label><Input id="edit-buttonText" value={editingBanner.buttonText} onChange={(e) => setEditingBanner({ ...editingBanner, buttonText: e.target.value })} /></div>
                             <div className="space-y-2"><Label htmlFor="edit-className">Background Class</Label><Input id="edit-className" value={editingBanner.className} onChange={(e) => setEditingBanner({ ...editingBanner, className: e.target.value })} /></div>
                            <div className="flex items-center space-x-2"><Switch id="edit-isActive" checked={editingBanner.isActive} onCheckedChange={(checked) => setEditingBanner({ ...editingBanner, isActive: checked })} /><Label htmlFor="edit-isActive">Active</Label></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingBanner(null)}>Cancel</Button>
                        <Button onClick={handleUpdateBanner} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
