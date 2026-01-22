'use client';

import InvestorLayout from '@/components/app/investor-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Building } from 'lucide-react';
import { useParams } from 'next/navigation';


export default function BusinessProfilePage() {
    const params = useParams();
    const businessId = params.businessId as string;
    
    return (
        <InvestorLayout>
            <div className="container mx-auto px-4 py-16 text-center">
                <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h1 className="text-4xl font-bold font-headline">Business Not Found</h1>
                <p className="text-lg text-muted-foreground mt-2">The requested business profile could not be located or is not yet available.</p>
                <Link href="/invest">
                    <Button className="mt-6">Back to Opportunities</Button>
                </Link>
            </div>
        </InvestorLayout>
    );
}
