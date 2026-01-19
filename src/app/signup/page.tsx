'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, writeBatch, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async () => {
    setIsLoading(true);
    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "Password is too short",
            description: "Password must be at least 6 characters.",
        });
        setIsLoading(false);
        return;
    }

    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Database service is not available. Please try again later.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Use a batch to create user and business docs atomically
      const batch = writeBatch(firestore);

      // 1. Create a new business document
      const businessRef = doc(collection(firestore, 'businesses'));
      batch.set(businessRef, {
        id: businessRef.id,
        name: `${name}'s Business`, // Placeholder name
        type: '',
        currency: '',
        plan: '',
      });

      // 2. Create the user profile and link it to the business
      const userRef = doc(firestore, 'users', user.uid);
      batch.set(userRef, {
        id: user.uid,
        displayName: name,
        email: user.email,
        phoneNumber: phoneNumber,
        role: 'Owner',
        businessId: businessRef.id,
        canRecordSales: true,
        canSeeReports: true,
        canManageMarket: true,
      });

      // 3. Commit the batch
      await batch.commit();
      
      toast({
        title: "Account Created",
        description: "Let's set up your business.",
      });
      router.push('/business-info');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Create your Account</CardTitle>
          <CardDescription>Get started with Busmo as a business owner.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="e.g., Tunde Oladipo" className="h-12 text-base" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}/>
          </div>
           <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (for calls)</Label>
            <Input id="phone" type="tel" placeholder="+234 800 000 0000" className="h-12 text-base" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isLoading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Must be at least 6 characters" className="h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
          </div>
          <Button className="w-full h-14 text-lg" onClick={handleSignUp} disabled={isLoading || !name || !email || !password || !phoneNumber}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
           <p className="text-sm text-center text-muted-foreground pt-2">
              Already have an account?{' '}
              <Link href="/login" className="underline font-medium text-primary">
                  Log In
              </Link>
          </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
