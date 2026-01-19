'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Building, Handshake, MapPin, BarChart, ChevronRight } from 'lucide-react';
import InvestorLayout from '@/components/app/investor-layout';

const profitSharingOpportunities = [
  { id: 'biz1', name: 'Aisha\'s Crafts', industry: 'Fashion', location: 'Lagos, NG', revenueRange: '₦1M - ₦5M', investmentType: 'Profit Sharing' },
  { id: 'biz2', name: 'Femi\'s Farm', industry: 'Agriculture', location: 'Ibadan, NG', revenueRange: '₦500K - ₦2M', investmentType: 'Profit Sharing' },
  { id: 'biz4', name: 'Mama\'s Kitchen', industry: 'Food & Beverage', location: 'Kano, NG', revenueRange: '₦2M - ₦8M', investmentType: 'Profit Sharing' },
];

const equityOpportunities = [
  { id: 'biz3', name: 'City Electronics Inc.', industry: 'Electronics', location: 'Abuja, NG', revenueRange: '₦20M - ₦50M', investmentType: 'Equity' },
];

export default function InvestPage() {
    return (
        <InvestorLayout>
            <div className="container mx-auto px-4 py-12 sm:py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">
                        Invest in Africa's Growth Engine
                    </h1>
                    <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
                        Discover and fund the next generation of small and medium businesses, backed by real-time, trusted data from Busmo.
                    </p>
                </div>

                {/* Filters */}
                <Card className="mb-12">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            <span>Filter Opportunities</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Industry / Niche</label>
                            <Select>
                                <SelectTrigger><SelectValue placeholder="All Industries" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fashion">Fashion</SelectItem>
                                    <SelectItem value="agriculture">Agriculture</SelectItem>
                                    <SelectItem value="food">Food & Beverage</SelectItem>
                                    <SelectItem value="electronics">Electronics</SelectItem>
                                    <SelectItem value="retail">Retail</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Location</label>
                             <Select>
                                <SelectTrigger><SelectValue placeholder="All Locations" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lagos">Lagos, NG</SelectItem>
                                    <SelectItem value="abuja">Abuja, NG</SelectItem>
                                    <SelectItem value="ibadan">Ibadan, NG</SelectItem>
                                    <SelectItem value="kano">Kano, NG</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                             <label className="text-sm font-medium">Revenue Range (Annual)</label>
                             <Select>
                                <SelectTrigger><SelectValue placeholder="Any Revenue" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">&lt; ₦5M</SelectItem>
                                    <SelectItem value="2">₦5M - ₦20M</SelectItem>
                                    <SelectItem value="3">₦20M - ₦100M</SelectItem>
                                    <SelectItem value="4">&gt; ₦100M</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Investment Type</label>
                             <Select>
                                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="profit-sharing">Profit Sharing</SelectItem>
                                    <SelectItem value="equity">Equity</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Investment Sections */}
                <div className="space-y-16">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Handshake className="w-8 h-8 text-accent"/>
                            <h2 className="text-2xl font-bold font-headline sm:text-3xl">Profit-Sharing Opportunities</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {profitSharingOpportunities.map(biz => (
                                <Link href={`/invest/${biz.id}`} key={biz.id}>
                                    <Card className="h-full overflow-hidden group cursor-pointer hover:border-primary transition-colors duration-200">
                                        <CardHeader>
                                            <CardTitle>{biz.name}</CardTitle>
                                            <CardDescription>{biz.industry}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm">
                                             <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="w-4 h-4" />
                                                <span>{biz.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <BarChart className="w-4 h-4" />
                                                <span>Revenue: {biz.revenueRange}</span>
                                            </div>
                                        </CardContent>
                                        <div className="p-4 pt-2 mt-auto text-sm font-semibold text-primary flex items-center justify-end group-hover:text-accent">
                                            View Details <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section>
                         <div className="flex items-center gap-3 mb-6">
                            <Building className="w-8 h-8 text-accent"/>
                            <h2 className="text-2xl font-bold font-headline sm:text-3xl">Equity Investment Opportunities</h2>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {equityOpportunities.map(biz => (
                                <Link href={`/invest/${biz.id}`} key={biz.id}>
                                    <Card className="h-full overflow-hidden group cursor-pointer hover:border-primary transition-colors duration-200">
                                         <CardHeader>
                                            <CardTitle>{biz.name}</CardTitle>
                                            <CardDescription>{biz.industry}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm">
                                             <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="w-4 h-4" />
                                                <span>{biz.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <BarChart className="w-4 h-4" />
                                                <span>Revenue: {biz.revenueRange}</span>
                                            </div>
                                        </CardContent>
                                        <div className="p-4 pt-2 mt-auto text-sm font-semibold text-primary flex items-center justify-end group-hover:text-accent">
                                            View Profile <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

            </div>
        </InvestorLayout>
    );
}
