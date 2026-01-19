'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, BotMessageSquare, PackagePlus, FilePlus, Landmark, CircleDollarSign, Activity, TrendingUp, AlertTriangle, Download, Calendar as CalendarIcon, Bell, Users, Link2, Store } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { getBusinessInsights } from '@/ai/flows/get-business-insights';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, Timestamp } from 'firebase/firestore';
import { useIsMobile } from '@/hooks/use-mobile';

const presetQuestions = [
    "Did I make profit today?",
    "How many sales today?",
    "Which product sells the most?",
    "What product is running low?",
];

// Define interfaces for our Firestore data
interface AppUser {
    id: string;
    phoneNumber: string;
    businessId: string;
    role: string;
}

interface Business {
    id: string;
    name: string;
    type: string;
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
}

interface Product {
    id: string;
    name: string;
    price: number;
    cost: number;
    quantity: number;
}


export default function OwnerHomePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [answer, setAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const isMobile = useIsMobile();

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
    const { data: businessData } = useDoc<Business>(businessRef);

    const salesQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        const thirtyDaysAgo = addDays(new Date(), -30);
        return query(
            collection(firestore, 'sales'),
            where('businessId', '==', businessId),
            where('timestamp', '>=', thirtyDaysAgo)
        );
    }, [firestore, businessId]);
    const { data: salesData } = useCollection<Sale>(salesQuery);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, 'products'), where('businessId', '==', businessId));
    }, [firestore, businessId]);
    const { data: productsData } = useCollection<Product>(productsQuery);


    const handleQuestionClick = async (question: string) => {
        setIsLoading(true);
        setSelectedQuestion(question);
        setAnswer(null);
        try {
            const response = await getBusinessInsights({ 
                query: question,
                sales: salesData?.map(s => ({
                    ...s,
                    timestamp: s.timestamp?.toDate ? s.timestamp.toDate().toISOString() : new Date().toISOString(),
                })) || [],
                products: productsData || [],
                currency: businessData?.currency || '₦',
            });
            setAnswer(response.answer);
        } catch (error) {
            console.error("Error getting business insights:", error);
            setAnswer("Sorry, I couldn't process that request. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        router.push('/owner/summary');
    }

    const canManageStaff = businessData?.plan && businessData.plan !== 'shop';
    
    const datePickerButtonContent = (
         <>
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
        </>
    );

    const datePickerCalendar = (
         <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
        />
    );


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-card">
        <Logo className="h-8" />
        <div className="flex items-center gap-2">
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="grid gap-4">
                <div className="space-y-1">
                  <h4 className="font-medium leading-none">Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    You have 3 unread notifications.
                  </p>
                </div>
                <Separator />
                <div className="grid gap-3">
                  <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                      <div className='space-y-1'>
                        <p className="text-sm font-medium">New Sale</p>
                        <p className='text-sm text-muted-foreground'>Bottled Water (x2)</p>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">₦300</div>
                  </div>
                  <Separator />
                   <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                      <div className='space-y-1'>
                        <p className="text-sm font-medium">New Sale</p>
                        <p className='text-sm text-muted-foreground'>Biscuits (x1)</p>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">₦250</div>
                  </div>
                  <Separator />
                   <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                      <div className='space-y-1'>
                        <p className="text-sm font-medium text-warning">Low Stock Alert</p>
                        <p className='text-sm text-muted-foreground'>Biscuits are running low</p>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">5 left</div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <ThemeToggle />
          <Separator orientation="vertical" className="h-8 bg-border" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-semibold">{businessData?.name || 'Your Business'}</div>
              <div className="text-xs text-muted-foreground">{userProfile?.role || 'Owner'}</div>
            </div>
            <Avatar>
              <AvatarFallback>{businessData?.name ? businessData.name.split(' ').map(n => n[0]).join('').substring(0,2) : 'B'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Center Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline text-lg">
                        <BotMessageSquare className="w-6 h-6 text-accent" />
                        Ask about your business
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
                    <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between font-headline text-lg gap-2">
                        <div className='flex items-center gap-2'>
                          <Activity className="w-6 h-6 text-primary" />
                          <span>Business Health</span>
                        </div>
                        {isMobile ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        {datePickerButtonContent}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-auto p-0">
                                    {datePickerCalendar}
                                </DialogContent>
                            </Dialog>
                        ) : (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        {datePickerButtonContent}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    {datePickerCalendar}
                                </PopoverContent>
                            </Popover>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center text-sm text-muted-foreground pt-4">
                        <p>Not enough data for this period. Record sales and expenses to see your summary.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/owner/summary" passHref>
                            <Button variant="secondary" className="w-full">
                                View Sample Statement
                            </Button>
                        </Link>
                         <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="secondary" className="w-full">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Statement
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Download Business Statement</DialogTitle>
                                    <DialogDescription>
                                        This will download a PDF statement for the selected date range.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="pt-4">
                                    <Button onClick={handleDownload}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
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
                 <Link href={canManageStaff ? "/owner/staff" : "#"} passHref>
                    <Button variant="secondary" className="w-full h-16 text-lg justify-start px-4 gap-3" disabled={!canManageStaff} title={!canManageStaff ? "Upgrade plan to manage staff" : ""}>
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
            </div>
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {businessData?.plan !== 'shop' && (
                <Card className="bg-card/50 border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline text-lg text-muted-foreground">
                            <TrendingUp className="w-6 h-6" />
                            Business Forecast
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-sm text-muted-foreground">
                            <p>Record data for 7+ days to unlock sales trends and future insights.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

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

            <Card className="bg-card/50 border-dashed">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 font-headline text-lg text-muted-foreground">
                        <AlertTriangle className="w-6 h-6 text-warning" />
                        Stock Alert
                    </CardTitle>
                    <CardDescription>
                        Keep track of products that are running low.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="text-center text-sm text-muted-foreground">
                        <p>No low-stock alerts yet. We'll notify you here when inventory is running low.</p>
                    </div>
                    <Button variant="secondary" className="w-full" disabled>
                        View Low Stock Items
                    </Button>
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

          </div>
        </div>
      </main>
    </div>
  );
}
