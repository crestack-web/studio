'use client';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RecordExpensePage() {
    return (
        <MainLayout title="Record Expense" backHref="/owner/home">
            <div className="w-full max-w-md space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>New Expense</CardTitle>
                        <CardDescription>Record a business expense.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Expense Title</Label>
                            <Input id="title" placeholder="e.g., Rent, electricity bill" className="h-12 text-base" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" placeholder="0.00" className="h-12 text-base" />
                        </div>
                    </CardContent>
                </Card>
                <Button className="w-full h-14 text-lg">Save Expense</Button>
            </div>
        </MainLayout>
    );
}
