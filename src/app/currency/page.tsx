'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AppUser {
    businessId?: string;
}

const currencyMap: { [key: string]: string } = {
    NG: '₦',
    GH: 'GH₵',
    NE: 'CFA',
    CM: 'CFA',
};

export default function CurrencyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState('NG');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

  const businessId = userProfile?.businessId;
  const isLoading = isUserLoading || isProfileLoading;


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

    if (!firestore || !businessId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not find your business. Please go back and try again.',
      });
      return;
    }

    setIsSubmitting(true);
    const businessRef = doc(firestore, 'businesses', businessId);
    try {
      await updateDoc(businessRef, {
        currency: currencyMap[selectedCountry],
      });
      router.push('/plans');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating currency',
        description: error.message || 'Could not save your currency selection.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = isLoading || isSubmitting || !businessId;

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
            disabled={isLoading || isSubmitting}
          >
            <div>
              <RadioGroupItem value="NG" id="ng" className="peer sr-only" disabled={isLoading || isSubmitting} />
              <Label htmlFor="ng" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Nigeria
                <span className="font-normal text-sm mt-2 text-muted-foreground">₦ (NGN)</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="GH" id="gh" className="peer sr-only" disabled={isLoading || isSubmitting} />
              <Label htmlFor="gh" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Ghana
                <span className="font-normal text-sm mt-2 text-muted-foreground">GH₵ (GHS)</span>
              </Label>
            </div>
             <div>
              <RadioGroupItem value="NE" id="ne" className="peer sr-only" disabled={isLoading || isSubmitting} />
              <Label htmlFor="ne" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Niger
                <span className="font-normal text-sm mt-2 text-muted-foreground">CFA (XOF)</span>
              </Label>
            </div>
             <div>
              <RadioGroupItem value="CM" id="cm" className="peer sr-only" disabled={isLoading || isSubmitting} />
              <Label htmlFor="cm" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Cameroon
                <span className="font-normal text-sm mt-2 text-muted-foreground">CFA (XAF)</span>
              </Label>
            </div>
          </RadioGroup>
          <Button className="w-full h-14 text-lg" onClick={handleContinue} disabled={isButtonDisabled}>
            {(isLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Loading...' : isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
