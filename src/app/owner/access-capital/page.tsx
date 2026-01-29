'use client';

import { useState, useMemo } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle2, ShieldCheck, TrendingUp, Handshake, Building2, LockKeyhole, Banknote, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/currency';
import { differenceInDays } from 'date-fns';

// Interfaces for Firestore data
interface AppUser {
    businessId?: string;
}

interface Business {
    plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
    createdAt: { toDate: () => Date };
}

interface BusinessProfile {
    isSeekingInvestment?: boolean;
}

interface Sale {
    id: string;
}

interface Investment {
    id: string;
    investorName: string;
    amount: number;
    type: 'Profit Sharing' | 'Equity';
    terms: {
        profitShare?: number;
        duration?: number;
        equity?: number;
        valuation?: number;
    };
    status: 'pending-acceptance' | 'active' | 'rejected' | 'completed';
}

export default function AccessCapitalPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    
    const [offerToAccept, setOfferToAccept] = useState<Investment | null>(null);
    const [offerToReject, setOfferToReject] = useState<Investment | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !authUser) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businesses', businessId);
    }, [firestore, businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<Business>(businessRef);

    const businessProfileRef = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return doc(firestore, 'businessProfiles', businessId);
    }, [firestore, businessId]);
    const { data: businessProfileData, isLoading: isLoadingProfile } = useDoc<BusinessProfile>(businessProfileRef);
    
    const salesQuery = useMemoFirebase(() => {
        if (!firestore || !businessId) return null;
        return query(collection(firestore, `businesses/${businessId}/sales`), where('timestamp', '!=', null));
    }, [firestore, businessId]);
    const { data: salesData, isLoading: isLoadingSales } = useCollection<Sale>(salesQuery);
    
    const investmentOffersQuery = useMemoFirebase(() => {
        if (!firestore || !businessId || !businessProfileData?.isSeekingInvestment) return null;
        return query(
            collection(firestore, 'investments'), 
            where('businessId', '==', businessId),
            where('status', '==', 'pending-acceptance')
        );
    }, [firestore, businessId, businessProfileData?.isSeekingInvestment]);
    const { data: investmentOffers, isLoading: isLoadingOffers } = useCollection<Investment>(investmentOffersQuery);

    const isEligible = useMemo(() => {
        if (!businessData || !salesData) return false;
        const businessAgeInDays = businessData.createdAt ? differenceInDays(new Date(), businessData.createdAt.toDate()) : 0;
        return businessAgeInDays >= 30 && salesData.length > 0;
    }, [businessData, salesData]);

    const canAccessEquity = businessData?.plan === 'company';
    const isSeekingInvestment = businessProfileData?.isSeekingInvestment;

    const handleOptIn = async () => {
        if (!businessProfileRef) return;
        setIsUpdating(true);
        try {
            await updateDocumentNonBlocking(businessProfileRef, { isSeekingInvestment: true });
            toast({ title: "You're all set!", description: "Investors can now see your business and send offers." });
        } catch (error) {
            toast({ title: "Error", description: "Could not opt-in. Please try again.", variant: 'destructive' });
        } finally {
            setIsUpdating(false);
        }
    }

    const handleAccept = async () => {
        if (!offerToAccept || !firestore) return;
        setIsUpdating(true);
        const investmentRef = doc(firestore, 'investments', offerToAccept.id);
        
        try {
            await updateDocumentNonBlocking(investmentRef, { status: 'pending-funding' });
            toast({
                title: `Offer Accepted!`,
                description: `You have accepted the investment offer. The investor has been notified to fund the investment.`,
            });
        } catch (error) {
            toast({ title: "Error", description: "Could not accept the offer.", variant: "destructive" });
        } finally {
            setOfferToAccept(null);
            setIsUpdating(false);
        }
    };

    const handleReject = async () => {
        if (!offerToReject || !firestore) return;
        setIsUpdating(true);
        const investmentRef = doc(firestore, 'investments', offerToReject.id);
        try {
            await updateDocumentNonBlocking(investmentRef, { status: 'rejected-by-business', rejectionReason });
            toast({
                title: `Offer Rejected`,
                description: `You have rejected the investment offer.`,
            });
        } catch (error) {
             toast({ title: "Error", description: "Could not reject the offer.", variant: "destructive" });
        } finally {
            setOfferToReject(null);
            setRejectionReason('');
            setIsUpdating(false);
        }
    };

    const isLoading = isLoadingBusiness || isLoadingSales || isLoadingProfile || isLoadingOffers;

    const getTermsString = (offer: Investment) => {
        if (offer.type === 'Profit Sharing') {
            return `${offer.terms.profitShare}% profit share for ${offer.terms.duration} months`;
        }
        if (offer.type === 'Equity') {
            return `${offer.terms.equity}% equity at a ${formatCurrency(offer.terms.valuation, 'NGN')} valuation`;
        }
        return 'N/A';
    }


    return (
        <MainLayout title="Access Capital" backHref="/owner/home">
            <div className="w-full max-w-5xl space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold font-headline sm:text-4xl">Unlock Your Business's Growth Potential</h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        Busmo analyzes your business health to connect you with capital opportunities. Based on your data, here's what you might be eligible for.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <TrendingUp className="w-6 h-6 text-primary" />
                                <span>Your Business Readiness Score</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-muted-foreground">We automatically calculate an internal score based on your real-time performance. Investors use this as a signal of business health.</p>
                            <ul className="text-sm space-y-2 text-muted-foreground">
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Revenue consistency</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Profit margin health</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Inventory discipline</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Cash flow reliability</li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                <span>Privacy-First & Opt-In</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-muted-foreground">Your detailed business data is never shared. You must explicitly opt-in to show interest in an investment type.</p>
                            <p className="text-muted-foreground">Investors only see summarized metrics and signals, not your raw transaction data. Your privacy is paramount.</p>
                             <Button variant="secondary" disabled>
                                <LockKeyhole className="mr-2 h-4 w-4"/>
                                Manage Data Sharing (Coming Soon)
                             </Button>
                        </CardContent>
                    </Card>
                </div>
                
                {isEligible && !isSeekingInvestment && (
                    <Card className="bg-primary/5 border-primary/20 text-center">
                        <CardHeader>
                            <CardTitle className="text-primary">Congratulations! You're eligible for investment.</CardTitle>
                            <CardDescription>Your consistent data recording has made your business visible to our network of investors.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleOptIn} disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Opt-In to Receive Investment Offers
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {isSeekingInvestment && (
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Handshake className="w-6 h-6 text-primary" />
                                <span>Incoming Investment Offers</span>
                            </CardTitle>
                            <CardDescription>Review, accept, or reject investment intents from potential investors.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Investor</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Terms</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingOffers ? (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
                                    ) : investmentOffers && investmentOffers.length > 0 ? (
                                        investmentOffers.map(offer => (
                                            <TableRow key={offer.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarFallback>{offer.investorName?.split(' ').map(n => n[0]).join('') || '?'}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{offer.investorName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{formatCurrency(offer.amount, 'NGN')}</TableCell>
                                                <TableCell>{getTermsString(offer)}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Button size="sm" onClick={() => setOfferToAccept(offer)} disabled={isUpdating}>Accept</Button>
                                                    <Button size="sm" variant="outline" onClick={() => setOfferToReject(offer)} disabled={isUpdating}>Reject</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                You have no incoming investment offers.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}


                 <div>
                    <h2 className="text-2xl font-bold font-headline text-center mb-6">Your Capital Options</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 font-headline">
                                    <Handshake className="w-7 h-7 text-accent" />
                                    <span>Profit Sharing</span>
                                </CardTitle>
                                <CardDescription>Get a cash injection for growth. Repay with a small percentage of your future profits. Perfect for inventory, marketing, or small equipment.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="border rounded-lg p-4 bg-background">
                                     <p className="text-sm text-muted-foreground font-medium">Sample Offer</p>
                                     <p className="text-3xl font-bold font-headline text-primary">₦150,000</p>
                                     <p className="text-muted-foreground">for a <span className="font-semibold text-foreground">10% share</span> of net profits over <span className="font-semibold text-foreground">12 months</span>.</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" disabled>Learn More & Opt-In (Coming Soon)</Button>
                            </CardFooter>
                        </Card>
                        
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 font-headline">
                                    <Banknote className="w-7 h-7 text-accent" />
                                    <span>Working Capital Loans</span>
                                </CardTitle>
                                <CardDescription>Short-term loans from our partners to manage cash flow or purchase inventory.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="border rounded-lg p-4 bg-background">
                                    <p className="text-sm text-muted-foreground font-medium">Sample Offer</p>
                                    <p className="text-3xl font-bold font-headline text-primary">₦250,000</p>
                                    <p className="text-muted-foreground">with a <span className="font-semibold text-foreground">5% fee</span>, repaid over <span className="font-semibold text-foreground">3 months</span>.</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" disabled>Explore Loan Offers (Coming Soon)</Button>
                            </CardFooter>
                        </Card>

                        <Card className={cn("flex flex-col", !canAccessEquity && "bg-muted/50 border-dashed")}>
                             <CardHeader>
                                <CardTitle className="flex items-center gap-3 font-headline">
                                    <Building2 className="w-7 h-7 text-accent" />
                                    <span>Equity Investment</span>
                                </CardTitle>
                                <CardDescription>For registered companies ready for major growth. Access larger investments from venture partners in exchange for equity.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                               {canAccessEquity ? (
                                    <div className="border rounded-lg p-4 bg-background">
                                         <p className="text-sm text-muted-foreground font-medium">Example Opportunity</p>
                                         <p className="text-2xl font-bold font-headline text-primary">Valuation Estimate: ₦5M - ₦8M</p>
                                         <p className="text-muted-foreground">Access offers for up to <span className="font-semibold text-foreground">20% equity</span> to scale your operations.</p>
                                    </div>
                               ) : (
                                    <div className="text-center p-4 h-full flex flex-col justify-center items-center">
                                        <p className="text-muted-foreground font-medium">This feature is available on the <span className="text-primary font-bold">Company</span> plan.</p>
                                        <Link href="/owner/pricing">
                                            <Button variant="link">Upgrade Your Plan</Button>
                                        </Link>
                                    </div>
                               )}
                            </CardContent>
                            <CardFooter>
                                 <Button className="w-full" disabled>Explore Equity Options (Coming Soon)</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

                <div className="text-center text-muted-foreground text-sm pt-4">
                    <p>Busmo does not guarantee returns and is not a direct lender. We provide trusted data to reduce risk and increase transparency for both businesses and investors.</p>
                     <Link href="/owner/home" passHref>
                        <Button variant="link" className="mt-2">Back to Home</Button>
                    </Link>
                </div>
            </div>

            {/* Dialogs */}
             <Dialog open={!!offerToAccept} onOpenChange={(isOpen) => !isOpen && setOfferToAccept(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Accept Investment Offer?</DialogTitle>
                         <DialogDescription>
                            Review the next steps before confirming your acceptance.
                        </DialogDescription>
                    </DialogHeader>
                    <Alert variant="default" className="bg-primary/5 border-primary/20">
                        <ShieldCheck className="h-4 w-4 !text-primary" />
                        <AlertTitle className="text-primary font-semibold">What Happens Next?</AlertTitle>
                        <AlertDescription>
                            <ol className="list-decimal list-inside space-y-1 mt-2">
                                <li>The investor will be notified of your acceptance.</li>
                                <li>They will be instructed to fund the investment.</li>
                                <li>Once funded, the investment will become 'Active' in your dashboard and performance tracking will begin.</li>
                            </ol>
                        </AlertDescription>
                    </Alert>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOfferToAccept(null)} disabled={isUpdating}>Cancel</Button>
                        <Button onClick={handleAccept} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Acceptance
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!offerToReject} onOpenChange={(isOpen) => !isOpen && setOfferToReject(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Investment Offer?</DialogTitle>
                        <DialogDescription>
                            This will permanently reject the offer from {offerToReject?.investorName}. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="rejection-reason">Reason for Rejection (Optional)</Label>
                        <Textarea 
                            id="rejection-reason"
                            placeholder="e.g., The terms are not favorable, we are pursuing other funding options."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                         <p className="text-xs text-muted-foreground">Providing a reason helps us improve future capital matches.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOfferToReject(null)} disabled={isUpdating}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject Offer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    );
}
