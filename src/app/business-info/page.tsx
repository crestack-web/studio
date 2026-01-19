'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AppUser {
    businessId?: string;
}

export default function BusinessInfoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
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
        if (!businessName || !businessType) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill out both fields.',
            });
            return;
        }

        if (!firestore || !businessId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not find your business. Please try again.',
            });
            return;
        }

        setIsSubmitting(true);
        const businessRef = doc(firestore, 'businesses', businessId);
        try {
            await updateDoc(businessRef, {
                name: businessName,
                type: businessType,
            });
            router.push('/currency');
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error updating business',
                description: error.message || 'Could not save business details.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isButtonDisabled = isLoading || isSubmitting || !businessName || !businessType || !businessId;


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
                disabled={isLoading || isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-type">Business Type</Label>
            <Select onValueChange={setBusinessType} value={businessType} disabled={isLoading || isSubmitting}>
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
            {(isLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Loading...' : isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
