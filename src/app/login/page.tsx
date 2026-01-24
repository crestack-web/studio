'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building } from 'lucide-react';

export default function RoleSelectionPage() {
  return (
    <OnboardingLayout>
      <div className="w-full max-w-sm space-y-6">
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center">
                    <Building className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-headline pt-2">For Business Owners</CardTitle>
                <CardDescription>Manage your business, track performance, and sell online.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <Button asChild className="w-full h-12 text-base">
                    <Link href="/login/form">Log In</Link>
                </Button>
                <Button asChild variant="outline" className="w-full h-12 text-base">
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="text-center">
                <div className="flex justify-center">
                    <User className="w-10 h-10 text-accent" />
                </div>
                <CardTitle className="text-xl font-headline pt-2">For Staff Members</CardTitle>
                <CardDescription>Log in to record sales and manage inventory for your employer.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full h-12 text-base" variant="secondary">
                    <Link href="/login/form">Staff Log In</Link>
                </Button>
                 <p className="text-xs text-center text-muted-foreground mt-3">You must be invited by a business owner to log in as staff.</p>
            </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  );
}
