
'use client';

import { useState, type FormEvent } from 'react';
import MarketLayout from '@/components/app/market-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bike, Box, CheckCircle, MapPin, PackageSearch, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';

const deliveryRates = [
    { city: 'Lagos', rate: '₦2,000 - ₦3,500' },
    { city: 'Abuja', rate: '₦2,500 - ₦4,000' },
    { city: 'Accra', rate: 'GH₵30 - GH₵50' },
    { city: 'Niamey', rate: '1,500 CFA - 2,500 CFA' },
    { city: 'Douala', rate: '1,500 CFA - 2,500 CFA' },
];

const howItWorksSteps = [
    { icon: PackageSearch, title: 'Order is Placed', description: "A customer buys your product from the Busmo Market and selects Home Delivery." },
    { icon: Bike, title: 'Rider Dispatched', description: "Our system automatically finds and dispatches the nearest verified delivery partner to your location for pickup." },
    { icon: Box, title: 'Secure Handover', description: "Our rider securely packages the item and begins the delivery journey." },
    { icon: MapPin, title: 'Real-Time Tracking', description: "You and your customer can track the delivery in real-time until it's safely delivered." },
];

export default function DeliveryPage() {
    const { toast } = useToast();
    const firestore = useFirestore();

    // Rider Dialog State
    const [isRiderDialogOpen, setIsRiderDialogOpen] = useState(false);
    const [riderName, setRiderName] = useState('');
    const [riderPhone, setRiderPhone] = useState('');
    const [riderAddress, setRiderAddress] = useState('');
    const [isSubmittingRider, setIsSubmittingRider] = useState(false);

    // Guarantor Dialog State
    const [isGuarantorDialogOpen, setIsGuarantorDialogOpen] = useState(false);
    const [guarantorName, setGuarantorName] = useState('');
    const [guarantorPhone, setGuarantorPhone] = useState('');
    const [guarantorAddress, setGuarantorAddress] = useState('');
    const [guaranteedRiderName, setGuaranteedRiderName] = useState('');
    const [guaranteedRiderPhone, setGuaranteedRiderPhone] = useState('');
    const [relationship, setRelationship] = useState('');
    const [isSubmittingGuarantor, setIsSubmittingGuarantor] = useState(false);

    const handleApplyForRider = async (e: FormEvent) => {
        e.preventDefault();
        if (!riderName || !riderPhone || !riderAddress) {
            toast({ title: 'Please fill all fields', variant: 'destructive' });
            return;
        }
        if (!firestore) return;

        setIsSubmittingRider(true);
        try {
            await addDocumentNonBlocking(collection(firestore, 'riderApplications'), {
                name: riderName,
                phone: riderPhone,
                address: riderAddress,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Application Submitted!', description: 'We will review your application and contact you soon.' });
            setIsRiderDialogOpen(false);
            setRiderName('');
            setRiderPhone('');
            setRiderAddress('');
        } catch (error) {
            toast({ title: 'Submission failed', description: 'Please try again.', variant: 'destructive' });
        } finally {
            setIsSubmittingRider(false);
        }
    };

     const handleApplyForGuarantor = async (e: FormEvent) => {
        e.preventDefault();
        if (!guarantorName || !guarantorPhone || !guaranteedRiderName || !guaranteedRiderPhone) {
            toast({ title: 'Please fill all required fields', variant: 'destructive' });
            return;
        }
        if (!firestore) return;

        setIsSubmittingGuarantor(true);
        try {
            await addDocumentNonBlocking(collection(firestore, 'guarantorApplications'), {
                guarantorName,
                guarantorPhone,
                guarantorAddress,
                riderName: guaranteedRiderName,
                riderPhone: guaranteedRiderPhone,
                relationship,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Application Submitted!', description: 'Thank you for supporting your community. We will be in touch.' });
            setIsGuarantorDialogOpen(false);
            setGuarantorName('');
            setGuarantorPhone('');
            setGuarantorAddress('');
            setGuaranteedRiderName('');
            setGuaranteedRiderPhone('');
            setRelationship('');
        } catch (error) {
            toast({ title: 'Submission failed', description: 'Please try again.', variant: 'destructive' });
        } finally {
            setIsSubmittingGuarantor(false);
        }
    };


    return (
        <MarketLayout>
            <div className="w-full max-w-5xl space-y-16">
                {/* Hero Section */}
                <section className="text-center">
                    <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-full inline-block">
                             <Bike className="w-12 h-12 text-primary" />
                        </div>
                    </div>
                    <h1 className="mt-4 text-4xl font-bold tracking-tight font-headline sm:text-5xl">
                        Fast, Affordable, and Reliable Delivery
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
                        Busmo partners with a network of local delivery riders to get your products to customers quickly and safely, so you can focus on selling.
                    </p>
                    <Button asChild size="lg" className="mt-8">
                        <Link href="/signup">Start Selling with Busmo Delivery</Link>
                    </Button>
                </section>

                {/* How It Works Section */}
                <section>
                    <h2 className="text-3xl font-bold font-headline text-center mb-12">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {howItWorksSteps.map((step, index) => (
                             <div key={index} className="flex flex-col items-center text-center">
                                <div className="p-3 bg-card border rounded-full mb-4">
                                    <step.icon className="w-8 h-8 text-accent" />
                                </div>
                                <h3 className="font-semibold">{step.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Rate Card & Coverage Section */}
                <section className="grid md:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Delivery Rate Card</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm mb-4">Sample rates for intra-city delivery. Final rates are based on distance.</p>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>City</TableHead>
                                        <TableHead className="text-right">Average Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deliveryRates.map(item => (
                                        <TableRow key={item.city}>
                                            <TableCell className="font-medium">{item.city}</TableCell>
                                            <TableCell className="text-right">{item.rate}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Our Coverage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm mb-4">We're constantly expanding. Currently, our delivery network is active in:</p>
                            <div className="grid grid-cols-2 gap-4">
                                <ul className="space-y-2">
                                     <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/>Lagos, NG</li>
                                     <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/>Abuja, NG</li>
                                     <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/>Accra, GH</li>
                                </ul>
                                <ul className="space-y-2">
                                     <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/>Niamey, NE</li>
                                     <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/>Douala, CM</li>
                                     <li className="flex items-center gap-2 text-muted-foreground">More cities soon!</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </section>
                
                {/* Benefits Section */}
                <section>
                    <h2 className="text-3xl font-bold font-headline text-center mb-12">Peace of Mind for Every Order</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-card">
                            <ShieldCheck className="w-8 h-8 text-success mt-1 shrink-0"/>
                            <div>
                                <h3 className="font-semibold">Insured Shipments</h3>
                                <p className="text-sm text-muted-foreground">Every delivery is insured, protecting you and your customer against loss or damage.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-card">
                             <CheckCircle className="w-8 h-8 text-success mt-1 shrink-0"/>
                            <div>
                                <h3 className="font-semibold">Vetted Riders</h3>
                                <p className="text-sm text-muted-foreground">All our delivery partners are carefully vetted and trained for professional service.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Partner with us section */}
                <section>
                    <h2 className="text-3xl font-bold font-headline text-center mb-6">Join Our Delivery Network</h2>
                    <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
                        We're empowering local entrepreneurs. If you're a reliable bike rider or want to guarantee one, you can partner with Busmo to earn more.
                    </p>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle>For Riders</CardTitle>
                                <CardDescription>Turn your bike into a business. Earn competitive fees delivering for stores in your area.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success"/> Get a steady stream of delivery jobs.</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success"/> Get paid instantly for completed deliveries.</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success"/> All you need is a bike, a smartphone, and a guarantor.</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                 <Dialog open={isRiderDialogOpen} onOpenChange={setIsRiderDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full">Apply to be a Rider</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Apply to be a Busmo Rider</DialogTitle>
                                            <DialogDescription>Fill in your details below. We'll contact you for the next steps.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleApplyForRider} className="space-y-4 pt-4">
                                            <div className="space-y-2"><Label htmlFor="rider-name">Full Name</Label><Input id="rider-name" value={riderName} onChange={(e) => setRiderName(e.target.value)} required /></div>
                                            <div className="space-y-2"><Label htmlFor="rider-phone">Phone Number</Label><Input id="rider-phone" type="tel" value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} required /></div>
                                            <div className="space-y-2"><Label htmlFor="rider-address">Address / Main Area of Operation</Label><Textarea id="rider-address" value={riderAddress} onChange={(e) => setRiderAddress(e.target.value)} required /></div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={isSubmittingRider} className="w-full">
                                                    {isSubmittingRider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Submit Application
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>
                        <Card className="flex flex-col">
                            <CardHeader>
                                <CardTitle>For Guarantors</CardTitle>
                                <CardDescription>Vouch for a rider you trust and earn a commission on every successful delivery they make.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                 <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success"/> Provide a safety net for local commerce.</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success"/> Earn passive income by vouching for reliable riders.</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-success"/> A simple way to invest in your community.</li>
                                </ul>
                            </CardContent>
                             <CardFooter>
                                <Dialog open={isGuarantorDialogOpen} onOpenChange={setIsGuarantorDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className="w-full">Become a Guarantor</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Become a Rider Guarantor</DialogTitle>
                                            <DialogDescription>Fill out your details and the details of the rider you wish to guarantee.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleApplyForGuarantor} className="space-y-4 pt-4">
                                            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">Your (Guarantor's) Information</h3>
                                            <div className="space-y-2"><Label htmlFor="guarantor-name">Your Full Name</Label><Input id="guarantor-name" value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} required /></div>
                                            <div className="space-y-2"><Label htmlFor="guarantor-phone">Your Phone Number</Label><Input id="guarantor-phone" type="tel" value={guarantorPhone} onChange={(e) => setGuarantorPhone(e.target.value)} required /></div>
                                            <div className="space-y-2"><Label htmlFor="guarantor-address">Your Address</Label><Textarea id="guarantor-address" value={guarantorAddress} onChange={(e) => setGuarantorAddress(e.target.value)} /></div>

                                            <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2 pt-4">Rider's Information</h3>
                                            <div className="space-y-2"><Label htmlFor="guaranteed-rider-name">Rider's Full Name</Label><Input id="guaranteed-rider-name" value={guaranteedRiderName} onChange={(e) => setGuaranteedRiderName(e.target.value)} required /></div>
                                            <div className="space-y-2"><Label htmlFor="guaranteed-rider-phone">Rider's Phone Number</Label><Input id="guaranteed-rider-phone" type="tel" value={guaranteedRiderPhone} onChange={(e) => setGuaranteedRiderPhone(e.target.value)} required /></div>
                                            <div className="space-y-2"><Label htmlFor="relationship">Your Relationship to the Rider</Label><Textarea id="relationship" placeholder="e.g., Uncle, family friend, mentor..." value={relationship} onChange={(e) => setRelationship(e.target.value)} /></div>
                                            
                                            <DialogFooter className="pt-4">
                                                <Button type="submit" disabled={isSubmittingGuarantor} className="w-full">
                                                    {isSubmittingGuarantor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Submit Guarantor Application
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                             </CardFooter>
                        </Card>
                    </div>
                </section>
                
            </div>
        </MarketLayout>
    );
}
