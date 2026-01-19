'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InvestorLayout from '@/components/app/investor-layout';
import { BarChart, Percent, TrendingUp, ShieldCheck, Package, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface ProfitSharingOffer {
    type: 'Profit Sharing';
    ask: string;
    offer: string;
    duration: string;
}

interface EquityOffer {
    type: 'Equity';
    ask: string;
    offer: string;
    valuation: string;
}

type InvestmentOffer = ProfitSharingOffer | EquityOffer;

interface BusinessProfile {
    id: string;
    name: string;
    description: string;
    industry: string;
    location: string;
    data: {
        revenueRange: string;
        grossMargin: string;
        cashFlow: string;
        inventoryHealth: string;
        readinessScore: number;
        forecast: string;
    };
    investmentOffer: InvestmentOffer;
}

const mockBusinesses: BusinessProfile[] = [
    {
      id: 'biz1',
      name: 'Aisha\'s Crafts',
      description: 'Beautifully handcrafted leather goods and accessories, made with love in Lagos.',
      industry: 'Fashion & Apparel',
      location: 'Lagos, Nigeria',
      data: {
        revenueRange: '₦1.2M - ₦1.8M (Annual)',
        grossMargin: '45% - 55%',
        cashFlow: 'Stable & Consistent',
        inventoryHealth: 'Excellent',
        readinessScore: 85,
        forecast: 'Projected to grow 20% in the next quarter based on sales velocity.',
      },
      investmentOffer: {
        type: 'Profit Sharing',
        ask: '₦500,000 Investment',
        offer: '15% Profit Share',
        duration: '18 Month Term',
      },
    },
    {
      id: 'biz2',
      name: 'Femi\'s Farm',
      description: 'Fresh, organic produce delivered directly from our farm. Supporting sustainable agriculture in Ibadan.',
      industry: 'Agriculture',
      location: 'Ibadan, Nigeria',
      data: {
        revenueRange: '₦800K - ₦1.5M (Annual)',
        grossMargin: '60% - 70%',
        cashFlow: 'Seasonal but Reliable',
        inventoryHealth: 'Good',
        readinessScore: 78,
        forecast: 'Expecting a 30% increase in yield next harvest season.',
      },
      investmentOffer: {
        type: 'Profit Sharing',
        ask: '₦300,000 Investment',
        offer: '20% Profit Share',
        duration: '12 Month Term',
      },
    },
    {
      id: 'biz3',
      name: 'City Electronics Inc.',
      description: 'A leading distributor of consumer electronics, with a strong retail presence in Abuja and plans for nationwide expansion.',
      industry: 'Electronics & Retail',
      location: 'Abuja, Nigeria',
      data: {
        revenueRange: '₦25M - ₦40M (Annual)',
        grossMargin: '15% - 20%',
        cashFlow: 'Very Strong',
        inventoryHealth: 'Good',
        readinessScore: 92,
        forecast: 'Projecting 40% growth year-over-year with expansion capital.',
      },
      investmentOffer: {
        type: 'Equity',
        ask: '₦10,000,000 Investment',
        offer: 'For 12% Equity',
        valuation: '₦83M Valuation',
      },
    },
    {
      id: 'biz4',
      name: 'Mama\'s Kitchen',
      description: 'Authentic Nigerian cuisine, serving the Kano community for over 10 years. Known for our delicious jollof rice and suya.',
      industry: 'Food & Beverage',
      location: 'Kano, Nigeria',
      data: {
        revenueRange: '₦3M - ₦5M (Annual)',
        grossMargin: '35% - 45%',
        cashFlow: 'Very Consistent',
        inventoryHealth: 'Excellent',
        readinessScore: 88,
        forecast: 'Forecasting steady 15% annual growth.',
      },
      investmentOffer: {
        type: 'Profit Sharing',
        ask: '₦750,000 Investment',
        offer: '10% Profit Share',
        duration: '24 Month Term',
      },
    }
];

const DataPoint = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-start gap-4">
        <Icon className="w-6 h-6 text-primary mt-1" />
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-semibold text-lg">{value}</p>
        </div>
    </div>
);

export default function BusinessProfilePage({ params }: { params: { businessId: string } }) {
    const business = mockBusinesses.find(b => b.id === params.businessId);
    const { toast } = useToast();

    if (!business) {
        return (
            <InvestorLayout>
                <div className="container mx-auto px-4 py-12 sm:py-16 text-center">
                    <h1 className="text-4xl font-bold font-headline">Business Not Found</h1>
                    <p className="text-lg text-muted-foreground mt-2">The requested business profile could not be located.</p>
                    <Link href="/invest">
                        <Button className="mt-6">Back to Opportunities</Button>
                    </Link>
                </div>
            </InvestorLayout>
        );
    }

    const handleExpressInterest = () => {
        toast({
            title: "Interest Expressed!",
            description: `Your interest in ${business?.name} has been noted. The business owner will be notified.`,
        });
    };

    return (
        <InvestorLayout>
            <div className="container mx-auto px-4 py-12 sm:py-16">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-bold font-headline">{business.name}</h1>
                        <p className="text-lg text-muted-foreground mt-1">{business.industry} in {business.location}</p>
                        <p className="mt-4 max-w-3xl">{business.description}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="md:col-span-2 space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Data-Backed Business Signals</CardTitle>
                                    <CardDescription>These metrics are derived directly from real-time business activity on Busmo.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid sm:grid-cols-2 gap-8">
                                    <DataPoint icon={BarChart} label="Annual Revenue Range" value={business.data.revenueRange} />
                                    <DataPoint icon={Percent} label="Gross Margin" value={business.data.grossMargin} />
                                    <DataPoint icon={Banknote} label="Cash Flow Stability" value={business.data.cashFlow} />
                                    <DataPoint icon={Package} label="Inventory Health" value={business.data.inventoryHealth} />
                                    <div className="sm:col-span-2">
                                        <DataPoint icon={TrendingUp} label="Analyst Forecast" value={business.data.forecast} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Alert variant="default" className="bg-primary/5 border-primary/20">
                                <ShieldCheck className="h-4 w-4 !text-primary" />
                                <AlertTitle className="text-primary font-semibold">A Note on Trust & Transparency</AlertTitle>
                                <AlertDescription>
                                    Busmo provides trusted operational data to reduce risk and increase transparency for both businesses and investors. This data is a signal of health, not a guarantee of future returns. All investments carry risk.
                                </AlertDescription>
                            </Alert>
                        </div>
                        
                        {/* Sidebar */}
                        <div className="space-y-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Business Readiness</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-center">
                                    <div className="relative h-24 w-24 mx-auto">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                className="text-muted/20"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                            />
                                            <path
                                                className="text-success"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeDasharray={`${business.data.readinessScore}, 100`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold">{business.data.readinessScore}</span>
                                            <span className="text-xs text-muted-foreground -mt-1">/ 100</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">This score reflects revenue consistency, profit margins, and inventory discipline.</p>
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-accent shadow-accent/10 shadow-lg">
                                <CardHeader>
                                    <CardTitle>Investment Offer</CardTitle>
                                    <CardDescription>{business.investmentOffer.type}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center border-b pb-4">
                                        <p className="text-sm text-muted-foreground">Seeking</p>
                                        <p className="text-3xl font-bold text-primary">{business.investmentOffer.ask}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground">Offering</p>
                                        <p className="font-semibold text-lg">{business.investmentOffer.offer}</p>
                                        {business.investmentOffer.type === 'Profit Sharing' ? (
                                            <p className="text-xs text-muted-foreground">over a {business.investmentOffer.duration}</p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">at a {business.investmentOffer.valuation}</p>
                                        )}
                                    </div>
                                </CardContent>
                                <div className="p-4 pt-0">
                                    <Button className="w-full h-12 text-lg" onClick={handleExpressInterest}>Express Interest</Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </InvestorLayout>
    );
}
