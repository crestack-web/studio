'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function CurrencyPage() {
  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Select Your Currency</CardTitle>
          <CardDescription>This will be used for all financial records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup defaultValue="NGN" className="grid grid-cols-2 gap-6">
            <div>
              <RadioGroupItem value="NGN" id="ngn" className="peer sr-only" />
              <Label htmlFor="ngn" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-3xl font-bold cursor-pointer">
                ₦
                <span className="font-normal text-sm mt-2 text-muted-foreground">NGN</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="CFA" id="cfa" className="peer sr-only" />
              <Label htmlFor="cfa" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                CFA
                <span className="font-normal text-sm mt-2 text-muted-foreground">XOF</span>
              </Label>
            </div>
          </RadioGroup>
          <Link href="/plans" className="w-full">
            <Button className="w-full h-14 text-lg">
              Continue
            </Button>
          </Link>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
