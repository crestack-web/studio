'use client';
import { useMemo } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Banknote, CreditCard, Download, Rocket, TrendingUp, Wallet, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { formatCurrency } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';

interface AppUser {
    businessId?: string;
}

interface Business {
    currency?: string;
}

interface Payout {
    id: string;
    orderId: string;
    amount: number;
    status: 'processing' | 'paid' | 'failed';
    createdAt: {
        toDate: () => Date;
    };
}


const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    processing: 'secondary',
    paid: 'default',
    failed: 'destructive',
};


export default function BusmoPayDashboard() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, `users/${authUser.uid}`);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, `businesses/${businessId}`);
    }, [firestore, businessId]);
    const { data: businessData } = useDoc<Business>(businessRef);
    
    const payoutsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, `businesses/${businessId}/payouts`));
    }, [firestore, businessId]);

    const { data: payouts, isLoading: isLoadingPayouts } = useCollection<Payout>(payoutsQuery);

    const sortedPayouts = useMemo(() => {
        if (!payouts) return [];
        return [...payouts].sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
        });
    }, [payouts]);

    const currency = businessData?.currency;

    const totalPaidOut = sortedPayouts?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0;
    const pendingPayouts = sortedPayouts?.filter(p => p.status === 'processing').reduce((sum, p) => sum + p.amount, 0) || 0;


    return (
        <MainLayout title="BusmoPay Dashboard" backHref="/owner/home">
            <div className="w-full max-w-5xl space-y-6">
                <Alert>
                    <Rocket className="h-4 w-4" />
                    <AlertTitle>Welcome to BusmoPay!</AlertTitle>
                    <AlertDescription>
                       Track your earnings from online sales. Payouts are initiated automatically when you mark an order as fulfilled.
                    </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Wallet className="w-5 h-5"/>Total Paid Out</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingPayouts ? <Skeleton className="h-9 w-36"/> : <p className="text-3xl font-bold">{formatCurrency(totalPaidOut, currency)}</p>}
                            <p className="text-xs text-muted-foreground">Earnings deposited to your bank account.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5"/>Pending Payouts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingPayouts ? <Skeleton className="h-9 w-32"/> : <p className="text-3xl font-bold">{formatCurrency(pendingPayouts, currency)}</p>}
                            <p className="text-xs text-muted-foreground">From fulfilled orders, processing.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Payout History</CardTitle>
                            <CardDescription>Your recent payouts from completed orders.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" size="sm" disabled><Download className="mr-2 h-4 w-4" />Export CSV</Button>
                             <Button size="sm" asChild><Link href="/owner/market?section=busmopay">Payout Settings</Link></Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingPayouts ? [...Array(3)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16 rounded-full"/></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto"/></TableCell>
                                    </TableRow>
                                )) : sortedPayouts && sortedPayouts.length > 0 ? sortedPayouts.map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell>{payout.createdAt.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono text-xs">#{payout.orderId.substring(0, 7)}</TableCell>
                                        <TableCell>
                                             <Badge variant={statusVariant[payout.status]} className="capitalize">
                                                {payout.status === 'paid' && <CheckCircle2 className="mr-1 h-3 w-3"/>}
                                                {payout.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(payout.amount, currency)}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No payouts yet. Fulfill an online order to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
