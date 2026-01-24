'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

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

    try {
        if (!auth || !firestore) {
            throw new Error("Firebase services not available.");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const ownerProfile = {
            id: user.uid,
            displayName: name,
            email: user.email,
            role: 'Owner',
        };
        
        setDocumentNonBlocking(doc(firestore, 'users', user.uid), ownerProfile, {});
        
        toast({
            title: "Account Created",
            description: "Let's set up your business.",
        });
        router.push('/business-info');

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message,
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
            <Label htmlFor="phone">Phone Number</Label>
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
              <Link href="/login/form" className="underline font-medium text-primary">
                  Log In
              </Link>
          </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
