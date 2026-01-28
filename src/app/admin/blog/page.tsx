'use client';
import { useState, useMemo, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, doc } from 'firebase/firestore';
import { Loader2, Plus, FileEdit, Trash2, FileUp, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { cn } from '@/lib/utils';


interface BlogPost {
    id: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    author: string;
    imageUrl: string;
    imageHint: string;
    isPublished: boolean;
    createdAt: any;
}

export default function AdminBlogPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    // State for creating new post
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('Busmo Team');
    const [imageUrl, setImageUrl] = useState('');
    const [imageHint, setImageHint] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // State for editing post
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

    const blogPostsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'blogs'));
    }, [firestore]);

    const { data: blogPosts, isLoading: isLoadingPosts } = useCollection<BlogPost>(blogPostsQuery);
    
    const sortedBlogPosts = useMemo(() => {
        if (!blogPosts) return [];
        return [...blogPosts].sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });
    }, [blogPosts]);

    const createSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/-+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start
            .replace(/-+$/, ''); // Trim - from end
    };
    
    const resetForm = () => {
        setTitle('');
        setContent('');
        setDescription('');
        setAuthor('Busmo Team');
        setImageUrl('');
        setImageHint('');
        setIsPublished(false);
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500 * 1024) { // 500KB limit
            toast({
                variant: 'destructive',
                title: 'Image too large',
                description: 'Please upload an image smaller than 500KB.',
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setter(reader.result as string);
        };
        reader.readAsDataURL(file);
    };


    const handleAddPost = async () => {
        if (!title || !content || !author) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out title, content, and author.' });
            return;
        }
        if (!firestore) return;
        setIsLoading(true);

        const slug = createSlug(title);
        const newPost = {
            title,
            slug,
            content,
            description,
            author,
            imageUrl,
            imageHint,
            isPublished,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        
        await addDocumentNonBlocking(collection(firestore, 'blogs'), newPost);

        toast({ title: 'Blog Post Added!', description: `"${title}" has been created.` });
        resetForm();
        setIsLoading(false);
    };
    
    const handleUpdatePost = async () => {
        if (!editingPost || !firestore) return;
        setIsLoading(true);

        const postRef = doc(firestore, 'blogs', editingPost.id);
        const updatedData = {
            ...editingPost,
            slug: createSlug(editingPost.title),
            updatedAt: serverTimestamp(),
        };

        await updateDocumentNonBlocking(postRef, updatedData);
        toast({ title: 'Post Updated', description: `"${editingPost.title}" has been saved.` });
        setEditingPost(null);
        setIsLoading(false);
    };

    const handleDeletePost = async (postId: string) => {
        if (!firestore) return;
        const postRef = doc(firestore, 'blogs', postId);
        await deleteDocumentNonBlocking(postRef);
        toast({ title: 'Post Deleted', description: 'The blog post has been permanently removed.' });
    };

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Manage Blog</h1>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Add New Post</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" disabled={isLoading} /></div>
                            <div className="space-y-2"><Label htmlFor="description">Short Description</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief summary for the blog list page." disabled={isLoading} /></div>
                            <div className="space-y-2"><Label htmlFor="content">Content</Label><Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your blog post content here. Use markdown for formatting." rows={10} disabled={isLoading} /></div>
                             <div className="space-y-2">
                                <Label>Featured Image</Label>
                                {imageUrl ? (
                                    <div className="relative aspect-video">
                                        <Image src={imageUrl} alt="Blog post image" fill className="object-cover rounded-md border" />
                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setImageUrl('')} disabled={isLoading}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <Label htmlFor="image-upload" className={cn("flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-background text-muted-foreground hover:border-primary hover:text-primary", isLoading && "cursor-not-allowed opacity-50")}>
                                        <FileUp className="h-8 w-8" />
                                        <span>Upload Image</span>
                                    </Label>
                                )}
                                <Input id="image-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setImageUrl)} className="hidden" disabled={isLoading} />
                                <p className="text-xs text-muted-foreground">Recommended size: 1200x630px. Max 500KB.</p>
                            </div>
                            <div className="space-y-2"><Label htmlFor="imageHint">Image Hint</Label><Input id="imageHint" value={imageHint} onChange={(e) => setImageHint(e.target.value)} placeholder="e.g., person writing" disabled={isLoading} /></div>
                            <div className="space-y-2"><Label htmlFor="author">Author</Label><Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={isLoading} /></div>
                            <div className="flex items-center space-x-2"><Switch id="isPublished" checked={isPublished} onCheckedChange={setIsPublished} disabled={isLoading} /><Label htmlFor="isPublished">Publish immediately</Label></div>
                            <Button onClick={handleAddPost} disabled={isLoading} className="w-full">{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Add Post</Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader><CardTitle>Existing Posts</CardTitle><CardDescription>View, edit, or delete existing blog posts.</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Author</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoadingPosts ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading posts...</TableCell></TableRow>
                                    ) : sortedBlogPosts && sortedBlogPosts.length > 0 ? sortedBlogPosts.map((post) => (
                                        <TableRow key={post.id}>
                                            <TableCell className="font-medium">{post.title}</TableCell>
                                            <TableCell><Badge variant={post.isPublished ? 'default' : 'secondary'}>{post.isPublished ? 'Published' : 'Draft'}</Badge></TableCell>
                                            <TableCell>{post.author}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingPost(post)}><FileEdit className="h-4 w-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the post titled "{post.title}".</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePost(post.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                         <TableRow><TableCell colSpan={4} className="h-24 text-center">No blog posts found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader><DialogTitle>Edit Blog Post</DialogTitle><DialogDescription>Make changes to your post here. Click save when you're done.</DialogDescription></DialogHeader>
                    {editingPost && (
                        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                            <div className="space-y-2"><Label htmlFor="edit-title">Title</Label><Input id="edit-title" value={editingPost.title} onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-description">Short Description</Label><Textarea id="edit-description" value={editingPost.description} onChange={(e) => setEditingPost({ ...editingPost, description: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-content">Content</Label><Textarea id="edit-content" value={editingPost.content} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} rows={12} /></div>
                            <div className="space-y-2">
                                <Label>Featured Image</Label>
                                {editingPost.imageUrl ? (
                                    <div className="relative aspect-video">
                                        <Image src={editingPost.imageUrl} alt="Blog post image" fill className="object-cover rounded-md border" />
                                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setEditingPost({...editingPost, imageUrl: ''})} disabled={isLoading}><X className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <Label htmlFor="edit-image-upload" className={cn("flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-input bg-background text-muted-foreground hover:border-primary hover:text-primary", isLoading && "cursor-not-allowed opacity-50")}>
                                        <FileUp className="h-8 w-8" />
                                        <span>Upload Image</span>
                                    </Label>
                                )}
                                <Input id="edit-image-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (val) => setEditingPost({...editingPost!, imageUrl: val}))} className="hidden" disabled={isLoading} />
                            </div>
                            <div className="space-y-2"><Label htmlFor="edit-imageHint">Image Hint</Label><Input id="edit-imageHint" value={editingPost.imageHint} onChange={(e) => setEditingPost({ ...editingPost, imageHint: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-author">Author</Label><Input id="edit-author" value={editingPost.author} onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })} /></div>
                            <div className="flex items-center space-x-2"><Switch id="edit-isPublished" checked={editingPost.isPublished} onCheckedChange={(checked) => setEditingPost({ ...editingPost, isPublished: checked })} /><Label htmlFor="edit-isPublished">Published</Label></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
                        <Button onClick={handleUpdatePost} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
