import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WelcomePage() {
  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome to Busmo</CardTitle>
          <CardDescription>Your AI partner for managing your small business in Africa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/signup" className="w-full">
            <Button className="w-full h-14 text-lg">
              Create Account
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full h-14 text-lg">
              Log In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
