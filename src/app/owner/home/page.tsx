'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, BotMessageSquare, PackagePlus, FilePlus, Landmark, CircleDollarSign, Activity, TrendingUp, AlertTriangle, Download, Calendar as CalendarIcon, Bell } from 'lucide-react';
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

const presetQuestions = [
    "Did I make profit today?",
    "How many sales today?",
    "Which product sells the most?",
    "What product is running low?",
];

export default function OwnerHomePage() {
    const { toast } = useToast();
    const [answer, setAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 7),
    });

    const handleQuestionClick = async (question: string) => {
        setIsLoading(true);
        setSelectedQuestion(question);
        setAnswer(null);
        try {
            if (question === "Did I make profit today?") {
                 setAnswer("I don’t have enough data yet. Please record sales or inventory.");
                 setIsLoading(false);
                 return;
            }
             if (question === "What product is running low?") {
                 setAnswer("I don’t have enough data yet. Please add products and record sales to get stock alerts.");
                 setIsLoading(false);
                 return;
            }
            const response = await getBusinessInsights({ query: question });
            setAnswer(response.answer);
        } catch (error) {
            console.error("Error getting business insights:", error);
            setAnswer("Sorry, I couldn't process that request. Please try again.");
        } finally {
            if (question !== "Did I make profit today?" && question !== "What product is running low?") {
                setIsLoading(false);
            }
        }
    };
    
    const handleDownload = () => {
        toast({
            title: "Feature in progress",
            description: "Business statement downloads are coming soon!",
        });
    }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
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
              <div className="font-semibold">Mama's Kitchen</div>
              <div className="text-xs text-muted-foreground">Owner</div>
            </div>
            <Avatar>
              <AvatarFallback>MK</AvatarFallback>
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
                        <BotMessageSquare className="w-6 h-6 text-primary" />
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
                    <CardTitle className="flex items-center gap-2 font-headline text-lg">
                        <Activity className="w-6 h-6 text-primary" />
                        Today's Health
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center text-sm text-muted-foreground">
                        <p>Not enough data yet. Record sales and expenses to see your daily summary.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/owner/summary" passHref>
                            <Button variant="secondary" className="w-full">
                                View Example Summary
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
                                        Select the date range for your statement.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="date"
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
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
                                        <PopoverContent className="w-auto p-0" align="center">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={date?.from}
                                                selected={date}
                                                onSelect={setDate}
                                                numberOfMonths={1}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <DialogFooter>
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
            </div>
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col gap-6">
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

            <Card className="bg-card/50 border-dashed">
                <CardHeader>
                     <CardTitle className="flex items-center gap-2 font-headline text-lg text-muted-foreground">
                        <Landmark className="w-6 h-6" />
                        Access Capital
                    </CardTitle>
                    <CardDescription>
                        Unlock loan offers based on your business performance.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="text-center text-sm text-muted-foreground">
                        <p>Keep recording sales and expenses to become eligible for loans.</p>
                    </div>
                    <Button variant="secondary" className="w-full" disabled>
                        Check Eligibility
                    </Button>
                </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
