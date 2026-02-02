
'use client';

import { notFound, useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import StorePageContent from '@/app/[slug]/page'; // Re-using the content component

export default function InvestBusinessProfilePage() {
    const params = useParams();
    const businessId = params.businessId as string;
    const firestore = useFirestore();

    const businessProfileRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businessProfiles', businessId);
    }, [firestore, businessId]);

    const { data: businessData, isLoading } = useDoc(businessProfileRef);
    
    if (isLoading) {
        // You can return a more specific loading skeleton for this page if desired
        return <StorePageContent.Skeleton />;
    }

    if (!businessData) {
        notFound();
    }

    // We pass the fetched businessId to the existing StorePageContent component.
    // This re-uses the entire UI from the public slug page.
    return <StorePageContent businessId={businessId} />;
}

    