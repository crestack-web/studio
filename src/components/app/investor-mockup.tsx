'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Percent, TrendingUp, Handshake, ChevronRight, MousePointer2 } from 'lucide-react';
import { Logo } from './logo';

const mockOpportunities = [
  { id: 'biz1', name: 'Aisha\'s Crafts', industry: 'Fashion', location: 'Lagos, NG' },
  { id: 'biz2', name: 'Femi\'s Farm', industry: 'Agriculture', location: 'Ibadan, NG' },
];

const mockProfile = {
  id: 'biz1',
  name: 'Aisha\'s Crafts',
  industry: 'Fashion & Apparel',
  data: {
    readinessScore: 85,
    revenueRange: '₦1.2M - ₦1.8M',
    grossMargin: '45% - 55%',
  },
  investmentOffer: {
    ask: '₦500,000',
    offer: '15% Profit Share',
  },
};


export function InvestorMockup() {
    const [view, setView] = useState<'list' | 'profile'>('list');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ top: -100, left: -100 });
    const [isClicking, setIsClicking] = useState(false);
    const [highlightedMetric, setHighlightedMetric] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const opportunityCardRef = useRef<HTMLDivElement>(null);
    const scoreRef = useRef<HTMLDivElement>(null);
    const revenueRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let timeouts: NodeJS.Timeout[] = [];
        const clearTimeouts = () => {
            timeouts.forEach(clearTimeout);
            timeouts = [];
        }

        const animate = () => {
            const opportunityCard = opportunityCardRef.current;
            const scoreEl = scoreRef.current;
            const revenueEl = revenueRef.current;

            if (view === 'list' && !opportunityCard) {
                timeouts.push(setTimeout(animate, 100));
                return;
            }
            
            if (view === 'profile' && (!scoreEl || !revenueEl)) {
                // This can happen during the brief period the profile view is rendering
                timeouts.push(setTimeout(animate, 100));
                return;
            }
            
            const containerRect = container.getBoundingClientRect();
            
            // Step 1: Move cursor to opportunity card
            const cardRect = opportunityCard!.getBoundingClientRect();
            let targetTop = cardRect.top - containerRect.top + cardRect.height / 2;
            let targetLeft = cardRect.left - containerRect.left + cardRect.width / 2;

            setCursorPosition({ top: targetTop, left: targetLeft });

            timeouts.push(setTimeout(() => {
                // Step 2: Simulate click and transition to profile
                setIsClicking(true);
                timeouts.push(setTimeout(() => {
                    setIsTransitioning(true);
                    setView('profile');
                    setIsClicking(false);
                    timeouts.push(setTimeout(() => setIsTransitioning(false), 500));

                    // Step 3: Hover over metrics on profile view
                    timeouts.push(setTimeout(() => {
                         if (!scoreRef.current || !revenueRef.current) return;
                        const scoreRect = scoreRef.current.getBoundingClientRect();
                        const revenueRect = revenueRef.current.getBoundingClientRect();
                        
                        // Move to score
                        setCursorPosition({
                            top: scoreRect.top - containerRect.top + scoreRect.height / 2,
                            left: scoreRect.left - containerRect.left + scoreRect.width / 2,
                        });
                        setHighlightedMetric('score');

                        // Move to revenue
                        timeouts.push(setTimeout(() => {
                            setCursorPosition({
                                top: revenueRect.top - containerRect.top + revenueRect.height / 2,
                                left: revenueRect.left - containerRect.left + revenueRect.width / 2,
                            });
                             setHighlightedMetric('revenue');

                            // Step 4: Reset
                            timeouts.push(setTimeout(() => {
                                setIsTransitioning(true);
                                setView('list');
                                setHighlightedMetric(null);
                                timeouts.push(setTimeout(() => {
                                    setIsTransitioning(false);
                                    timeouts.push(setTimeout(animate, 1000));
                                }, 500));
                            }, 3000));
                        }, 2500));
                    }, 1000));
                }, 200));
            }, 1500));
        };

        timeouts.push(setTimeout(animate, 2000));
        return clearTimeouts;
    }, [view]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-background rounded-xl overflow-hidden shadow-2xl border-8 border-foreground/10">
            <MousePointer2
                style={{
                    top: cursorPosition.top,
                    left: cursorPosition.left,
                    opacity: isTransitioning ? 0 : 1,
                    transform: `scale(${isClicking ? 0.9 : 1}) rotate(-15deg)`,
                }}
                className="absolute text-foreground transition-all duration-500 ease-in-out z-50 pointer-events-none h-5 w-5 -translate-x-1 -translate-y-1"
            />
            {/* Header */}
            <header className="p-3 bg-card/80 border-b flex items-center justify-between">
                <Logo className="h-6 text-xl" />
                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium">For Investors</span>
                    <Button size="xs" variant="ghost">Log In</Button>
                </div>
            </header>

            {/* Content */}
            <main className="p-4 overflow-hidden bg-muted/20 h-full relative">
                {/* List View */}
                 <div className={cn("absolute inset-4 space-y-4 transition-opacity duration-300", view === 'list' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                    <h2 className="text-lg font-bold font-headline">Profit-Sharing Opportunities</h2>
                    {mockOpportunities.map((biz, index) => (
                        <div ref={index === 0 ? opportunityCardRef : null} key={biz.id}>
                            <Card className="hover:border-primary transition-colors">
                                <CardHeader className="p-3">
                                    <CardTitle className="text-base">{biz.name}</CardTitle>
                                    <CardDescription className="text-xs">{biz.industry} &bull; {biz.location}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-3 pt-0 flex items-center justify-end text-xs font-semibold text-primary">
                                    View Details <ChevronRight className="w-3 h-3 ml-1" />
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>

                {/* Profile View */}
                <div className={cn("absolute inset-4 space-y-4 transition-opacity duration-300", view === 'profile' && !isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                    <h1 className="text-lg font-bold font-headline">{mockProfile.name}</h1>
                    <p className="text-sm text-muted-foreground -mt-3">{mockProfile.industry}</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                         <Card ref={scoreRef} className={cn("text-center transition-all duration-300", highlightedMetric === 'score' ? 'border-primary ring-2 ring-primary' : '')}>
                            <CardHeader className="p-2 pb-0">
                                <CardTitle className="text-2xl font-bold">{mockProfile.data.readinessScore}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 pt-0">
                                <p className="text-xs text-muted-foreground">Readiness Score</p>
                            </CardContent>
                        </Card>
                         <Card className="text-center">
                            <CardHeader className="p-2 pb-0">
                                <CardTitle className="text-xl font-bold">{mockProfile.investmentOffer.ask}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 pt-0">
                                <p className="text-xs text-muted-foreground">Seeking Investment</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                         <CardHeader className="p-3">
                            <CardTitle className="text-sm">Data-Backed Signals</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-3">
                             <div ref={revenueRef} className={cn("flex items-center gap-3 transition-colors duration-300 p-2 -m-2 rounded-md", highlightedMetric === 'revenue' ? 'bg-primary/10' : '')}>
                                <BarChart className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Annual Revenue</p>
                                    <p className="font-semibold text-sm">{mockProfile.data.revenueRange}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-3">
                                <Percent className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Gross Margin</p>
                                    <p className="font-semibold text-sm">{mockProfile.data.grossMargin}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
