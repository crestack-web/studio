
'use client';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Landmark, Percent, ShieldCheck, Briefcase } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface AppUser {
    businessId?: string;
}

interface Business {
    isSeekingInvestment?: boolean;
    plan?: string;
}

export default function OwnerInvestPage() {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
    const { data: userProfile } = useDoc<AppUser>(userProfileRef);
    const businessId = userProfile?.businessId;

    const businessProfileRef = useMemoFirebase(() => businessId ? doc(firestore, `businessProfiles/${businessId}`) : null, [firestore, businessId]);
    const { data: businessData, isLoading: isLoadingBusiness } = useDoc<Business>(businessProfileRef);
    
    const businessPlanRef = useMemoFirebase(() => businessId ? doc(firestore, `businesses/${businessId}`) : null, [firestore, businessId]);
    const { data: planData } = useDoc<Business>(businessPlanRef);

    const [isSaving, setIsSaving] = useState(false);
    
    const isCompanyPlan = planData?.plan === 'company';

    const handleToggleInvestmentSeeking = async (isSeeking: boolean) => {
        if (!businessProfileRef) return;
        setIsSaving(true);
        try {
            await updateDocumentNonBlocking(businessProfileRef, {
                isSeekingInvestment: isSeeking,
                updatedAt: serverTimestamp()
            });
            toast({
                title: 'Visibility Updated',
                description: isSeeking ? 'Your business is now visible to investors.' : 'Your business is no longer visible to investors.'
            });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update your setting.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <MainLayout title="Access Capital" backHref="/owner/home">
            <div className="w-full max-w-4xl space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>How Investment Works on Busmo</CardTitle>
                        <CardDescription>We help you turn your consistent business data into a track record that investors can trust.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
                            <div>
                                <h4 className="font-semibold">Build Your Track Record</h4>
                                <p className="text-sm text-muted-foreground">Consistently record sales and expenses for at least 3 months. The quality and consistency of your data build a verified financial history that determines your eligibility and potential offer sizes.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
                            <div>
                                <h4 className="font-semibold">Become Visible to Investors</h4>
                                <p className="text-sm text-muted-foreground">Once you're ready, you can make your business profile visible on the Busmo investment marketplace for verified investors to discover.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
                            <div>
                                <h4 className="font-semibold">Receive & Accept Offers</h4>
                                <p className="text-sm text-muted-foreground">Investors can make offers directly through the platform. You review and accept the terms that work for you.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5 text-primary" /> Profit Sharing</CardTitle>
                            <CardDescription>Get capital now in exchange for a percentage of your future profits for a set period.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0"/> Keep 100% ownership of your business.</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0"/> Flexible repayments that grow with your sales.</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0"/> Attracts investors looking for steady returns.</li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" /> Business Loans</CardTitle>
                             <CardDescription>Traditional loans with fixed repayment schedules, backed by your business performance data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0"/> Predictable, fixed monthly repayments.</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0"/> Your Busmo data acts as your credit history.</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0"/> Coming soon to the platform.</li>
                            </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Equity Investment</CardTitle>
                            <CardDescription>Sell a percentage of your business to investors for a larger capital injection.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm mb-4">
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0"/> Raise significant capital for major expansion.</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0"/> Bring on partners with valuable experience.</li>
                                <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0"/> Suitable for high-growth potential businesses.</li>
                            </ul>
                             <Alert>
                                <AlertTitle>Company Plan Required</AlertTitle>
                                <AlertDescription>
                                    This funding option is available exclusively for businesses on the Company plan.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </div>
                
                 <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-xl font-semibold font-headline text-center">See What's Possible</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Sample: Profit Sharing Offer</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Investment Amount</span>
                                    <span className="font-bold">₦500,000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Profit Share</span>
                                    <span className="font-bold">15%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span className="font-bold">18 months</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Sample: Equity Offer</CardTitle>
                            </CardHeader>
                             <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Investment Amount</span>
                                    <span className="font-bold">₦2,000,000</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Equity Offered</span>
                                    <span className="font-bold">10%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Post-Money Valuation</span>
                                    <span className="font-bold">₦20,000,000</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {!isCompanyPlan && (
                    <Alert variant="destructive">
                        <AlertTitle>Upgrade to Receive Offers</AlertTitle>
                        <AlertDescription>
                            Receiving and managing investment offers requires a <strong>Company</strong> plan. Your data is still being recorded to build your track record.
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Investor Visibility</CardTitle>
                        <CardDescription>Allow verified investors to see your business profile and performance metrics.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="investor-visibility" 
                                checked={!!businessData?.isSeekingInvestment} 
                                onCheckedChange={handleToggleInvestmentSeeking}
                                disabled={!isCompanyPlan || isSaving}
                            />
                            <Label htmlFor="investor-visibility" className="font-medium">
                                {isSaving ? <Loader2 className="animate-spin" /> : 'My business is open to investment offers'}
                            </Label>
                        </div>
                         {!isCompanyPlan && (
                            <p className="text-xs text-muted-foreground mt-2">You must be on the Company plan to enable this feature.</p>
                        )}
                    </CardContent>
                </Card>

            </div>
        </MainLayout>
    );
}
