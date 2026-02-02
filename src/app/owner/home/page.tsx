
'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect, FormEvent, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Plus, BotMessageSquare, PackagePlus, FilePlus, Landmark, CircleDollarSign, Activity, TrendingUp, AlertTriangle, Download, Bell, Users, Store, Loader2, LogOut, MessageSquare, Send, ArrowLeft, TrendingDown, ChevronsUp, Calendar, PackageMinus, Package, ShoppingCart, Lock, X, CreditCard, FileUp, Megaphone, MapPin } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { getBusinessInsights } from '@/ai/flows/get-business-insights';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { startOfDay, endOfDay, isWithinInterval, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { useUser, useCollection, useDoc, useMemoFirebase, useFirestore, useAuth, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, Timestamp, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
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
}

interface Announcement {
    id: string;
    text: string;
    href: string;
}


const MarketplacePerformanceCard = ({ businessId, currency }: { businessId: string; currency?: string; }) => {
    const firestore = useFirestore();

    const marketOrdersQuery = useMemoFirebase(() => {
        return query(
            collection(firestore, `businesses/${businessId}/orders`), 
            where('source', '==', 'market')
        );
    }, [firestore, businessId]);

    const { data: marketOrders, isLoading } = useCollection<MarketplaceOrder>(marketOrdersQuery);

    const marketRevenue = useMemo(() => {
        if (!marketOrders) return 0;
        return marketOrders.reduce((acc, order) => acc + order.total, 0);
    }, [marketOrders]);

    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <span>Marketplace Performance</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {marketOrders && marketOrders.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{marketOrders.length}</p>
                            <p className="text-xs text-muted-foreground">Orders</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{formatCurrency(marketRevenue, currency)}</p>
                            <p className="text-xs text-muted-foreground">Revenue</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">No marketplace orders yet.</p>
                )}
            </CardContent>
        </Card>
    );
};


export default function OwnerHomePage() {
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const onboardingComplete = searchParams.get('onboarding') === 'complete';

    const [answer, setAnswer] = useState<string | null>(null);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [aiCache, setAiCache] = useState<Record<string, string>>({});
    const [presetQuestions, setPresetQuestions] = useState<string[]>([]);
    const [isInsightVisible, setIsInsightVisible] = useState(true);

    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const { language } = useLanguage();
    
    const [chatView, setChatView] = useState('initial'); // 'initial', 'chat', 'ticket'
    const [chatInput, setChatInput] = useState('');
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [selectedBranchId, setSelectedBranchId] = useState('all');


    useEffect(() => {
        if (onboardingComplete) {
            setShowWelcome(true);
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('onboarding');
            window.history.replaceState({}, '', currentUrl.toString());
        }
    }, [onboardingComplete]);
    
    useEffect(() => {
        const allQuestions = [
            "Why did my profit drop this week?",
            "Which product should I restock first?",
            "Am I spending too much on expenses?",
            "Can I afford to grow this month?",
            "How are my sales today?",
            "What's my net profit today?",
            "What's my recent sales revenue?",
            "How much money have I withdrawn recently?",
        ];

        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        setPresetQuestions(shuffled.slice(0, 4));
    }, []);

    const userProfileRef = useMemoFirebase(() => {
        if (!authUser || !firestore) return null;
        return doc(firestore, `users/${authUser.uid}`);
    }, [authUser, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;
    
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
    
    const businessInsights = useMemo(() => {
        const defaultInsights = {
            totalSales: 0, totalProfit: 0, bestSellingProduct: undefined, worstSellingProduct: undefined,
            lowStockProducts: [], salesTodayCount: 0, salesTodayTotal: 0, profitToday: 0,
            totalDeposits: 0, totalWithdrawals: 0, profitMargin: 0, totalExpenses: 0,
            cashBalance: 0, dailyAvgExpense: 0, salesDays: 0,
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

        const lowStockProducts = productsData.flatMap(p => {
            if (p.hasVariants && p.variants) {
                return p.variants.map(v => {
                    const quantity = selectedBranchId === 'all' 
                        ? Object.values(v.stockByBranch || {}).reduce((s, q) => s + q, 0)
                        : v.stockByBranch?.[selectedBranchId] || 0;
                    return { id: `${p.id}-${v.id}`, name: `${p.name} (${v.name})`, quantity };
                });
            } else {
                const quantity = selectedBranchId === 'all'
                    ? Object.values(p.stockByBranch || {}).reduce((s, q) => s + q, 0)
                    : p.stockByBranch?.[selectedBranchId] || 0;
                return [{ id: p.id, name: p.name, quantity }];
            }
        }).filter(p => p.quantity <= 10);
        
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        for (const transaction of filteredTransactions) {
            if (transaction.type === 'deposit') totalDeposits += transaction.amount;
            if (transaction.type === 'withdrawal') totalWithdrawals += transaction.amount;
        }
        
        const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
        const cashBalance = totalDeposits - totalWithdrawals;

        const daysWithExpenses = new Set(filteredExpenses.map(e => e.createdAt.toDate().toDateString())).size;
        const dailyAvgExpense = daysWithExpenses > 0 ? totalExpenses / daysWithExpenses : 0;

        return { 
            totalSales, totalProfit: netProfit, bestSellingProduct, worstSellingProduct, 
            lowStockProducts, salesTodayCount, salesTodayTotal, profitToday: netProfitToday, 
            totalDeposits, totalWithdrawals, profitMargin, totalExpenses, cashBalance,
            dailyAvgExpense, salesDays: saleDates.size
        };

    }, [salesData, productsData, businessData, transactionsData, expensesData, selectedBranchId]);
    
    const forecasts = useMemo(() => {
        const defaultForecasts = {
            weeklyProfit: null,
            busiestDay: null,
            inventoryOutlook: null,
            cashRunway: null,
        };

        if (!salesData || salesData.length < 2 || !businessInsights.totalProfit) {
            return defaultForecasts;
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
        
        let inventoryOutlook = null;
        if (businessInsights.lowStockProducts.length > 0 && periodInDays > 0) {
            let mostAtRiskProduct: { name: string; days: number; } | null = null;
            let minDays = Infinity;
            for (const lowStockProduct of businessInsights.lowStockProducts) {
                const salesOfProduct = salesData.filter(s => s.productId === lowStockProduct.id);
                const totalSold = salesOfProduct.reduce((acc, s) => acc + s.quantity, 0);
                if (totalSold > 0) {
                    const dailyConsumption = totalSold / periodInDays;
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
                inventoryOutlook = `You are likely to run out of ${mostAtRiskProduct.name} in ${mostAtRiskProduct.days} days.`;
            }
        }
        
        const cashRunway = businessInsights.dailyAvgExpense > 0 ? Math.floor(businessInsights.cashBalance / businessInsights.dailyAvgExpense) : null;

        return { weeklyProfit, busiestDay, inventoryOutlook, cashRunway };

    }, [businessInsights, salesData]);

    const topInsight = useMemo(() => {
        if (!businessData || !salesData || salesData.length < 5) {
            return "Record more activity to unlock today's key insight.";
        }
        if(forecasts.cashRunway !== null && forecasts.cashRunway < 14) {
            return `Cash runway is low. You have an estimated ${forecasts.cashRunway} days of cash left based on current expenses.`;
        }
        if (businessInsights.profitMargin < 10 && businessInsights.totalSales > 0) {
            return `Profit margin is risky at ${businessInsights.profitMargin.toFixed(0)}%. Review your product costs and expenses.`;
        }
        if(businessInsights.bestSellingProduct) {
            const bestSellerRevenuePercentage = (businessInsights.bestSellingProduct.sales / businessInsights.totalSales) * 100;
            if(bestSellerRevenuePercentage > 50) {
                return `Your best seller, ${businessInsights.bestSellingProduct.name}, accounts for ${bestSellerRevenuePercentage.toFixed(0)}% of revenue. Consider promoting other products.`;
            }
        }
        return "Your business is performing consistently. Keep up the great work!";
    }, [businessData, salesData, businessInsights, forecasts]);
    
    const healthScore = useMemo(() => {
        if (!salesData || businessInsights.salesDays < 3) return { score: null, label: 'Needs Data' };
        
        let score = 0;
        const margin = businessInsights.profitMargin;
        if(margin >= 30) score += 40;
        else if (margin >= 10) score += 20 + ((margin - 10) / 20) * 20; // Pro-rata score for 10-29%
        else score += (margin / 10) * 20; // Pro-rata for &lt;10%

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
        
        const cacheKey = JSON.stringify({ question, insights: businessInsights });
        if (aiCache[cacheKey]) {
            setAnswer(aiCache[cacheKey]);
            setSelectedQuestion(question);
            return;
        }

        setIsLoadingAi(true);
        setSelectedQuestion(question);
        setAnswer(null);
        try {
            const response = await getBusinessInsights({ 
                query: question,
                insights: businessInsights,
                currency: getCurrencySymbol(businessData?.currency || businessData?.country),
            });
            if (response.answer) {
              setAnswer(response.answer);
              setAiCache(prev => ({ ...prev, [cacheKey]: response.answer }));
            } else {
              setAnswer("Sorry, I couldn't process that request. Please try again.");
            }
        } catch (error: any) {
            console.error("Error getting business insights:", error);
            if (error.message && error.message.includes('429 Too Many Requests')) {
                setAnswer("I'm experiencing high demand right now. Please try again in a minute.");
            } else {
                setAnswer("Sorry, I couldn't process that request. Please try again.");
            }
        } finally {
            setIsLoadingAi(false);
        }
    };
    
    const statementUrl = '/owner/summary';
    
    const handleSignOut = async () => {
      if(auth) {
        await signOut(auth);
      }
      router.push('/login');
    };

    const lowStockNotifications = businessInsights.lowStockProducts;

    const profitMargin = businessInsights.profitMargin;
    const profitMarginLabel = profitMargin >= 30 ? 'Healthy' : profitMargin >= 10 ? 'Fair' : 'Risky';
    const profitMarginColor = profitMargin >= 30 ? 'text-success' : profitMargin >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-destructive';
    
    const branches = businessData?.branches || [];
    const showBranchSelector = (businessData?.plan === 'multi-branch' || businessData?.plan === 'company') && branches.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-card px-4">
        <Logo className="h-8" />
        <div className="flex items-center gap-2">
            <ThemeToggle />
             <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative hover:bg-transparent">
                        <Bell className="h-5 w-5" />
                        {lowStockNotifications.length > 0 && <span className="absolute top-1 right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span></span>}
                    </Button>
                </PopoverTrigger>
                 <PopoverContent align="end" className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Notifications</h4>
                            <p className="text-sm text-muted-foreground">Your recent business alerts.</p>
                        </div>
                         <div className="grid gap-2">
                            {lowStockNotifications.length > 0 ? (
                                lowStockNotifications.slice(0, 3).map(product => (
                                    <div key={product.id} className="grid grid-cols-[25px_1fr] items-start pb-2 last:pb-0">
                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        <div className="grid gap-1">
                                            <p className="text-sm font-medium leading-none">Low Stock Warning</p>
                                            <p className="text-sm text-muted-foreground">{product.name} has only {product.quantity} units left.</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No new notifications.</p>
                            )}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="flex items-center gap-2 p-1 h-auto hover:bg-transparent">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{userProfile?.displayName?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col items-start">
                             <span className="font-semibold text-sm">{userProfile?.displayName}</span>
                             <span className="text-xs text-muted-foreground">{businessData?.businessName}</span>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/owner/staff">Manage Staff</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/owner/pricing">Billing</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      
        {announcements && announcements.length > 0 && (
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 sm:px-6">
                    <Carousel
                        plugins={[ Autoplay({ delay: 8000, stopOnInteraction: true }) ]}
                        opts={{ align: "start", loop: true }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {announcements.map((announcement) => (
                                <CarouselItem key={announcement.id}>
                                    <Link href={announcement.href || '#'}>
                                        <div className="relative p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <Megaphone className="h-4 w-4 text-primary"/>
                                                <p className="text-sm font-medium text-primary">{announcement.text}</p>
                                            </div>
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
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold font-headline">Welcome back, {userProfile?.displayName}!</h1>
                <p className="text-muted-foreground">Here's what's happening with your business today.</p>
            </div>
             {showBranchSelector && (
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
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
                    <CardTitle className="text-lg flex items-center gap-2"><BotMessageSquare className="w-5 h-5 text-accent"/> Ask Busmo</CardTitle>
                    <CardDescription>Get quick answers about your business.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {presetQuestions.map((q, i) => (
                        <Button key={i} variant="outline" size="sm" className={cn("h-auto py-2 justify-start text-left text-xs sm:text-sm", selectedQuestion === q && "bg-accent/80 text-accent-foreground")} onClick={() => handleQuestionClick(q)}>
                           {q}
                        </Button>
                    ))}
                </CardContent>
            </Card>

            {(isLoadingAi || answer) && (
                 <Card className="bg-muted/50">
                    <CardContent className="p-4">
                        {isLoadingAi ? (
                             <div className="flex items-center gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm font-medium">{answer}</p>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Business Health</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1 rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">Today's Sales</p>
                        <p className="text-2xl font-bold">{formatCurrency(businessInsights.salesTodayTotal, businessData?.currency)}</p>
                    </div>
                    <div className="space-y-1 rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">Today's Profit</p>
                        <p className="text-2xl font-bold">{formatCurrency(businessInsights.profitToday, businessData?.currency)}</p>
                    </div>
                     <div className="space-y-1 rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">Profit Margin</p>
                        <p className={cn("text-2xl font-bold", profitMarginColor)}>{businessInsights.profitMargin.toFixed(0)}%</p>
                    </div>
                    <div className="space-y-1 rounded-md border p-3">
                        <p className="text-sm text-muted-foreground">Cash Balance</p>
                        <p className="text-2xl font-bold">{formatCurrency(businessInsights.cashBalance, businessData?.currency)}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="secondary" asChild><Link href={statementUrl}>View Full Statement</Link></Button>
                </CardFooter>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild className="h-24 text-lg flex-col gap-2"><Link href="/record-sale"><Plus /> Record Sale</Link></Button>
              <Button asChild variant="secondary" className="h-24 flex-col gap-2"><Link href="/add-inventory"><PackagePlus/>Add Stock</Link></Button>
              <Button asChild variant="secondary" className="h-24 flex-col gap-2"><Link href="/record-expense"><FilePlus/>Add Expense</Link></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="h-24 flex-col gap-2"><CircleDollarSign/>Cashflow</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><Link href="/owner/add-money">Add Money (Deposit)</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/owner/take-money">Take Money (Withdrawal)</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/owner/reduce-inventory">Reduce Stock (Damage/Loss)</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
           <div className="lg:col-span-1 flex flex-col gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Today's Top Insight</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground font-medium">{topInsight}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2"><ChevronsUp className="w-5 h-5 text-primary"/> Forecasts</CardTitle>
                        <CardDescription className="text-xs">Based on your recent activity.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 pt-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-success/10 rounded-full"><TrendingUp className="w-4 h-4 text-success" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Next Week's Profit</p>
                                {forecasts.weeklyProfit ? (<p className="font-semibold">~{formatCurrency(forecasts.weeklyProfit, businessData?.currency)}</p>) : (<p className="text-xs text-muted-foreground">Needs data</p>)}
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-full"><Calendar className="w-4 h-4 text-primary" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Busiest Day</p>
                                {forecasts.busiestDay ? (<p className="font-semibold">{forecasts.busiestDay}</p>) : (<p className="text-xs text-muted-foreground">Needs data</p>)}
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-accent/10 rounded-full"><Landmark className="w-4 h-4 text-accent" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Cash Runway</p>
                                {forecasts.cashRunway !== null ? (<p className="font-semibold">~{forecasts.cashRunway} days</p>) : (<p className="text-xs text-muted-foreground">Needs data</p>)}
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-destructive/10 rounded-full"><PackageMinus className="w-4 h-4 text-destructive" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground">Inventory Outlook</p>
                                {forecasts.inventoryOutlook ? (<p className="font-semibold text-destructive text-xs">{forecasts.inventoryOutlook}</p>) : (<p className="text-xs text-muted-foreground">Stock levels are healthy.</p>)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2"><Store className="w-5 h-5 text-primary" /> Sell Online</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {businessData?.marketSettings?.isStoreActive ? (
                             <p className="text-sm text-muted-foreground">Your store is live! Manage products, orders, and settings.</p>
                        ) : (
                             <p className="text-sm text-muted-foreground">Set up your free online store on the Busmo Market.</p>
                        )}
                       <Button asChild variant="secondary" className="mt-4 w-full"><Link href="/owner/market">Manage My Market</Link></Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2"><Landmark className="w-5 h-5 text-primary" /> Access Capital</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-sm text-muted-foreground">Turn your consistent business data into funding opportunities.</p>
                       <Button asChild variant="secondary" className="mt-4 w-full"><Link href="/owner/invest">Explore Funding Options</Link></Button>
                    </CardContent>
                </Card>
          </div>
        </div>
      </main>
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Welcome to Busmo!</DialogTitle>
                <DialogDescription>
                    You're all set up. Here are a few things you can do to get started.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                 <Link href="/add-product" onClick={() => setShowWelcome(false)}>
                    <div className="p-3 rounded-md border hover:bg-muted/50 cursor-pointer">
                        <p className="font-semibold">1. Add Your Products</p>
                        <p className="text-sm text-muted-foreground">Start by adding your inventory to track stock levels.</p>
                    </div>
                </Link>
                 <Link href="/record-sale" onClick={() => setShowWelcome(false)}>
                    <div className="p-3 rounded-md border hover:bg-muted/50 cursor-pointer">
                        <p className="font-semibold">2. Record Your First Sale</p>
                        <p className="text-sm text-muted-foreground">Record a sale to see how your dashboard comes to life.</p>
                    </div>
                </Link>
            </div>
        </DialogContent>
    </Dialog>
    </div>
  );
}
