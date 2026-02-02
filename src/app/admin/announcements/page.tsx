'use client';
import { useState, useMemo, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, doc } from 'firebase/firestore';
import { Loader2, Plus, FileEdit, Trash2, Megaphone } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Announcement {
    id: string;
    text: string;
    href: string;
    page: 'welcome' | 'home';
    isActive: boolean;
    createdAt?: { toDate: () => Date };
}

export default function AdminAnnouncementsPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const [text, setText] = useState('');
    const [href, setHref] = useState('');
    const [page, setPage] = useState<'welcome' | 'home'>('home');
    const [isActive, setIsActive] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    const announcementsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'announcements'));
    }, [firestore]);

    const { data: announcements, isLoading: isLoadingAnnouncements } = useCollection<Announcement>(announcementsQuery);
    
    const sortedAnnouncements = useMemo(() => {
        if (!announcements) return [];
        return [...announcements].sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });
    }, [announcements]);

    const resetForm = () => {
        setText('');
        setHref('');
        setPage('home');
        setIsActive(true);
    };

    const handleAddAnnouncement = async () => {
        if (!text || !page) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out all required fields.' });
            return;
        }
        if (!firestore) return;
        setIsLoading(true);

        const newAnnouncement = {
            text,
            href,
            page,
            isActive,
            createdAt: serverTimestamp(),
        };
        
        await addDocumentNonBlocking(collection(firestore, 'announcements'), newAnnouncement);
        
        toast({ title: 'Announcement Added!', description: `A new announcement has been created.` });
        resetForm();
        setIsLoading(false);
    };
    
    const handleUpdateAnnouncement = async () => {
        if (!editingAnnouncement || !firestore) return;
        setIsLoading(true);

        const announcementRef = doc(firestore, 'announcements', editingAnnouncement.id);
        const updatedData = { ...editingAnnouncement, updatedAt: serverTimestamp() };

        await updateDocumentNonBlocking(announcementRef, updatedData);
        toast({ title: 'Announcement Updated', description: `The announcement has been saved.` });
        setEditingAnnouncement(null);
        setIsLoading(false);
    };

    const handleDeleteAnnouncement = async (announcementId: string) => {
        if (!firestore) return;
        const announcementRef = doc(firestore, 'announcements', announcementId);
        await deleteDocumentNonBlocking(announcementRef);
        toast({ title: 'Announcement Deleted', description: 'The announcement has been permanently removed.' });
    };

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Manage Announcements</h1>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Add New Announcement</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="text">Text</Label><Input id="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g., Get 50% off yearly plans!" disabled={isLoading} /></div>
                            <div className="space-y-2"><Label htmlFor="href">Link URL</Label><Input id="href" value={href} onChange={(e) => setHref(e.target.value)} placeholder="/pricing" disabled={isLoading} /></div>
                            <div className="space-y-2">
                                <Label htmlFor="page-select">Display Page</Label>
                                <Select value={page} onValueChange={(val: 'welcome' | 'home') => setPage(val)} disabled={isLoading}>
                                    <SelectTrigger id="page-select"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="home">Owner Home</SelectItem>
                                        <SelectItem value="welcome">Welcome Page</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-2"><Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} disabled={isLoading} /><Label htmlFor="isActive">Activate announcement</Label></div>
                            <Button onClick={handleAddAnnouncement} disabled={isLoading} className="w-full">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add Announcement</Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader><CardTitle>Existing Announcements</CardTitle><CardDescription>View, edit, or delete announcements.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Text</TableHead><TableHead>Page</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingAnnouncements ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading announcements...</TableCell></TableRow>
                                    ) : sortedAnnouncements && sortedAnnouncements.length > 0 ? sortedAnnouncements.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium truncate max-w-xs">{item.text}</TableCell>
                                            <TableCell><Badge variant="outline" className="capitalize">{item.page}</Badge></TableCell>
                                            <TableCell><Badge variant={item.isActive ? 'default' : 'secondary'}>{item.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingAnnouncement(item)}><FileEdit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this announcement.</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteAnnouncement(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                         <TableRow><TableCell colSpan={4} className="h-24 text-center">No announcements found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <Dialog open={!!editingAnnouncement} onOpenChange={(open) => !open && setEditingAnnouncement(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Edit Announcement</DialogTitle><DialogDescription>Make changes to your announcement here. Click save when you're done.</DialogDescription></DialogHeader>
                    {editingAnnouncement && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2"><Label htmlFor="edit-text">Text</Label><Input id="edit-text" value={editingAnnouncement.text} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, text: e.target.value})} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-href">Link URL</Label><Input id="edit-href" value={editingAnnouncement.href} onChange={(e) => setEditingAnnouncement({...editingAnnouncement, href: e.target.value})} /></div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-page-select">Display Page</Label>
                                <Select value={editingAnnouncement.page} onValueChange={(val: 'welcome' | 'home') => setEditingAnnouncement({...editingAnnouncement, page: val})}>
                                    <SelectTrigger id="edit-page-select"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="home">Owner Home</SelectItem>
                                        <SelectItem value="welcome">Welcome Page</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2 pt-2"><Switch id="edit-isActive" checked={editingAnnouncement.isActive} onCheckedChange={(checked) => setEditingAnnouncement({ ...editingAnnouncement, isActive: checked })} /><Label htmlFor="edit-isActive">Active</Label></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingAnnouncement(null)}>Cancel</Button>
                        <Button onClick={handleUpdateAnnouncement} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
