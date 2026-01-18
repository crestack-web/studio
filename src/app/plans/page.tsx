'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShoppingCart, Store, Network } from 'lucide-react';

export default function PlansPage() {
  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Choose Your Plan</CardTitle>
          <CardDescription>All plans start with a free trial. No credit card needed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup defaultValue="shop" className="grid grid-cols-1 gap-4">
            <div>
              <RadioGroupItem value="shop" id="shop" className="peer sr-only" />
              <Label htmlFor="shop" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <div className="flex items-center gap-4">
                  <ShoppingCart className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Shop</p>
                    <p className="text-sm text-muted-foreground">For small retailers</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold">₦1,500</p>
                    <p className="text-sm text-muted-foreground">/month</p>
                </div>
              </Label>
            </div>
             <div>
              <RadioGroupItem value="supermarket" id="supermarket" className="peer sr-only" />
              <Label htmlFor="supermarket" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <div className="flex items-center gap-4">
                  <Store className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Supermarket</p>
                    <p className="text-sm text-muted-foreground">For larger stores</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold">₦10,000</p>
                    <p className="text-sm text-muted-foreground">/month</p>
                </div>
              </Label>
            </div>
             <div>
              <RadioGroupItem value="multi-branch" id="multi-branch" className="peer sr-only" />
              <Label htmlFor="multi-branch" className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <div className="flex items-center gap-4">
                  <Network className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Multiple Branches</p>
                    <p className="text-sm text-muted-foreground">For chains & franchises</p>
                  </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold">₦30,000</p>
                    <p className="text-sm text-muted-foreground">/month</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
          <Link href="/role" className="w-full">
            <Button className="w-full h-14 text-lg">
              Start Free Trial
            </Button>
          </Link>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
