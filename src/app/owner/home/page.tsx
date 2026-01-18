'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, BotMessageSquare, PackagePlus, FilePlus, Landmark, CircleDollarSign } from 'lucide-react';
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
            const response = await getBusinessInsights({ query: question });
            setAnswer(response.answer);
        } catch (error) {
            console.error("Error getting business insights:", error);
            setAnswer("Sorry, I couldn't process that request. Please try again.");
        } finally {
            if (question !== "Did I make profit today?") {
                setIsLoading(false);
            }
        }
    };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Logo className="h-8" />
        <div className="text-sm font-medium">Owner</div>
      </header>
      <main className="flex-1 flex flex-col p-4 sm:p-6 gap-6 justify-center">
        <div className="w-full max-w-md mx-auto">
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
        </div>
        
        {(isLoading || answer) && (
            <div className="w-full max-w-md mx-auto">
                <Card className={isLoading ? "" : "bg-muted"}>
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
            </div>
        )}

        <div className="w-full max-w-md mx-auto grid grid-cols-1 gap-4">
            <Link href="/record-sale">
                <Button className="w-full h-16 text-lg justify-start px-6 gap-4">
                    <Plus className="w-6 h-6" />
                    Record Sale
                </Button>
            </Link>
            <Link href="/add-inventory">
                <Button variant="secondary" className="w-full h-16 text-lg justify-start px-6 gap-4">
                    <PackagePlus className="w-6 h-6" />
                    Add Inventory
                </Button>
            </Link>
            <Link href="/record-expense">
                <Button variant="secondary" className="w-full h-16 text-lg justify-start px-6 gap-4">
                    <FilePlus className="w-6 h-6" />
                    Record Expense
                </Button>
            </Link>
             <Link href="/owner/add-money">
                <Button variant="secondary" className="w-full h-16 text-lg justify-start px-6 gap-4">
                    <Landmark className="w-6 h-6" />
                    Add Money
                </Button>
            </Link>
            <Link href="/owner/take-money">
                <Button variant="secondary" className="w-full h-16 text-lg justify-start px-6 gap-4">
                    <CircleDollarSign className="w-6 h-6" />
                    Take Money
                </Button>
            </Link>
        </div>
      </main>
    </div>
  );
}
