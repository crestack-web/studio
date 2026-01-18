'use client';

import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Landmark, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AccessCapitalPage() {
    return (
        <MainLayout title="Access Capital" backHref="/owner/home">
            <div className="w-full max-w-2xl space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline">Unlock Your Business Potential</h1>
                    <p className="text-muted-foreground mt-2">
                        Busmo helps you grow by providing access to capital based on your business performance.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Landmark className="w-6 h-6 text-primary" />
                            <span>How to Qualify for a Loan</span>
                        </CardTitle>
                        <CardDescription>
                            Lenders look for consistent and healthy business activity. Here’s what you need to do:
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-start gap-4">
                            <CheckCircle2 className="w-8 h-8 text-success mt-1 shrink-0" />
                            <div>
                                <h3 className="font-semibold">Record Transactions Consistently</h3>
                                <p className="text-muted-foreground text-sm">
                                    Log all your sales, expenses, and inventory changes in Busmo for at least 30 days. The more data you provide, the better.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <CheckCircle2 className="w-8 h-8 text-success mt-1 shrink-0" />
                            <div>
                                <h3 className="font-semibold">Show Positive Cash Flow</h3>
                                <p className="text-muted-foreground text-sm">
                                    A healthy business makes more than it spends. Focus on increasing sales and managing your expenses to demonstrate profitability.
                                </p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <CheckCircle2 className="w-8 h-8 text-success mt-1 shrink-0" />
                            <div>
                                <h3 className="font-semibold">Maintain Good Inventory Levels</h3>
                                <p className="text-muted-foreground text-sm">
                                    Avoid frequent stock-outs. Keeping popular items in stock shows you can meet customer demand.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                           <TrendingUp className="w-6 h-6" />
                           <span>Sample Loan Offer</span>
                        </CardTitle>
                        <CardDescription className="text-primary-foreground/80">
                            Based on 3 months of consistent data, a business like yours could be eligible for:
                        </CardDescription>
                    </CardHeader>
                     <CardContent className="text-center">
                        <p className="text-5xl font-bold font-headline">₦250,000</p>
                        <p className="text-sm text-primary-foreground/80 mt-1">6-month term at a competitive interest rate.</p>

                        <Button variant="secondary" className="mt-6" disabled>
                            Apply Now (Feature Coming Soon)
                        </Button>
                    </CardContent>
                </Card>

                <div className="text-center text-muted-foreground text-sm">
                    <p>Keep up the great work! We'll notify you as soon as you're eligible for an offer.</p>
                     <Link href="/owner/home" passHref>
                        <Button variant="link">Back to Home</Button>
                    </Link>
                </div>
            </div>
        </MainLayout>
    );
}
