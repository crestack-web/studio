'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect, FormEvent, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, BotMessageSquare, PackagePlus, FilePlus, Landmark, CircleDollarSign, Activity, TrendingUp, AlertTriangle, Download, Bell, Users, Store, Loader2, LogOut, MessageSquare, Send, ArrowLeft, TrendingDown, ChevronsUp, PackageMinus, Package, ShoppingCart, Lock, X, CreditCard, FileUp, Megaphone } from 'lucide-react';
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

interface AppUser {
    id: string;
    displayName: string;
    businessId: string;
    role: string;
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
    }
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
}

interface Product {
    id: string;
    name: string;
    price: number;
    cost: number;
    quantity: number;
    hasVariants?: boolean;
    variants?: {
        id: string;
        name: string;
        price: number;
        cost?: number;
        quantity: number;
    }[];
}

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    createdAt: Timestamp;
}

interface Expense {
    id: string;
    category: string;
    title: string;
    amount: number;
    createdAt: Timestamp;
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


function OwnerHomeContent() {
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

        if (!salesData || !productsData || !businessData || !expensesData || !transactionsData) {
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

        for (const sale of salesData) {
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

        const totalExpenses = expensesData.reduce((acc, exp) => acc + exp.amount, 0);
        const expensesToday = expensesData
            .filter(exp => exp.createdAt?.toDate && isWithinInterval(exp.createdAt.toDate(), todayInterval))
            .reduce((acc, exp) => acc + exp.amount, 0);

        const netProfit = grossProfit - totalExpenses;
        const netProfitToday = grossProfitToday - expensesToday;

        const soldProducts = Object.values(salesByProduct);
        const bestSellingProduct = soldProducts.length > 0 ? [...soldProducts].sort((a,b) => b.sales - a.sales)[0] : undefined;
        const worstSellingProduct = soldProducts.length > 0 ? [...soldProducts].sort((a,b) => a.sales - b.sales)[0] : undefined;

        const lowStockProducts = productsData.filter(p => p.quantity <= 10);
        
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        if (transactionsData) {
            for (const transaction of transactionsData) {
                if (transaction.type === 'deposit') totalDeposits += transaction.amount;
                if (transaction.type === 'withdrawal') totalWithdrawals += transaction.amount;
            }
        }
        
        const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
        const cashBalance = totalDeposits - totalWithdrawals;

        const daysWithExpenses = new Set(expensesData.map(e => e.createdAt.toDate().toDateString())).size;
        const dailyAvgExpense = daysWithExpenses > 0 ? totalExpenses / daysWithExpenses : 0;

        return { 
            totalSales, totalProfit: netProfit, bestSellingProduct, worstSellingProduct, 
            lowStockProducts, salesTodayCount, salesTodayTotal, profitToday: netProfitToday, 
            totalDeposits, totalWithdrawals, profitMargin, totalExpenses, cashBalance,
            dailyAvgExpense, salesDays: saleDates.size
        };

    }, [salesData, productsData, businessData, transactionsData, expensesData]);
    
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      

      <main className="flex-1 p-4 sm:p-6">
        
      </main>
      
    </div>
  );
}

