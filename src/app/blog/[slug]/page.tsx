'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPostBySlug, blogPosts } from '@/lib/blog-posts';
import InvestorLayout from '@/components/app/investor-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function BlogPostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const post = getPostBySlug(slug);
    
    const otherPosts = blogPosts.filter(p => p.slug !== slug).slice(0, 2);

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
                                src={post.imageUrl}
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
                            {otherPosts.map((p) => (
                                 <Link href={`/blog/${p.slug}`} key={p.slug} className="block group">
                                     <Card className="h-full flex flex-col overflow-hidden hover:border-primary transition-colors duration-200">
                                         <div className="aspect-video relative overflow-hidden">
                                             <Image
                                                src={p.imageUrl}
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
