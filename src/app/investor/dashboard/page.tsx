'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, DollarSign, Briefcase, Clock } from "lucide-react";
import Link from "next/link";

const mockInvestments = [
    { 
        id: 'inv1', 
        businessName: "Aisha's Crafts",
        businessId: 'biz1',
        status: 'Active',
        amount: 500000,
        type: 'Profit Sharing',
        since: 'July 2024'
    },
    { 
        id: 'inv2', 
        businessName: "City Electronics Inc.",
        businessId: 'biz3',
        status: 'Pending Funding',
        amount: 10000000,
        type: 'Equity',
        since: 'August 2024'
    },
    { 
        id: 'inv3', 
        businessName: "Femi's Farm",
        businessId: 'biz2',
        status: 'Completed',
        amount: 300000,
        type: 'Profit Sharing',
        since: 'January 2023'
    },
];

const portfolioSummary = {
    totalInvested: 10800000,
    totalReturns: 75000,
    activeInvestments: 2,
};

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Active': 'default',
    'Pending Funding': 'destructive',
    'Completed': 'secondary',
    'Pending Acceptance': 'outline',
    'Rejected': 'destructive'
};


export default function InvestorDashboardPage() {
    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Investor Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, Tunde. Here's your portfolio overview.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{portfolioSummary.totalInvested.toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₦{portfolioSummary.totalReturns.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+5.2% since last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{portfolioSummary.activeInvestments}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>My Investment Portfolio</CardTitle>
                    <CardDescription>An overview of all your pending and active investments.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Business</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Since</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockInvestments.map((investment) => (
                                <TableRow key={investment.id}>
                                    <TableCell className="font-medium">{investment.businessName}</TableCell>
                                    <TableCell>{investment.type}</TableCell>
                                    <TableCell>₦{investment.amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[investment.status] || 'default'}>
                                            {investment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{investment.since}</TableCell>
                                    <TableCell className="text-right">
                                        {investment.status === 'Pending Funding' && (
                                            <Button size="sm">Fund Investment</Button>
                                        )}
                                        {investment.status !== 'Pending Funding' && (
                                             <Link href={`/investor/portfolio/${investment.id}`}>
                                                <Button size="sm" variant="outline">View Details</Button>
                                            </Link>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
