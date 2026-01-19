'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, MousePointer2, Handshake, User, ShieldCheck, Briefcase, DollarSign, ArrowUpRight } from 'lucide-react';
import { Logo } from './logo';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type View =
  | 'investor_list'
  | 'investor_profile'
  | 'investor_commit_dialog'
  | 'owner_dashboard'
  | 'investor_dashboard_pending'
  | 'investor_fund_dialog'
  | 'investor_dashboard_active';

type Persona = 'investor' | 'owner';

const InvestorHeader = () => (
    <>
        <span className="text-xs font-medium">For Investors</span>
        <Button size="xs" variant="ghost">Log In</Button>
    </>
);

const OwnerHeader = () => (
    <>
        <div className="text-right">
            <div className="font-semibold text-sm">Aisha's Crafts</div>
            <div className="text-xs text-muted-foreground">Owner</div>
        </div>
        <Avatar className="h-7 w-7">
            <AvatarFallback>AC</AvatarFallback>
        </Avatar>
    </>
);

const InvestorDashboardHeader = () => (
    <>
        <div className="text-right">
            <div className="font-semibold text-sm">Tunde Oladipo</div>
            <div className="text-xs text-muted-foreground">Investor</div>
        </div>
        <Avatar className="h-7 w-7">
            <AvatarFallback>TO</AvatarFallback>
        </Avatar>
    </>
);


export function InvestorMockup() {
    const [view, setView] = useState<View>('investor_list');
    const [persona, setPersona] = useState<Persona>('investor');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [cursorPosition, setCursorPosition] = useState({ top: -100, left: -100 });
    const [isClicking, setIsClicking] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const elementsRef = useRef<{ [key: string]: HTMLElement | null }>({});

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let timeouts: NodeJS.Timeout[] = [];
        const clearTimeouts = () => {
            timeouts.forEach(clearTimeout);
            timeouts = [];
        }

        const animateStep = async (step: Function) => {
            return new Promise(resolve => {
                timeouts.push(setTimeout(() => {
                    step();
                    resolve(true);
                }, 0));
            });
        }
        
        const moveCursorTo = (elementKey: string, duration = 1000) => {
            return new Promise(resolve => {
                 const element = elementsRef.current[elementKey];
                 if (!element || !container) return resolve(false);
                 const containerRect = container.getBoundingClientRect();
                 const elemRect = element.getBoundingClientRect();
                 setCursorPosition({
                     top: elemRect.top - containerRect.top + elemRect.height / 2,
                     left: elemRect.left - containerRect.left + elemRect.width / 2,
                 });
                 timeouts.push(setTimeout(resolve, duration));
            });
        }

        const click = (duration = 400) => {
             return new Promise(resolve => {
                setIsClicking(true);
                timeouts.push(setTimeout(() => {
                    setIsClicking(false);
                    resolve(true);
                }, duration));
            });
        }

        const changeView = (newView: View, newPersona: Persona | null = null) => {
             return new Promise(resolve => {
                setIsTransitioning(true);
                timeouts.push(setTimeout(() => {
                    setView(newView);
                    if (newPersona) setPersona(newPersona);
                    setIsTransitioning(false);
                    resolve(true);
                }, 600));
            });
        }
        
        const animationSequence = async () => {
            // 1. Start on investor list
            await animateStep(() => setView('investor_list'));
            await moveCursorTo('opportunityCard');
            
            // 2. Click to view profile
            await click();
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 500)));
            await changeView('investor_profile');

            // 3. Commit to invest
            await moveCursorTo('commitBtn');
            await click();
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 500)));
            await changeView('investor_commit_dialog');

            // 4. Submit intent
            await moveCursorTo('submitIntentBtn');
            await click();
            
            // 5. Switch to owner view
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 500)));
            await changeView('owner_dashboard', 'owner');
            
            // 6. Owner accepts
            await moveCursorTo('acceptBtn');
            await click();

            // 7. Switch to investor dashboard (pending)
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 500)));
            await changeView('investor_dashboard_pending', 'investor');
            
            // 8. Investor funds
            await moveCursorTo('fundBtn');
            await click();
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 500)));
            await changeView('investor_fund_dialog');
            
            // 9. Investor confirms funding
            await moveCursorTo('confirmFundBtn');
            await click();

            // 10. Show active investment
            await new Promise(resolve => timeouts.push(setTimeout(resolve, 500)));
            await changeView('investor_dashboard_active');

            // 11. Reset
            timeouts.push(setTimeout(animationSequence, 5000));
        };

        timeouts.push(setTimeout(animationSequence, 3000));
        return clearTimeouts;

    }, []);

    const renderHeader = () => {
        if (view === 'owner_dashboard') return <OwnerHeader />;
        if (view.startsWith('investor_dashboard')) return <InvestorDashboardHeader />;
        return <InvestorHeader />;
    };

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
                   {renderHeader()}
                </div>
            </header>

            {/* Content */}
            <main className="p-4 overflow-hidden bg-muted/20 h-full relative">
                <div className={cn("absolute inset-4 space-y-4 transition-all duration-300", !isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none')}>
                    
                    {/* Investor List */}
                    {view === 'investor_list' && (
                        <div>
                            <h2 className="text-base font-bold font-headline mb-3">Profit-Sharing Opportunities</h2>
                            <div ref={el => elementsRef.current['opportunityCard'] = el}>
                                <Card className="hover:border-primary transition-colors">
                                    <CardHeader className="p-3">
                                        <CardTitle className="text-sm">Aisha's Crafts</CardTitle>
                                        <CardDescription className="text-xs">Fashion &bull; Lagos, NG</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0 flex items-center justify-end text-xs font-semibold text-primary">
                                        View Details <ChevronRight className="w-3 h-3 ml-1" />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                    
                    {/* Investor Profile */}
                    {view === 'investor_profile' && (
                        <div>
                             <h1 className="text-base font-bold font-headline">Aisha's Crafts</h1>
                             <p className="text-xs text-muted-foreground -mt-1 mb-3">Lagos, Nigeria</p>
                             <div className="grid grid-cols-2 gap-2">
                                <Card className="text-center"><CardHeader className="p-2 pb-0"><CardTitle className="text-xl">85</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p className="text-xs text-muted-foreground">Readiness</p></CardContent></Card>
                                <Card className="text-center bg-primary/5 border-primary/20"><CardHeader className="p-2 pb-0"><CardTitle className="text-lg">₦500k</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p className="text-xs text-muted-foreground">Ask</p></CardContent></Card>
                             </div>
                             <p className="text-xs text-muted-foreground text-center my-2">Offering 15% Profit Share over 18 Months</p>
                             <Button ref={el => elementsRef.current['commitBtn'] = el} className="w-full h-9">Commit to Invest</Button>
                        </div>
                    )}

                     {/* Investor Commit Dialog */}
                    {view === 'investor_commit_dialog' && (
                        <Card className="flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="text-base">Confirm Investment Intent</CardTitle>
                                <CardDescription className="text-xs">Review the offer before submitting.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-3">
                                 <div className="text-xs space-y-1 rounded-md border p-2">
                                     <h4 className="font-semibold mb-1 text-center">Offer Summary</h4>
                                     <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">₦500,000</span></div>
                                     <div className="flex justify-between"><span className="text-muted-foreground">Offer</span><span className="font-semibold">15% Profit Share</span></div>
                                     <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-semibold">18 Months</span></div>
                                </div>
                                <div className="text-xs text-destructive/80 p-2 bg-destructive/5 rounded-md flex items-start gap-2">
                                    <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0"/>
                                    <span>Busmo provides data signals but does not guarantee returns. All investments carry risk.</span>
                                </div>
                            </CardContent>
                            <div className="p-4 pt-0">
                                <Button ref={el => elementsRef.current['submitIntentBtn'] = el} className="w-full h-9">Submit Investment Intent</Button>
                            </div>
                        </Card>
                    )}

                    {/* Owner Dashboard */}
                    {view === 'owner_dashboard' && (
                        <div>
                            <CardHeader className="p-0 mb-2">
                                <CardTitle className="text-base flex items-center gap-2"><Handshake className="w-4 h-4 text-primary" /> Incoming Investment Offers</CardTitle>
                            </CardHeader>
                            <Card>
                               <Table>
                                 <TableHeader>
                                    <TableRow><TableHead className="h-8 text-xs">Investor</TableHead><TableHead className="h-8 text-xs">Terms</TableHead><TableHead className="h-8 text-xs text-right">Actions</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="p-2 text-xs font-medium">Tunde Oladipo</TableCell>
                                        <TableCell className="p-2 text-xs">₦500k for 15%</TableCell>
                                        <TableCell className="p-2 text-right">
                                            <Button ref={el => elementsRef.current['acceptBtn'] = el} size="xs" className="h-6">Accept</Button>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                               </Table>
                            </Card>
                        </div>
                    )}

                    {/* Investor Dashboard Pending */}
                    {(view === 'investor_dashboard_pending' || view === 'investor_dashboard_active') && (
                        <div>
                             <div className="grid grid-cols-3 gap-2 mb-3">
                                <Card><CardHeader className="p-2"><CardTitle className="text-xs flex items-center gap-1"><DollarSign className="w-3 h-3"/>Total Invested</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p className="font-bold text-base">₦0</p></CardContent></Card>
                                <Card><CardHeader className="p-2"><CardTitle className="text-xs flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/>Returns</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p className="font-bold text-base">₦0</p></CardContent></Card>
                                <Card><CardHeader className="p-2"><CardTitle className="text-xs flex items-center gap-1"><Briefcase className="w-3 h-3"/>Active</CardTitle></CardHeader><CardContent className="p-2 pt-0"><p className="font-bold text-base">0</p></CardContent></Card>
                            </div>
                            <CardHeader className="p-0 mb-2"><CardTitle className="text-base">My Portfolio</CardTitle></CardHeader>
                             <Card>
                               <Table>
                                 <TableHeader>
                                    <TableRow><TableHead className="h-8 text-xs">Business</TableHead><TableHead className="h-8 text-xs">Status</TableHead><TableHead className="h-8 text-xs text-right">Action</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="p-2 text-xs font-medium">Aisha's Crafts</TableCell>
                                        <TableCell className="p-2 text-xs">
                                             {view === 'investor_dashboard_active' ? (
                                                <Badge variant="default" className="text-xs">Active</Badge>
                                             ) : (
                                                <Badge variant="destructive" className="text-xs">Pending Funding</Badge>
                                             )}
                                        </TableCell>
                                        <TableCell className="p-2 text-right">
                                            {view === 'investor_dashboard_pending' && (
                                                <Button ref={el => elementsRef.current['fundBtn'] = el} size="xs" className="h-6">Fund Investment</Button>
                                            )}
                                             {view === 'investor_dashboard_active' && (
                                                <Button size="xs" variant="outline" className="h-6">View</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                               </Table>
                            </Card>
                        </div>
                    )}
                    
                    {/* Investor Fund Dialog */}
                    {view === 'investor_fund_dialog' && (
                        <Card className="flex flex-col h-full">
                            <CardHeader>
                                <CardTitle className="text-base">Confirm Funding</CardTitle>
                                <CardDescription className="text-xs">You are marking the investment in Aisha's Crafts as funded.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md space-y-1">
                                    <p className="font-semibold flex items-center gap-1 text-foreground"><ShieldCheck className="w-3 h-3 text-primary"/> Important</p>
                                    <p>By clicking "Confirm", you are confirming that you have sent the funds to the business owner directly.</p>
                                </div>
                            </CardContent>
                             <div className="p-4 pt-0">
                                <Button ref={el => elementsRef.current['confirmFundBtn'] = el} className="w-full h-9">Confirm, I've Sent the Funds</Button>
                            </div>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
