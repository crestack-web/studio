
'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect, FormEvent, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, BotMessageSquare, PackagePlus, FilePlus, Landmark, CircleDollarSign, Activity, TrendingUp, AlertTriangle, Download, Bell, Users, Store, Loader2, LogOut, MessageSquare, Send, ArrowLeft, TrendingDown, ChevronsUp, PackageMinus, Package, ShoppingCart, Lock, X, CreditCard } from 'lucide-react';
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
    text: string;
    createdAt: Timestamp;
}

interface MarketplaceOrder {
    id: string;
    total: number;
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
    
    const [chatView, setChatView] = useState('initial'); // 'initial', 'chat', 'ticket'
    const [chatInput, setChatInput] = useState('');
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);


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

    const onlineAgents = useMemo(() => {
        if (agentsError || !allAgents) return [];
        return allAgents.filter(agent => agent.status === 'online');
    }, [allAgents, agentsError]);
    
    const assignedAgent = onlineAgents?.[0];

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

    const handleCreateTicket = (e: FormEvent) => {
        e.preventDefault();
        if (!firestore) {
            toast({ title: "Error", description: "Could not connect to our services. Please try again later.", variant: "destructive" });
            return;
        }
        const ticketsCollectionRef = collection(firestore, 'supportTickets');
        addDocumentNonBlocking(ticketsCollectionRef, {
            subject: ticketSubject,
            message: ticketMessage,
            status: 'open',
            createdAt: serverTimestamp(),
            userId: authUser?.uid || null,
            userName: userProfile?.displayName || 'N/A',
            userEmail: authUser?.email || 'N/A'
        });
        toast({ title: "Ticket Submitted", description: "Our team will review your request and get back to you shortly." });
        setTicketSubject('');
        setTicketMessage('');
        setChatView('initial');
    };

    const activeConversationQuery = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return query(
            collection(firestore, 'chatConversations'),
            where('userId', '==', authUser.uid),
            where('status', 'in', ['open', 'in-progress']),
            limit(1)
        );
    }, [firestore, authUser]);
    const { data: activeConversations } = useCollection<ChatConversation>(activeConversationQuery);
    const activeConversation = activeConversations?.[0];

    useEffect(() => {
        if (activeConversation) {
            setConversationId(activeConversation.id);
        } else {
            setConversationId(null);
        }
    }, [activeConversation]);

    const chatMessagesQuery = useMemoFirebase(() => {
        if (!firestore || !conversationId) return null;
        return query(collection(firestore, `chatConversations/${conversationId}/messages`), orderBy('createdAt', 'asc'));
    }, [firestore, conversationId]);
    const { data: realChatMessages, isLoading: isLoadingMessages } = useCollection<ChatMessage>(chatMessagesQuery);
    
    useEffect(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [realChatMessages]);

    const handleStartChat = async () => {
        if (!firestore || !authUser || !userProfile) return;
        setChatView('chat');
        if (activeConversation) {
            setConversationId(activeConversation.id);
            return;
        }

        const newConversation = {
            userId: authUser.uid,
            userName: userProfile.displayName,
            agentId: null,
            status: 'open',
            lastMessage: 'User initiated chat',
            lastMessageAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        const newConversationRef = await addDocumentNonBlocking(collection(firestore, 'chatConversations'), newConversation);
        setConversationId(newConversationRef.id);
    };

    const handleSendMessageToSupport = (e: FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !firestore || !conversationId || !authUser || !userProfile) return;

        const messageText = chatInput.trim();
        setChatInput('');

        const message = {
            senderId: authUser.uid,
            senderName: userProfile.displayName,
            text: messageText,
            createdAt: serverTimestamp(),
        };

        const messagesRef = collection(firestore, `chatConversations/${conversationId}/messages`);
        const conversationRef = doc(firestore, 'chatConversations', conversationId);
        
        addDocumentNonBlocking(messagesRef, message);
        updateDocumentNonBlocking(conversationRef, {
            lastMessage: messageText,
            lastMessageAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    };

    const canManageStaff = businessData?.plan !== 'shop';
    
    const isLoadingData = isLoadingSales || isLoadingTransactions || isLoadingExpenses;

    const isNigeria = businessData?.country === 'NG';

    const lowStockNotifications = businessInsights.lowStockProducts;

    const profitMargin = businessInsights.profitMargin;
    const profitMarginLabel = profitMargin >= 30 ? 'Healthy' : profitMargin >= 10 ? 'Fair' : 'Risky';
    const profitMarginColor = profitMargin >= 30 ? 'text-success' : profitMargin >= 10 ? 'text-yellow-600 dark:text-yellow-400' : 'text-destructive';


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-card">
        <Logo className="h-8" />
        <div className="flex items-center gap-2">
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-5 w-5" />
                {lowStockNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="p-2">
                <p className="font-semibold px-2 py-1">Notifications</p>
                <Separator className="mb-2" />
                {lowStockNotifications.length > 0 ? (
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                        {lowStockNotifications.map(p => (
                            <div key={p.id} className="p-2 rounded-md hover:bg-muted text-sm">
                                <p className="font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />Low Stock Alert</p>
                                <p className="mt-1">
                                    <span className="font-semibold">{p.name}</span> has only {p.quantity} units left.
                                </p>
                                <Link href="/add-inventory" className="text-primary hover:underline text-xs font-semibold">
                                    Restock now &rarr;
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications.
                      </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <ThemeToggle />
          <Separator orientation="vertical" className="h-8 bg-border" />
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="hidden sm:block text-right">
                  <div className="font-semibold">{businessData?.businessName || <Skeleton className="h-5 w-24" />}</div>
                  <div className="text-xs text-muted-foreground">{userProfile?.role || 'Owner'}</div>
                </div>
                <Avatar>
                  <AvatarFallback>{businessData?.businessName ? businessData.businessName.split(' ').map(n => n[0]).join('').substring(0,2) : 'B'}</AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-headline sm:text-4xl">
              Welcome back, {userProfile?.displayName || 'Owner'}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's your business at a glance. Keep up the great work!
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {isInsightVisible && (
                <Card className="border border-warning bg-warning/20">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <CardTitle className="text-base font-medium text-foreground/80">Today's Key Insight</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2" onClick={() => setIsInsightVisible(false)}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Hide insight</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingData ? (
                      <div className="font-semibold"><Skeleton className="h-5 w-3/4" /></div>
                    ) : (
                      <p className="font-semibold">
                        {topInsight}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 font-headline text-lg">
                    <Activity className="w-6 h-6 text-primary" />
                    <div className="flex-1">Business Health</div>
                    {healthScore.score !== null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">{healthScore.score}<span className="text-sm text-muted-foreground">/100</span></p>
                        <p className="text-xs font-semibold">{healthScore.label}</p>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingData ? (
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (salesData && salesData.length > 0) || (transactionsData && transactionsData.length > 0) ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1 rounded-md border p-3"><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-lg font-bold sm:text-xl">{formatCurrency(businessInsights.totalSales, businessData?.country)}</p></div>
                        <div className="space-y-1 rounded-md border p-3">
                          <p className="text-sm text-muted-foreground">Net Profit</p>
                          <p className={cn("text-lg font-bold sm:text-xl", businessInsights.totalProfit >= 0 ? "text-success" : "text-destructive")}>{formatCurrency(businessInsights.totalProfit, businessData?.country)}</p>
                          {businessInsights.totalSales > 0 && <p className={cn("text-xs font-semibold", profitMarginColor)}>{profitMargin.toFixed(0)}% margin ({profitMarginLabel})</p>}
                        </div>
                        <div className="space-y-1 rounded-md border p-3"><p className="text-sm text-muted-foreground">Money In</p><p className="text-lg font-bold sm:text-xl">{formatCurrency(businessInsights.totalDeposits, businessData?.country)}</p></div>
                        <div className="space-y-1 rounded-md border p-3"><p className="text-sm text-muted-foreground">Money Out</p><p className="text-lg font-bold sm:text-xl">{formatCurrency(businessInsights.totalWithdrawals, businessData?.country)}</p></div>
                      </div>
                      <div className="pt-4">
                        <Link href={statementUrl} passHref>
                          <Button variant="secondary" className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            View Summary & Statement
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      <p>Record sales and expenses to see your summary.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between font-headline text-lg gap-2">
                    <div className='flex items-center gap-2'>
                      <BotMessageSquare className="w-6 h-6 text-accent" />
                      <span>Ask about your business</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {presetQuestions.map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      className={cn("w-full justify-start h-12", selectedQuestion === q && "bg-accent text-accent-foreground hover:bg-accent/90")}
                      onClick={() => handleQuestionClick(q)}
                      disabled={isLoadingAi && selectedQuestion === q}
                    >
                      {isLoadingAi && selectedQuestion === q && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <span className="truncate">{q}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {(isLoadingAi || answer) && (
                <Card className={isLoadingAi ? "bg-background" : "bg-muted/30"}>
                  <CardContent className="p-4">
                    {isLoadingAi ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{answer}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/record-sale">
                  <Button className="w-full h-16 text-lg justify-start px-4 gap-3">
                    <Plus className="w-6 h-6" />
                    Record Sale
                  </Button>
                </Link>
                <Link href="/record-expense">
                  <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3">
                    <FilePlus className="w-6 h-6" />
                    Record Expense
                  </Button>
                </Link>
                <Link href="/add-inventory">
                  <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3">
                    <PackagePlus className="w-6 h-6" />
                    Add Inventory
                  </Button>
                </Link>
                <Link href="/owner/reduce-inventory">
                  <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3">
                    <PackageMinus className="w-6 h-6" />
                    Reduce Inventory
                  </Button>
                </Link>
                <Link href="/owner/add-money">
                  <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3">
                    <Landmark className="w-6 h-6" />
                    Add Money
                  </Button>
                </Link>
                <Link href="/owner/take-money">
                  <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3">
                    <CircleDollarSign className="w-6 h-6" />
                    Take Money
                  </Button>
                </Link>
              </div>

              <Card className="border-dashed border-primary/50">
                <CardHeader className="text-center">
                  <div className="flex justify-center"><Lock className="w-8 h-8 text-muted-foreground" /></div>
                  <CardTitle className="text-xl pt-2">Unlock Funding</CardTitle>
                  <CardDescription>Build consistent records to unlock loans and investments.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button asChild variant="outline">
                    <Link href="/owner/access-capital">Learn More</Link>
                  </Button>
                </CardContent>
              </Card>

            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-lg">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <span>Business Forecast</span>
                  </CardTitle>
                  <CardDescription>
                    Based on your recent activity, here's what to expect.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-sm flex items-center gap-1.5"><TrendingUp className="w-5 h-5 text-success" />Weekly Profit Forecast</h4>
                    {isLoadingData ? (
                      <div className="font-semibold"><Skeleton className="h-5 w-48 mt-1" /></div>
                    ) : forecasts.weeklyProfit !== null ? (
                      <p className="text-muted-foreground text-sm mt-1">You're on track to make <span className="font-bold text-foreground">~{formatCurrency(forecasts.weeklyProfit, businessData?.country)}</span> in profit next week.</p>
                    ) : (
                      <p className="text-muted-foreground text-xs mt-1">Not enough data to forecast profit.</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-sm flex items-center gap-1.5"><Activity className="w-5 h-5 text-primary" />Busiest Day Prediction</h4>
                    {isLoadingData ? (
                      <div className="font-semibold"><Skeleton className="h-5 w-48 mt-1" /></div>
                    ) : forecasts.busiestDay ? (
                      <p className="text-muted-foreground text-sm mt-1">Expect your busiest day to be <span className="font-bold text-foreground">{forecasts.busiestDay}</span>. Plan for extra stock.</p>
                    ) : (
                      <p className="text-muted-foreground text-xs mt-1">Record more sales to predict your busiest day.</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-sm flex items-center gap-1.5"><Package className="w-5 h-5 text-warning" />Inventory Outlook</h4>
                    {isLoadingData ? (
                      <div className="font-semibold"><Skeleton className="h-5 w-48 mt-1" /></div>
                    ) : forecasts.inventoryOutlook ? (
                      <p className="text-muted-foreground text-sm mt-1">{forecasts.inventoryOutlook}</p>
                    ) : (
                      <p className="text-muted-foreground text-xs mt-1">No low-stock items with predictable sales.</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold text-sm flex items-center gap-1.5"><CircleDollarSign className="w-5 h-5 text-destructive" />Cash Runway</h4>
                    {isLoadingData ? (
                      <div className="font-semibold"><Skeleton className="h-5 w-48 mt-1" /></div>
                    ) : forecasts.cashRunway !== null ? (
                      <p className="text-muted-foreground text-sm mt-1">Your business can run for <span className="font-bold text-foreground">{forecasts.cashRunway} days</span> without new sales.</p>
                    ) : (
                      <p className="text-muted-foreground text-xs mt-1">Not enough expense data to calculate.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-headline text-lg">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    Product Performance
                  </CardTitle>
                  <CardDescription>
                    Highlights of your product sales in this period.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingSales ? <Skeleton className="h-24" /> : (salesData && salesData.length > 0) ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-muted/50">
                          <h4 className="font-semibold text-sm flex items-center gap-1.5"><ChevronsUp className="w-5 h-5 text-success" />Best Seller</h4>
                          <p className="font-bold text-lg truncate">{businessInsights.bestSellingProduct?.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(businessInsights.bestSellingProduct?.sales || 0, businessData?.country)} in revenue</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted/50">
                          <h4 className="font-semibold text-sm flex items-center gap-1.5"><TrendingDown className="w-5 h-5 text-destructive" />Worst Seller</h4>
                          <p className="font-bold text-lg truncate">{businessInsights.worstSellingProduct?.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(businessInsights.worstSellingProduct?.sales || 0, businessData?.country)} in revenue</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      <p>No product sales data for this period.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {businessData?.marketSettings?.isStoreActive && businessId && (
                <MarketplacePerformanceCard businessId={businessId} currency={businessData?.currency} />
              )}

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Store className="w-5 h-5 text-primary" />
                    Sell Online
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Set up your free online store on Busmo Market.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button variant="secondary" size="sm" className="w-full h-8 text-xs" asChild>
                    <Link href="/owner/market">Manage My Store</Link>
                  </Button>
                </CardContent>
              </Card>

              {isNigeria && (
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="w-5 h-5 text-primary" />
                      BusmoPay
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Track online revenue and manage payouts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Button variant="secondary" size="sm" className="w-full h-8 text-xs" asChild>
                      <Link href="/owner/busmopay">View Dashboard</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Landmark className="w-5 h-5 text-primary" />
                    Access Capital
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your business data can unlock investment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Button variant="secondary" size="sm" className="w-full h-8 text-xs" asChild>
                    <Link href="/owner/access-capital">Explore Options</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome aboard, {userProfile?.displayName || 'friend'}!</DialogTitle>
            <DialogDescription>
              You're all set up. The journey to business clarity starts now. Record your first sale to see the magic happen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowWelcome(false)}>Let's Go!</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet onOpenChange={(isOpen) => { if (!isOpen) setChatView('initial') }}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
            size="icon"
            aria-label="Chat with support"
          >
            <MessageSquare className="h-8 w-8" />
            <span className="sr-only">Chat with support</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          {chatView === 'initial' && (
            <>
              <SheetHeader>
                <SheetTitle>Customer Support</SheetTitle>
                <SheetDescription>
                  Our team is online and ready to help.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Available Agents</h3>
                <div className="space-y-3">
                  {isLoadingAgents ? (
                    <>
                      <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-16" /></div></div>
                    </>
                  ) : agentsError ? (
                    <p className="text-sm text-destructive text-center py-4">Could not load agent list.</p>
                  ) : onlineAgents && onlineAgents.length > 0 ? (
                    onlineAgents.map(agent => (
                      <div key={agent.userId} className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            {agent.avatarUrl ? (
                              <Image src={agent.avatarUrl} alt={agent.displayName} width={40} height={40} data-ai-hint="support agent" />
                            ) : (
                              <AvatarFallback>{agent.displayName.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          {agent.status === 'online' && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />}
                        </div>
                        <div>
                          <p className="font-semibold">{agent.displayName}</p>
                          <p className="text-xs text-muted-foreground">Support Agent</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No agents are currently online.</p>
                  )}
                </div>
              </div>
              <div className="flex-1" />
              <SheetFooter className="flex-col-reverse sm:flex-col-reverse gap-2 pt-4 border-t">
                <Button onClick={handleStartChat} className="w-full h-12 text-base" disabled={isLoadingAgents || !!agentsError || !onlineAgents || onlineAgents.length === 0}>Start Live Chat</Button>
                <Button onClick={() => setChatView('ticket')} variant="outline" className="w-full h-12 text-base">Create Support Ticket</Button>
              </SheetFooter>
            </>
          )}
          {chatView === 'chat' && (
            <>
              <SheetHeader className="flex-row items-center gap-3 pb-2 border-b">
                <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setChatView('initial')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                {assignedAgent ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {assignedAgent.avatarUrl ? (
                          <Image src={assignedAgent.avatarUrl} alt={assignedAgent.displayName} width={40} height={40} data-ai-hint="support agent" />
                        ) : (
                          <AvatarFallback>{assignedAgent.displayName.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      {assignedAgent.status === 'online' && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />}
                    </div>
                    <div>
                      <SheetTitle>{assignedAgent.displayName}</SheetTitle>
                      <SheetDescription>Support Agent</SheetDescription>
                    </div>
                  </div>
                ) : (
                  <div>
                    <SheetTitle>Connecting...</SheetTitle>
                    <SheetDescription>Waiting for an agent.</SheetDescription>
                  </div>
                )}
              </SheetHeader>
              <div className="flex-1 space-y-4 py-4 pr-4 overflow-y-auto -mr-6">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : realChatMessages ? (
                  realChatMessages.map(msg => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.senderId === authUser?.uid ? 'justify-end' : ''}`}>
                      {msg.senderId !== authUser?.uid && assignedAgent && (
                        <Avatar className="w-8 h-8 border">
                             {assignedAgent.avatarUrl ? (
                                <Image src={assignedAgent.avatarUrl} alt={assignedAgent.displayName} width={32} height={32} data-ai-hint="support agent" />
                            ) : (
                                <AvatarFallback>{assignedAgent.displayName.charAt(0)}</AvatarFallback>
                            )}
                        </Avatar>
                      )}
                      <div className={`rounded-xl p-3 text-sm max-w-[80%] ${msg.senderId === authUser?.uid ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                ) : null}
                <div ref={chatMessagesEndRef} />
              </div>
              <SheetFooter className="pt-4 -mx-6 px-6 pb-6 border-t bg-background">
                <form
                  onSubmit={handleSendMessageToSupport}
                  className="flex w-full items-center gap-2"
                >
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your message..."
                    className="h-12 flex-1 text-base"
                  />
                  <Button type="submit" size="icon" className="h-12 w-12 shrink-0">
                    <Send className="h-6 w-6" />
                  </Button>
                </form>
              </SheetFooter>
            </>
          )}
          {chatView === 'ticket' && (
            <>
              <SheetHeader className="flex-row items-center gap-3 pb-2 border-b">
                <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setChatView('initial')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <SheetTitle>Create a Support Ticket</SheetTitle>
                  <SheetDescription>We'll get back to you via email.</SheetDescription>
                </div>
              </SheetHeader>
              <form onSubmit={handleCreateTicket} className="flex-1 py-4 flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-subject">Subject</Label>
                  <Input id="ticket-subject" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} placeholder="e.g., Issue with my latest report" required />
                </div>
                <div className="space-y-2 flex-1 flex flex-col">
                  <Label htmlFor="ticket-message">Message</Label>
                  <Textarea id="ticket-message" value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} placeholder="Please describe your issue in detail..." className="flex-1" required />
                </div>
                <SheetFooter className="pt-4">
                  <Button type="submit" className="w-full h-12 text-base">Submit Ticket</Button>
                </SheetFooter>
              </form>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function OwnerHomePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    }>
      <OwnerHomeContent />
    </Suspense>
  )
}
