
'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, query, collection, Timestamp, where, runTransaction, orderBy } from 'firebase/firestore';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { ShieldCheck, Printer, ArrowLeft, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-provider';
import { LanguageSwitcher } from '@/components/app/language-switcher';

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
    variantId?: string;
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
    quantity: number;
    hasVariants?: boolean;
    variants?: { id: string; name: string; price: number; cost?: number, quantity: number }[];
}

const StatCard = ({ title, value, isLoading, currency = false, currencyCode, isProfit = false }: { title: string; value: number; isLoading: boolean; currency?: boolean; currencyCode?: string; isProfit?: boolean }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
                <p className={cn("text-lg sm:text-2xl font-bold leading-tight break-all", isProfit && (value >= 0 ? 'text-success' : 'text-destructive'))}>
                    {currency ? formatCurrencyUtil(value, currencyCode) : value}
                </p>
            )}
        </CardContent>
    </Card>
);

function StatementContent() {
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const { t } = useLanguage();

    const [date, setDate] = useState<DateRange | undefined>(() => {
        const fromDateStr = searchParams.get('from');
        const toDateStr = searchParams.get('to');
        if (fromDateStr && toDateStr) {
            return { from: new Date(fromDateStr), to: new Date(toDateStr) };
        }
        return { from: addDays(new Date(), -29), to: new Date() };
    });

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

    const range = useMemo(() => {
        if (!date?.from || !date?.to) return null;
        return { from: startOfDay(date.from), to: endOfDay(date.to) };
    }, [date?.from, date?.to]);

    const salesQuery = useMemoFirebase(() => {
        if (!firestore || !businessId || !range) return null;
        return query(
            collection(firestore, `businesses/${businessId}/sales`),
            where('timestamp', '>=', range.from),
            where('timestamp', '<=', range.to),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, businessId, range]);
    const { data: salesData, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    
    const expensesQuery = useMemoFirebase(() => {
        if (!firestore || !businessId || !range) return null;
        return query(
            collection(firestore, `businesses/${businessId}/expenses`),
            where('createdAt', '>=', range.from),
            where('createdAt', '<=', range.to),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, businessId, range]);
    const { data: expensesData, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

    const transactionsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId || !range) return null;
        return query(
            collection(firestore, `businesses/${businessId}/transactions`),
            where('createdAt', '>=', range.from),
            where('createdAt', '<=', range.to),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, businessId, range]);
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
            return acc + (product ? (product.cost || 0) * sale.quantity : 0);
        }, 0);
        const totalExpenses = expensesData.reduce((acc, exp) => acc + exp.amount, 0);
        const grossProfit = totalRevenue - cogs;
        const netProfit = grossProfit - totalExpenses;
        
        const totalDeposits = transactionsData.filter(t => t.type === 'deposit').reduce((acc, t) => acc + t.amount, 0);
        const totalWithdrawals = transactionsData.filter(t => t.type === 'withdrawal').reduce((acc, t) => acc + t.amount, 0);

        // Queries are ordered, but keep a safe fallback sort for missing timestamps.
        const sortedSales = [...salesData].sort((a,b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
        const sortedExpenses = [...expensesData].sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        const sortedTransactions = [...transactionsData].sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

        return { 
            summary: { totalRevenue, cogs, grossProfit, totalExpenses, netProfit, totalDeposits, totalWithdrawals }, 
            sortedSales, 
            sortedExpenses,
            sortedTransactions 
        };
    }, [salesData, productsData, expensesData, transactionsData]);
    
    const handleDeleteSale = async (sale: Sale) => {
        if (!firestore || !businessId) {
            toast({ variant: 'destructive', title: t('common.errorTitle'), description: t('statement.dbError') });
            return;
        }
        
        try {
            await runTransaction(firestore, async (transaction) => {
                const saleRef = doc(firestore, `businesses/${businessId}/sales`, sale.id);
                const productRef = doc(firestore, `businesses/${businessId}/products`, sale.productId);
                
                const productSnap = await transaction.get(productRef);
                if (!productSnap.exists()) {
                    // Product might have been deleted, so we can't restore inventory.
                    // Just delete the sale.
                    transaction.delete(saleRef);
                    return;
                }
                
                const productData = productSnap.data() as Product;

                // Add back the quantity
                if (productData.hasVariants && sale.variantId) {
                    const variantIndex = productData.variants?.findIndex(v => v.id === sale.variantId);
                    if (variantIndex !== undefined && variantIndex > -1) {
                        const newVariants = [...(productData.variants || [])];
                        newVariants[variantIndex].quantity += sale.quantity;
                        transaction.update(productRef, { variants: newVariants });
                    }
                } else {
                    const newQuantity = productData.quantity + sale.quantity;
                    transaction.update(productRef, { quantity: newQuantity });
                }
                
                // Delete the sale
                transaction.delete(saleRef);
            });
            toast({ title: t('statement.saleDeletedTitle'), description: t('statement.saleDeletedDesc') });
        } catch (error: any) {
            console.error("Error deleting sale:", error);
            toast({ variant: 'destructive', title: t('statement.deleteSaleErrorTitle'), description: error.message });
        }
    };


    const handlePrint = () => {
        window.print();
    };

    const isLoading = isLoadingBusiness || isLoadingSales || isLoadingExpenses || isLoadingProducts || isLoadingTransactions;

    return (
        <div className="bg-muted/30 dark:bg-background">
             <header className="bg-card p-4 print:hidden sticky top-0 z-10 border-b">
                <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
                     <Button variant="outline" onClick={() => router.back()} className="hidden sm:inline-flex">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('main_layout.back')}
                    </Button>
                    <div className="flex-1 flex justify-center">
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
                                        <span>{t('statement.pickDateRange')}</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
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
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">{t('statement.printCta')}</span>
                        </Button>
                    </div>
                </div>
            </header>
            <main className="p-4 sm:p-8">
                <div className="max-w-4xl mx-auto bg-card p-6 sm:p-10 rounded-lg shadow-lg print:shadow-none print:rounded-none print:p-0">
                    <div className="flex justify-between items-start border-b pb-6">
                        <div>
                            <h1 className="text-3xl font-bold font-headline text-primary">{t('statement.title')}</h1>
                            <p className="text-muted-foreground mt-1">{businessData?.businessName}</p>
                        </div>
                        <Logo className="h-10" />
                    </div>
                    <div className="mt-6 text-sm text-muted-foreground">
                        <p><strong>{t('statement.reportDateLabel')}</strong> {format(new Date(), 'PPP')}</p>
                        {date?.from && <p><strong>{t('statement.periodLabel')}</strong> {format(date.from, 'PPP')} {t('statement.toLabel')} {date.to ? format(date.to, 'PPP') : t('statement.nowLabel')}</p>}
                    </div>

                    <div className="mt-8">
                        <h2 className="text-xl font-semibold font-headline mb-4">{t('statement.summaryTitle')}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           <StatCard title={t('statement.totalRevenue')} value={summary.totalRevenue} isLoading={isLoading} currency currencyCode={businessData?.currency} />
                           <StatCard title={t('statement.cogs')} value={summary.cogs} isLoading={isLoading} currency currencyCode={businessData?.currency} />
                           <StatCard title={t('statement.grossProfit')} value={summary.grossProfit} isLoading={isLoading} currency currencyCode={businessData?.currency} isProfit />
                           <StatCard title={t('statement.operatingExpenses')} value={summary.totalExpenses} isLoading={isLoading} currency currencyCode={businessData?.currency} />
                           <StatCard title={t('statement.totalMoneyIn')} value={summary.totalDeposits} isLoading={isLoading} currency currencyCode={businessData?.currency} />
                           <StatCard title={t('statement.totalMoneyOut')} value={summary.totalWithdrawals} isLoading={isLoading} currency currencyCode={businessData?.currency} />
                        </div>
                        <div className="mt-4">
                            <StatCard title={t('statement.netProfit')} value={summary.netProfit} isLoading={isLoading} currency currencyCode={businessData?.currency} isProfit />
                        </div>
                    </div>
                    
                    <div className="mt-10">
                        <h2 className="text-xl font-semibold font-headline mb-4">{t('statement.salesTransactions')}</h2>
                        <div className="overflow-x-auto">
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('statement.table.date')}</TableHead>
                                    <TableHead>{t('statement.table.product')}</TableHead>
                                    <TableHead>{t('statement.table.qty')}</TableHead>
                                    <TableHead className="text-right">{t('statement.table.amount')}</TableHead>
                                    <TableHead className="text-right print:hidden">{t('statement.table.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5}><Skeleton className="h-20" /></TableCell></TableRow>
                                ) : sortedSales.length > 0 ? (
                                    sortedSales.map(sale => (
                                        <TableRow key={sale.id}>
                                            <TableCell>{format(sale.timestamp.toDate(), 'PP')}</TableCell>
                                            <TableCell>{sale.productName}</TableCell>
                                            <TableCell>{sale.quantity}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrencyUtil(sale.amount, businessData?.currency)}</TableCell>
                                            <TableCell className="text-right print:hidden">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t('statement.deleteConfirmTitle')}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t('statement.deleteConfirmDesc')}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteSale(sale)}
                                                                className="bg-destructive hover:bg-destructive/90"
                                                            >
                                                                {t('common.delete')}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24">{t('statement.noSales')}</TableCell></TableRow>
                                )}
                            </TableBody>
                         </Table>
                        </div>
                    </div>

                    <div className="mt-10">
                        <h2 className="text-xl font-semibold font-headline mb-4">{t('statement.expenseTransactions')}</h2>
                        <div className="overflow-x-auto">
                         <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>{t('statement.table.date')}</TableHead>
                                    <TableHead>{t('statement.table.category')}</TableHead>
                                    <TableHead>{t('statement.table.description')}</TableHead>
                                    <TableHead className="text-right">{t('statement.table.amount')}</TableHead>
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
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">{t('statement.noExpenses')}</TableCell></TableRow>
                                )}
                            </TableBody>
                         </Table>
                        </div>
                    </div>

                     <div className="mt-10">
                        <h2 className="text-xl font-semibold font-headline mb-4">{t('statement.cashFlowTransactions')}</h2>
                        <div className="overflow-x-auto">
                         <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>{t('statement.table.date')}</TableHead>
                                    <TableHead>{t('statement.table.type')}</TableHead>
                                    <TableHead>{t('statement.table.description')}</TableHead>
                                    <TableHead className="text-right">{t('statement.table.amount')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4}><Skeleton className="h-20" /></TableCell></TableRow>
                                ) : sortedTransactions.length > 0 ? (
                                    sortedTransactions.map(transaction => (
                                        <TableRow key={transaction.id}>
                                            <TableCell>{format(transaction.createdAt.toDate(), 'PP')}</TableCell>
                                            <TableCell className="capitalize">{transaction.type === 'deposit' ? t('statement.deposit') : t('statement.withdrawal')}</TableCell>
                                            <TableCell>{transaction.description}</TableCell>
                                            <TableCell className="text-right font-medium">{formatCurrencyUtil(transaction.amount, businessData?.currency)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24">{t('statement.noCashFlow')}</TableCell></TableRow>
                                )}
                            </TableBody>
                         </Table>
                        </div>
                    </div>

                    <footer className="mt-12 pt-6 border-t flex justify-center items-center text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 mr-2 text-success" />
                        {t('statement.verifiedFooter')}
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
