'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { collection, serverTimestamp, doc, writeBatch } from 'firebase/firestore';

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
    const [address, setAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();

    useEffect(() => {
        if (!isUserLoading && !authUser) {
            router.push('/signup');
        }
    }, [authUser, isUserLoading, router]);

    const handleContinue = async () => {
        if (!businessName || !businessType || !address) {
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
            
        // 1. Define refs for all documents to be created/updated
        const newBusinessRef = doc(collection(firestore, 'businesses'));
        const businessId = newBusinessRef.id;
        const businessSlug = createSlug(businessName);
        const businessProfileRef = doc(firestore, 'businessProfiles', businessId);
        const userDocRef = doc(firestore, 'users', authUser.uid);

        // 2. Prepare data for each document
        const businessData = {
            ownerId: authUser.uid,
            businessName,
            slug: businessSlug,
            businessType,
            address,
            createdAt: serverTimestamp(),
            onboardingCompleted: false,
        };

        const businessProfileData = {
            ownerId: authUser.uid,
            businessName,
            slug: businessSlug,
            businessType,
            address,
        };
        
        // 3. Add all operations to the batch
        batch.set(newBusinessRef, businessData);
        batch.set(businessProfileRef, businessProfileData);
        // Use set with merge:true to handle cases where the user doc might not exist yet
        // due to the non-blocking write on the signup page. This will create or update as needed.
        batch.set(userDocRef, { businessId: businessId }, { merge: true });

        // 4. Commit the batch atomically
        batch.commit()
            .then(() => {
                router.replace('/currency');
            })
            .catch((error) => {
                // This is a contextual error that helps debug security rule failures.
                const permissionError = new FirestorePermissionError({
                    path: `BATCH WRITE on user: ${userDocRef.path}`,
                    operation: 'write', 
                    requestResourceData: { 
                        business: businessData, 
                        businessProfile: businessProfileData,
                        userUpdate: { businessId: businessId }
                    },
                });
                errorEmitter.emit('permission-error', permissionError);

                toast({
                    variant: 'destructive',
                    title: 'Error Creating Business',
                    description: 'A permissions issue occurred. See the developer console for details.',
                });
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    const isButtonDisabled = isUserLoading || isSubmitting || !businessName || !businessType || !address;


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
           <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            <Input 
                id="address" 
                placeholder="e.g., 123 Allen Avenue, Ikeja, Lagos" 
                className="h-12 text-base" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isUserLoading || isSubmitting}
            />
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
