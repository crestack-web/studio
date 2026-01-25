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
import { collection, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { markets } from '@/lib/currency';

const createSlug = (name: string) => {
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .trim()
        .replace(/\s+/g, '-') // replace spaces with -
        .replace(/-+/g, '-'); // replace multiple hyphens with a single one
};


export default function BusinessInfoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const selectedCountryData = markets.find(c => c.code === country);

    useEffect(() => {
        if (!isUserLoading && !authUser) {
            router.push('/signup');
        }
    }, [authUser, isUserLoading, router]);

    const handleContinue = async () => {
        if (!businessName || !businessType || !country || !city) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill out all fields.',
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

        const batch = writeBatch(firestore);
            
        const newBusinessRef = doc(collection(firestore, 'businesses'));
        const businessId = newBusinessRef.id;
        const businessSlug = createSlug(businessName);
        const businessProfileRef = doc(firestore, 'businessProfiles', businessId);
        const userDocRef = doc(firestore, 'users', authUser.uid);

        const businessData = {
            ownerId: authUser.uid,
            businessName,
            slug: businessSlug,
            businessType,
            country,
            city,
            createdAt: serverTimestamp(),
            onboardingCompleted: false,
        };

        const businessProfileData = {
            ownerId: authUser.uid,
            businessName,
            slug: businessSlug,
            businessType,
            country,
            city,
        };
        
        batch.set(newBusinessRef, businessData);
        batch.set(businessProfileRef, businessProfileData);
        batch.set(userDocRef, { businessId: businessId }, { merge: true });

        try {
            await batch.commit();
            router.replace('/currency');
        } catch (error) {
            console.error("Error creating business:", error);
            toast({
                variant: 'destructive',
                title: 'Error Creating Business',
                description: 'Could not save business details. Please check your connection and try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isButtonDisabled = isUserLoading || isSubmitting || !businessName || !businessType || !country || !city;

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
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select onValueChange={setCountry} value={country} disabled={isUserLoading || isSubmitting}>
                  <SelectTrigger id="country" className="h-12 text-base">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {markets.map(m => <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="city">Primary City</Label>
                <Select onValueChange={setCity} value={city} disabled={!country || isSubmitting}>
                  <SelectTrigger id="city" className="h-12 text-base">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCountryData?.cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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

    