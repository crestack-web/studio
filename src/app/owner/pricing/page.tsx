'use client';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShoppingCart, Store, Network, AlertCircle, Building, Check, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function PricingPage() {
  return (
    <MainLayout title="Choose Your Plan" backHref="/owner/home">
        <div className="w-full max-w-lg space-y-6">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Your Free Trial Has Ended</AlertTitle>
                <AlertDescription>
                    Please choose a plan to continue using Busmo and access your data.
                </AlertDescription>
            </Alert>

            <Card className="w-full">
                <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Upgrade Your Plan</CardTitle>
                <CardDescription>All plans are billed monthly. You can cancel anytime.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <RadioGroup defaultValue="shop" className="grid grid-cols-1 gap-4">
                    <div>
                        <RadioGroupItem value="shop" id="shop" className="peer sr-only" />
                        <Label htmlFor="shop" className="block rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <ShoppingCart className="w-8 h-8 text-primary" />
                                    <div className="text-left">
                                        <p className="font-semibold">Shop</p>
                                        <p className="text-sm text-muted-foreground">For small retailers</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">₦1,500</p>
                                    <p className="text-sm text-muted-foreground">/month</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Record Sales, Expenses & Inventory</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Basic AI Insights</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>1 Staff Member</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Advanced Forecasting</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Multiple Branches</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Production Tracking</span></li>
                            </ul>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="supermarket" id="supermarket" className="peer sr-only" />
                        <Label htmlFor="supermarket" className="block rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                           <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <Store className="w-8 h-8 text-primary" />
                                    <div className="text-left">
                                        <p className="font-semibold">Supermarket</p>
                                        <p className="text-sm text-muted-foreground">For larger stores</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">₦10,000</p>
                                    <p className="text-sm text-muted-foreground">/month</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Everything in Shop</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Up to 5 Staff Members</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Advanced Forecasting</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Multiple Branches</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Production Tracking</span></li>
                            </ul>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="multi-branch" id="multi-branch" className="peer sr-only" />
                        <Label htmlFor="multi-branch" className="block rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <Network className="w-8 h-8 text-primary" />
                                    <div className="text-left">
                                        <p className="font-semibold">Multiple Branches</p>
                                        <p className="text-sm text-muted-foreground">For chains & franchises</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">₦30,000</p>
                                    <p className="text-sm text-muted-foreground">/month</p>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Everything in Supermarket</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Unlimited Staff Members</span></li>
                                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Multiple Branches</span></li>
                                <li className="flex items-center gap-2 text-muted-foreground/60"><X className="h-4 w-4" /><span>Production Tracking</span></li>
                            </ul>
                        </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="company" id="company" className="peer sr-only" />
                      <Label htmlFor="company" className="block rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <Building className="w-8 h-8 text-primary" />
                                <div className="text-left">
                                    <p className="font-semibold">Company</p>
                                    <p className="text-sm text-muted-foreground">For production & enterprise</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold">Custom</p>
                                <p className="text-sm text-muted-foreground">Contact Us</p>
                            </div>
                        </div>
                        <Separator className="my-4" />
                        <ul className="space-y-2 text-sm text-muted-foreground">
                           <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Everything in Multi-Branch</span></li>
                           <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Production Tracking</span></li>
                           <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Custom Integrations</span></li>
                           <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /><span>Dedicated Support</span></li>
                        </ul>
                      </Label>
                    </div>
                </RadioGroup>
                <Button className="w-full h-14 text-lg">
                    Proceed to Payment
                </Button>
                </CardContent>
            </Card>
        </div>
    </MainLayout>
  );
}
