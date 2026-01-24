'use client';

import { useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import MarketLayout from '@/components/app/market-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';


interface BusinessProfile {
    id: string;
}

// A list of reserved route names to prevent conflicts
const RESERVED_PATHS = [
    'add-inventory', 'add-product', 'admin', 'blog', 'business-info', 
    'currency', 'invest', 'investor', 'login', 'market', 'owner', 'page', 
    'plans', 'pricing', 'record-expense', 'record-sale', 'role', 
    'signup', 'staff', 'welcome', 'public', 'assets', 'api', 'favicon.ico'
];

export default function StoreSlugPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const firestore = useFirestore();

    // Prevent this page from matching reserved routes like /login, /admin, etc.
    if (RESERVED_PATHS.includes(slug)) {
        notFound();
    }

    const businessProfileQuery = useMemoFirebase(() => {
        if (!firestore || !slug) return null;
        return query(collection(firestore, 'businessProfiles'), where('slug', '==', slug), limit(1));
    }, [firestore, slug]);
    const { data: businessData, isLoading } = useCollection<BusinessProfile>(businessProfileQuery);
    
    const businessProfile = businessData?.[0];

    useEffect(() => {
        if (!isLoading) {
            if (businessProfile) {
                // We found the business by slug, now redirect to the canonical ID-based URL.
                router.replace(`/market/store/${businessProfile.id}`);
            } else {
                // If no business is found for this slug after loading, it's a 404.
                notFound();
            }
        }
    }, [isLoading, businessProfile, router]);
    
    // Show a loader while we find the business and redirect.
    return (
        <MarketLayout>
            <div className="w-full max-w-6xl">
                 <Card className="overflow-hidden mb-8">
                    <Skeleton className="h-48 md:h-64 w-full" />
                    <CardContent className="p-6 space-y-2">
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-5 w-1/4" />
                    </CardContent>
                </Card>
                 <Skeleton className="h-8 w-1/3 mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                         <Card key={i} className="overflow-hidden h-full flex flex-col">
                            <Skeleton className="aspect-video w-full" />
                            <CardContent className="p-4 flex-1 flex flex-col">
                                <Skeleton className="h-6 mt-4 w-3/4" />
                                <Skeleton className="h-8 mt-2 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </MarketLayout>
    );
}
