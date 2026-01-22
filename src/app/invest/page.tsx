'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Building } from 'lucide-react';
import InvestorLayout from '@/components/app/investor-layout';


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
                            <Select disabled>
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
                             <Select disabled>
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
                             <Select disabled>
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
                             <Select disabled>
                                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="profit-sharing">Profit Sharing</SelectItem>
                                    <SelectItem value="equity">Equity</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Empty State */}
                <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <Building className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Opportunities Coming Soon</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        We are currently building our network of verified businesses. Check back soon for investment opportunities.
                    </p>
                </div>
            </div>
        </InvestorLayout>
    );
}
