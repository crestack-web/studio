
'use client';
import { useState } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';


interface AppUser {
    businessId?: string;
}

export default function TakeMoneyPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const firestore = useFirestore();
    const { user: authUser } = useUser();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;
    
    const handleConfirmWithdrawal = async () => {
        if (!amount) {
            toast({
                variant: 'destructive',
                title: 'Missing Amount',
                description: 'Please enter an amount.',
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

        const transactionData = {
            businessId,
            type: 'withdrawal',
            amount: parseFloat(amount),
            description: description,
            createdAt: serverTimestamp(),
        };

        const transactionsColRef = collection(firestore, `businesses/${businessId}/transactions`);
        
        addDocumentNonBlocking(transactionsColRef, transactionData);

        toast({
            title: 'Withdrawal Confirmed',
            description: `Successfully recorded a withdrawal of ${amount}.`,
        });
        router.back();
    };

    return (
        <MainLayout title="Take Money" backHref="/owner/home">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Take Money</CardTitle>
                        <CardDescription>Record a cash withdrawal from the business.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" placeholder="0.00" className="h-12 text-base" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Note (Optional)</Label>
                            <Textarea id="description" placeholder="e.g., Owner's drawings, personal use" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg" onClick={handleConfirmWithdrawal} disabled={isLoading || !amount}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Withdrawal
                </Button>
            </div>
        </MainLayout>
    );
}
