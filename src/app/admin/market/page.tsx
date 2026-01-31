
'use client';
import { useState, useMemo, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, doc, orderBy } from 'firebase/firestore';
import { Loader2, Plus, FileEdit, Trash2, FileUp, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';


interface MarketBanner {
    id: string;
    title?: string;
    subtitle?: string;
    imageUrl: string;
    imageHint?: string;
    buttonText?: string;
    className?: string;
    isActive: boolean;
    createdAt: any;
}

interface MarketGifBanner {
    id: string;
    imageUrl: string;
    linkUrl: string;
    isActive: boolean;
    createdAt: any;
}

export default function AdminMarketPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    // State for main banners
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageHint, setImageHint] = useState('');
    const [buttonText, setButtonText] = useState('');
    const [className, setClassName] = useState('bg-blue-500');
    const [isActive, setIsActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingBanner, setEditingBanner] = useState<MarketBanner | null>(null);

    // State for GIF banners
    const [gifImageUrl, setGifImageUrl] = useState('');
    const [gifLinkUrl, setGifLinkUrl] = useState('');
    const [gifIsActive, setGifIsActive] = useState(false);
    const [isLoadingGif, setIsLoadingGif] = useState(false);
    const [editingGifBanner, setEditingGifBanner] = useState<MarketGifBanner | null>(null);

    // Queries
    const bannersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketBanners'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: banners, isLoading: isLoadingBanners } = useCollection<MarketBanner>(bannersQuery);

    const gifBannersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'marketGifBanners'), orderBy('createdAt', 'desc'));
    }, [firestore]);
    const { data: gifBanners, isLoading: isLoadingGifBanners } = useCollection<MarketGifBanner>(gifBannersQuery);

    
    // Handlers for main banners
    const resetForm = () => {
        setTitle('');
        setSubtitle('');
        setImageUrl('');
        setImageHint('');
        setButtonText('');
        setClassName('bg-blue-500');
        setIsActive(false);
    };

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1280,
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

    const handleAddBanner = async () => {
        if (!imageUrl) {
            toast({ variant: 'destructive', title: 'Missing Image', description: 'Please upload an image for the banner.' });
            return;
        }
        setIsLoading(true);
        const newBanner = { title, subtitle, imageUrl, imageHint, buttonText, className, isActive, createdAt: serverTimestamp() };
        await addDocumentNonBlocking(collection(firestore, 'marketBanners'), newBanner);
        toast({ title: 'Banner Added!', description: `A new banner has been created.` });
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
    
    // Handlers for GIF banners
    const handleAddGifBanner = async () => {
        if (!gifImageUrl) {
            toast({ variant: 'destructive', title: 'Missing Image', description: 'Please provide an image or GIF URL.' });
            return;
        }
        setIsLoadingGif(true);
        const newBanner = { imageUrl: gifImageUrl, linkUrl: gifLinkUrl, isActive: gifIsActive, createdAt: serverTimestamp() };
        await addDocumentNonBlocking(collection(firestore, 'marketGifBanners'), newBanner);
        toast({ title: 'GIF Banner Added' });
        setGifImageUrl('');
        setGifLinkUrl('');
        setGifIsActive(false);
        setIsLoadingGif(false);
    };

    const handleUpdateGifBanner = async () => {
        if (!editingGifBanner || !firestore) return;
        setIsLoadingGif(true);
        const bannerRef = doc(firestore, 'marketGifBanners', editingGifBanner.id);
        await updateDocumentNonBlocking(bannerRef, { ...editingGifBanner });
        toast({ title: 'GIF Banner Updated' });
        setEditingGifBanner(null);
        setIsLoadingGif(false);
    };

    const handleDeleteGifBanner = async (bannerId: string) => {
        if (!firestore) return;
        const bannerRef = doc(firestore, 'marketGifBanners', bannerId);
        await deleteDocumentNonBlocking(bannerRef);
        toast({ title: 'GIF Banner Deleted' });
    };

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Manage Market Homepage</h1>
            
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Add New Main Banner</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Clearance Sale" disabled={isLoading} /></div>
                            <div className="space-y-2"><Label htmlFor="subtitle">Subtitle</Label><Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="e.g., Up to 50% Off" disabled={isLoading} /></div>
                             <div className="space-y-2">
                                <Label>Image</Label>
                                {imageUrl ? (
                                    <div className="relative aspect-video">
                                        <Image src={imageUrl} alt="Banner image" fill className="object-cover rounded-md border" />
                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setImageUrl('')} disabled={isLoading}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <Label htmlFor="image-upload" className={cn("flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-background text-muted-foreground hover:border-primary hover:text-primary", isLoading && "cursor-not-allowed opacity-50")}>
                                        <FileUp className="h-8 w-8" />
                                        <span>Upload Image</span>
                                    </Label>
                                )}
                                <Input id="image-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setImageUrl)} className="hidden" disabled={isLoading} />
                                <p className="text-xs text-muted-foreground">Recommended: 1200x630px.</p>
                            </div>
                             <div className="space-y-2"><Label htmlFor="imageHint">Image Hint</Label><Input id="imageHint" value={imageHint} onChange={(e) => setImageHint(e.target.value)} placeholder="e.g., abstract background" disabled={isLoading} /></div>
                             <div className="space-y-2"><Label htmlFor="buttonText">Button Text</Label><Input id="buttonText" value={buttonText} onChange={(e) => setButtonText(e.target.value)} placeholder="e.g., Shop Now" disabled={isLoading} /></div>
                             <div className="space-y-2"><Label htmlFor="className">Background Class</Label><Input id="className" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g., bg-orange-500" disabled={isLoading} /></div>
                            <div className="flex items-center space-x-2"><Switch id="isActive" checked={isActive} onCheckedChange={(val) => setIsActive(val)} disabled={isLoading} /><Label htmlFor="isActive">Activate banner</Label></div>
                            <Button onClick={handleAddBanner} disabled={isLoading} className="w-full">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add Main Banner</Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Add New GIF Banner</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Image / GIF URL</Label>
                                <Input value={gifImageUrl} onChange={(e) => setGifImageUrl(e.target.value)} placeholder="https://..." disabled={isLoadingGif} />
                                <p className="text-xs text-muted-foreground">Direct link to an image or GIF. Recommended size: 250x202px.</p>
                            </div>
                            <div className="space-y-2"><Label>Link URL</Label><Input value={gifLinkUrl} onChange={(e) => setGifLinkUrl(e.target.value)} placeholder="/market/category/fashion" disabled={isLoadingGif} /></div>
                            <div className="flex items-center space-x-2"><Switch checked={gifIsActive} onCheckedChange={setGifIsActive} disabled={isLoadingGif} /><Label>Activate banner</Label></div>
                            <Button onClick={handleAddGifBanner} disabled={isLoadingGif} className="w-full">{isLoadingGif ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add GIF Banner</Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                     <Card>
                        <CardHeader><CardTitle>Existing Main Banners</CardTitle><CardDescription>View, edit, or delete main carousel banners.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingBanners ? (
                                        <TableRow><TableCell colSpan={3} className="h-24 text-center">Loading banners...</TableCell></TableRow>
                                    ) : banners && banners.length > 0 ? banners.map((banner) => (
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
                                         <TableRow><TableCell colSpan={3} className="h-24 text-center">No main banners found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Existing GIF Banners</CardTitle><CardDescription>Manage small promotional side banners.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Image</TableHead><TableHead>Link</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingGifBanners ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
                                    ) : gifBanners && gifBanners.length > 0 ? gifBanners.map((banner) => (
                                        <TableRow key={banner.id}>
                                            <TableCell><Image src={banner.imageUrl} alt="GIF banner" width={80} height={60} className="rounded-md object-cover bg-muted" /></TableCell>
                                            <TableCell className="font-mono text-xs truncate max-w-[150px]">{banner.linkUrl}</TableCell>
                                            <TableCell><Badge variant={banner.isActive ? 'default' : 'secondary'}>{banner.isActive ? 'Active' : 'Draft'}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingGifBanner(banner)}><FileEdit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the GIF banner.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteGifBanner(banner.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                         <TableRow><TableCell colSpan={4} className="h-24 text-center">No GIF banners found.</TableCell></TableRow>
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
                            <div className="space-y-2"><Label htmlFor="edit-title">Title</Label><Input id="edit-title" value={editingBanner.title || ''} onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-subtitle">Subtitle</Label><Input id="edit-subtitle" value={editingBanner.subtitle || ''} onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })} /></div>
                            <div className="space-y-2">
                                <Label>Image</Label>
                                {editingBanner.imageUrl ? (
                                    <div className="relative aspect-video">
                                        <Image src={editingBanner.imageUrl} alt="Banner image" fill className="object-cover rounded-md border" />
                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setEditingBanner({...editingBanner, imageUrl: ''})} disabled={isLoading}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <Label htmlFor="edit-image-upload" className={cn("flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-background text-muted-foreground hover:border-primary hover:text-primary", isLoading && "cursor-not-allowed opacity-50")}>
                                        <FileUp className="h-8 w-8" />
                                        <span>Upload Image</span>
                                    </Label>
                                )}
                                <Input id="edit-image-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (val) => setEditingBanner({...editingBanner!, imageUrl: val}))} className="hidden" disabled={isLoading} />
                            </div>
                            <div className="space-y-2"><Label htmlFor="edit-imageHint">Image Hint</Label><Input id="edit-imageHint" value={editingBanner.imageHint || ''} onChange={(e) => setEditingBanner({ ...editingBanner, imageHint: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-buttonText">Button Text</Label><Input id="edit-buttonText" value={editingBanner.buttonText || ''} onChange={(e) => setEditingBanner({ ...editingBanner, buttonText: e.target.value })} /></div>
                             <div className="space-y-2"><Label htmlFor="edit-className">Background Class</Label><Input id="edit-className" value={editingBanner.className || ''} onChange={(e) => setEditingBanner({ ...editingBanner, className: e.target.value })} /></div>
                            <div className="flex items-center space-x-2"><Switch id="edit-isPublished" checked={editingBanner.isActive} onCheckedChange={(checked) => setEditingBanner({ ...editingBanner, isActive: checked })} /><Label htmlFor="edit-isPublished">Active</Label></div>
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

             <Dialog open={!!editingGifBanner} onOpenChange={(open) => !open && setEditingGifBanner(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Edit GIF Banner</DialogTitle></DialogHeader>
                    {editingGifBanner && (
                        <div className="grid gap-4 py-4">
                           <div className="space-y-2"><Label>Image / GIF URL</Label><Input value={editingGifBanner.imageUrl} onChange={(e) => setEditingGifBanner({ ...editingGifBanner, imageUrl: e.target.value })} /></div>
                           <div className="space-y-2"><Label>Link URL</Label><Input value={editingGifBanner.linkUrl} onChange={(e) => setEditingGifBanner({ ...editingGifBanner, linkUrl: e.target.value })} /></div>
                           <div className="flex items-center space-x-2"><Switch checked={editingGifBanner.isActive} onCheckedChange={(checked) => setEditingGifBanner({ ...editingGifBanner, isActive: checked })} /><Label>Active</Label></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingGifBanner(null)}>Cancel</Button>
                        <Button onClick={handleUpdateGifBanner} disabled={isLoadingGif}>
                            {isLoadingGif && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
