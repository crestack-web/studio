'use client';

import { Logo } from "@/components/app/logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

// This layout has been stripped of its authentication logic for UI prototyping.
// In a real application, this would fetch the user's profile and protect the route.

export default function InvestorDashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const handleSignOut = async () => {
        // Simulate sign out
        router.push('/login');
    };
    
    const name = 'Tunde Oladipo';
    const initials = 'TO';

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
