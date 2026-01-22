'use client';

import React, { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, query, collection, Timestamp, where } from 'firebase/firestore';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { ShieldCheck, Printer, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';


interface AppUser {
    businessId?: string;
    displayName?: string;
}

interface Business {
    businessName: string;
    currency: string;
}

interface Sale {
    id: string;
    productId: string;
    productName: string;
    amount: number;
    quantity: number;
    timestamp: Timestamp;
}

interface Expense {
    id: string;
    category: string;
    title: string;
    amount: number;
    createdAt: Timestamp;
}

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    description: string;
    createdAt: Timestamp;
}

interface Product {
    id: string;
    name: string;
    cost: number;
    price: number;
}

const StatCard = ({ title, value, isLoading, currency = false, currencyCode, isProfit = false }: { title: string; value: number; isLoading: boolean; currency?: boolean; currencyCode?: string; isProfit?: boolean }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
                <p className={cn("text-2xl font-bold", isProfit && (value >= 0 ? 'text-success' : 'text-destructive'))}>
                    {currency ? formatCurrencyUtil(value, currencyCode) : value}
                </p>
            )}
        </CardContent>
    </Card>
);

function StatementContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromDateStr = searchParams.get('from');
    const toDateStr = searchParams.get('to');

    const dateRange = useMemo(() => {
        const from = fromDateStr ? new Date(fromDateStr) : undefined;
        const to = toDateStr ? new Date(toDateStr) : undefined;
        return { from, to };
    }, [fromDateStr, toDateStr]);

    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);

    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businesses', businessId);
    }, [firestore, businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<Business>(businessRef);

    const salesQuery = useMemoFirebase(() => {
        if (!firestore || !businessId || !dateRange.from || !dateRange.to) return null;
        return query(collection(firestore, `businesses/${businessId}/sales`), where('timestamp', '>=', dateRange.from), where('timestamp', '<=', dateRange.to));
    }, [firestore, businessId, dateRange]);
    const { data: salesData, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    
    const expensesQuery = useMemoFirebase(() => {
        if (!firestore || !businessId || !dateRange.from || !dateRange.to) return null;
        return query(collection(firestore, `businesses/${businessId}/expenses`), where('createdAt', '>=', dateRange.from), where('createdAt', '<=', dateRange.to));
    }, [firestore, businessId, dateRange]);
    const { data: expensesData, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId || !dateRange.from || !dateRange.to) return null;
        return query(collection(firestore, `businesses/${businessId}/transactions`), where('createdAt', '>=', dateRange.from), where('createdAt', '<=', dateRange.to));
    }, [firestore, businessId, dateRange]);
    const { data: transactionsData, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, `businesses/${businessId}/products`));
    }, [firestore, businessId]);
    const { data: productsData, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

    const { summary, sortedSales, sortedExpenses, sortedTransactions } = useMemo(() => {
        const emptyState = { 
            summary: { totalRevenue: 0, cogs: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0, totalDeposits: 0, totalWithdrawals: 0 }, 
            sortedSales: [], 
            sortedExpenses: [],
            sortedTransactions: []
        };
        if (!salesData || !productsData || !expensesData || !transactionsData) {
            return emptyState;
        }

        const totalRevenue = salesData.reduce((acc, sale) => acc + sale.amount, 0);
        const cogs = salesData.reduce((acc, sale) => {
            const product = productsData.find(p => p.id === sale.productId);
            return acc + (product ? product.cost * sale.quantity : 0);
        }, 0);
        const totalExpenses = expensesData.reduce((acc, exp) => acc + exp.amount, 0);
        const grossProfit = totalRevenue - cogs;
        const netProfit = grossProfit - totalExpenses;
        
        const totalDeposits = transactionsData.filter(t => t.type === 'deposit').reduce((acc, t) => acc + t.amount, 0);
        const totalWithdrawals = transactionsData.filter(t => t.type === 'withdrawal').reduce((acc, t) => acc + t.amount, 0);

        const sortedSales = [...salesData].sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis());
        const sortedExpenses = [...expensesData].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        const sortedTransactions = [...transactionsData].sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        return { 
            summary: { totalRevenue, cogs, grossProfit, totalExpenses, netProfit, totalDeposits, totalWithdrawals }, 
            sortedSales, 
            sortedExpenses,
            sortedTransactions 
        };
    }, [salesData, productsData, expensesData, transactionsData]);

    const handlePrint = () => {
        window.print();
    };

    const isLoading = isLoadingBusiness || isLoadingSales || isLoadingExpenses || isLoadingProducts || isLoadingTransactions;

    return (
        <div className="bg-muted/30 dark:bg-background">
             <header className="bg-card p-4 print:hidden sticky top-0 z-10 border-b">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-lg font-semibold hidden sm:block">Business Statement</h1>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print / Save PDF
                    </Button>
                </div>
            </header>
            <main className="p-4 sm:p-8">
                <div className="max-w-4xl mx-auto bg-card p-6 sm:p-10 rounded-lg shadow-lg print:shadow-none print:rounded-none print:p-0">
                    <div className="flex justify-between items-start border-b pb-6">
                        <div>
                            <h1 className="text-3xl font-bold font-headline text-primary">Business Statement</h1>
                            <p className="text-muted-foreground mt-1">{businessData?.businessName}</p>
                        </div>
                        <Logo className="h-10" />
                    </div>
                    <div className="mt-6 text-sm text-muted-foreground">
                        <p><strong>Report Date:</strong> {format(new Date(), 'PPP')}</p>
                        {dateRange.from && <p><strong>Period:</strong> {format(dateRange.from, 'PPP')} to {dateRange.to ? format(dateRange.to, 'PPP') : 'now'}</p>}
                    </div>

                    <div className="mt-8">
                        <h2 className="text-xl font-semibold font-headline mb-4">Financial Summary</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           <StatCard title="Total Revenue" value={summary.totalRevenue} isLoading={isLoading} currency currencyCode={businessData?.currency} />
                           <StatCard title="Cost of Goods" value={summary.cogs} isLoading={isLoading} currency currencyCode={businessData?.currency} />
                           <StatCard title="Gross Profit" value={summary.grossProfit} isLoading={isLoading} currency currencyCode={businessData?.currency} isProfit />
                           <StatCard title="Operating Expenses" value={summary.totalExpenses} isLoading={isLoading} currency currencyCode={businessData?.currency} />
                           <StatCard title="Total Money In" value={summary.totalDeposits} isLoading={isLoading} currency currencyCode={businessData?.currency} />
                           <StatCard title="Total Money Out" value={summary.totalWithdrawals} isLoading={isLoading} currency currencyCode={businessData?.currency} />
                        </div>
                        <div className="mt-4">
                            <StatCard title="Net Profit / Loss" value={summary.netProfit} isLoading={isLoading} currency currencyCode={businessData?.currency} isProfit />
                        </div>
                    </div>
                    
                    <div className="mt-10">
                        <h2 className="text-xl font-semibold font-headline mb-4">Sales Transactions</h2>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4}><Skeleton className="h-20" /></TableCell></TableRow>
                                ) : sortedSales.length > 0 ? (
                                    sortedSales.map(sale => (
                                        <TableRow key={sale.id}>
                                            <TableCell>{format(sale.timestamp.toDate(), 'PP')}</TableCell>
                                            <TableCell>{sale.productName}</TableCell>
                                            <TableCell>{sale.quantity}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrencyUtil(sale.amount, businessData?.currency)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">No sales recorded in this period.</TableCell></TableRow>
                                )}
                            </TableBody>
                         </Table>
                    </div>

                    <div className="mt-10">
                        <h2 className="text-xl font-semibold font-headline mb-4">Expense Transactions</h2>
                         <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4}><Skeleton className="h-20" /></TableCell></TableRow>
                                ) : sortedExpenses.length > 0 ? (
                                    sortedExpenses.map(expense => (
                                        <TableRow key={expense.id}>
                                            <TableCell>{format(expense.createdAt.toDate(), 'PP')}</TableCell>
                                            <TableCell className="capitalize">{expense.category}</TableCell>
                                            <TableCell>{expense.title}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrencyUtil(expense.amount, businessData?.currency)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">No expenses recorded in this period.</TableCell></TableRow>
                                )}
                            </TableBody>
                         </Table>
                    </div>

                     <div className="mt-10">
                        <h2 className="text-xl font-semibold font-headline mb-4">Cash Flow Transactions</h2>
                         <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4}><Skeleton className="h-20" /></TableCell></TableRow>
                                ) : sortedTransactions.length > 0 ? (
                                    sortedTransactions.map(transaction => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>{format(transaction.createdAt.toDate(), 'PP')}</TableCell>
                                            <TableCell className="capitalize">{transaction.type}</TableCell>
                                            <TableCell>{transaction.description}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrencyUtil(transaction.amount, businessData?.currency)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">No cash flow transactions recorded in this period.</TableCell></TableRow>
                                )}
                            </TableBody>
                         </Table>
                    </div>

                    <footer className="mt-12 pt-6 border-t flex justify-center items-center text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 mr-2 text-success" />
                        Document Verified by Busmo
                    </footer>
                </div>
            </main>
        </div>
    );
}

export default function SummaryPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Skeleton className="h-1/2 w-1/2"/></div>}>
            <StatementContent />
        </Suspense>
    );
}
