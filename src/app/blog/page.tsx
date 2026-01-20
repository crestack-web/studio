'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { blogPosts } from '@/lib/blog-posts';
import InvestorLayout from '@/components/app/investor-layout';

export default function BlogPage() {
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
                    {blogPosts.map((post) => (
                        <Link href={`/blog/${post.slug}`} key={post.slug} className="block group">
                            <Card className="h-full flex flex-col overflow-hidden hover:border-primary transition-colors duration-200">
                                <div className="aspect-video relative overflow-hidden">
                                     <Image
                                        src={post.imageUrl}
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
            </div>
        </InvestorLayout>
    );
}
