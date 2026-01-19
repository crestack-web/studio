'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, DollarSign, Briefcase, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';


interface Investment {
    id: string;
    businessName: string;
    businessId: string;
    status: 'Active' | 'Pending Funding' | 'Completed' | 'Pending Acceptance' | 'Rejected' | 'Cancelled';
    amount: number;
    type: 'Profit Sharing' | 'Equity';
    createdAt: { toDate: () => Date }; // Firestore Timestamp
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" | "success" } = {
    'Active': 'default',
    'Pending Funding': 'destructive',
    'Completed': 'secondary',
    'Pending Acceptance': 'outline',
    'Rejected': 'destructive',
    'Cancelled': 'destructive',
};

const LoadingSkeleton = () => (
    <>
        {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
            </TableRow>
        ))}
    </>
);

export default function InvestorDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [investmentToFund, setInvestmentToFund] = useState<Investment | null>(null);

    const investmentsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, "investments"), where("investorId", "==", user.uid));
    }, [firestore, user?.uid]);

    const { data: investments, isLoading: isLoadingInvestments } = useCollection<Investment>(investmentsQuery);

    const portfolioSummary = useMemo(() => {
        if (!investments) return { totalInvested: 0, totalReturns: 0, activeInvestments: 0 };
        
        const totalInvested = investments
            .filter(inv => inv.status === 'Active' || inv.status === 'Completed')
            .reduce((sum, inv) => sum + inv.amount, 0);

        const activeInvestments = investments.filter(inv => inv.status === 'Active').length;

        return {
            totalInvested,
            totalReturns: 0, // Placeholder
            activeInvestments,
        };
    }, [investments]);

    if (!isUserLoading && !user) {
        router.push('/investor/login');
        return null;
    }
    
    const handleFundInvestment = async () => {
        if (!firestore || !investmentToFund) return;
        
        const investmentRef = doc(firestore, 'investments', investmentToFund.id);
        
        try {
            await updateDoc(investmentRef, { status: 'Active' });
            toast({
                title: 'Investment Funded!',
                description: `The investment in ${investmentToFund.businessName} is now active.`,
            });
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error Funding Investment',
                description: error.message || 'There was an issue updating the investment status.',
            });
        } finally {
            setInvestmentToFund(null);
        }
    };


    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Investor Dashboard</h1>
                <p className="text-muted-foreground">Welcome back. Here's your portfolio overview.</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingInvestments ? <Skeleton className="h-8 w-36" /> : (
                            <div className="text-2xl font-bold">₦{portfolioSummary.totalInvested.toLocaleString()}</div>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingInvestments ? <Skeleton className="h-8 w-32" /> : (
                            <>
                                <div className="text-2xl font-bold">₦{portfolioSummary.totalReturns.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Coming soon</p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoadingInvestments ? <Skeleton className="h-8 w-10" /> : (
                            <div className="text-2xl font-bold">{portfolioSummary.activeInvestments}</div>
                        )}
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
                            {isLoadingInvestments || isUserLoading ? <LoadingSkeleton /> : (
                                investments?.length ? (
                                    investments.map((investment) => (
                                        <TableRow key={investment.id}>
                                            <TableCell className="font-medium">{investment.businessName}</TableCell>
                                            <TableCell>{investment.type}</TableCell>
                                            <TableCell>₦{investment.amount.toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant[investment.status] || 'default'}>
                                                    {investment.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{investment.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</TableCell>
                                            <TableCell className="text-right">
                                                {investment.status === 'Pending Funding' && (
                                                    <Button size="sm" onClick={() => setInvestmentToFund(investment)}>Fund Investment</Button>
                                                )}
                                                {investment.status !== 'Pending Funding' && (
                                                     <Link href={`/investor/dashboard/portfolio/${investment.id}`}>
                                                        <Button size="sm" variant="outline">View Details</Button>
                                                    </Link>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            You haven't made any investments yet.
                                            <Link href="/invest" passHref>
                                                <Button variant="link">Explore Opportunities</Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!investmentToFund} onOpenChange={() => setInvestmentToFund(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Funding</DialogTitle>
                        <DialogDescription>
                            You are about to mark the investment in <strong>{investmentToFund?.businessName}</strong> as funded.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="p-4 border rounded-md">
                            <div className="flex justify-between font-bold">
                                <span>Investment Amount</span>
                                <span>₦{investmentToFund?.amount.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md space-y-2">
                            <p className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Important</p>
                            <p>By clicking "Confirm," you are confirming that you have sent the funds to the business owner directly.</p>
                            <p>Busmo is a system of record and does not handle funds.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInvestmentToFund(null)}>Cancel</Button>
                        <Button onClick={handleFundInvestment}>Confirm, I've Sent the Funds</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}

    