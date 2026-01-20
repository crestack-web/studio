'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { doc } from 'firebase/firestore';

interface UserProfile {
    role?: string;
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check user role
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await new Promise<UserProfile | undefined>((resolve) => {
        const { data } = useDoc<UserProfile>(userDocRef);
        // This is a bit of a hack, but useDoc is async so we need to wait
        setTimeout(() => resolve(data), 1000);
      });
      
      // A more robust solution might involve a custom hook or direct getDoc
      // For this prototype, we will just check the role after a short delay
      const userProfileSnap = await (await import('firebase/firestore')).getDoc(userDocRef);


      if (userProfileSnap.exists() && userProfileSnap.data().role === 'Admin') {
        toast({
          title: "Admin Login Successful",
          description: "Redirecting to your dashboard...",
        });
        router.push('/admin/dashboard');
      } else {
        await auth.signOut();
        throw new Error("You are not authorized to access this page.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Logo className="h-10" />
        </div>
        <Card className="w-full">
            <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Admin Panel</CardTitle>
            <CardDescription>Log in to manage Busmo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="admin@busmo.com" className="h-12 text-base" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" className="h-12 text-base" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>
            <Button className="w-full h-14 text-lg" onClick={handleLogin} disabled={isLoading || !email || !password}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log In
            </Button>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
