'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect, FormEvent, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Plus, BotMessageSquare, PackagePlus, FilePlus, CircleDollarSign, Activity, AlertTriangle, Megaphone, MapPin, Gift, Copy, X, ShoppingCart } from 'lucide-react';
import { getBusinessInsights } from '@/ai/flows/get-business-insights';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { startOfDay, endOfDay, isWithinInterval, differenceInDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useUser, useCollection, useDoc, useMemoFirebase, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, Timestamp, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import imageCompression from 'browser-image-compression';
import { useLanguage } from '@/context/language-provider';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getFunctionUrl } from '@/lib/api';

interface AppUser {
    id: string;
    displayName: string;
    businessId: string;
    role: string;
    branchId?: string;
}

interface Business {
    id: string;
    businessName: string;
    businessType: string;
    currency: string;
    country?: string;
    plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
    slug?: string;
    deliveryType?: 'nationwide' | 'cities';
    deliveryCities?: string[];
    marketSettings?: {
        isStoreActive?: boolean;
    };
    branches?: { id: string; name: string }[];
}

interface Sale {
    id: string;
    amount: number;
    paymentType: string;
    source?: string;
    timestamp: Timestamp;
    productId?: string;
    variantId?: string;
    quantity: number;
    branchId?: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    cost: number;
    stockByBranch?: Record<string, number>;
    hasVariants?: boolean;
    variants?: {
        id: string;
        name: string;
        price: number;
        cost?: number;
        stockByBranch?: Record<string, number>;
    }[];
}

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    createdAt: Timestamp;
    branchId?: string;
}

interface Expense {
    id: string;
    category: string;
    title: string;
    amount: number;
    createdAt: Timestamp;
    branchId?: string;
}

interface SupportAgent {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    status: 'online' | 'offline';
    language?: 'en' | 'fr';
}

interface ChatConversation {
    id: string;
    userId: string;
    status: 'open' | 'in-progress' | 'closed';
}

interface ReferralStats {
    balance?: number;
    totalCommission?: number;
    paidReferralsCount?: number;
    totalReferralsCount?: number;
    currentRate?: number;
}

interface ChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    text?: string;
    imageUrl?: string;
    createdAt: Timestamp;
}

interface MarketplaceOrder {
    id: string;
    total: number;
    source?: string;
    status: 'pending' | 'confirmed' | 'in progress' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
}

interface Announcement {
    id: string;
    text: string;
    href: string;
}

interface Subscription {
    id: string;
    planId: string;
    status: 'active' | 'trialing' | 'cancelled' | 'past_due';
    currentPeriodEnd: Timestamp;
}


const MarketplacePerformanceCard = ({ businessId, currency }: { businessId: string; currency?: string; }) => {
    const { t } = useLanguage();
    const firestore = useFirestore();

    const marketOrdersQuery = useMemoFirebase(() => {
        return query(
            collection(firestore, `businesses/${businessId}/orders`), 
            where('payment', '==', 'busmopay') // Assuming busmopay orders are from the market
        );
    }, [firestore, businessId]);

    const { data: marketOrders, isLoading } = useCollection<MarketplaceOrder>(marketOrdersQuery);

    const { successfulOrders, marketRevenue } = useMemo(() => {
        if (!marketOrders) return { successfulOrders: [], marketRevenue: 0 };
        
        const successful = marketOrders.filter(order => 
            !['pending', 'cancelled', 'returned'].includes(order.status)
        );
        
        const revenue = successful.reduce((acc, order) => acc + order.total, 0);

        return { successfulOrders: successful, marketRevenue: revenue };
    }, [marketOrders]);

    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <span>{t('ownerHome.marketplacePerformanceTitle')}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {successfulOrders && successfulOrders.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{successfulOrders.length}</p>
                            <p className="text-xs text-muted-foreground">{t('ownerHome.orders')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{formatCurrency(marketRevenue, currency)}</p>
                            <p className="text-xs text-muted-foreground">{t('ownerHome.revenue')}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">{t('ownerHome.noMarketplaceOrders')}</p>
                )}
            </CardContent>
        </Card>
    );
};


export default function OwnerHomePage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const onboardingComplete = searchParams.get('onboarding') === 'complete';
    const subscriptionSuccess = searchParams.get('subscription') === 'success';

    const [answer, setAnswer] = useState<string | null>(null);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [aiCache, setAiCache] = useState<Record<string, string>>({});
    const [presetQuestions, setPresetQuestions] = useState<string[]>([]);
    const [isInsightVisible, setIsInsightVisible] = useState(true);

    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { language, t } = useLanguage();
    
    const [chatView, setChatView] = useState('initial'); // 'initial', 'chat', 'ticket'
    const [chatInput, setChatInput] = useState('');
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [selectedBranchId, setSelectedBranchId] = useState('all');
    const [isTrialAlertHidden, setIsTrialAlertHidden] = useState(false);


    useEffect(() => {
        if (onboardingComplete) {
            setShowWelcome(true);
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('onboarding');
            window.history.replaceState({}, '', currentUrl.toString());
        }
        if (subscriptionSuccess) {
            toast({
                title: t('ownerHome.subscriptionActivatedTitle'),
                description: t('ownerHome.subscriptionActivatedDesc'),
                className: "bg-success text-success-foreground",
            });
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('subscription');
            window.history.replaceState({}, '', currentUrl.toString());
        }
         if (typeof window !== 'undefined' && window.localStorage.getItem('isTrialAlertHidden') === 'true') {
            setIsTrialAlertHidden(true);
        }
    }, [onboardingComplete, subscriptionSuccess, t, toast]);
    
    useEffect(() => {
        const allQuestions = t('ownerHome.presetQuestions', { returnObjects: true }) as string[];

        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        setPresetQuestions(shuffled.slice(0, 4));
    }, [language, t]);

    const getMissingDataFallback = (question: string) => {
        const q = (question || '').toLowerCase();

        const requiresSales = q.includes('sale') || q.includes('sales') || q.includes('revenue') || q.includes("chiffre") || q.includes('vent');
        const requiresExpenses = q.includes('expense') || q.includes('expenses') || q.includes('charge') || q.includes('dépense') || q.includes('depense');
        const requiresTransactions = q.includes('withdraw') || q.includes('withdrawn') || q.includes('deposit') || q.includes('cash') || q.includes('retir') || q.includes('dépôt') || q.includes('depot');
        const requiresProducts = q.includes('product') || q.includes('restock') || q.includes('stock') || q.includes('produit') || q.includes('réappro');
        const requiresProfit = q.includes('profit') || q.includes('margin') || q.includes('béné') || q.includes('benef') || q.includes('marge');
        const requiresGrowth = q.includes('grow') || q.includes('afford') || q.includes('grandir') || q.includes('permettre');

        const needed: Array<'sales' | 'expenses' | 'transactions' | 'products'> = [];
        if (requiresProfit) {
            needed.push('sales', 'products', 'expenses');
        } else {
            if (requiresSales) needed.push('sales');
            if (requiresExpenses) needed.push('expenses');
            if (requiresTransactions) needed.push('transactions');
            if (requiresProducts) needed.push('products');
        }
        if (requiresGrowth) {
            needed.push('sales', 'expenses', 'transactions');
        }

        const uniqueNeeded = Array.from(new Set(needed));
        if (uniqueNeeded.length === 0) return null;

        const missing: string[] = [];
        if (uniqueNeeded.includes('sales') && (!salesData || salesData.length === 0)) missing.push(language === 'fr' ? 'enregistrer des ventes' : 'record sales');
        if (uniqueNeeded.includes('expenses') && (!expensesData || expensesData.length === 0)) missing.push(language === 'fr' ? 'ajouter des dépenses' : 'add expenses');
        if (uniqueNeeded.includes('transactions') && (!transactionsData || transactionsData.length === 0)) missing.push(language === 'fr' ? 'ajouter des dépôts/retraits' : 'add deposits/withdrawals');
        if (uniqueNeeded.includes('products') && (!productsData || productsData.length === 0)) missing.push(language === 'fr' ? 'ajouter tes produits' : 'add your products');

        if (missing.length === 0) return null;
        if (language === 'fr') {
            return `Je n’ai pas assez de données pour répondre. Pour ça, tu dois ${missing.join(', ')}.`;
        }
        return `I don’t have enough data to answer that. To get this, please ${missing.join(', ')}.`;
    };

    const userProfileRef = useMemoFirebase(() => {
        if (!authUser || !firestore) return null;
        return doc(firestore, `users/${authUser.uid}`);
    }, [authUser, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const didEnsureReferralCode = useRef(false);
    useEffect(() => {
        if (!authUser || didEnsureReferralCode.current) return;
        if ((userProfile as any)?.referralCode) return;

        (async () => {
            try {
                const token = await authUser.getIdToken();
                await fetch(getFunctionUrl('ensureReferralCode'), {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({}),
                });
            } catch {
                // Silent: user can still use the page.
            } finally {
                didEnsureReferralCode.current = true;
            }
        })();
    }, [authUser, userProfile]);

    const referralStatsRef = useMemoFirebase(() => {
        if (!authUser || !firestore) return null;
        return doc(firestore, `users/${authUser.uid}/referralStats/summary`);
    }, [authUser, firestore]);
    const { data: referralStats } = useDoc<ReferralStats>(referralStatsRef);

    const handleCopyReferralLink = async () => {
        try {
            if (typeof window === 'undefined') return;
            const code = (userProfile as any)?.referralCode;
            if (!code) {
                toast({ variant: 'destructive', title: t('ownerHome.referralMissingCodeTitle'), description: t('ownerHome.referralMissingCodeDesc') });
                return;
            }

            const url = `${window.location.origin}/signup?ref=${encodeURIComponent(String(code))}`;
            await navigator.clipboard.writeText(url);
            toast({ title: t('ownerHome.referralCopiedTitle'), description: t('ownerHome.referralCopiedDesc') });
        } catch {
            toast({ variant: 'destructive', title: t('ownerHome.referralCopyFailedTitle'), description: t('ownerHome.referralCopyFailedDesc') });
        }
    };
    
    const agentsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'supportAgents'));
    }, [firestore]);
    const { data: allAgents, isLoading: isLoadingAgents, error: agentsError } = useCollection<SupportAgent>(agentsQuery);

    const assignedAgent = useMemo(() => {
        if (!allAgents) return null;
        const onlineLanguageMatches = allAgents.filter(a => a.status === 'online' && a.language === language);
        if (onlineLanguageMatches.length > 0) return onlineLanguageMatches[0];
        
        const anyOnline = allAgents.filter(a => a.status === 'online');
        if (anyOnline.length > 0) return anyOnline[0];

        return null;
    }, [allAgents, language]);

    const canChat = useMemo(() => {
        if(!allAgents) return false;
        return allAgents.some(a => a.status === 'online');
    }, [allAgents]);
    
    const businessRef = useMemoFirebase(() => {
        if (!businessId || !firestore) return null;
        return doc(firestore, `businesses/${businessId}`);
    }, [businessId, firestore]);
    const { data: businessData, isLoading: isBusinessLoading } = useDoc<Business>(businessRef);

    const salesQuery = useMemoFirebase(() => {
        if (!businessId || !firestore) return null;
        const salesCollection = collection(firestore, `businesses/${businessId}/sales`);
        return query(salesCollection, orderBy('timestamp', 'desc'), limit(500));
    }, [businessId, firestore]);
    const { data: salesData, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);

    const transactionsQuery = useMemoFirebase(() => {
        if (!businessId || !firestore) return null;
        const transactionsCollection = collection(firestore, `businesses/${businessId}/transactions`);
        return query(transactionsCollection, orderBy('createdAt', 'desc'), limit(500));
    }, [businessId, firestore]);
    const { data: transactionsData, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery);

    const expensesQuery = useMemoFirebase(() => {
        if (!businessId || !firestore) return null;
        return query(collection(firestore, `businesses/${businessId}/expenses`), orderBy('createdAt', 'desc'), limit(500));
    }, [businessId, firestore]);
    const { data: expensesData, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesQuery);

    const productsQuery = useMemoFirebase(() => {
        if (!businessId || !firestore) return null;
        return query(collection(firestore, `businesses/${businessId}/products`));
    }, [businessId, firestore]);
    const { data: productsData } = useCollection<Product>(productsQuery);

    const announcementsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'announcements'), where('isActive', '==', true), where('page', '==', 'home'));
    }, [firestore]);
    const { data: announcements } = useCollection<Announcement>(announcementsQuery);
    
    const subscriptionsQuery = useMemoFirebase(() => {
        if (!authUser || !firestore) return null;
        return query(collection(firestore, `users/${authUser.uid}/subscriptions`));
    }, [authUser, firestore]);
    const { data: subscriptionsData } = useCollection<Subscription>(subscriptionsQuery);

    const activeSubscription = subscriptionsData?.[0];

    const businessInsights = useMemo(() => {
        const defaultInsights = {
            totalSales: 0, totalProfit: 0, bestSellingProduct: undefined, worstSellingProduct: undefined,
            lowStockProducts: [], salesTodayCount: 0, salesTodayTotal: 0, profitToday: 0,
            totalDeposits: 0, totalWithdrawals: 0, profitMargin: 0, totalExpenses: 0,
            cashBalance: 0,
            dailyAvgExpense: 0,
            dailyAvgBurn: 0,
            recentActivityInWindow: false,
            salesDays: 0,
        };
        
        const filteredSales = selectedBranchId === 'all' ? salesData : salesData?.filter(s => s.branchId === selectedBranchId);
        const filteredExpenses = selectedBranchId === 'all' ? expensesData : expensesData?.filter(e => e.branchId === selectedBranchId);
        const filteredTransactions = selectedBranchId === 'all' ? transactionsData : transactionsData?.filter(t => t.branchId === selectedBranchId);

        if (!filteredSales || !productsData || !businessData || !filteredExpenses || !filteredTransactions) {
            return defaultInsights;
        }

        const todayInterval = { start: startOfDay(new Date()), end: endOfDay(new Date()) };
        const salesByProduct: { [key: string]: { id: string, name: string, quantity: number, sales: number } } = {};
        
        let totalSales = 0;
        let totalCogs = 0;
        let salesTodayCount = 0;
        let salesTodayTotal = 0;
        let cogsToday = 0;
        
        const saleDates = new Set<string>();

        for (const sale of filteredSales) {
            totalSales += sale.amount;
            saleDates.add(sale.timestamp.toDate().toDateString());
            const product = productsData.find(p => p.id === sale.productId);
            if (product) {
                let costOfItem = 0;
                if (product.hasVariants && sale.variantId) {
                    const variant = product.variants?.find(v => v.id === sale.variantId);
                    costOfItem = variant?.cost || 0;
                } else {
                    costOfItem = product.cost || 0;
                }
                const cogsForSale = costOfItem * sale.quantity;
                totalCogs += cogsForSale;

                if (!salesByProduct[product.id]) {
                    salesByProduct[product.id] = { id: product.id, name: product.name, quantity: 0, sales: 0 };
                }
                salesByProduct[product.id].quantity += sale.quantity;
                salesByProduct[product.id].sales += sale.amount;

                if (isWithinInterval(sale.timestamp.toDate(), todayInterval)) {
                    cogsToday += cogsForSale;
                }
            }

            if (isWithinInterval(sale.timestamp.toDate(), todayInterval)) {
                salesTodayCount++;
                salesTodayTotal += sale.amount;
            }
        }
        
        const grossProfit = totalSales - totalCogs;
        const grossProfitToday = salesTodayTotal - cogsToday;

        const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        const expensesToday = filteredExpenses
            .filter(exp => exp.createdAt?.toDate && isWithinInterval(exp.createdAt.toDate(), todayInterval))
            .reduce((acc, exp) => acc + exp.amount, 0);

        const netProfit = grossProfit - totalExpenses;
        const netProfitToday = grossProfitToday - expensesToday;

        const soldProducts = Object.values(salesByProduct);
        const bestSellingProduct = soldProducts.length > 0 ? [...soldProducts].sort((a,b) => b.sales - a.sales)[0] : undefined;
        const worstSellingProduct = soldProducts.length > 0 ? [...soldProducts].sort((a,b) => a.sales - b.sales)[0] : undefined;

        const lowStockProducts = productsData
            .flatMap(p => {
                if (p.hasVariants && p.variants) {
                    return p.variants.map(v => {
                        const quantity = selectedBranchId === 'all'
                            ? Object.values(v.stockByBranch || {}).reduce((s, q) => s + q, 0)
                            : v.stockByBranch?.[selectedBranchId] || 0;
                        return {
                            id: `${p.id}-${v.id}`,
                            productId: p.id,
                            variantId: v.id,
                            name: `${p.name} (${v.name})`,
                            quantity,
                        };
                    });
                }

                const quantity = selectedBranchId === 'all'
                    ? Object.values(p.stockByBranch || {}).reduce((s, q) => s + q, 0)
                    : p.stockByBranch?.[selectedBranchId] || 0;
                return [{ id: p.id, productId: p.id, name: p.name, quantity }];
            })
            .filter(p => p.quantity <= 10);
        
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        for (const transaction of filteredTransactions) {
            if (transaction.type === 'deposit') totalDeposits += transaction.amount;
            if (transaction.type === 'withdrawal') totalWithdrawals += transaction.amount;
        }
        
        const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
        const cashBalance = totalDeposits - totalWithdrawals;

        // Use a fixed recent window so averages aren't distorted by sparse data.
        // Cash runway should be based on net burn (profit - expenses), not just expenses.
        const windowDays = 30;
        const activityWindow = {
            start: startOfDay(subDays(new Date(), windowDays - 1)),
            end: endOfDay(new Date()),
        };

        const expensesInWindowTotal = filteredExpenses
            .filter(e => e.createdAt?.toDate && isWithinInterval(e.createdAt.toDate(), activityWindow))
            .reduce((acc, e) => acc + e.amount, 0);

        let salesInWindowTotal = 0;
        let cogsInWindowTotal = 0;
        for (const sale of filteredSales) {
            if (!isWithinInterval(sale.timestamp.toDate(), activityWindow)) continue;
            salesInWindowTotal += sale.amount;
            const product = productsData.find(p => p.id === sale.productId);
            if (!product) continue;
            let costOfItem = 0;
            if (product.hasVariants && sale.variantId) {
                const variant = product.variants?.find(v => v.id === sale.variantId);
                costOfItem = variant?.cost || 0;
            } else {
                costOfItem = product.cost || 0;
            }
            cogsInWindowTotal += costOfItem * sale.quantity;
        }

        const windowGrossProfit = salesInWindowTotal - cogsInWindowTotal;
        const windowNetProfit = windowGrossProfit - expensesInWindowTotal;
        const dailyAvgBurn = windowNetProfit < 0 ? (-windowNetProfit) / windowDays : 0;
        const dailyAvgExpense = expensesInWindowTotal > 0 ? expensesInWindowTotal / windowDays : 0;
        const recentActivityInWindow = expensesInWindowTotal > 0 || salesInWindowTotal > 0;

        return { 
            totalSales, totalProfit: netProfit, bestSellingProduct, worstSellingProduct, 
            lowStockProducts, salesTodayCount, salesTodayTotal, profitToday: netProfitToday, 
            totalDeposits, totalWithdrawals, profitMargin, totalExpenses, cashBalance,
            dailyAvgExpense,
            dailyAvgBurn,
            recentActivityInWindow,
            salesDays: saleDates.size
        };

    }, [salesData, productsData, businessData, transactionsData, expensesData, selectedBranchId]);
    
    const forecasts = useMemo(() => {
        const defaultForecasts = {
            weeklyProfit: null,
            busiestDay: null,
            inventoryOutlook: null,
            cashRunway: null,
        };

        // Cash runway can be computed even when there isn't enough sales data for other forecasts.
        const cashRunway = businessInsights.dailyAvgBurn > 0
            ? Math.floor(businessInsights.cashBalance / businessInsights.dailyAvgBurn)
            : null;

        // Stock outlook: use a fixed recent window so depletion estimates don't get diluted by old sales.
        const stockWindowDays = 30;
        const stockWindow = {
            start: startOfDay(subDays(new Date(), stockWindowDays - 1)),
            end: endOfDay(new Date()),
        };

        let inventoryOutlook: string | null = null;
        if (businessInsights.lowStockProducts.length > 0) {
            const salesInWindow = (salesData || []).filter(s => isWithinInterval(s.timestamp.toDate(), stockWindow));

            let mostAtRiskProduct: { name: string; days: number } | null = null;
            let minDays = Infinity;
            let sawAnySalesForLowStock = false;

            for (const lowStockProduct of businessInsights.lowStockProducts as any[]) {
                const productId = lowStockProduct.productId ?? lowStockProduct.id;
                const variantId = lowStockProduct.variantId;
                const totalSold = salesInWindow
                    .filter(s => {
                        if (s.productId !== productId) return false;
                        if (variantId) return s.variantId === variantId;
                        return true;
                    })
                    .reduce((acc, s) => acc + s.quantity, 0);

                if (totalSold > 0) {
                    sawAnySalesForLowStock = true;
                    const dailyConsumption = totalSold / stockWindowDays;
                    if (dailyConsumption > 0) {
                        const daysToDepletion = lowStockProduct.quantity / dailyConsumption;
                        if (daysToDepletion < minDays) {
                            minDays = daysToDepletion;
                            mostAtRiskProduct = { name: lowStockProduct.name, days: Math.floor(daysToDepletion) };
                        }
                    }
                }
            }

            if (mostAtRiskProduct && mostAtRiskProduct.days !== Infinity && mostAtRiskProduct.days >= 0) {
                inventoryOutlook = language === 'fr'
                    ? `Tu risques de manquer de ${mostAtRiskProduct.name} dans ${mostAtRiskProduct.days} jours.`
                    : `You are likely to run out of ${mostAtRiskProduct.name} in ${mostAtRiskProduct.days} days.`;
            } else if (!sawAnySalesForLowStock) {
                inventoryOutlook = language === 'fr'
                    ? "Stock faible, mais aucune vente récente — impossible d’estimer l’épuisement."
                    : "Low stock, but no recent sales — can't estimate depletion.";
            }
        }

        if (!salesData || salesData.length < 2) {
            return { ...defaultForecasts, cashRunway, inventoryOutlook };
        }

        const firstSaleDate = salesData[salesData.length - 1].timestamp.toDate();
        const lastSaleDate = salesData[0].timestamp.toDate();
        const periodInDays = differenceInDays(lastSaleDate, firstSaleDate) + 1;
        let weeklyProfit = null;
        if (periodInDays > 0) {
            const dailyAvgProfit = businessInsights.totalProfit / periodInDays;
            weeklyProfit = dailyAvgProfit * 7;
        }

        const dayCounts = Array(7).fill(0);
        salesData.forEach(sale => {
            const dayIndex = sale.timestamp.toDate().getDay();
            dayCounts[dayIndex]++;
        });
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const busiestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
        const busiestDay = daysOfWeek[busiestDayIndex];
        
        return { weeklyProfit, busiestDay, inventoryOutlook, cashRunway };

    }, [businessInsights, salesData, language]);

    type ForecastProductPerformanceRow = {
        productId: string;
        name: string;
        units: number;
        revenue: number;
    };

    type ForecastProductPerformanceSummary = {
        totalUnits: number;
        bestSeller?: ForecastProductPerformanceRow;
        worstSeller?: ForecastProductPerformanceRow;
    };

    const forecastProductPerformanceSummary = useMemo<ForecastProductPerformanceSummary>(() => {
        const windowDays = 30;
        const window = {
            start: startOfDay(subDays(new Date(), windowDays - 1)),
            end: endOfDay(new Date()),
        };

        const filteredSales = selectedBranchId === 'all' ? salesData : salesData?.filter(s => s.branchId === selectedBranchId);
        if (!filteredSales || filteredSales.length === 0) return { totalUnits: 0 };

        const byProduct = new Map<string, ForecastProductPerformanceRow>();
        let totalUnits = 0;

        for (const sale of filteredSales) {
            if (!sale?.timestamp?.toDate) continue;
            const saleDate = sale.timestamp.toDate();
            if (!isWithinInterval(saleDate, window)) continue;

            const units = Number(sale.quantity || 0);
            totalUnits += units;

            if (!sale.productId) continue;
            const productId = sale.productId;
            const productName = productsData?.find(p => p.id === sale.productId)?.name || 'Product';

            const existing = byProduct.get(productId) || { productId, name: productName, units: 0, revenue: 0 };
            existing.units += units;
            existing.revenue += Number(sale.amount || 0);
            byProduct.set(productId, existing);
        }

        const rows = Array.from(byProduct.values()).filter(r => r.units > 0);

        const bestSeller = rows.length > 0
            ? [...rows].sort((a, b) => (b.units - a.units) || (b.revenue - a.revenue))[0]
            : undefined;

        const worstSellerCandidate = rows.length > 0
            ? [...rows].sort((a, b) => (a.units - b.units) || (a.revenue - b.revenue))[0]
            : undefined;

        const worstSeller = rows.length >= 2 && worstSellerCandidate && bestSeller
            ? (worstSellerCandidate.productId !== bestSeller.productId ? worstSellerCandidate : undefined)
            : undefined;

        return { totalUnits, bestSeller, worstSeller };
    }, [productsData, salesData, selectedBranchId]);

    const topInsights = useMemo<string[]>(() => {
        if (!businessData || !salesData || salesData.length < 5) {
            return [
                language === 'fr'
                    ? "Enregistre plus d’activité pour débloquer des insights (ventes, dépenses, dépôts/retraits)."
                    : "Record more activity to unlock insights (sales, expenses, deposits/withdrawals).",
            ];
        }

        const insights: string[] = [];

        if (forecasts.cashRunway !== null && forecasts.cashRunway < 14) {
            insights.push(
                language === 'fr'
                    ? `Trésorerie faible : ~${forecasts.cashRunway} jours de marge au rythme actuel.`
                    : `Cash runway is low: ~${forecasts.cashRunway} days at the current burn rate.`
            );
        }

        if (businessInsights.totalSales > 0) {
            const margin = businessInsights.profitMargin;
            if (margin < 10) {
                insights.push(
                    language === 'fr'
                        ? `Marge faible (${margin.toFixed(0)}%). Revois les prix, les coûts et les dépenses.`
                        : `Low margin (${margin.toFixed(0)}%). Review pricing, costs, and expenses.`
                );
            }

            const expenseRatio = businessInsights.totalExpenses / businessInsights.totalSales;
            if (Number.isFinite(expenseRatio) && expenseRatio > 0.6) {
                insights.push(
                    language === 'fr'
                        ? `Dépenses élevées : ~${(expenseRatio * 100).toFixed(0)}% du chiffre d’affaires.`
                        : `High expenses: ~${(expenseRatio * 100).toFixed(0)}% of sales.`
                );
            }
        }

        if (businessInsights.bestSellingProduct && businessInsights.totalSales > 0) {
            const bestSellerSales = businessInsights.bestSellingProduct.sales || 0;
            const bestSellerRevenuePercentage = (bestSellerSales / businessInsights.totalSales) * 100;
            if (Number.isFinite(bestSellerRevenuePercentage) && bestSellerRevenuePercentage > 50) {
                insights.push(
                    language === 'fr'
                        ? `Dépendance produit : ${businessInsights.bestSellingProduct.name} = ${bestSellerRevenuePercentage.toFixed(0)}% des revenus.`
                        : `Product concentration: ${businessInsights.bestSellingProduct.name} is ${bestSellerRevenuePercentage.toFixed(0)}% of revenue.`
                );
            }
        }

        if (businessInsights.lowStockProducts.length > 0) {
            const topLow = businessInsights.lowStockProducts
                .slice(0, 2)
                .map(p => `${p.name} (${p.quantity})`)
                .join(', ');
            insights.push(
                language === 'fr'
                    ? `Stock faible à surveiller : ${topLow}.`
                    : `Low stock to watch: ${topLow}.`
            );
        }

        if (insights.length === 0) {
            insights.push(
                language === 'fr'
                    ? "Rien d’urgent détecté. Continue comme ça et enregistre tes données chaque jour."
                    : "No urgent risks detected. Keep recording daily activity to improve insights."
            );
        }

        return insights.slice(0, 4);
    }, [businessData, salesData, businessInsights, forecasts, language]);
    
    const healthScore = useMemo(() => {
        if (!salesData || businessInsights.salesDays < 3) return { score: null, label: 'Needs Data' };
        
        let score = 0;
        const margin = businessInsights.profitMargin;
        if(margin >= 30) score += 40;
        else if (margin >= 10) score += 20 + ((margin - 10) / 20) * 20; // Pro-rata score for 10-29%
        else score += (margin / 10) * 20; // Pro-rata for <10%

        const salesConsistency = Math.min(1, businessInsights.salesDays / 30);
        score += salesConsistency * 30;

        const expenseRatio = businessInsights.totalSales > 0 ? businessInsights.totalExpenses / businessInsights.totalSales : 1;
        score += Math.max(0, (1 - expenseRatio)) * 30;

        const finalScore = Math.min(100, Math.max(0, Math.round(score)));
        let label = 'At Risk';
        if (finalScore >= 75) label = 'Healthy';
        else if (finalScore >= 50) label = 'Stable';

        return { score: finalScore, label };
    }, [businessInsights, salesData]);


    const handleQuestionClick = async (question: string) => {
        if (!businessData || !businessInsights) return;

        const unavailableText = language === 'fr'
            ? "Busmo n’est pas disponible pour le moment. Réessaie bientôt."
            : "Busmo isn’t available right now. Please try again.";

        const formatLocalCurrency = (value: number) => formatCurrency(value, businessData?.currency);
        const formatPercent = (value: number) => `${Math.round(value)}%`;

        const generateLocalInsightAnswer = (q: string) => {
            const text = (q || '').toLowerCase();
            const hasSales = businessInsights.totalSales > 0 || businessInsights.salesTodayCount > 0;
            const hasExpenses = businessInsights.totalExpenses > 0;
            const hasTransactions = businessInsights.totalDeposits > 0 || businessInsights.totalWithdrawals > 0;

            const isFrench = language === 'fr';
            const basedOnRecent = isFrench ? "D’après l’activité récente" : "Based on recent activity";

            if (text.includes('today') || text.includes("aujourd'hu") || text.includes('aujourd’hui')) {
                if (text.includes('sale') || text.includes('vent')) {
                    if (!hasSales) return null;
                    return isFrench
                        ? `Aujourd’hui, tu as ${businessInsights.salesTodayCount} ventes pour ${formatLocalCurrency(businessInsights.salesTodayTotal)}.`
                        : `Today, you made ${businessInsights.salesTodayCount} sales totaling ${formatLocalCurrency(businessInsights.salesTodayTotal)}.`;
                }
                if (text.includes('profit') || text.includes('béné') || text.includes('benef')) {
                    if (!hasSales) return null;
                    return isFrench
                        ? `Le bénéfice net d’aujourd’hui est ${formatLocalCurrency(businessInsights.profitToday)}.`
                        : `Today’s net profit is ${formatLocalCurrency(businessInsights.profitToday)}.`;
                }
            }

            if (text.includes('revenue') || text.includes('sales') || text.includes('chiffre') || text.includes('vent')) {
                if (!hasSales) return null;
                return isFrench
                    ? `${basedOnRecent}, ton chiffre d’affaires total est ${formatLocalCurrency(businessInsights.totalSales)}.`
                    : `${basedOnRecent}, your total sales are ${formatLocalCurrency(businessInsights.totalSales)}.`;
            }

            if (text.includes('profit') || text.includes('béné') || text.includes('benef')) {
                if (!hasSales) return null;
                return isFrench
                    ? `${basedOnRecent}, ton bénéfice net est ${formatLocalCurrency(businessInsights.totalProfit)}.`
                    : `${basedOnRecent}, your net profit is ${formatLocalCurrency(businessInsights.totalProfit)}.`;
            }

            if (text.includes('margin') || text.includes('marge')) {
                if (!hasSales) return null;
                return isFrench
                    ? `${basedOnRecent}, ta marge nette est d’environ ${formatPercent(businessInsights.profitMargin)}.`
                    : `${basedOnRecent}, your net profit margin is about ${formatPercent(businessInsights.profitMargin)}.`;
            }

            if (text.includes('expense') || text.includes('charge') || text.includes('dépense') || text.includes('depense')) {
                if (!hasExpenses) return null;
                return isFrench
                    ? `${basedOnRecent}, tes dépenses totalisent ${formatLocalCurrency(businessInsights.totalExpenses)} (environ ${formatLocalCurrency(businessInsights.dailyAvgExpense)} par jour).`
                    : `${basedOnRecent}, your expenses total ${formatLocalCurrency(businessInsights.totalExpenses)} (about ${formatLocalCurrency(businessInsights.dailyAvgExpense)} per day).`;
            }

            if (text.includes('withdraw') || text.includes('retir')) {
                if (!hasTransactions) return null;
                return isFrench
                    ? `${basedOnRecent}, tu as retiré ${formatLocalCurrency(businessInsights.totalWithdrawals)}.`
                    : `${basedOnRecent}, you’ve withdrawn ${formatLocalCurrency(businessInsights.totalWithdrawals)}.`;
            }

            if (text.includes('deposit') || text.includes('dépôt') || text.includes('depot')) {
                if (!hasTransactions) return null;
                return isFrench
                    ? `${basedOnRecent}, tu as déposé ${formatLocalCurrency(businessInsights.totalDeposits)}.`
                    : `${basedOnRecent}, you’ve deposited ${formatLocalCurrency(businessInsights.totalDeposits)}.`;
            }

            if (text.includes('cash') || text.includes('balance') || text.includes('trésor') || text.includes('tresor')) {
                if (!hasTransactions) return null;
                return isFrench
                    ? `${basedOnRecent}, ta trésorerie est ${formatLocalCurrency(businessInsights.cashBalance)}.`
                    : `${basedOnRecent}, your cash balance is ${formatLocalCurrency(businessInsights.cashBalance)}.`;
            }

            if (text.includes('restock') || text.includes('stock') || text.includes('réappro') || text.includes('reappro')) {
                if (businessInsights.lowStockProducts.length === 0) {
                    return isFrench
                        ? "Aucun produit en stock faible pour le moment."
                        : "No low‑stock products right now.";
                }
                const top = [...businessInsights.lowStockProducts].sort((a, b) => a.quantity - b.quantity)[0];
                return isFrench
                    ? `Réapprovisionne ${top.name} en premier — il ne reste que ${top.quantity}.`
                    : `Restock ${top.name} first — only ${top.quantity} left.`;
            }

            if (text.includes('best') || text.includes('meilleur')) {
                const best = businessInsights.bestSellingProduct;
                if (!best) return null;
                return isFrench
                    ? `${basedOnRecent}, ton meilleur produit est ${best.name} (${best.quantity} unités vendues).`
                    : `${basedOnRecent}, your best seller is ${best.name} (${best.quantity} units sold).`;
            }

            if (text.includes('worst') || text.includes('moins') || text.includes('pire')) {
                const worst = businessInsights.worstSellingProduct;
                if (!worst) return null;
                return isFrench
                    ? `${basedOnRecent}, le produit le moins performant est ${worst.name} (${worst.quantity} unités vendues).`
                    : `${basedOnRecent}, your weakest performer is ${worst.name} (${worst.quantity} units sold).`;
            }

            if (text.includes('grow') || text.includes('afford') || text.includes('grandir') || text.includes('permettre')) {
                if (forecasts.cashRunway !== null) {
                    return isFrench
                        ? `${basedOnRecent}, tu as environ ${forecasts.cashRunway} jours de marge de trésorerie. Planifie ta croissance avec prudence.`
                        : `${basedOnRecent}, you have about ${forecasts.cashRunway} days of cash runway. Plan growth cautiously.`;
                }
                if (businessInsights.recentActivityInWindow && businessInsights.dailyAvgBurn === 0) {
                    return isFrench
                        ? "Tu ne brûles pas de trésorerie actuellement. La croissance semble possible si tu gardes ce rythme."
                        : "You’re not burning cash right now. Growth may be possible if you maintain this pace.";
                }
            }

            return null;
        };
        
        const currency = getCurrencySymbol(businessData?.currency || businessData?.country);
        const cacheKey = JSON.stringify({ question, insights: businessInsights, language, currency, selectedBranchId });
        if (aiCache[cacheKey]) {
            setAnswer(aiCache[cacheKey]);
            setSelectedQuestion(question);
            return;
        }

        const missingDataFallback = getMissingDataFallback(question);
        if (missingDataFallback) {
            setSelectedQuestion(question);
            setAnswer(missingDataFallback);
            setAiCache(prev => ({ ...prev, [cacheKey]: missingDataFallback }));
            return;
        }

        const localAnswer = generateLocalInsightAnswer(question);

        setIsLoadingAi(true);
        setSelectedQuestion(question);
        setAnswer(null);
        try {
            const insightsForAI = {
                totalSales: businessInsights.totalSales,
                totalProfit: businessInsights.totalProfit,
                bestSellingProduct: businessInsights.bestSellingProduct,
                worstSellingProduct: businessInsights.worstSellingProduct,
                lowStockProducts: businessInsights.lowStockProducts,
                salesTodayCount: businessInsights.salesTodayCount,
                salesTodayTotal: businessInsights.salesTodayTotal,
                profitToday: businessInsights.profitToday,
                totalDeposits: businessInsights.totalDeposits,
                totalWithdrawals: businessInsights.totalWithdrawals,
                totalExpenses: businessInsights.totalExpenses,
                profitMargin: businessInsights.profitMargin,
                cashBalance: businessInsights.cashBalance,
                dailyAvgExpense: businessInsights.dailyAvgExpense,
                salesDays: businessInsights.salesDays,
            };

            const response = await getBusinessInsights({ 
                query: question,
                insights: insightsForAI,
                currency,
                language,
            });
            if (response.answer && response.answer !== unavailableText) {
                setAnswer(response.answer);
                setAiCache(prev => ({ ...prev, [cacheKey]: response.answer }));
                return;
            }

            if (localAnswer) {
                setAnswer(localAnswer);
                setAiCache(prev => ({ ...prev, [cacheKey]: localAnswer }));
            } else {
                setAnswer(unavailableText);
            }
        } catch (error: any) {
            console.error("Error getting business insights:", error);
            if (localAnswer) {
                setAnswer(localAnswer);
                setAiCache(prev => ({ ...prev, [cacheKey]: localAnswer }));
            } else {
                setAnswer(unavailableText);
            }
        } finally {
            setIsLoadingAi(false);
        }
    };
    
        const statementUrl = '/owner/summary';

    const displayAnswer = useMemo(() => {
        const raw = (answer || '').trim();
        if (!raw) return '';

        const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
        if (!looksLikeHtml) return raw;

        return raw
            .replace(/<\s*br\s*\/?\s*>/gi, '\n')
            .replace(/<\s*\/\s*p\s*>/gi, '\n')
            .replace(/<\s*p\b[^>]*>/gi, '')
            .replace(/<\s*ul\b[^>]*>/gi, '\n')
            .replace(/<\s*\/\s*ul\s*>/gi, '\n')
            .replace(/<\s*li\b[^>]*>/gi, '\n- ')
            .replace(/<\s*\/\s*li\s*>/gi, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }, [answer]);

    const profitMargin = businessInsights.profitMargin;
    const profitMarginLabel = profitMargin >= 30 ? 'Healthy' : profitMargin >= 10 ? 'Fair' : 'Risky';
    const profitMarginColor = profitMargin >= 30 ? 'text-success' : profitMargin >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-destructive';
    
    const branches = businessData?.branches || [];
    const showBranchSelector = (businessData?.plan === 'multi-branch' || businessData?.plan === 'company') && branches.length > 0;

  return (
    <div className="flex flex-col min-h-svh bg-background">
        {announcements && announcements.length > 0 && (
            <div className="bg-primary text-primary-foreground">
                <div className="container mx-auto">
                    <Carousel
                        plugins={[ Autoplay({ delay: 8000, stopOnInteraction: true }) ]}
                        opts={{ align: "start", loop: true }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {announcements.map((announcement) => (
                                <CarouselItem key={announcement.id}>
                                    <Link href={announcement.href || '#'}>
                                        <div className="flex items-center justify-center gap-2 text-center py-2 px-4 text-sm font-medium">
                                            <Megaphone className="h-4 w-4" />
                                            <span>{announcement.text}</span>
                                        </div>
                                    </Link>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            </div>
        )}

      <main className="flex-1 p-4 sm:p-6 space-y-6">
        {!isTrialAlertHidden && activeSubscription && activeSubscription.status === 'trialing' && new Date() < activeSubscription.currentPeriodEnd.toDate() && (
            <Alert variant="default" className="bg-primary/10 border-primary/20 relative pr-12">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <AlertTitle>{t('ownerHome.trialActiveTitle')}</AlertTitle>
                <AlertDescription className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <span>
                        {t('ownerHome.trialDaysLeft').replace(
                            '{{days}}',
                            String(Math.max(0, differenceInDays(activeSubscription.currentPeriodEnd.toDate(), new Date())))
                        )}
                    </span>
                    <Button
                        size="sm"
                        className="mt-2 sm:mt-0"
                        onClick={() => {
                            const trialEndsOn = activeSubscription.currentPeriodEnd.toDate().toLocaleDateString();
                            toast({
                                title: t('ownerHome.trialNotEndedTitle'),
                                description: t('ownerHome.trialNotEndedDesc').replace('{{date}}', trialEndsOn),
                            });
                        }}
                    >
                        {t('ownerHome.upgradeNow')}
                    </Button>
                </AlertDescription>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-primary/70 hover:text-primary hover:bg-primary/10"
                    onClick={() => {
                        setIsTrialAlertHidden(true);
                        localStorage.setItem('isTrialAlertHidden', 'true');
                    }}
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">{t('ownerHome.dismiss')}</span>
                </Button>
            </Alert>
        )}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
                <h1 className="text-lg md:text-2xl font-bold font-headline">
                    {t('ownerHome.welcomeBack').replace('{{name}}', userProfile?.displayName || '')}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">{t('ownerHome.todaySubtitle')}</p>
            </div>
             {showBranchSelector && (
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder={t('ownerHome.selectBranch')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('ownerHome.allBranches')}</SelectItem>
                            {branches.map(branch => (
                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> {t('ownerHome.businessHealthTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1 rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">{t('ownerHome.todaysSales')}</p>
                        <p className="text-2xl font-bold">{formatCurrency(businessInsights.salesTodayTotal, businessData?.currency)}</p>
                    </div>
                    <div className="space-y-1 rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">{t('ownerHome.todaysProfit')}</p>
                        <p className="text-2xl font-bold">{formatCurrency(businessInsights.profitToday, businessData?.currency)}</p>
                    </div>
                     <div className="space-y-1 rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">{t('ownerHome.profitMargin')}</p>
                        <p className={cn("text-2xl font-bold", profitMarginColor)}>{businessInsights.profitMargin.toFixed(0)}%</p>
                    </div>
                    <div className="space-y-1 rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">{t('ownerHome.cashBalance')}</p>
                        <p className="text-2xl font-bold">{formatCurrency(businessInsights.cashBalance, businessData?.currency)}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="secondary" asChild><Link href={statementUrl}>{t('ownerHome.viewStatement')}</Link></Button>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Button asChild className="h-24 text-lg flex-col gap-2"><Link href="/record-sale"><Plus /> {t('ownerHome.recordSale')}</Link></Button>
                            <Button asChild variant="secondary" className="h-24 flex-col gap-2"><Link href="/add-inventory"><PackagePlus/>{t('ownerHome.addStock')}</Link></Button>
                            <Button asChild variant="secondary" className="h-24 flex-col gap-2"><Link href="/record-expense"><FilePlus/>{t('ownerHome.addExpense')}</Link></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" className="h-24 flex-col gap-2"><CircleDollarSign/>{t('ownerHome.cashflow')}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild><Link href="/owner/add-money">{t('ownerHome.addMoneyDeposit')}</Link></DropdownMenuItem>
                                        <DropdownMenuItem asChild><Link href="/owner/take-money">{t('ownerHome.takeMoneyWithdrawal')}</Link></DropdownMenuItem>
                                        <DropdownMenuItem asChild><Link href="/owner/reduce-inventory">{t('ownerHome.reduceStockDamage')}</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
           <div className="lg:col-span-1 flex flex-col gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2"><BotMessageSquare className="w-5 h-5 text-accent"/> {t('askBusmo.title')}</CardTitle>
                        <CardDescription className="text-xs">{t('ownerHome.askBusmoDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="secondary" className="w-full">
                            <Link href="/owner/ask">{t('askBusmo.title')}</Link>
                        </Button>
                    </CardContent>
                </Card>
                
                {businessId && <MarketplacePerformanceCard businessId={businessId} currency={businessData?.currency} />}

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> {t('ownerHome.referralTitle')}</CardTitle>
                        <CardDescription className="text-xs">{t('ownerHome.referralSubtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded-md border bg-background p-3">
                            <p className="text-xs text-muted-foreground">{t('ownerHome.referralBalanceLabel')}</p>
                            <p className="mt-1 text-2xl font-bold">{formatCurrency(referralStats?.balance ?? 0, businessData?.currency || 'NGN')}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="secondary" className="flex-1">
                                <Link href="/owner/referrals">{t('ownerHome.referralTitle')}</Link>
                            </Button>
                            <Button type="button" variant="outline" className="flex-1" onClick={handleCopyReferralLink}>
                                <Copy className="h-4 w-4 mr-2" /> {t('ownerHome.referralCopyButton')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
          </div>
        </div>
      </main>
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('ownerHome.welcomeDialogTitle')}</DialogTitle>
                <DialogDescription>
                    {t('ownerHome.welcomeDialogDesc')}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <Link href="/add-product" onClick={() => setShowWelcome(false)}>
                    <div className="p-3 rounded-md border hover:bg-muted/50 cursor-pointer">
                        <p className="font-semibold">{t('ownerHome.welcomeStep1Title')}</p>
                        <p className="text-sm text-muted-foreground">{t('ownerHome.welcomeStep1Desc')}</p>
                    </div>
                </Link>
                 <Link href="/record-sale" onClick={() => setShowWelcome(false)}>
                    <div className="p-3 rounded-md border hover:bg-muted/50 cursor-pointer">
                        <p className="font-semibold">{t('ownerHome.welcomeStep2Title')}</p>
                        <p className="text-sm text-muted-foreground">{t('ownerHome.welcomeStep2Desc')}</p>
                    </div>
                </Link>
            </div>
        </DialogContent>
    </Dialog>
    </div>
  );
}
