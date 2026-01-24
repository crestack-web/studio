'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // This effect handles role assignment after a user is created in Firebase Auth.
  useEffect(() => {
    // Check if we have a newly authenticated user and are in the processing state.
    if (isProcessing && user && !isUserLoading) {
      const assignRole = async () => {
        if (!firestore || !user.email) {
          toast({ variant: "destructive", title: "Error", description: "Could not initialize services." });
          setIsProcessing(false);
          setIsLoading(false);
          return;
        }

        const invitationRef = doc(firestore, 'invitations', user.email);
        const userDocRef = doc(firestore, 'users', user.uid);

        try {
          const invitationSnap = await getDoc(invitationRef);

          if (invitationSnap.exists() && invitationSnap.data().status === 'pending') {
            // This is a staff member accepting an invitation.
            const invitationData = invitationSnap.data();
            const staffProfile = {
              id: user.uid,
              displayName: name,
              email: user.email,
              role: 'Staff',
              businessId: invitationData.businessId,
            };

            const batch = writeBatch(firestore);
            batch.set(userDocRef, staffProfile); // Create staff user profile
            batch.delete(invitationRef); // Delete the used invitation
            await batch.commit();

            toast({ title: "Welcome!", description: `You have successfully joined ${invitationData.businessName}.` });
            router.push('/staff/home');

          } else {
            // This is a new business owner.
            const ownerProfile = {
              id: user.uid,
              displayName: name,
              email: user.email,
              role: 'Owner',
            };
            
            await setDoc(userDocRef, ownerProfile);
            
            toast({ title: "Account Created", description: "Let's set up your business." });
            router.push('/business-info');
          }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Sign Up Failed", description: "Could not assign role. " + error.message });
            setIsLoading(false);
            setIsProcessing(false);
        }
      };

      assignRole();
    }
  }, [user, isUserLoading, isProcessing, firestore, name, email, router, toast]);

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
      if (!auth) throw new Error("Firebase Auth service not available.");
      
      // Create the user in Firebase Auth. This will trigger the useEffect above.
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Set processing state to true to let the useEffect know it should run the role assignment logic.
      setIsProcessing(true);

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message,
        });
        setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || isProcessing || !name || !email || !password || !phoneNumber;

  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Create your Account</CardTitle>
          <CardDescription>Sign up to start your business or join an existing one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="e.g., Tunde Oladipo" className="h-12 text-base" value={name} onChange={(e) => setName(e.target.value)} disabled={isButtonDisabled}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isButtonDisabled}/>
          </div>
           <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" placeholder="+234 800 000 0000" className="h-12 text-base" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isButtonDisabled}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Must be at least 6 characters" className="h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isButtonDisabled} />
          </div>
          <Button className="w-full h-14 text-lg" onClick={handleSignUp} disabled={isButtonDisabled}>
            {(isLoading || isProcessing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? 'Finalizing...' : 'Continue'}
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
