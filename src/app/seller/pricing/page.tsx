import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function SellerPricingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Seller Pricing</CardTitle>
            <CardDescription>Start with a 3-day free trial. Simple, transparent pricing for sellers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border rounded-lg p-4 bg-card">
                <h3 className="font-semibold text-lg mb-2">Free Trial</h3>
                <p className="text-muted-foreground mb-2">Try all features free for 3 days.</p>
                <Button variant="secondary" className="w-full" onClick={() => router.push('/seller/signup')}>Start Free Trial</Button>
              </div>
              <div className="border rounded-lg p-4 bg-card">
                <h3 className="font-semibold text-lg mb-2">Seller Plan</h3>
                <p className="text-muted-foreground mb-2">₦1,500/month after trial. Cancel anytime.</p>
                <Button className="w-full" onClick={() => router.push('/seller/signup')}>Choose Plan</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
