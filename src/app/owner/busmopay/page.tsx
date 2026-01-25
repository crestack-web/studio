
'use client';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Banknote, CreditCard, Download, ExternalLink, MoreHorizontal, TrendingUp, Rocket } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Mock data
const transactions = [
    { id: 'txn_1', date: '2024-07-15', method: 'paystack', amount: 12000, status: 'succeeded', customer: 'Tunde O.' },
    { id: 'txn_2', date: '2024-07-15', method: 'airtel', amount: 5500, status: 'succeeded', customer: 'Amina K.' },
    { id: 'txn_3', date: '2024-07-14', method: 'paystack', amount: 8200, status: 'succeeded', customer: 'John A.' },
    { id: 'txn_4', date: '2024-07-13', method: 'paystack', amount: 25000, status: 'failed', customer: 'Jane D.' },
];

export default function BusmoPayDashboard() {

    return (
        <MainLayout title="BusmoPay Dashboard" backHref="/owner/home">
            <div className="w-full max-w-5xl space-y-6">
                <Alert>
                    <Rocket className="h-4 w-4" />
                    <AlertTitle>Coming Soon!</AlertTitle>
                    <AlertDescription>
                        The BusmoPay dashboard is almost here. You'll soon be able to track live transactions, view payouts, and manage payment links. The data below is for demonstration purposes only.
                    </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5"/>Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">₦45,700</p>
                            <p className="text-xs text-muted-foreground">+15% from last month</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-5 h-5"/>Paystack Volume</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">₦20,200</p>
                            <p className="text-xs text-muted-foreground">2 successful transactions</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Banknote className="w-5 h-5"/>Airtel Money Volume</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">5,500 CFA</p>
                            <p className="text-xs text-muted-foreground">1 successful transaction</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Transactions</CardTitle>
                            <CardDescription>Your latest BusmoPay transactions.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" size="sm" disabled><Download className="mr-2 h-4 w-4" />Export CSV</Button>
                             <Button size="sm" asChild><Link href="/owner/market?section=busmopay">Payment Settings</Link></Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.date}</TableCell>
                                        <TableCell>{tx.customer}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.method === 'paystack' ? 'default' : 'secondary'} className={tx.method === 'airtel' ? 'bg-red-600 hover:bg-red-700' : ''}>
                                                {tx.method === 'paystack' ? 'Paystack' : 'Airtel'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                             <Badge variant={tx.status === 'succeeded' ? 'secondary' : 'destructive'} className={tx.status === 'succeeded' ? 'text-primary' : ''}>
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {tx.method === 'paystack' ? `₦${tx.amount.toLocaleString()}` : `${tx.amount.toLocaleString()} CFA`}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="text-lg">Generate Payment Link</CardTitle>
                        <CardDescription>Create a simple link to get paid for any product or service.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground text-sm">
                        <p>This feature is coming soon.</p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
