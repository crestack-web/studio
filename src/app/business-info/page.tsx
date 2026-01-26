'use client';
import { useState, useEffect } from 'react';
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

export default function BusinessInfoPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const selectedCountryData = markets.find(c => c.code === country);

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

        // Simulate backend call
        setTimeout(() => {
            router.replace('/plans');
        }, 1000);
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
