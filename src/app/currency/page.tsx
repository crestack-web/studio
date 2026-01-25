
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { currencyMap } from '@/lib/currency';


interface AppUser {
    businessId?: string;
}

export default function CurrencyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState('NG');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfile } = useDoc<AppUser>(userProfileRef);
  const businessId = userProfile?.businessId;


  useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.push('/signup');
    }
  }, [authUser, isUserLoading, router]);

  const handleContinue = async () => {
    if (!selectedCountry) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a country.',
      });
      return;
    }

    if (!businessId || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Business information not found. Please go back and try again.',
        });
        return;
    }

    setIsSubmitting(true);
    
    try {
        const businessDocRef = doc(firestore, 'businesses', businessId);
        await updateDoc(businessDocRef, {
            currency: selectedCountry,
        });

        router.replace('/plans');
    } catch (error: any) {
        console.error("Error saving currency:", error);
        let description = "We couldn't save your currency selection. Please try again.";
        if (error.code === 'permission-denied') {
            description = "You don't have permission to update your business settings. Please try logging in again.";
        } else if (error.message) {
            description = `An unexpected error occurred: ${error.message}`;
        }
        toast({
            variant: 'destructive',
            title: 'Error Saving Currency',
            description: description,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const isButtonDisabled = isUserLoading || isSubmitting;

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Select Your Country</CardTitle>
          <CardDescription>This determines your currency and financial settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            defaultValue="NG" 
            className="grid grid-cols-2 gap-4"
            value={selectedCountry}
            onValueChange={setSelectedCountry}
            disabled={isUserLoading || isSubmitting}
          >
            <div>
              <RadioGroupItem value="NG" id="ng" className="peer sr-only" disabled={isUserLoading || isSubmitting} />
              <Label htmlFor="ng" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Nigeria
                <span className="font-normal text-sm mt-2 text-muted-foreground">{currencyMap['NG'].symbol} (NGN)</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="GH" id="gh" className="peer sr-only" disabled={isUserLoading || isSubmitting} />
              <Label htmlFor="gh" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Ghana
                <span className="font-normal text-sm mt-2 text-muted-foreground">{currencyMap['GH'].symbol} (GHS)</span>
              </Label>
            </div>
             <div>
              <RadioGroupItem value="NE" id="ne" className="peer sr-only" disabled={isUserLoading || isSubmitting} />
              <Label htmlFor="ne" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Niger
                <span className="font-normal text-sm mt-2 text-muted-foreground">{currencyMap['NE'].symbol} (XOF)</span>
              </Label>
            </div>
             <div>
              <RadioGroupItem value="CM" id="cm" className="peer sr-only" disabled={isUserLoading || isSubmitting} />
              <Label htmlFor="cm" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Cameroon
                <span className="font-normal text-sm mt-2 text-muted-foreground">{currencyMap['CM'].symbol} (XAF)</span>
              </Label>
            </div>
          </RadioGroup>
          <Button className="w-full h-14 text-lg" onClick={handleContinue} disabled={isButtonDisabled}>
            {(isUserLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUserLoading ? 'Loading...' : isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
