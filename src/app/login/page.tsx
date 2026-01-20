
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
        if (!auth) {
            throw new Error("Firebase auth not available");
        }
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      router.push('/owner/home');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Login Failed",
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
          <CardTitle className="text-2xl font-headline">Log In</CardTitle>
          <CardDescription>Select your role to log in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="owner" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="owner">Business Owner</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
            </TabsList>
            <TabsContent value="owner" className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="owner-email">Email Address</Label>
                <Input id="owner-email" type="email" placeholder="you@example.com" className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-password">Password</Label>
                <Input id="owner-password" type="password" placeholder="••••••••" className="h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
              </div>
              <Button className="w-full h-14 text-lg" onClick={handleLogin} disabled={isLoading || !email || !password}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log In as Owner
              </Button>
               <p className="text-sm text-center text-muted-foreground pt-2">
                  Don't have an account?{' '}
                  <Link href="/signup" className="underline font-medium text-primary">
                      Sign Up
                  </Link>
              </p>
            </TabsContent>
            <TabsContent value="staff" className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email Address</Label>
                <Input id="staff-email" type="email" placeholder="you@example.com" className="h-12 text-base" />
              </div>
               <Link href="/staff/home" className="w-full">
                <Button className="w-full h-14 text-lg">
                  Log In as Staff
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground pt-2">
                  You can only log in if the business owner has added you as a staff member.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
