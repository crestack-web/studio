
'use client';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Banknote, CreditCard, Download, Rocket, TrendingUp, Wallet, CheckCircle2, ShoppingCart, HelpCircle, Loader2, ArrowRight, Calendar as CalendarIcon, ChevronDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { formatCurrency } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format, subDays, eachDayOfInterval, toDate } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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

const StatCard = ({
    title,
    value,
    isLoading,
    currency,
    note,
    icon,
    children,
}: {
    title: string;
    value: number;
    isLoading: boolean;
    currency?: string;
    note?: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
}) => (
    <Card className="bg-muted/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            {icon ? <div className="text-muted-foreground">{icon}</div> : null}
        </CardHeader>
        <CardContent className="space-y-1">
            {isLoading ? (
                <Skeleton className="h-9 w-3/4" />
            ) : (
                <p className="text-2xl font-semibold tracking-tight">{formatCurrency(value, currency)}</p>
            )}
            {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
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
            <ResponsiveContainer width="100%" height={200}>
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
    const router = useRouter();
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const [isAboutOpen, setIsAboutOpen] = useState(false);
    const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
    const [isProcessingPayout, setIsProcessingPayout] = useState(false);
    const [date, setDate] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

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

        const startDate = date?.from || subDays(new Date(), 29);
        const endDate = date?.to || new Date();
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const dailyRevenue = new Map<string, number>(days.map(d => [format(d, 'yyyy-MM-dd'), 0]));

        successfulTxns.forEach(tx => {
            if (tx.createdAt) {
                const txDate = tx.createdAt.toDate();
                if (txDate >= startDate && txDate <= endDate) {
                    const dateStr = format(txDate, 'yyyy-MM-dd');
                    if (dailyRevenue.has(dateStr)) {
                        dailyRevenue.set(dateStr, dailyRevenue.get(dateStr)! + tx.amount);
                    }
                }
            }
        });
        const _chartData = Array.from(dailyRevenue.entries()).map(([dateStr, revenue]) => ({ date: toDate(dateStr), revenue })).sort((a,b) => a.date.getTime() - b.date.getTime());


        return {
            totalRevenue: _totalRevenue,
            totalPaidOut: _totalPaidOut,
            availableForPayout: _availableForPayout > 0 ? _availableForPayout : 0,
            comingSoon: _comingSoon,
            chartData: _chartData,
        };
    }, [transactions, payouts, orders, date]);

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
        return (
            <main className="flex-1 p-4 sm:p-6">
                <header className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push('/owner/home')} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-lg font-semibold">BusmoPay</h1>
                </header>
                <div className="w-full space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </main>
        );
    }

    if (businessData && businessData.country !== 'NG') {
        return (
            <main className="flex-1 p-4 sm:p-6">
                <header className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push('/owner/home')} className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-lg font-semibold">BusmoPay</h1>
                </header>
                <div className="w-full max-w-lg text-center">
                    <Card>
                        <CardHeader>
                            <CardTitle>Coming Soon!</CardTitle>
                            <CardDescription>BusmoPay is currently available only for businesses in Nigeria.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">We are working hard to bring BusmoPay to your country. Stay tuned for updates!</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        );
    }
    
    return (
        <main className="flex-1 p-4 sm:p-6">
            <header className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => router.push('/owner/home')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-lg font-semibold">BusmoPay</h1>
            </header>
            <div className="w-full space-y-6">
                <Collapsible open={isAboutOpen} onOpenChange={setIsAboutOpen}>
                    <Card>
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> About BusmoPay</CardTitle>
                                <CardDescription>
                                    BusmoPay collects money from your customers, confirms the payment for the order, then pays out your earnings.
                                </CardDescription>
                            </div>
                            <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 self-start">
                                    {isAboutOpen ? 'Hide details' : 'Show details'}
                                    <ChevronDown className={cn('h-4 w-4', isAboutOpen ? 'rotate-180' : 'rotate-0')} />
                                </Button>
                            </CollapsibleTrigger>
                        </CardHeader>
                        <CollapsibleContent>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-lg border p-4">
                                        <div className="flex items-center gap-2 font-semibold"><CreditCard className="h-4 w-4 text-primary" /> Collect</div>
                                        <p className="mt-1 text-sm text-muted-foreground">Customers pay online during checkout. The payment is recorded as a BusmoPay transaction.</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <div className="flex items-center gap-2 font-semibold"><ShoppingCart className="h-4 w-4 text-primary" /> Confirm</div>
                                        <p className="mt-1 text-sm text-muted-foreground">Successful payments move the order forward so you can prepare, ship, or deliver with confidence.</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <div className="flex items-center gap-2 font-semibold"><Banknote className="h-4 w-4 text-primary" /> Settle</div>
                                        <p className="mt-1 text-sm text-muted-foreground">After you fulfill the order, your earnings are paid out to your verified bank account.</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Card className="bg-muted/30">
                                        <CardHeader>
                                            <CardTitle className="text-base">How money flows</CardTitle>
                                            <CardDescription>Simple, auditable movement of funds.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="text-sm text-muted-foreground space-y-2">
                                            <p><span className="font-medium text-foreground">1)</span> Buyer pays via BusmoPay during checkout.</p>
                                            <p><span className="font-medium text-foreground">2)</span> BusmoPay records the transaction and updates the order payment status.</p>
                                            <p><span className="font-medium text-foreground">3)</span> When the order is fulfilled, BusmoPay triggers settlement.</p>
                                            <p><span className="font-medium text-foreground">4)</span> Payout is sent to your verified bank account (minus Busmo commission).</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-muted/30">
                                        <CardHeader>
                                            <CardTitle className="text-base">Where BusmoPay is used</CardTitle>
                                            <CardDescription>Across Busmo commerce features that accept online payments.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="text-sm text-muted-foreground space-y-2">
                                            <p><span className="font-medium text-foreground">•</span> Online checkout on your Busmo Storefront / Market orders.</p>
                                            <p><span className="font-medium text-foreground">•</span> Transaction history for reconciliation and reporting.</p>
                                            <p><span className="font-medium text-foreground">•</span> Payouts to your bank account after fulfillment.</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Alert>
                                    <HelpCircle className="h-4 w-4" />
                                    <AlertTitle>Payout timeline & fees</AlertTitle>
                                    <AlertDescription>
                                        After you fulfill an order, earnings (minus a 10% commission) are settled to your verified bank account within 24–48 hours.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Available for Payout"
                        value={availableForPayout}
                        isLoading={isLoading}
                        currency={currency}
                        icon={<Wallet className="h-4 w-4" />}
                    >
                        <Button size="sm" className="mt-2 w-full" onClick={handleRequestPayout}>Request Payout</Button>
                        <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                            <Link href="/owner/market?section=busmopay">Payout Settings</Link>
                        </Button>
                    </StatCard>
                    <StatCard
                        title="Coming Soon"
                        value={comingSoon}
                        isLoading={isLoading}
                        currency={currency}
                        note="Estimated from confirmed orders"
                        icon={<CalendarIcon className="h-4 w-4" />}
                    />
                    <StatCard
                        title="Total Revenue"
                        value={totalRevenue}
                        isLoading={isLoading}
                        currency={currency}
                        note="All-time online sales"
                        icon={<CreditCard className="h-4 w-4" />}
                    />
                    <StatCard
                        title="Total Paid Out"
                        value={totalPaidOut}
                        isLoading={isLoading}
                        currency={currency}
                        note="Sent to your bank"
                        icon={<Banknote className="h-4 w-4" />}
                    />
                </div>
                
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <CardTitle>Revenue Over Time</CardTitle>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full sm:w-[260px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} -{" "}
                                                {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-[200px] w-full" /> : <RevenueChart data={chartData} currency={currency} />}
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>Your recent BusmoPay transactions.</CardDescription>
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
                        <CardHeader>
                            <CardTitle>Payout History</CardTitle>
                            <CardDescription>Your recent payouts from completed orders.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Order ID</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoading ? [...Array(3)].map((_, i) => (
                                        <TableRow key={i}><TableCell><Skeleton className="h-5 w-24"/></TableCell><TableCell><Skeleton className="h-5 w-20"/></TableCell><TableCell><Skeleton className="h-6 w-16 rounded-full"/></TableCell><TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto"/></TableCell></TableRow>
                                    )) : payouts && payouts.length > 0 ? payouts.slice(0, 5).map((payout) => (
                                        <TableRow key={payout.id}><TableCell>{payout.createdAt.toDate().toLocaleDateString()}</TableCell><TableCell className="font-mono text-xs">#{payout.orderId.substring(0, 7)}</TableCell><TableCell><Badge variant={payoutStatusVariant[payout.status]} className="capitalize">{payout.status === 'paid' && <CheckCircle2 className="mr-1 h-3 w-3"/>}{payout.status}</Badge></TableCell><TableCell className="text-right font-medium">{formatCurrency(payout.amount, currency)}</TableCell></TableRow>
                                    )) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">No payouts yet.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
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
        </main>
    );
}
