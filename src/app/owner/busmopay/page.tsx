'use client';
import { useMemo, useState } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Banknote, CreditCard, Download, Rocket, TrendingUp, Wallet, CheckCircle2, ShoppingCart, HelpCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { formatCurrency } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, toDate } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface AppUser {
    businessId?: string;
}

interface Business {
    currency?: string;
    country?: string;
}

interface Order {
    id: string;
    total: number;
    status: 'pending' | 'confirmed' | 'in progress' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    payoutStatus?: 'unpaid' | 'processing' | 'paid';
}

interface SellerBankAccount {
    status: 'unverified' | 'pending' | 'verified' | 'failed';
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

interface PaymentTransaction {
    id: string;
    orderId: string;
    amount: number;
    status: 'pending' | 'successful' | 'failed';
    gateway: 'paystack';
    createdAt: {
        toDate: () => Date;
    };
}


const payoutStatusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    processing: 'secondary',
    paid: 'default',
    failed: 'destructive',
};

const transactionStatusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
    pending: 'secondary',
    successful: 'default',
    failed: 'destructive',
};

const StatCard = ({ title, value, isLoading, currency, note, children }: { title: string, value: number, isLoading: boolean, currency?: string, note?: string, children?: React.ReactNode }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-9 w-3/4" /> : <p className="text-2xl font-bold">{formatCurrency(value, currency)}</p>}
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
            {children}
        </CardContent>
    </Card>
);

const RevenueChart = ({ data, currency }: { data: any[], currency?: string }) => {
    const chartConfig = {
        revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    };

    return (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: -10 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => format(value, 'MMM d')} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value, currency).replace(/₦|CFA/g, '')} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
};


export default function BusmoPayDashboard() {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
    const [isProcessingPayout, setIsProcessingPayout] = useState(false);

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
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<Business>(businessRef);

    const bankAccountRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, `businesses/${businessId}/bankAccount`, 'primary');
    }, [firestore, businessId]);
    const { data: bankAccountData, isLoading: isLoadingBank } = useDoc<SellerBankAccount>(bankAccountRef);
    const isBankAccountVerified = bankAccountData?.status === 'verified';
    
    const payoutsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, `businesses/${businessId}/payouts`), orderBy('createdAt', 'desc'));
    }, [firestore, businessId]);
    const { data: payouts, isLoading: isLoadingPayouts } = useCollection<Payout>(payoutsQuery);
    
    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, `businesses/${businessId}/paymentTransactions`), orderBy('createdAt', 'desc'));
    }, [firestore, businessId]);
    const { data: transactions, isLoading: isLoadingTransactions } = useCollection<PaymentTransaction>(transactionsQuery);

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, `businesses/${businessId}/orders`));
    }, [firestore, businessId]);
    const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);

    const {
        totalRevenue,
        totalPaidOut,
        availableForPayout,
        comingSoon,
        chartData,
    } = useMemo(() => {
        const defaults = { totalRevenue: 0, totalPaidOut: 0, availableForPayout: 0, comingSoon: 0, chartData: [] };
        if (!transactions || !payouts || !orders) return defaults;

        const successfulTxns = transactions.filter(t => t.status === 'successful');
        const _totalRevenue = successfulTxns.reduce((sum, t) => sum + t.amount, 0);
        
        const _totalPaidOut = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
        const _pendingPayouts = payouts.filter(p => p.status === 'processing').reduce((sum, p) => sum + p.amount, 0);

        const _availableForPayout = _totalRevenue - _totalPaidOut - _pendingPayouts;

        const _comingSoon = orders
            .filter(o => o.payoutStatus === 'unpaid' && o.status === 'confirmed')
            .reduce((sum, o) => sum + o.total * 0.9, 0);

        const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
        const dailyRevenue = new Map<string, number>(days.map(d => [format(d, 'yyyy-MM-dd'), 0]));
        successfulTxns.forEach(tx => {
            if (tx.createdAt) {
                const dateStr = format(tx.createdAt.toDate(), 'yyyy-MM-dd');
                if (dailyRevenue.has(dateStr)) {
                    dailyRevenue.set(dateStr, dailyRevenue.get(dateStr)! + tx.amount);
                }
            }
        });
        const _chartData = Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({ date: toDate(date), revenue })).sort((a,b) => a.date.getTime() - b.date.getTime());

        return {
            totalRevenue: _totalRevenue,
            totalPaidOut: _totalPaidOut,
            availableForPayout: _availableForPayout > 0 ? _availableForPayout : 0,
            comingSoon: _comingSoon,
            chartData: _chartData,
        };
    }, [transactions, payouts, orders]);

    const handleRequestPayout = () => {
        if (availableForPayout <= 0) {
            toast({ title: "No funds available for payout.", variant: 'destructive' });
            return;
        }
        if (!isBankAccountVerified) {
            toast({ title: "Bank Account Not Verified", description: "Please verify your bank account in settings before requesting a payout.", variant: 'destructive'});
            return;
        }
        setIsPayoutDialogOpen(true);
    };

    const confirmPayoutRequest = () => {
        setIsProcessingPayout(true);
        setTimeout(() => {
            toast({ title: "Payout Requested!", description: `${formatCurrency(availableForPayout, businessData?.currency)} will be sent to your verified bank account within 24 hours.`});
            setIsProcessingPayout(false);
            setIsPayoutDialogOpen(false);
        }, 2000);
    };

    const currency = businessData?.currency;
    const isLoading = isLoadingBusiness || isLoadingPayouts || isLoadingTransactions || isLoadingOrders || isLoadingBank;
    
    if (isLoadingBusiness) {
        return <MainLayout title="BusmoPay Dashboard" backHref="/owner/home"><div className="w-full max-w-5xl space-y-6"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div></MainLayout>
    }

    if (businessData && businessData.country !== 'NG') {
        return (
            <MainLayout title="BusmoPay" backHref="/owner/home">
                <div className="w-full max-w-lg text-center"><Card><CardHeader><CardTitle>Coming Soon!</CardTitle><CardDescription>BusmoPay is currently available only for businesses in Nigeria.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">We are working hard to bring BusmoPay to your country. Stay tuned for updates!</p></CardContent></Card></div>
            </MainLayout>
        );
    }
    
    return (
        <MainLayout title="BusmoPay Dashboard" backHref="/owner/home">
            <div className="w-full max-w-5xl space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Available for Payout" value={availableForPayout} isLoading={isLoading} currency={currency}>
                        <Button size="sm" className="mt-2" onClick={handleRequestPayout}>Request Payout</Button>
                    </StatCard>
                    <StatCard title="Coming Soon" value={comingSoon} isLoading={isLoading} currency={currency} note="From confirmed orders" />
                    <StatCard title="Total Revenue" value={totalRevenue} isLoading={isLoading} currency={currency} note="All-time online sales" />
                    <StatCard title="Total Paid Out" value={totalPaidOut} isLoading={isLoading} currency={currency} note="Sent to your bank" />
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Over Time (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-[250px] w-full" /> : <RevenueChart data={chartData} currency={currency} />}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div><CardTitle>Transaction History</CardTitle><CardDescription>Your recent BusmoPay transactions.</CardDescription></div>
                        <div className="flex items-center gap-2"><Button size="sm" asChild><Link href="/owner/market?section=busmopay">Payout Settings</Link></Button></div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Order ID</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoading ? [...Array(3)].map((_, i) => (
                                    <TableRow key={i}><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell><Skeleton className="h-5 w-20"/></TableCell><TableCell><Skeleton className="h-6 w-24 rounded-full"/></TableCell><TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto"/></TableCell></TableRow>
                                )) : transactions && transactions.length > 0 ? transactions.slice(0, 5).map((tx) => (
                                    <TableRow key={tx.id}><TableCell>{tx.createdAt.toDate().toLocaleDateString()}</TableCell><TableCell className="font-mono text-xs">#{tx.orderId.substring(0, 7)}</TableCell><TableCell><Badge variant={transactionStatusVariant[tx.status]} className="capitalize">{tx.status}</Badge></TableCell><TableCell className="text-right font-medium">{formatCurrency(tx.amount, currency)}</TableCell></TableRow>
                                )) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">No transactions yet.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Payout History</CardTitle><CardDescription>Your recent payouts from completed orders.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Order ID</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoading ? [...Array(3)].map((_, i) => (
                                    <TableRow key={i}><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell><Skeleton className="h-5 w-20"/></TableCell><TableCell><Skeleton className="h-6 w-16 rounded-full"/></TableCell><TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto"/></TableCell></TableRow>
                                )) : sortedPayouts && sortedPayouts.length > 0 ? sortedPayouts.slice(0, 5).map((payout) => (
                                    <TableRow key={payout.id}><TableCell>{payout.createdAt.toDate().toLocaleDateString()}</TableCell><TableCell className="font-mono text-xs">#{payout.orderId.substring(0, 7)}</TableCell><TableCell><Badge variant={payoutStatusVariant[payout.status]} className="capitalize">{payout.status === 'paid' && <CheckCircle2 className="mr-1 h-3 w-3"/>}{payout.status}</Badge></TableCell><TableCell className="text-right font-medium">{formatCurrency(payout.amount, currency)}</TableCell></TableRow>
                                )) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">No payouts yet.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Request Payout</DialogTitle><DialogDescription>You are requesting a payout to your verified bank account.</DialogDescription></DialogHeader>
                    <div className="py-4 space-y-2">
                        <div className="flex justify-between items-baseline p-4 border rounded-md">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="text-2xl font-bold">{formatCurrency(availableForPayout, currency)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground px-1">Funds will be settled to your bank account within 24 hours.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)}>Cancel</Button>
                        <Button onClick={confirmPayoutRequest} disabled={isProcessingPayout}>
                            {isProcessingPayout && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Confirm Payout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
