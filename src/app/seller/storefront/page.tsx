"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SellerStorefrontSettings() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // TODO: Load and save seller-specific storefront settings

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Storefront Settings</CardTitle>
            <CardDescription>Customize your seller storefront. Changes here only affect your seller store.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Storefront settings form goes here */}
            <div className="flex justify-between gap-4">
              <Button variant="secondary" onClick={() => router.push('/seller/dashboard')} disabled={isSaving}>
                Exit
              </Button>
              <Button onClick={() => {/* Save logic */}} disabled={isSaving}>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
