'use client';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TakeMoneyPage() {
    return (
        <MainLayout title="Take Money" backHref="/owner/home">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Take Money</CardTitle>
                        <CardDescription>Record a cash withdrawal from the business.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" placeholder="0.00" className="h-12 text-base" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Note (Optional)</Label>
                            <Textarea id="description" placeholder="e.g., Owner's drawings, personal use" />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg">Confirm Withdrawal</Button>
            </div>
        </MainLayout>
    );
}
