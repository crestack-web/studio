'use client';

import { Logo } from "@/components/app/logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface UserProfile {
    displayName?: string;
    role?: string;
}

export default function InvestorDashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const firestore = useFirestore();
    const { user, isUserLoading, auth } = useFirebase();

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        } else if (!isProfileLoading && userProfile?.role !== 'Investor') {
            // If user is logged in but not an investor, redirect them away
            router.replace('/owner/home'); 
        }
    }, [user, isUserLoading, userProfile, isProfileLoading, router]);


    const handleSignOut = async () => {
        if (auth) {
            await signOut(auth);
        }
        router.push('/login');
    };
    
    const name = userProfile?.displayName || '';
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    if (isUserLoading || isProfileLoading || !user || userProfile?.role !== 'Investor') {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

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
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
