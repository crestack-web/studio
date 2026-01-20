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

export default function AddMoneyPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSaveDeposit = async () => {
        if (!amount) {
            toast({
                variant: 'destructive',
                title: 'Missing Amount',
                description: 'Please enter an amount.',
            });
            return;
        }

        setIsLoading(true);

        // MOCK BEHAVIOR
        setTimeout(() => {
            toast({
                title: 'Deposit Saved (Mock)',
                description: `Successfully recorded a deposit of ${amount}.`,
            });
            router.back();
            setIsLoading(false);
        }, 500);
    };


    return (
        <MainLayout title="Add Money" backHref="/owner/home">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Add Money</CardTitle>
                        <CardDescription>Record a cash deposit into the business.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" placeholder="0.00" className="h-12 text-base" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Note (Optional)</Label>
                            <Textarea id="description" placeholder="e.g., Initial capital, loan repayment" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg" onClick={handleSaveDeposit} disabled={isLoading || !amount}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Deposit
                </Button>
            </div>
        </MainLayout>
    );
}
