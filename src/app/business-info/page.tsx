'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { collection, serverTimestamp, doc, setDoc, writeBatch } from 'firebase/firestore';

export default function BusinessInfoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();

    useEffect(() => {
        if (!isUserLoading && !authUser) {
            router.push('/signup');
        }
    }, [authUser, isUserLoading, router]);

    const handleContinue = async () => {
        if (!businessName || !businessType) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill out both fields.',
            });
            return;
        }

        if (!authUser || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'User not found. Please log in again.',
            });
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);

        try {
            // Step 1: Create the main business document first and wait for it.
            const newBusinessRef = doc(collection(firestore, 'businesses'));
            const businessId = newBusinessRef.id;
            const businessData = {
                ownerId: authUser.uid,
                businessName,
                businessType,
                createdAt: serverTimestamp(),
                onboardingCompleted: false, // This will be set to true at the end of the flow
            };
            await setDoc(newBusinessRef, businessData);

            // Step 2: Now that the business exists, create the profile and update the user.
            const batch = writeBatch(firestore);

            const businessProfileRef = doc(firestore, 'businessProfiles', businessId);
            const businessProfileData = {
                businessName,
                businessType,
            };
            batch.set(businessProfileRef, businessProfileData);

            const userDocRef = doc(firestore, 'users', authUser.uid);
            batch.update(userDocRef, { businessId: businessId });

            await batch.commit();

            router.replace('/currency');
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error Creating Business',
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isButtonDisabled = isUserLoading || isSubmitting || !businessName || !businessType;


  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">About your business</CardTitle>
          <CardDescription>This helps us tailor your experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input 
                id="business-name" 
                placeholder="e.g., Mama's Kitchen" 
                className="h-12 text-base" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                disabled={isUserLoading || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-type">Business Type</Label>
            <Select onValueChange={setBusinessType} value={businessType} disabled={isUserLoading || isSubmitting}>
              <SelectTrigger id="business-type" className="h-12 text-base">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shop">Shop</SelectItem>
                <SelectItem value="supermarket">Supermarket</SelectItem>
                <SelectItem value="food">Food / Restaurant</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full h-14 text-lg" onClick={handleContinue} disabled={isButtonDisabled}>
            {(isUserLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUserLoading ? 'Loading...' : isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
