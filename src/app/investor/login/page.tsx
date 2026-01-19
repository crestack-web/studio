'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function InvestorLoginPage() {
  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Investor Log In</CardTitle>
          <CardDescription>Access your investment dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="h-12 text-base" />
          </div>
          <Link href="/investor/dashboard" className="w-full">
            <Button className="w-full h-14 text-lg">
              Log In
            </Button>
          </Link>
          <p className="text-sm text-center text-muted-foreground pt-2">
              Don't have an account?{' '}
              <Link href="/investor/signup" className="underline font-medium text-primary">
                  Sign Up
              </Link>
          </p>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
