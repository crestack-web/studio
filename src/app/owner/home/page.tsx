'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, BotMessageSquare, PackagePlus, FilePlus, Landmark, CircleDollarSign, Activity, TrendingUp, AlertTriangle, Download, Bell, Users, Store, Loader2, LogOut, MessageSquare, Send, ArrowLeft, TrendingDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { getBusinessInsights } from '@/ai/flows/get-business-insights';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { useUser, useCollection, useDoc, useMemoFirebase, useFirestore, useAuth, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, Timestamp, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
    plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
}

interface Sale {
    id: string;
    amount: number;
    paymentType: string;
    source: string;
    timestamp: Timestamp;
    productId?: string;
    quantity: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    cost: number;
    quantity: number;
}

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    createdAt: Timestamp;
}

function OwnerHomeContent() {
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const onboardingComplete = searchParams.get('onboarding') === 'complete';

    const [answer, setAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [aiCache, setAiCache] = useState<Record<string, string>>({});
    const [presetQuestions, setPresetQuestions] = useState<string[]>([]);

    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    
    const [chatView, setChatView] = useState('initial'); // 'initial', 'chat', 'ticket'
    const [chatMessages, setChatMessages] = useState([
        {
        id: '1',
        sender: 'support',
        text: 'Hi there! How can I help you today?',
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);

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
            "How are my sales today?",
            "What's my net profit today?",
            "Which products should I consider restocking?",
            "Tell me about my best selling product.",
            "Tell me about my worst selling product.",
            "What's my recent sales revenue?",
            "How much cash have I deposited recently?",
            "How much money have I withdrawn recently?",
        ];

        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        setPresetQuestions(shuffled.slice(0, 4));
    }, []);

    const supportAgents = [
        { name: 'Amina', avatarUrl: 'https://picsum.photos/seed/amina/40/40', imageHint: 'woman smiling' },
        { name: 'Tunde', avatarUrl: 'https://picsum.photos/seed/tunde/40/40', imageHint: 'man smiling' }
    ];

    const userProfileRef = useMemoFirebase(() => {
        if (!authUser || !firestore) return null;
        return doc(firestore, `users/${authUser.uid}`);
    }, [authUser, firestore]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

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

    const productsQuery = useMemoFirebase(() => {
        if (!businessId || !firestore) return null;
        return query(collection(firestore, `businesses/${businessId}/products`));
    }, [businessId, firestore]);
    const { data: productsData } = useCollection<Product>(productsQuery);
    
    useEffect(() => {
        if (!isUserLoading && !authUser) {
            router.push('/login');
        }
    }, [isUserLoading, authUser, router]);

    // This effect handles redirecting to the correct onboarding step
    useEffect(() => {
        if (isBusinessLoading || !businessData || !userProfile) {
            return; // Wait for data to load
        }

        // Only run this logic if the user is authenticated
        if (authUser) {
            const { businessName, businessType, plan } = businessData;
            
            // If plan is already set, onboarding is complete, do nothing.
            if (plan) return;

            if (!businessName || !businessType || businessName === `${userProfile?.displayName}'s Business`) {
                router.replace('/business-info');
            } else if (!plan) {
                router.replace('/plans');
            }
        }
    }, [businessData, isBusinessLoading, authUser, userProfile, router]);


    const businessInsights = useMemo(() => {
        const defaultInsights = {
            totalSales: 0, totalProfit: 0, bestSellingProduct: undefined, worstSellingProduct: undefined,
            lowStockProducts: [], salesTodayCount: 0, salesTodayTotal: 0, profitToday: 0,
            totalDeposits: 0, totalWithdrawals: 0,
        };

        if (!salesData || !productsData || !businessData) {
            return defaultInsights;
        }

        const todayInterval = { start: startOfDay(new Date()), end: endOfDay(new Date()) };
        const salesByProduct: { [key: string]: { id: string, name: string, quantity: number, sales: number } } = {};
        
        let totalSales = 0;
        let totalProfit = 0;
        let salesTodayCount = 0;
        let salesTodayTotal = 0;
        let profitToday = 0;

        for (const sale of salesData) {
            totalSales += sale.amount;
            const product = productsData.find(p => p.id === sale.productId);
            if (product) {
                const profit = sale.amount - (product.cost * sale.quantity);
                totalProfit += profit;

                if (!salesByProduct[product.id]) {
                    salesByProduct[product.id] = { id: product.id, name: product.name, quantity: 0, sales: 0 };
                }
                salesByProduct[product.id].quantity += sale.quantity;
                salesByProduct[product.id].sales += sale.amount;

                if (isWithinInterval(sale.timestamp.toDate(), todayInterval)) {
                    profitToday += profit;
                }
            }

            if (isWithinInterval(sale.timestamp.toDate(), todayInterval)) {
                salesTodayCount++;
                salesTodayTotal += sale.amount;
            }
        }
        
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
        
        return { totalSales, totalProfit, bestSellingProduct, worstSellingProduct, lowStockProducts, salesTodayCount, salesTodayTotal, profitToday, totalDeposits, totalWithdrawals };

    }, [salesData, productsData, businessData, transactionsData]);

    const handleQuestionClick = async (question: string) => {
        if (!businessData || !businessInsights) return;
        
        const cacheKey = JSON.stringify({ question, insights: businessInsights });
        if (aiCache[cacheKey]) {
            setAnswer(aiCache[cacheKey]);
            setSelectedQuestion(question);
            return;
        }

        setIsLoading(true);
        setSelectedQuestion(question);
        setAnswer(null);
        try {
            const response = await getBusinessInsights({ 
                query: question,
                insights: businessInsights,
                currency: getCurrencySymbol(businessData?.currency),
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
            setIsLoading(false);
        }
    };
    
    const statementUrl = '/owner/summary';

    const handleDownload = () => {
        router.push(statementUrl);
    }
    
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

    const canManageStaff = true;
    
    const isLoadingData = isLoadingSales || isLoadingTransactions;

    // Loading state: Show a spinner until we know if onboarding is complete or not.
    if (isUserLoading || isBusinessLoading || (authUser && !businessData?.plan)) {
        return (
            <div className="flex flex-col min-h-screen bg-background items-center justify-center">
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            </div>
        );
    }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-card">
        <Logo className="h-8" />
        <div className="flex items-center gap-2">
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications.
              </div>
            </PopoverContent>
          </Popover>
          <ThemeToggle />
          <Separator orientation="vertical" className="h-8 bg-border" />
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="text-right">
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
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between font-headline text-lg gap-2">
                        <div className='flex items-center gap-2'>
                            <BotMessageSquare className="w-6 h-6 text-accent" />
                            <span>Ask about your business</span>
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Recent Activity</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   {presetQuestions.map((q) => (
                       <Button 
                        key={q} 
                        variant="outline" 
                        className={cn("w-full justify-start h-12", selectedQuestion === q && "bg-accent text-accent-foreground hover:bg-accent/90")} 
                        onClick={() => handleQuestionClick(q)} 
                        disabled={isLoading && selectedQuestion === q}
                       >
                           {isLoading && selectedQuestion === q && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           {q}
                       </Button>
                   ))}
                </CardContent>
            </Card>
            
            {(isLoading || answer) && (
                <Card className={isLoading ? "bg-background" : "bg-muted"}>
                    <CardContent className="p-4">
                        {isLoading ? (
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
            
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 font-headline text-lg">
                        <Activity className="w-6 h-6 text-primary" />
                        <span>Business Health</span>
                    </CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    {isLoadingData ? (
                        <div className="space-y-4 pt-4">
                           <Skeleton className="h-28 w-full" />
                           <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (salesData && salesData.length > 0) || (transactionsData && transactionsData.length > 0) ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1 rounded-md border p-3"><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-lg font-bold sm:text-xl">{formatCurrency(businessInsights.totalSales, businessData?.currency)}</p></div>
                                <div className="space-y-1 rounded-md border p-3"><p className="text-sm text-muted-foreground">Net Profit</p><p className={cn("text-lg font-bold sm:text-xl", businessInsights.totalProfit >= 0 ? "text-success" : "text-destructive")}>{formatCurrency(businessInsights.totalProfit, businessData?.currency)}</p></div>
                                <div className="space-y-1 rounded-md border p-3"><p className="text-sm text-muted-foreground">Money In</p><p className="text-lg font-bold sm:text-xl">{formatCurrency(businessInsights.totalDeposits, businessData?.currency)}</p></div>
                                <div className="space-y-1 rounded-md border p-3"><p className="text-sm text-muted-foreground">Money Out</p><p className="text-lg font-bold sm:text-xl">{formatCurrency(businessInsights.totalWithdrawals, businessData?.currency)}</p></div>
                            </div>
                            <div className="pt-4">
                                <Link href={statementUrl} passHref>
                                    <Button variant="secondary" className="w-full">
                                        <Activity className="mr-2 h-4 w-4" />
                                        View Summary & Statement
                                    </Button>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center text-sm text-muted-foreground pt-4">
                                <p>Record sales and expenses to see your summary for this period.</p>
                            </div>
                             <div className="pt-4">
                                <Link href={statementUrl} passHref>
                                    <Button variant="secondary" className="w-full">
                                        <Activity className="mr-2 h-4 w-4" />
                                        View Summary & Statement
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
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
                                <h4 className="font-semibold text-sm flex items-center gap-1.5"><ChevronsUp className="w-5 h-5 text-success"/>Best Seller</h4>
                                <p className="font-bold text-lg truncate">{businessInsights.bestSellingProduct?.name || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">{formatCurrency(businessInsights.bestSellingProduct?.sales || 0, businessData?.currency)} in revenue</p>
                             </div>
                             <div className="p-4 rounded-lg bg-muted/50">
                                <h4 className="font-semibold text-sm flex items-center gap-1.5"><TrendingDown className="w-5 h-5 text-destructive"/>Worst Seller</h4>
                                <p className="font-bold text-lg truncate">{businessInsights.worstSellingProduct?.name || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">{formatCurrency(businessInsights.worstSellingProduct?.sales || 0, businessData?.currency)} in revenue</p>
                             </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm flex items-center gap-1.5 mb-2"><AlertTriangle className="w-5 h-5 text-warning"/>Low Stock</h4>
                            {businessInsights.lowStockProducts.length > 0 ? (
                                <div className="space-y-2 text-sm">
                                {businessInsights.lowStockProducts.slice(0, 3).map(p => (
                                    <div key={p.id} className="flex justify-between"><span>{p.name}</span><span className="font-medium">{p.quantity} left</span></div>
                                ))}
                                </div>
                            ) : <p className="text-sm text-muted-foreground">No low-stock alerts.</p>}
                          </div>
                        </>
                     ) : (
                         <div className="text-center text-sm text-muted-foreground py-4">
                            <p>No product sales data for this period.</p>
                        </div>
                     )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/record-sale">
                    <Button className="w-full h-16 text-lg justify-start px-4 gap-3">
                        <Plus className="w-6 h-6" />
                        Record Sale
                    </Button>
                </Link>
                <Link href="/add-inventory">
                    <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3">
                        <PackagePlus className="w-6 h-6" />
                        Add Inventory
                    </Button>
                </Link>
                <Link href="/record-expense">
                    <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3">
                        <FilePlus className="w-6 h-6" />
                        Record Expense
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
                 <Link href={canManageStaff ? "/owner/staff" : "/owner/pricing"} passHref>
                    <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3" title={!canManageStaff ? "Upgrade plan to manage staff" : ""}>
                        <Users className="w-6 h-6" />
                        Manage Staff
                    </Button>
                </Link>
                 <Link href="/owner/market">
                    <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3">
                        <Store className="w-6 h-6" />
                        My Market
                    </Button>
                </Link>
                 <Link href="/owner/busmopay">
                    <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3" asChild>
                        <Logo variant="busmopay" className="text-lg" />
                    </Button>
                </Link>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col gap-6">
             <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 font-headline text-lg">
                        <Store className="w-6 h-6 text-primary" />
                        Sell Online
                    </CardTitle>
                    <CardDescription>
                        Set up your free online store on Busmo Market and reach more customers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/owner/market" className='w-full'>
                        <Button variant="secondary" className="w-full">
                            Set Up Your Store
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 font-headline text-lg">
                        <Landmark className="w-6 h-6 text-primary" />
                        Access Capital
                    </CardTitle>
                    <CardDescription>
                        Your business data can unlock investment. See your options.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="text-center text-sm text-muted-foreground">
                        <p>Your performance data helps build a trusted financial story for investors.</p>
                    </div>
                    <Link href="/owner/access-capital" className='w-full'>
                        <Button variant="secondary" className="w-full">
                            Explore Capital Options
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {(businessData?.plan === 'multi-branch' || businessData?.plan === 'company') && (
                <Card className="bg-card/50 border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline text-lg text-muted-foreground">
                            <TrendingUp className="w-6 h-6" />
                            <span>Branch Performance</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-sm text-muted-foreground">
                            <p>Branch performance comparison is coming soon for your plan.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
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
                    {supportAgents.map(agent => (
                        <div key={agent.name} className="flex items-center gap-3">
                            <div className="relative">
                            <Avatar className="h-10 w-10">
                                <Image src={agent.avatarUrl} alt={agent.name} width={40} height={40} data-ai-hint={agent.imageHint} />
                            </Avatar>
                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                            </div>
                            <div>
                            <p className="font-semibold">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">Support Agent</p>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
                <div className="flex-1" />
                <SheetFooter className="flex-col-reverse sm:flex-col-reverse gap-2 pt-4 border-t">
                <Button onClick={() => setChatView('chat')} className="w-full h-12 text-base">Start Live Chat</Button>
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
                    <div className="flex items-center gap-3">
                        <div className="relative">
                        <Avatar className="h-10 w-10">
                            <Image src={supportAgents[0].avatarUrl} alt={supportAgents[0].name} width={40} height={40} data-ai-hint={supportAgents[0].imageHint} />
                        </Avatar>
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                        </div>
                        <div>
                        <SheetTitle>{supportAgents[0].name}</SheetTitle>
                        <SheetDescription>Support Agent</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>
                <div className="flex-1 space-y-4 py-4 pr-4 overflow-y-auto -mr-6">
                {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                    {msg.sender === 'support' && (
                        <Avatar className="w-8 h-8 border">
                        <Image src={supportAgents[0].avatarUrl} alt={supportAgents[0].name} width={32} height={32} />
                        </Avatar>
                    )}
                    <div className={`rounded-xl p-3 text-sm max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none'}`}>
                        {msg.text}
                    </div>
                    </div>
                ))}
                </div>
                <SheetFooter className="pt-4 -mx-6 px-6 pb-6 border-t bg-background">
                <form
                    onSubmit={(e) => {
                    e.preventDefault();
                    if (!chatInput.trim()) return;
                    setChatMessages([...chatMessages, { id: Date.now().toString(), sender: 'user', text: chatInput }]);
                    setChatInput('');
                    setTimeout(() => {
                        setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'support', text: "Thanks for your message. I'm looking into that now."}])
                    }, 1500)
                    }}
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
