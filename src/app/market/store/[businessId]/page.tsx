'use client';
import { useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import MarketLayout from '@/components/app/market-layout';

interface BusinessProfile {
    slug?: string;
}

export default function StoreIdPage() {
    const params = useParams();
    const router = useRouter();
    const businessId = params.businessId as string;
    const firestore = useFirestore();

    const businessProfileRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businessProfiles', businessId);
    }, [firestore, businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<BusinessProfile>(businessProfileRef);
    
    useEffect(() => {
        if (!isLoadingBusiness) {
            if (businessData?.slug) {
                router.replace(`/${businessData.slug}`);
            } else if (!businessData) {
                // If there's no business data after loading, it means this ID is invalid.
                notFound();
            }
            // If there's business data but no slug, this page might still be used,
            // though the goal is to transition to slugs. So we don't call notFound() here.
        }
    }, [isLoadingBusiness, businessData, router]);

    // Show a loader while we figure out where to redirect or if the page is valid
    return (
        <MarketLayout>
            <div className="w-full max-w-6xl space-y-8">
                 <Skeleton className="h-48 md:h-64 w-full" />
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                         <div key={i} className="space-y-2">
                             <Skeleton className="aspect-square w-full" />
                             <Skeleton className="h-5 w-3/4" />
                             <Skeleton className="h-6 w-1/2" />
                         </div>
                    ))}
                </div>
            </div>
        </MarketLayout>
    );
}
