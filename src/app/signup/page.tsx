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
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, type User } from 'firebase/auth';
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
            title: "Weak Password",
            description: "Your password must be at least 6 characters long.",
        });
        setIsLoading(false);
        return;
    }

    if (!firestore || !auth) {
        toast({ variant: "destructive", title: "Initialization Error", description: "Could not connect to services. Please try again." });
        setIsLoading(false);
        return;
    }

    let newUser: User | null = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      newUser = userCredential.user;
      
      await updateProfile(newUser, { displayName: name });

      const userDocRef = doc(firestore, 'users', newUser.uid);
      const ownerProfile = {
          id: newUser.uid,
          displayName: name,
          email: newUser.email,
          phoneNumber: phoneNumber,
          role: 'Owner',
      };

      await setDoc(userDocRef, ownerProfile);
      
      toast({ title: "Account Created!", description: "Let's set up your business." });
      router.push('/business-info');

    } catch (error: any) {
        console.error("Sign up error:", error);
        let title = "Sign Up Failed";
        let description = "An unknown error occurred. Please try again.";
        
        if (error.code) {
            switch(error.code) {
                case 'auth/email-already-in-use':
                    title = "Email Already in Use";
                    description = "This email address is already associated with an account. Please log in or use a different email.";
                    break;
                case 'auth/invalid-email':
                    title = "Invalid Email";
                    description = "Please enter a valid email address.";
                    break;
                case 'auth/weak-password':
                    title = "Weak Password";
                    description = "Your password must be at least 6 characters long.";
                    break;
                case 'permission-denied':
                    title = "Account Setup Failed";
                    description = "We couldn't create your user profile due to a permissions issue. This can sometimes happen on a slow network. Please try again.";
                    break;
                default:
                    description = `An unexpected error occurred: ${error.message}`;
            }
        } else if (error.message) {
            description = `An unexpected error occurred: ${error.message}`;
        }
        
        toast({
            variant: "destructive",
            title: title,
            description: description,
        });
        
        // Clean up the created auth user if profile creation failed
        if (newUser) {
            try {
                await newUser.delete();
            } catch (deleteError) {
                console.error("Failed to clean up user after profile creation failure:", deleteError);
            }
        }
    } finally {
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
