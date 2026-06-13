
'use client';
import { useState } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { collection, doc, serverTimestamp } from 'firebase/firestore';


interface AppUser {
    businessId?: string;
}

const categoryPlaceholders: { [key: string]: string } = {
    rent: "e.g., Office rent for May",
    utilities: "e.g., Electricity bill for June",
    supplies: "e.g., Cleaning supplies",
    salaries: "e.g., Staff salaries for July",
    marketing: "e.g., Facebook ad campaign",
    other: "e.g., Miscellaneous business expense",
};

export default function RecordExpensePage() {
  return (
    <FirebaseClientProvider>
      <RecordExpensePageContent />
    </FirebaseClientProvider>
  );
}

function RecordExpensePageContent() {
    const { toast } = useToast();
    const router = useRouter();
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;


    const titlePlaceholder = category ? (categoryPlaceholders[category] || "e.g., Describe the expense") : "Select a category to see examples";


    const handleSaveExpense = async () => {
        if (!category || !title || !amount) {
            toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please fill out all fields.',
            });
            return;
        }

        if (!businessId || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not find your business. Please try again.',
            });
            return;
        }


        setIsLoading(true);

        const expenseData = {
            businessId,
            category,
            title,
            amount: parseFloat(amount),
            createdAt: serverTimestamp(),
        };

        const expensesColRef = collection(firestore, `businesses/${businessId}/expenses`);
        
        addDocumentNonBlocking(expensesColRef, expenseData);
        
        toast({
            title: 'Expense Saved',
            description: `Successfully recorded expense: ${title}.`,
        });
        router.back();

    };


    return (
        <MainLayout title="Record Expense" backHref="/owner/home">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>New Expense</CardTitle>
                        <CardDescription>Record a business expense.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select onValueChange={setCategory} value={category} disabled={isLoading}>
                                <SelectTrigger id="category" className="h-12 text-base">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rent">Rent</SelectItem>
                                    <SelectItem value="utilities">Utilities</SelectItem>
                                    <SelectItem value="supplies">Supplies</SelectItem>
                                    <SelectItem value="salaries">Salaries</SelectItem>
                                    <SelectItem value="marketing">Marketing</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Expense Title</Label>
                            <Input id="title" placeholder={titlePlaceholder} className="h-12 text-base" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" placeholder="0.00" className="h-12 text-base" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading} />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg" onClick={handleSaveExpense} disabled={isLoading || !category || !title || !amount}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Expense
                </Button>
            </div>
        </MainLayout>
    );
}
