import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SellerDispatchPage() {
  // TODO: Fetch dispatch shop info and handle pickup requests
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Dispatch Shop</CardTitle>
            <CardDescription>Manage your BusmoGo dispatch shop and request pickups for your orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dispatch shop info and pickup request form go here */}
            <div className="border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-lg mb-2">Request Pickup</h3>
              <p className="text-muted-foreground mb-2">Schedule a pickup for your ready-to-ship orders.</p>
              <Button className="w-full">Request Pickup</Button>
            </div>
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
