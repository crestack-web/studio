'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import OnboardingLayout from '@/components/app/onboarding-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  return (
    <OnboardingLayout>
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Log In</CardTitle>
          <CardDescription>Select your role to log in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="owner" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="owner">Owner</TabsTrigger>
              <TabsTrigger value="staff">Staff</TabsTrigger>
            </TabsList>
            <TabsContent value="owner" className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+234 800 000 0000" className="h-12 text-base" />
              </div>
              <Link href="/owner/home" className="w-full">
                <Button className="w-full h-14 text-lg">
                  Log In as Owner
                </Button>
              </Link>
            </TabsContent>
            <TabsContent value="staff" className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" className="h-12 text-base" />
              </div>
               <Link href="/staff/home" className="w-full">
                <Button className="w-full h-14 text-lg">
                  Log In as Staff
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground pt-2">
                  You can only log in if the business owner has added you as a staff member.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </OnboardingLayout>
  );
}
