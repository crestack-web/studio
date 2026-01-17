'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield } from 'lucide-react';

export default function RolePage() {
  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">What is your role?</CardTitle>
          <CardDescription>This determines what you can see and do.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <Link href="/owner/home">
            <Button variant="outline" className="w-full h-28 flex-col gap-2 text-lg">
              <Shield className="w-8 h-8"/>
              Owner
            </Button>
          </Link>
          <Link href="/staff/home">
            <Button variant="outline" className="w-full h-28 flex-col gap-2 text-lg">
              <User className="w-8 h-8"/>
              Staff / Cashier
            </Button>
          </Link>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
