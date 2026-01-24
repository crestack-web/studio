
'use client';

import { Logo } from "@/components/app/logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, getFirestore } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
    displayName?: string;
}

export default function InvestorDashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const handleSignOut = async () => {
        const auth = getAuth();
        await signOut(auth);
        router.push('/investor/login');
    };
    
    const name = userProfile?.displayName || '';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-card">
                <Logo className="h-8" />
                <div className="flex items-center gap-4">
                    <Link href="/invest" passHref>
                        <Button variant="ghost">Explore Opportunities</Button>
                    </Link>
                    <ThemeToggle />
                    <Separator orientation="vertical" className="h-8 bg-border" />
                    {isUserLoading || isProfileLoading ? (
                        <div className="flex items-center gap-3">
                            <div className="text-right space-y-1">
                               <Skeleton className="h-4 w-24 ml-auto" />
                               <Skeleton className="h-3 w-16 ml-auto" />
                            </div>
                            <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                    ) : user ? (
                         <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="font-semibold">{name}</div>
                                <div className="text-xs text-muted-foreground">Investor</div>
                            </div>
                            <Avatar>
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <Button variant="ghost" size="sm" onClick={handleSignOut}>Sign Out</Button>
                        </div>
                    ) : (
                         <Link href="/investor/login" passHref>
                            <Button>Log In</Button>
                        </Link>
                    )}
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}

    