'use client';
import { useState } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categoryPlaceholders: { [key: string]: string } = {
    rent: "e.g., Office rent for May",
    utilities: "e.g., Electricity bill for June",
    supplies: "e.g., Cleaning supplies",
    salaries: "e.g., Staff salaries for July",
    marketing: "e.g., Facebook ad campaign",
    other: "e.g., Miscellaneous business expense",
};

export default function RecordExpensePage() {
    const [titlePlaceholder, setTitlePlaceholder] = useState("Select a category to see examples");

    const handleCategoryChange = (category: string) => {
        setTitlePlaceholder(categoryPlaceholders[category] || "e.g., Describe the expense");
    };

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
                            <Label htmlFor="category">Category</Label>
                            <Select onValueChange={handleCategoryChange}>
                                <SelectTrigger id="category" className="h-12 text-base">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rent">Rent</SelectItem>
                                    <SelectItem value="utilities">Utilities</SelectItem>
                                    <SelectItem value="supplies">Supplies</SelectItem>
                                    <SelectItem value="salaries">Salaries</SelectItem>
                                    <SelectItem value="marketing">Marketing</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Expense Title</Label>
                            <Input id="title" placeholder={titlePlaceholder} className="h-12 text-base" />
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
