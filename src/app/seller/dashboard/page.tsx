'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Loader2, LogOut, PackagePlus, Store, CreditCard, Package, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/app/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailVerificationRequired } from '@/components/auth/email-verification-required';
import { useAuth, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';

interface AppUserProfile {
  displayName?: string;
  businessId?: string;
  role?: string;
}

interface BusinessProfile {
  businessName?: string;
}

export default function SellerDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  if (!isUserLoading && !user) {
    router.replace('/seller/login');
    return null;
  }

  if (user && !user.emailVerified) {
    return <EmailVerificationRequired dashboardLabel="Seller" />;
  }

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUserProfile>(userProfileRef);

  const businessRef = useMemoFirebase(() => {
    if (!userProfile?.businessId || !firestore) return null;
    return doc(firestore, 'businesses', userProfile.businessId);
  }, [userProfile?.businessId, firestore]);
  const { data: businessData, isLoading: isBusinessLoading } = useDoc<BusinessProfile>(businessRef);

  const isLoading = isUserLoading || isProfileLoading || isBusinessLoading;

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/seller/login');
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <Link href="/sell" className="flex items-center gap-2">
          <Logo className="h-8" />
          <span className="text-sm font-semibold text-muted-foreground">Seller Central</span>
        </Link>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <Skeleton className="h-6 w-28" />
          ) : (
            <div className="text-right">
              <div className="font-semibold">{userProfile?.displayName || user?.email}</div>
              {businessData?.businessName ? (
                <div className="text-xs text-muted-foreground">{businessData.businessName}</div>
              ) : (
                <div className="text-xs text-muted-foreground">Seller account</div>
              )}
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-headline">Seller Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your storefront, products, orders, payments, and delivery.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Storefront</CardTitle>
                <CardDescription>Turn your store on and manage settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/owner/market">Open Storefront Settings</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><PackagePlus className="h-5 w-5 text-primary" /> Add product</CardTitle>
                <CardDescription>Create a new marketplace product listing.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/add-product">Add Product</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Orders</CardTitle>
                <CardDescription>View and manage incoming marketplace orders.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/owner/market?section=orders">View Orders</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Payments</CardTitle>
                <CardDescription>BusmoPay payouts and marketplace payment settings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/owner/market?section=busmopay">Open Payment Settings</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Delivery (BusmoGo)</CardTitle>
                <CardDescription>Offer delivery options and learn how BusmoGo works.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="secondary">
                  <Link href="/market/delivery">Go to BusmoGo</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
