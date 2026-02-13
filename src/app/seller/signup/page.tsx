'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  Loader2,
  ShoppingBag,
  UtensilsCrossed,
  Shirt,
  Scissors,
  Smartphone,
  Briefcase,
} from 'lucide-react';

import OnboardingLayout from '@/components/app/onboarding-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'signup' | 'login';

type SellerCategoryKey =
  | 'Food & Restaurants'
  | 'Retail'
  | 'Fashion'
  | 'Beauty'
  | 'Electronics'
  | 'Services';

const CATEGORY_OPTIONS: Array<{
  key: SellerCategoryKey;
  title: string;
  description: string;
  Icon: any;
}> = [
  { key: 'Food & Restaurants', title: 'Food & Restaurants', description: 'Meals, groceries, snacks, drinks.', Icon: UtensilsCrossed },
  { key: 'Retail', title: 'Retail', description: 'General stores and everyday essentials.', Icon: ShoppingBag },
  { key: 'Fashion', title: 'Fashion', description: 'Clothing, accessories, footwear.', Icon: Shirt },
  { key: 'Beauty', title: 'Beauty', description: 'Salon, cosmetics, personal care.', Icon: Scissors },
  { key: 'Electronics', title: 'Electronics', description: 'Phones, gadgets, accessories.', Icon: Smartphone },
  { key: 'Services', title: 'Services', description: 'Repairs, home services, and more.', Icon: Briefcase },
];

function inferDisplayNameFromEmail(email: string) {
  const local = (email || '').split('@')[0] || 'Seller';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, 40) : 'Seller';
}

export default function SellerSignupPage() {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [step, setStep] = useState<'auth' | 'category'>('auth');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<SellerCategoryKey | null>(null);
  const [existingBusinessId, setExistingBusinessId] = useState<string | null>(null);
  const [existingRole, setExistingRole] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const title = useMemo(() => (mode === 'signup' ? 'Create Seller Account' : 'Seller Login'), [mode]);
  const subtitle = useMemo(
    () => (mode === 'signup' ? 'Sign up to start selling on Busmo.' : 'Log in to access Seller Central.'),
    [mode]
  );

  const afterAuth = async (uid: string) => {
    const userRef = doc(firestore, 'users', uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      setExistingBusinessId(null);
      setExistingRole(null);
      setStep('category');
      return;
    }

    const data = snap.data() as any;
    setExistingRole(data?.role || null);

    const sellerCategory = data?.sellerCategory;
    const businessId = data?.businessId;
    setExistingBusinessId(businessId || null);

    if (sellerCategory) {
      router.replace('/seller/dashboard');
      return;
    }

    if (businessId) {
      try {
        const bizSnap = await getDoc(doc(firestore, 'businesses', businessId));
        const bizData = bizSnap.exists() ? (bizSnap.data() as any) : null;
        if (bizData?.businessType) {
          router.replace('/seller/dashboard');
          return;
        }
      } catch {
        // non-blocking
      }
    }

    setStep('category');
  };

  const handleAuth = async () => {
    setIsLoading(true);

    try {
      if (password.length < 6) {
        toast({ variant: 'destructive', title: 'Weak Password', description: 'Password must be at least 6 characters.' });
        return;
      }

      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'Account Created', description: 'One more step to personalize your seller profile.' });
        await afterAuth(cred.user.uid);
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Continuing to Seller Central...' });
      await afterAuth(cred.user.uid);
    } catch (error: any) {
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already in use. Try logging in instead.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'Please enter a valid email address.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'Invalid email or password.';
      }

      toast({ variant: 'destructive', title: mode === 'signup' ? 'Sign Up Failed' : 'Login Failed', description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryContinue = async () => {
    if (!auth.currentUser) return;
    if (!selectedCategory) {
      toast({ variant: 'destructive', title: 'Pick a category', description: 'Select the category that best matches your business.' });
      return;
    }

    setIsLoading(true);

    try {
      const user = auth.currentUser;
      const userRef = doc(firestore, 'users', user.uid);

      const displayName = inferDisplayNameFromEmail(user.email || email);

      const batch = writeBatch(firestore);

      let businessIdToUse = existingBusinessId;
      if (!businessIdToUse) {
        const businessRef = doc(collection(firestore, 'businesses'));
        businessIdToUse = businessRef.id;
        batch.set(businessRef, {
          ownerId: user.uid,
          businessName: displayName,
          businessType: selectedCategory,
          createdAt: serverTimestamp(),
          onboardingCompleted: true,
        });
      } else {
        batch.set(doc(firestore, 'businesses', businessIdToUse), { businessType: selectedCategory }, { merge: true });
      }

      batch.set(
        userRef,
        {
          id: user.uid,
          displayName,
          email: user.email,
          role: existingRole || 'Seller',
          businessId: businessIdToUse,
          sellerCategory: selectedCategory,
          sellerOnboardingCompleted: true,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      toast({ title: 'All set', description: 'Welcome to Busmo Seller Central.' });
      router.replace('/seller/dashboard');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Could not save', description: 'Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'category') {
    return (
      <OnboardingLayout>
        <Card className="w-full rounded-2xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">What do you sell?</CardTitle>
            <CardDescription>Choose a category for your business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {CATEGORY_OPTIONS.map(({ key, title, description, Icon }) => {
                const selected = selectedCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={
                      "w-full text-left rounded-2xl border bg-card p-4 shadow-md hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                      (selected ? 'ring-2 ring-primary border-primary/30' : '')
                    }
                  >
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-base">{title}</div>
                        <div className="text-sm text-muted-foreground">{description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full h-14 text-lg rounded-full"
              onClick={handleCategoryContinue}
              disabled={isLoading || !selectedCategory}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Not sure? Pick the closest one — you can update later.
            </p>
          </CardContent>
        </Card>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout>
      <Card className="w-full rounded-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === 'signup' ? 'default' : 'secondary'}
              className="h-11 rounded-full"
              onClick={() => setMode('signup')}
              disabled={isLoading}
            >
              Sign up
            </Button>
            <Button
              type="button"
              variant={mode === 'login' ? 'default' : 'secondary'}
              className="h-11 rounded-full"
              onClick={() => setMode('login')}
              disabled={isLoading}
            >
              Log in
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="h-12 text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-12 text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button
            className="w-full h-14 text-lg rounded-full"
            onClick={handleAuth}
            disabled={isLoading || !email || !password}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signup' ? 'Create Seller Account' : 'Log In'}
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Looking for the seller overview?{' '}
            <Link href="/seller" className="underline font-medium text-primary">
              See how it works
            </Link>
          </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
