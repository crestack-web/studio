'use client';

import { useState } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { TrendingUp, Building, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// In a real app, this would come from user data.
const userPlan = 'multi-branch'; // or 'shop', 'supermarket'

const summaryData = {
    totalSales: 77000, // Combined
    costOfGoodsSold: 35000,
    totalExpenses: 18000,
    netProfit: 24000,
    numberOfSales: 31,
    currency: '₦',
};

const salesByProductData = [
  { product: 'Bottled Water', sales: 27000, quantity: 180 },
  { product: 'Biscuits', sales: 22500, quantity: 90 },
  { product: 'Soft Drink', sales: 18000, quantity: 90 },
  { product: 'Bread', sales: 9500, quantity: 95 },
];

const productChartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const branchPerformanceData = [
    { branch: 'Main Branch', profit: 13000 },
    { branch: 'Ikeja Outlet', profit: 9500 },
    { branch: 'Lekki Kiosk', profit: 6000 },
];

const branchChartConfig = {
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


const paymentMethods = [
    { type: 'Cash', amount: 40000, count: 18 },
    { type: 'Transfer', amount: 27000, count: 9 },
    { type: 'POS', amount: 10000, count: 4 },
];

export default function SummaryPage() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const formatCurrency = (value: number) => `${summaryData.currency}${value.toLocaleString()}`;

  return (
    <MainLayout title="Business Summary" backHref="/owner/home">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        Sales by Product
                    </CardTitle>
                    <CardDescription>
                        Performance of your top-selling products for the selected period. Click a bar for details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                     <ChartContainer config={productChartConfig} className="w-full h-[350px]">
                        <ResponsiveContainer>
                            <BarChart data={salesByProductData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="product" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={100} />
                                <XAxis dataKey="sales" type="number" hide />
                                <RechartsTooltip 
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={<ChartTooltipContent 
                                        formatter={(value) => formatCurrency(value as number)}
                                        labelClassName="font-bold"
                                    />} 
                                />
                                <Bar dataKey="sales" fill="var(--color-sales)" radius={5} onClick={(data) => setSelectedProduct(data)} className="cursor-pointer" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            {userPlan === 'multi-branch' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <Building className="w-6 h-6 text-primary" />
                            Branch Performance
                        </CardTitle>
                        <CardDescription>
                            Comparing profit across your different business locations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ChartContainer config={branchChartConfig} className="w-full h-[300px]">
                            <ResponsiveContainer>
                                <BarChart data={branchPerformanceData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="branch" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis hide />
                                    <RechartsTooltip 
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                                    />
                                    <Bar dataKey="profit" fill="var(--color-profit)" radius={5} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            )}

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <Package className="w-6 h-6 text-primary" />
                        Top Products List
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {salesByProductData.sort((a, b) => b.sales - a.sales).map((item, index) => (
                        <div key={item.product}>
                            <div className="flex justify-between items-center py-2">
                                <div>
                                    <p className="font-medium">{item.product}</p>
                                    <p className="text-sm text-muted-foreground">{item.quantity} units sold</p>
                                </div>
                                <p className="font-semibold text-lg">{formatCurrency(item.sales)}</p>
                            </div>
                            {index < salesByProductData.length - 1 && <Separator />}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
        
        {/* Right Column */}
        <div className="flex flex-col gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">Net Profit</CardTitle>
                     <CardDescription>Total Revenue - (COGS + Expenses)</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-5xl font-bold font-headline text-success">
                    {formatCurrency(summaryData.netProfit)}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Profit Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2 text-sm">
                    <div className="flex justify-between items-center">
                    <span>Total Revenue</span>
                    <span className="font-semibold">{formatCurrency(summaryData.totalSales)}</span>
                    </div>
                    <Separator/>
                    <div className="flex justify-between items-center">
                    <span>Cost of Goods Sold</span>
                    <span className="font-semibold text-muted-foreground">-{formatCurrency(summaryData.costOfGoodsSold)}</span>
                    </div>
                    <Separator/>
                    <div className="flex justify-between items-center">
                    <span>Expenses</span>
                    <span className="font-semibold text-muted-foreground">-{formatCurrency(summaryData.totalExpenses)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">Number of Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-5xl font-bold font-headline">
                    {summaryData.numberOfSales}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sales by Payment Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                    {paymentMethods.map((method, index) => (
                    <div key={method.type}>
                        <div className="flex justify-between items-center py-2">
                        <p className="font-medium">{method.type} <span className="text-sm text-muted-foreground">({method.count} sales)</span></p>
                        <p className="font-semibold text-lg">{formatCurrency(method.amount)}</p>
                        </div>
                        {index < paymentMethods.length - 1 && <Separator />}
                    </div>
                    ))}
                </CardContent>
            </Card>

        </div>
      </div>
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{selectedProduct?.product}</DialogTitle>
                <DialogDescription>
                    Details for this product for the selected period.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Sales</span>
                    <span className="font-semibold">{formatCurrency(selectedProduct?.sales || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Quantity Sold</span>
                    <span className="font-semibold">{selectedProduct?.quantity} units</span>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
