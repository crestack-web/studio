'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import InvestorLayout from '@/components/app/investor-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { BlogPost } from '../page';


export default function BlogPostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const firestore = useFirestore();

    const postQuery = useMemoFirebase(() => {
        if (!firestore || !slug) return null;
        return query(collection(firestore, 'blogs'), where('slug', '==', slug), limit(1));
    }, [firestore, slug]);
    const { data: postData, isLoading: isLoadingPost } = useCollection<BlogPost>(postQuery);
    
    const post = postData?.[0] ? {
        ...postData[0],
        date: postData[0].createdAt.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    } : null;

    const otherPostsQuery = useMemoFirebase(() => {
        if (!firestore || !slug) return null;
        return query(
            collection(firestore, 'blogs'), 
            where('slug', '!=', slug),
            where('isPublished', '==', true),
            orderBy('slug', 'asc'), // to have some order
            orderBy('createdAt', 'desc'),
            limit(2)
        );
    }, [firestore, slug]);
    const { data: otherPostsData, isLoading: isLoadingOthers } = useCollection<BlogPost>(otherPostsQuery);
    
    const otherPosts = otherPostsData?.map(p => ({
         ...p,
        date: p.createdAt.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    })) || [];

    if (isLoadingPost) {
        return (
            <InvestorLayout>
                <div className="container mx-auto px-4 py-12 sm:py-16">
                    <div className="max-w-4xl mx-auto">
                        <Skeleton className="h-6 w-48 mb-8" />
                        <Skeleton className="h-12 w-3/4 mb-4" />
                        <Skeleton className="h-6 w-1/2 mb-8" />
                        <Skeleton className="aspect-video w-full mb-8" />
                        <div className="space-y-4">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-5/6" />
                        </div>
                    </div>
                </div>
            </InvestorLayout>
        );
    }
    
    if (!post) {
        return (
            <InvestorLayout>
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-4xl font-bold">Post not found</h1>
                    <Link href="/blog">
                        <Button variant="link" className="mt-4">Back to Blog</Button>
                    </Link>
                </div>
            </InvestorLayout>
        );
    }

    return (
        <InvestorLayout>
            <div className="container mx-auto px-4 py-12 sm:py-16">
                <div className="max-w-4xl mx-auto">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        Back to all articles
                    </Link>

                    <article>
                        <header className="space-y-4 mb-8">
                            <h1 className="text-4xl font-bold tracking-tight font-headline sm:text-5xl">
                                {post.title}
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                {post.date} &bull; by {post.author}
                            </p>
                        </header>

                        <div className="aspect-video relative overflow-hidden rounded-lg mb-8">
                             <Image
                                src={post.imageUrl || 'https://picsum.photos/seed/placeholder/800/400'}
                                alt={post.title}
                                fill
                                className="object-cover"
                                data-ai-hint={post.imageHint}
                            />
                        </div>

                        <div className="prose dark:prose-invert max-w-none text-lg text-foreground/90 leading-relaxed whitespace-pre-wrap">
                            {post.content}
                        </div>
                    </article>
                    
                    <div className="mt-16 pt-12 border-t">
                        <h2 className="text-2xl font-bold font-headline mb-6">More Articles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {isLoadingOthers ? (
                                <>
                                    <Card><Skeleton className="aspect-video"/><CardHeader><Skeleton className="h-6 w-3/4"/><Skeleton className="h-4 w-1/2 mt-2"/></CardHeader></Card>
                                    <Card><Skeleton className="aspect-video"/><CardHeader><Skeleton className="h-6 w-3/4"/><Skeleton className="h-4 w-1/2 mt-2"/></CardHeader></Card>
                                </>
                           ) : otherPosts.map((p) => (
                                 <Link href={`/blog/${p.slug}`} key={p.slug} className="block group">
                                     <Card className="h-full flex flex-col overflow-hidden hover:border-primary transition-colors duration-200">
                                         <div className="aspect-video relative overflow-hidden">
                                             <Image
                                                src={p.imageUrl || 'https://picsum.photos/seed/placeholder/800/400'}
                                                alt={p.title}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                data-ai-hint={p.imageHint}
                                            />
                                         </div>
                                         <CardHeader>
                                             <CardTitle className="text-xl">{p.title}</CardTitle>
                                             <CardDescription>{p.date}</CardDescription>
                                         </CardHeader>
                                     </Card>
                                 </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </InvestorLayout>
    );
}
