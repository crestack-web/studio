"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SellerPaymentsPage() {
  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-extrabold font-headline tracking-tight mb-2 text-gray-900 dark:text-gray-100">Payments & Payouts</h1>
      <p className="mb-8 text-base text-muted-foreground dark:text-gray-300">See your BusmoPay payouts and manage payment settings.</p>
      <div className="w-full max-w-3xl">
        <Card className="rounded-2xl shadow-lg bg-white/80 dark:bg-gray-900/80 border border-gray-100 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payments & Payouts</CardTitle>
            <CardDescription className="dark:text-gray-300">See your BusmoPay payouts and manage payment settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payments/payouts table/list goes here */}
            <div className="flex justify-end">
              <Button asChild variant="secondary">
                <Link href="/seller/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
