'use client';

import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Banknote, Building, Calendar, Hash, Percent, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';

interface Investment {
    id: string;
    businessName: string;
    businessId: string;
    amount: number;
    type: 'Profit Sharing' | 'Equity';
    status: string;
    terms: {
        profitShare?: number;
        duration?: number;
        equity?: number;
        valuation?: number;
    };
    createdAt: {
        toDate: () => Date;
    };
}

interface Business {
    name: string;
    type: string;
    currency: string;
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" | "success" } = {
    'Active': 'default',
    'Pending Funding': 'destructive',
    'Completed': 'secondary',
    'Pending Acceptance': 'outline',
    'Rejected': 'destructive',
    'Cancelled': 'destructive',
};

const DataPoint = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number; }) => (
    <div className="flex justify-between items-center">
        <span className="text-muted-foreground flex items-center gap-2"><Icon className="w-4 h-4"/>{label}</span>
        <span className="font-semibold">{value}</span>
    </div>
);


export default function InvestmentDetailsContent({ investmentId }: { investmentId: string }) {
    const firestore = useFirestore();

    const investmentRef = useMemoFirebase(() => {
        if (!firestore || !investmentId) return null;
        return doc(firestore, 'investments', investmentId);
    }, [firestore, investmentId]);

    const { data: investment, isLoading: isLoadingInvestment } = useDoc<Investment>(investmentRef);

    const businessRef = useMemoFirebase(() => {
        if (!firestore || !investment?.businessId) return null;
        return doc(firestore, 'businesses', investment.businessId);
    }, [firestore, investment?.businessId]);

    const { data: business, isLoading: isLoadingBusiness } = useDoc<Business>(businessRef);

    const currency = business?.currency || '₦';
    const isLoading = isLoadingInvestment || isLoadingBusiness;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <Link href="/investor/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>
            
            {isLoading ? (
                <Skeleton className="h-96 w-full" />
            ) : !investment || !business ? (
                <Card>
                    <CardContent className="p-10 text-center text-muted-foreground">
                        Investment details not found.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Investment Summary</CardTitle>
                            <CardDescription>Details of your investment in {investment.businessName}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <DataPoint icon={Hash} label="Investment ID" value={investment.id} />
                            <Separator />
                            <DataPoint icon={Banknote} label="Amount Invested" value={`${currency}${investment.amount.toLocaleString()}`} />
                             <Separator />
                            <DataPoint icon={Calendar} label="Date Initiated" value={investment.createdAt.toDate().toLocaleDateString()} />
                             <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4"/>Status</span>
                                <Badge variant={statusVariant[investment.status] || 'default'}>{investment.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Offer Terms</CardTitle>
                             <CardDescription>{investment.type}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            {investment.type === 'Profit Sharing' && investment.terms.profitShare && (
                                <DataPoint icon={Percent} label="Profit Share" value={`${investment.terms.profitShare}%`} />
                            )}
                            {investment.type === 'Profit Sharing' && investment.terms.duration && (
                                 <DataPoint icon={Calendar} label="Duration" value={`${investment.terms.duration} months`} />
                            )}
                            {investment.type === 'Equity' && investment.terms.equity && (
                                 <DataPoint icon={Percent} label="Equity Offered" value={`${investment.terms.equity}%`} />
                            )}
                             {investment.type === 'Equity' && investment.terms.valuation && (
                                 <DataPoint icon={Banknote} label="Valuation" value={`${currency}${investment.terms.valuation.toLocaleString()}`} />
                            )}
                        </CardContent>
                    </Card>
                     <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Business Details</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                           <div className="space-y-1">
                               <p className="font-bold text-lg">{business.name}</p>
                               <p className="text-muted-foreground capitalize flex items-center gap-2"><Building className="w-4 h-4"/> {business.type}</p>
                           </div>
                           <Link href={`/invest/${investment.businessId}`} passHref>
                                <Button variant="secondary">View Public Profile</Button>
                           </Link>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
