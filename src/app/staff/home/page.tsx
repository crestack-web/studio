
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, PackagePlus, FilePlus, LogOut } from 'lucide-react';
import { Logo } from '@/components/app/logo';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailVerificationRequired } from '@/components/auth/email-verification-required';

interface AppUser {
    displayName?: string;
    businessId?: string;
    staffPermissions?: {
        canRecordSale?: boolean;
        canAddInventory?: boolean;
        canRecordExpense?: boolean;
    };
}

interface Business {
    businessName?: string;
}

export default function StaffHomePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();

    if (!isUserLoading && !user) {
        router.replace('/login');
        return null;
    }

    if (user && !user.emailVerified) {
        return <EmailVerificationRequired dashboardLabel="Staff" />;
    }

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(userProfileRef);

    const businessRef = useMemoFirebase(() => {
        if (!userProfile?.businessId || !firestore) return null;
        return doc(firestore, 'businesses', userProfile.businessId);
    }, [userProfile?.businessId, firestore]);
    const { data: businessData, isLoading: isBusinessLoading } = useDoc<Business>(businessRef);

    const handleSignOut = async () => {
        if(auth) {
            await signOut(auth);
        }
        router.push('/login');
    };
    
    const isLoading = isUserLoading || isProfileLoading || isBusinessLoading;

    const permissions = userProfile?.staffPermissions;
    const hasDashboardAccess = Boolean(
        permissions?.canRecordSale || permissions?.canAddInventory || permissions?.canRecordExpense
    );

    const canAddInventory = Boolean(permissions?.canAddInventory);
    const canRecordExpense = Boolean(permissions?.canRecordExpense);

    return (
        <div className="flex flex-col min-h-screen bg-background">
        <header className="flex items-center justify-between p-4 border-b bg-card">
            <Logo className="h-8" />
            <div className="flex items-center gap-4">
                {isLoading ? <Skeleton className="h-6 w-24" /> : (
                    <div className="text-right">
                         <div className="font-semibold">{userProfile?.displayName}</div>
                         <div className="text-xs text-muted-foreground">Staff at {businessData?.businessName}</div>
                    </div>
                )}
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Sign Out</span>
                </Button>
            </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-4">
                 <h1 className="text-center text-2xl font-bold font-headline">Staff Dashboard</h1>

                {!hasDashboardAccess ? (
                    <div className="space-y-3 text-center">
                        <p className="text-sm text-muted-foreground">Your account is ready, but your business owner still needs to assign your permissions.</p>
                        <p className="text-xs text-muted-foreground">Check back later or contact your manager.</p>
                    </div>
                ) : (
                    <>
                        <Link href="/record-sale">
                            <Button className="w-full h-24 text-xl font-headline flex-col gap-2">
                                <Plus className="w-8 h-8" />
                                Record a Sale
                            </Button>
                        </Link>
                        {canAddInventory && (
                            <Link href="/add-inventory">
                                <Button variant="secondary" className="w-full h-24 text-xl font-headline flex-col gap-2">
                                    <PackagePlus className="w-8 h-8" />
                                    Add Inventory
                                </Button>
                            </Link>
                        )}
                        {canRecordExpense && (
                            <Link href="/record-expense">
                                <Button variant="secondary" className="w-full h-24 text-xl font-headline flex-col gap-2">
                                    <FilePlus className="w-8 h-8" />
                                    Record Expense
                                </Button>
                            </Link>
                        )}
                    </>
                )}
            </div>
        </main>
        </div>
    );
}
