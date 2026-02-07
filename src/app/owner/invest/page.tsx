
'use client';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Landmark, Percent, Briefcase, Sparkles, LineChart, ClipboardList, ShieldCheck } from 'lucide-react';
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
            <div className="w-full max-w-5xl space-y-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <CardTitle className="text-2xl sm:text-3xl">Access Capital with Verified Business Data</CardTitle>
                                <CardDescription className="text-base">
                                    Busmo helps you turn day‑to‑day operations into an investor‑ready track record — sales, expenses, inventory, and fulfillment.
                                </CardDescription>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                                <Sparkles className="h-5 w-5" />
                                <span className="text-sm">Data → Trust → Funding</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4 text-primary" /> Build a Track Record</div>
                                <p className="mt-1 text-sm text-muted-foreground">Keep your sales and expenses up to date. Consistency matters more than perfection.</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 font-semibold"><LineChart className="h-4 w-4 text-primary" /> Show Real Performance</div>
                                <p className="mt-1 text-sm text-muted-foreground">Investors look for stable revenue, healthy margins, and a clear operating rhythm.</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Receive Offers Safely</div>
                                <p className="mt-1 text-sm text-muted-foreground">Only businesses that opt‑in are visible. You stay in control of your visibility.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold font-headline">How it works</h3>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="flex items-start gap-3 rounded-lg border p-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
                                    <div>
                                        <h4 className="font-semibold">Record your operations</h4>
                                        <p className="text-sm text-muted-foreground">Track sales, expenses, inventory movement, and order fulfillment for at least 3 months.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg border p-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
                                    <div>
                                        <h4 className="font-semibold">Opt‑in to investor visibility</h4>
                                        <p className="text-sm text-muted-foreground">When you’re ready, you can make your profile discoverable in the investor marketplace.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg border p-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
                                    <div>
                                        <h4 className="font-semibold">Review and accept offers</h4>
                                        <p className="text-sm text-muted-foreground">Investors can submit offers. You choose what works for your business goals and timeline.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5 text-primary" /> Profit Sharing</CardTitle>
                            <CardDescription>Get capital now in exchange for a percentage of future profits for a defined period.</CardDescription>
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

                <Card>
                    <CardHeader>
                        <CardTitle>What investors typically look at</CardTitle>
                        <CardDescription>These are common signals of a well‑run business. Keep them updated in Busmo for a stronger profile.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-lg border p-4">
                                <div className="font-semibold">Revenue consistency</div>
                                <p className="mt-1 text-sm text-muted-foreground">Stable weekly/monthly sales and repeat customers show predictability.</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="font-semibold">Profitability and margins</div>
                                <p className="mt-1 text-sm text-muted-foreground">Healthy gross margin and controlled operating expenses increase confidence.</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="font-semibold">Cash discipline</div>
                                <p className="mt-1 text-sm text-muted-foreground">Clear expense categories and steady cash flow reduce risk.</p>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="font-semibold">Inventory and fulfillment</div>
                                <p className="mt-1 text-sm text-muted-foreground">Fast turnover, low stockouts, and consistent fulfillment show operational strength.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
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
                        <CardDescription>When enabled, verified investors can discover your profile and key performance metrics.</CardDescription>
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

                <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                        Busmo does not guarantee funding. Your visibility and the offers you receive depend on your data quality, business performance, and investor interest.
                    </AlertDescription>
                </Alert>

            </div>
        </MainLayout>
    );
}
