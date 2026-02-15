"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SellerDeliveryPage() {
  // TODO: Fetch and display seller's delivery options and orders
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Delivery (BusmoGo)</CardTitle>
            <CardDescription>Offer delivery options and manage BusmoGo orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Delivery options/orders table/list goes here */}
            <div className="flex justify-end">
              <Button asChild variant="secondary">
                <Link href="/seller/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
