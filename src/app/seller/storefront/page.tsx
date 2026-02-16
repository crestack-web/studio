"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SellerStorefrontSettings() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="min-h-screen flex flex-col px-6 py-8 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl sm:text-4xl font-extrabold font-headline tracking-tight mb-2 text-gray-900 dark:text-gray-100">Storefront Settings</h1>
      <p className="mb-8 text-base text-muted-foreground dark:text-gray-300">Customize your seller storefront. Changes here only affect your seller store.</p>
      <div className="w-full max-w-2xl">
        <Card className="rounded-2xl shadow-lg bg-white/80 dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Storefront Settings</CardTitle>
            <CardDescription className="dark:text-gray-300">Customize your seller storefront. Changes here only affect your seller store.</CardDescription>
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
