'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import InvestorLayout from '@/components/app/investor-layout';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  date: string; // Keep as string for simplicity, can be converted from Timestamp
  imageUrl: string;
  imageHint: string;
  createdAt: any; // Firestore Timestamp
}

const BlogSkeleton = () => (
    [...Array(3)].map((_, i) => (
        <Card key={i} className="h-full flex flex-col overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <Skeleton className="h-8 w-24 mt-4" />
            </CardContent>
        </Card>
    ))
);


export default function BlogPage() {
    const firestore = useFirestore();

    const blogQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'blogs'), 
            where('isPublished', '==', true),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: blogPosts, isLoading } = useCollection<BlogPost>(blogQuery);

    const formattedPosts = blogPosts?.map(post => ({
        ...post,
        date: post.createdAt.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    })) || [];

    return (
        <InvestorLayout>
            <div className="container mx-auto px-4 py-12 sm:py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
                        Busmo Blog
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Tips, insights, and stories to help you grow your small business.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? <BlogSkeleton /> : formattedPosts.map((post) => (
                        <Link href={`/blog/${post.slug}`} key={post.slug} className="block group">
                            <Card className="h-full flex flex-col overflow-hidden hover:border-primary transition-colors duration-200">
                                <div className="aspect-video relative overflow-hidden">
                                     <Image
                                        src={post.imageUrl || 'https://picsum.photos/seed/placeholder/800/400'}
                                        alt={post.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint={post.imageHint}
                                    />
                                </div>
                                <CardHeader>
                                    <CardTitle>{post.title}</CardTitle>
                                    <CardDescription>{post.date} &bull; by {post.author}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    <p className="text-muted-foreground flex-1">{post.description}</p>
                                    <div className="mt-4">
                                        <Button variant="link" className="p-0 h-auto">Read More &rarr;</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
                 {!isLoading && formattedPosts.length === 0 && (
                    <div className="text-center col-span-full py-20">
                        <p className="text-muted-foreground">No blog posts have been published yet. Check back soon!</p>
                    </div>
                )}
            </div>
        </InvestorLayout>
    );
}
