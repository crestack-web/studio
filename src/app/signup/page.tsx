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
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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

    if (!firestore || !auth) {
        toast({ variant: "destructive", title: "Error", description: "Could not connect to services." });
        setIsLoading(false);
        return;
    }

    let newUser;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      newUser = userCredential.user;
      await updateProfile(newUser, { displayName: name });
    } catch (authError: any) {
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: authError.message,
        });
        setIsLoading(false);
        return;
    }

    const userDocRef = doc(firestore, 'users', newUser.uid);
    const ownerProfile = {
        id: newUser.uid,
        displayName: name,
        email: newUser.email,
        phoneNumber: phoneNumber,
        role: 'Owner',
    };

    try {
        await setDoc(userDocRef, ownerProfile);
        toast({ title: "Account Created", description: "Let's set up your business." });
        router.push('/business-info');
    } catch (dbError: any) {
        console.error("Error creating user profile in Firestore:", dbError);
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: ownerProfile,
        });
        errorEmitter.emit('permission-error', permissionError);

        toast({
            variant: "destructive",
            title: "Account Setup Failed",
            description: "Your account could not be fully created. Please try again.",
        });

        // Clean up the created auth user
        try {
            if (auth.currentUser) {
                await auth.currentUser.delete();
            }
        } catch (deleteError) {
            console.error("Failed to clean up user after profile creation failure:", deleteError);
        }

        setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || !name || !email || !password || !phoneNumber;

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Create your Account</CardTitle>
          <CardDescription>Sign up to start your business.</CardDescription>
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
          <Button className="w-full h-14 text-lg" onClick={handleSignUp} disabled={isButtonDisabled}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Owner Account
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
