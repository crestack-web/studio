'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, BotMessageSquare, PackagePlus, FilePlus, Landmark, CircleDollarSign, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { getBusinessInsights } from '@/ai/flows/get-business-insights';
import { Skeleton } from '@/components/ui/skeleton';

const presetQuestions = [
    "Did I make profit today?",
    "How many sales today?",
    "Which product sells the most?",
    "What product is running low?",
];

export default function OwnerHomePage() {
    const [answer, setAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
        <Logo className="h-8" />
        <div className="text-sm font-medium">Owner</div>
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
                       <Button key={q} variant="outline" className="w-full justify-start h-12" onClick={() => handleQuestionClick(q)} disabled={isLoading && selectedQuestion === q}>
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
                    <Link href="/owner/summary" passHref>
                        <Button variant="secondary" className="w-full">
                            View Example Summary
                        </Button>
                    </Link>
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
                        <AlertTriangle className="w-6 h-6" />
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

          </div>
        </div>
      </main>
    </div>
  );
}
