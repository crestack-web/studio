'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, serverTimestamp, orderBy } from 'firebase/firestore';
import { Loader2, Plus, FileEdit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    author: string;
    createdAt: any;
}

export default function AdminBlogPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [author, setAuthor] = useState('Busmo Team');
    const [imageUrl, setImageUrl] = useState('');
    const [imageHint, setImageHint] = useState('');
    const [isPublished, setIsPublished] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const blogPostsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'blogs'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: blogPosts, isLoading: isLoadingPosts } = useCollection<BlogPost>(blogPostsQuery);
    
    const createSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const handleAddPost = async () => {
        if (!title || !content || !author) {
            toast({ variant: 'destructive', title: 'Missing fields', description: 'Please fill out title, content, and author.' });
            return;
        }
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
        setTitle('');
        setContent('');
        setDescription('');
        setImageUrl('');
        setImageHint('');
        setIsPublished(false);
        setIsLoading(false);
    };

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-bold font-headline">Manage Blog</h1>
            
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Post</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" disabled={isLoading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Short Description</Label>
                                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A brief summary for the blog list page." disabled={isLoading} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your blog post content here. Use newline characters for paragraphs." rows={6} disabled={isLoading} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="imageUrl">Image URL</Label>
                                <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://picsum.photos/..." disabled={isLoading} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="imageHint">Image Hint</Label>
                                <Input id="imageHint" value={imageHint} onChange={(e) => setImageHint(e.target.value)} placeholder="e.g., person writing" disabled={isLoading} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="author">Author</Label>
                                <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={isLoading} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="isPublished" checked={isPublished} onCheckedChange={setIsPublished} disabled={isLoading} />
                                <Label htmlFor="isPublished">Publish immediately</Label>
                            </div>
                             <Button onClick={handleAddPost} disabled={isLoading} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Add Post
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle>Existing Posts</CardTitle>
                            <CardDescription>View, edit, or delete existing blog posts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Author</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingPosts ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading posts...</TableCell></TableRow>
                                    ) : blogPosts && blogPosts.length > 0 ? blogPosts.map((post) => (
                                        <TableRow key={post.id}>
                                            <TableCell className="font-medium">{post.title}</TableCell>
                                            <TableCell>
                                                <Badge variant={post.isPublished ? 'default' : 'secondary'}>
                                                    {post.isPublished ? 'Published' : 'Draft'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{post.author}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><FileEdit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
        </main>
    );
}
