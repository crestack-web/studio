'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { markets } from '@/lib/currency';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';

export default function BusinessInfoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const firestore = useFirestore();

    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const selectedCountryData = markets.find(c => c.code === country);
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, `users/${authUser.uid}`);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc(userProfileRef);
    const businessId = userProfile?.businessId;


    const handleContinue = async () => {
        if (!businessName || !businessType || !country || !city) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill out all fields.',
            });
            return;
        }

        setIsSubmitting(true);

        if (businessId && firestore) {
            const businessDocRef = doc(firestore, `businesses/${businessId}`);
            const businessProfileRef = doc(firestore, 'businessProfiles', businessId);
            
            const currency = markets.find(m => m.code === country)?.currency || 'NGN';
            
            const businessUpdate = {
                businessName,
                businessType,
                country,
                city,
                currency,
                updatedAt: serverTimestamp(),
            };

            // Use non-blocking updates. Navigation will not wait for these to complete.
            updateDocumentNonBlocking(businessDocRef, businessUpdate);
            setDocumentNonBlocking(businessProfileRef, businessUpdate, { merge: true });

            // Best-effort dispatch shop assignment based on onboarding location.
            // We treat onboarding "Primary City" as the dispatch coverage "State".
            try {
              const shopsQ = query(
                collection(firestore, 'dispatchShops'),
                where('country', '==', country),
                where('state', '==', city)
              );
              const snap = await getDocs(shopsQ);
              const shopDoc = snap.docs[0];
              if (shopDoc) {
                const shop = shopDoc.data() as any;
                const assignment = {
                  dispatchShopId: shopDoc.id,
                  dispatchShopName: shop?.name || null,
                  dispatchShopLocation: shop?.location || null,
                  dispatchShopPickupFeeNgn: typeof shop?.pickupFeeNgn === 'number' ? shop.pickupFeeNgn : null,
                  dispatchShopMaintenanceFeeNgn: typeof shop?.maintenanceFeeNgn === 'number' ? shop.maintenanceFeeNgn : null,
                  dispatchShopAssignedAt: serverTimestamp(),
                };
                updateDocumentNonBlocking(businessDocRef, assignment);
                setDocumentNonBlocking(businessProfileRef, assignment, { merge: true });
              }
            } catch (e) {
              console.warn('Dispatch shop auto-assignment failed', e);
            }
        } else {
            console.warn("businessId not found, cannot save business info. Proceeding with navigation.");
        }

        // Immediately navigate to the next step
        router.push('/owner/pricing');
    };

    const isButtonDisabled = isSubmitting || !businessName || !businessType || !country || !city;

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
                disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business-type">Business Type</Label>
            <Select onValueChange={setBusinessType} value={businessType} disabled={isSubmitting}>
              <SelectTrigger id="business-type" className="h-12 text-base">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shop">Shop</SelectItem>
                <SelectItem value="supermarket">Supermarket</SelectItem>
                <SelectItem value="food">Food / Restaurant</SelectItem>
                <SelectItem value="groceries">Groceries</SelectItem>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                <SelectItem value="bakery">Bakery</SelectItem>
                <SelectItem value="cafe">Cafe</SelectItem>
                <SelectItem value="books">Books</SelectItem>
                <SelectItem value="toys">Toys</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="home">Home & Living</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="health">Health & Wellness</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select onValueChange={setCountry} value={country} disabled={isSubmitting}>
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
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
