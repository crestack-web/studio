
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '@/context/language-provider';

interface AppUser {
    businessId?: string;
}


export default function AddMoneyPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useLanguage();
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


    const handleSaveDeposit = async () => {
        if (!amount) {
            toast({
                variant: 'destructive',
                title: t('transactions.missingAmountTitle'),
                description: t('transactions.missingAmountDesc'),
            });
            return;
        }
        
        if (!businessId || !firestore) {
            toast({
                variant: 'destructive',
                title: t('common.errorTitle'),
                description: t('transactions.missingBusinessDesc'),
            });
            return;
        }


        setIsLoading(true);
        
        const transactionData = {
            businessId,
            type: 'deposit',
            amount: parseFloat(amount),
            description: description,
            createdAt: serverTimestamp(),
        };

        const transactionsColRef = collection(firestore, `businesses/${businessId}/transactions`);

        try {
            await addDoc(transactionsColRef, transactionData);

            const depositSavedDescTemplate = t('transactions.depositSavedDesc');
            toast({
                title: t('transactions.depositSavedTitle'),
                description: typeof depositSavedDescTemplate === 'string'
                  ? depositSavedDescTemplate.replace('{{amount}}', amount)
                  : `Successfully recorded a deposit of ${amount}.`,
            });
            router.back();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: t('transactions.saveFailedTitle'),
                description: error?.message || t('transactions.saveFailedDesc'),
            });
            setIsLoading(false);
        }
    };


    return (
        <MainLayout title={t('transactions.addMoneyTitle')} backHref="/owner/home">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('transactions.addMoneyTitle')}</CardTitle>
                        <CardDescription>{t('transactions.addMoneyDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="amount">{t('transactions.amountLabel')}</Label>
                            <Input id="amount" type="number" placeholder={t('transactions.amountPlaceholder')} className="h-12 text-base" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">{t('transactions.noteOptionalLabel')}</Label>
                            <Textarea id="description" placeholder={t('transactions.depositNotePlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} disabled={isLoading} />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg" onClick={handleSaveDeposit} disabled={isLoading || !amount}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('transactions.saveDepositCta')}
                </Button>
            </div>
        </MainLayout>
    );
}
