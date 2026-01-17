import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WelcomePage() {
  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome to BizAssistant</CardTitle>
          <CardDescription>Your AI partner for managing your small business in Africa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="w-full">
            <Button className="w-full h-14 text-lg">
              Get Started
            </Button>
          </Link>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
