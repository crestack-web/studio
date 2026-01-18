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
          <CardTitle className="text-2xl font-headline">Select Your Country</CardTitle>
          <CardDescription>This determines your currency and financial settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup defaultValue="NG" className="grid grid-cols-2 gap-4">
            <div>
              <RadioGroupItem value="NG" id="ng" className="peer sr-only" />
              <Label htmlFor="ng" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Nigeria
                <span className="font-normal text-sm mt-2 text-muted-foreground">₦ (NGN)</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="GH" id="gh" className="peer sr-only" />
              <Label htmlFor="gh" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Ghana
                <span className="font-normal text-sm mt-2 text-muted-foreground">GH₵ (GHS)</span>
              </Label>
            </div>
             <div>
              <RadioGroupItem value="NE" id="ne" className="peer sr-only" />
              <Label htmlFor="ne" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Niger
                <span className="font-normal text-sm mt-2 text-muted-foreground">CFA (XOF)</span>
              </Label>
            </div>
             <div>
              <RadioGroupItem value="CM" id="cm" className="peer sr-only" />
              <Label htmlFor="cm" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary h-28 text-xl font-bold cursor-pointer">
                Cameroon
                <span className="font-normal text-sm mt-2 text-muted-foreground">CFA (XAF)</span>
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
