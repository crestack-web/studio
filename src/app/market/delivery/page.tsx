'use client';

import MarketLayout from '@/components/app/market-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bike, Box, CheckCircle, MapPin, PackageSearch, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const deliveryRates = [
    { city: 'Lagos', rate: '₦2,000 - ₦3,500' },
    { city: 'Abuja', rate: '₦2,500 - ₦4,000' },
    { city: 'Accra', rate: 'GH₵30 - GH₵50' },
    { city: 'Niamey', rate: '1,500 CFA - 2,500 CFA' },
    { city: 'Douala', rate: '1,500 CFA - 2,500 CFA' },
];

const howItWorksSteps = [
    { icon: PackageSearch, title: 'Order is Placed', description: "A customer buys your product from the Busmo Market." },
    { icon: Bike, title: 'Rider Dispatched', description: "We instantly dispatch a verified local delivery partner to your location for pickup." },
    { icon: Box, title: 'Secure Handover', description: "Our rider securely packages the item and begins the delivery journey." },
    { icon: MapPin, title: 'Real-Time Tracking', description: "You and your customer can track the delivery in real-time until it's safely delivered." },
];

export default function DeliveryPage() {
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
                
            </div>
        </MarketLayout>
    );
}
