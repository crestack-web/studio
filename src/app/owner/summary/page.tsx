'use client';

import { useState, useMemo, useEffect } from 'react';
import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Label } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { TrendingUp, Building, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, query, collection, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency as formatCurrencyUtil } from '@/lib/currency';

interface AppUser {
    businessId?: string;
}

interface Business {
    plan: 'shop' | 'supermarket' | 'multi-branch' | 'company';
    currency: string;
}

interface Sale {
    id: string;
    amount: number;
    paymentType: string;
    source: string;
    timestamp: Timestamp;
    productId?: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    cost: number;
    quantity: number;
}


// Mock data for multi-branch, will be replaced if/when implemented
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


export default function SummaryPage() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const userProfileRef = useMemoFirebase(() => {
      if (!firestore || !authUser) return null;
      return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);
  const { data: userProfile } = useDoc<AppUser>(userProfileRef);
  const businessId = userProfile?.businessId;

  const businessRef = useMemoFirebase(() => {
      if (!firestore || !businessId) return null;
      return doc(firestore, 'businesses', businessId);
  }, [firestore, businessId]);
  const { data: businessData } = useDoc<Business>(businessRef);
  
  // For summary, let's fetch all sales data without date constraints
  const allSalesQuery = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return query(collection(firestore, 'sales'), where('businessId', '==', businessId));
  }, [firestore, businessId]);
  const { data: salesData, isLoading: isLoadingSales } = useCollection<Sale>(allSalesQuery);

  const allProductsQuery = useMemoFirebase(() => {
    if (!firestore || !businessId) return null;
    return query(collection(firestore, 'products'), where('businessId', '==', businessId));
  }, [firestore, businessId]);
  const { data: productsData, isLoading: isLoadingProducts } = useCollection<Product>(allProductsQuery);

  const formatCurrency = (value: number) => formatCurrencyUtil(value, businessData?.currency);
  const userPlan = businessData?.plan;
  
  const { summaryData, salesByProductData, paymentMethods, productChartConfig } = useMemo(() => {
    if (!salesData || !productsData || !businessData) {
      return { summaryData: null, salesByProductData: [], paymentMethods: [], productChartConfig: {} };
    }

    let totalSales = 0;
    let totalProfit = 0;
    let costOfGoodsSold = 0;
    const salesByProduct: { [key: string]: { product: string, sales: number, quantity: number } } = {};
    const paymentMethodsSummary: { [type: string]: { type: string, amount: number, count: number } } = {};
    const dynamicChartConfig: ChartConfig = { sales: { label: "Sales" } };
    let chartColorIndex = 1;


    salesData.forEach(sale => {
        totalSales += sale.amount;
        
        if (sale.productId) {
            const product = productsData.find(p => p.id === sale.productId);
            if (product) {
                const quantitySold = sale.amount / product.price;
                const cogsForSale = product.cost * quantitySold;
                costOfGoodsSold += cogsForSale;
                totalProfit += sale.amount - cogsForSale;

                if (!salesByProduct[product.id]) {
                    salesByProduct[product.id] = { product: product.name, sales: 0, quantity: 0 };
                    dynamicChartConfig[product.name] = {
                        label: product.name,
                        color: `hsl(var(--chart-${chartColorIndex}))`
                    }
                    chartColorIndex = chartColorIndex < 5 ? chartColorIndex + 1 : 1;
                }
                salesByProduct[product.id].sales += sale.amount;
                salesByProduct[product.id].quantity += quantitySold;
            }
        }

        if (!paymentMethodsSummary[sale.paymentType]) {
            paymentMethodsSummary[sale.paymentType] = { type: sale.paymentType, amount: 0, count: 0 };
        }
        paymentMethodsSummary[sale.paymentType].amount += sale.amount;
        paymentMethodsSummary[sale.paymentType].count++;
    });
    
    // TODO: Add expenses to this calculation
    const totalExpenses = 0;

    return {
        summaryData: {
            totalSales,
            costOfGoodsSold,
            totalExpenses,
            netProfit: totalProfit - totalExpenses,
            numberOfSales: salesData.length,
        },
        salesByProductData: Object.values(salesByProduct).sort((a,b) => b.sales - a.sales),
        paymentMethods: Object.values(paymentMethodsSummary),
        productChartConfig: dynamicChartConfig
    };

  }, [salesData, productsData, businessData]);

  const totalPieSales = useMemo(() => {
    return salesByProductData.reduce((acc, curr) => acc + curr.sales, 0);
  }, [salesByProductData]);
  
  const isLoading = isLoadingSales || isLoadingProducts;

  return (
    <MainLayout title="Business Summary" backHref="/owner/home">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        Sales by Product
                    </CardTitle>
                    <CardDescription>
                        A breakdown of sales by product. Click a slice for details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-[350px] w-full" /> : salesByProductData.length > 0 ? (
                         <ChartContainer
                            config={productChartConfig}
                            className="mx-auto aspect-square h-full max-h-[350px]"
                        >
                            <PieChart>
                                <RechartsTooltip
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={<ChartTooltipContent
                                        formatter={(value) => formatCurrency(value as number)}
                                        nameKey="product"
                                    />}
                                />
                                <Pie
                                    data={salesByProductData}
                                    dataKey="sales"
                                    nameKey="product"
                                    innerRadius="60%"
                                    strokeWidth={3}
                                    onClick={(data) => setSelectedProduct(data.payload)}
                                    className="cursor-pointer"
                                >
                                    {salesByProductData.map((entry) => (
                                         <Cell key={entry.product} fill={productChartConfig[entry.product as keyof typeof productChartConfig]?.color} />
                                    ))}
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                            return (
                                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold font-headline">{formatCurrency(totalPieSales)}</tspan>
                                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-sm">Total Sales</tspan>
                                                </text>
                                            )
                                            }
                                        }}
                                    />
                                </Pie>
                                <ChartLegend content={<ChartLegendContent nameKey="product" className="flex-wrap" />} className="-translate-y-4" />
                            </PieChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[350px] flex items-center justify-center text-muted-foreground">No sales data available.</div>
                    )}
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
                                    <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />} />
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
                    {isLoading ? <Skeleton className="h-40 w-full" /> : salesByProductData.length > 0 ? (
                        salesByProductData.map((item, index) => (
                            <div key={item.product}>
                                <div className="flex justify-between items-center py-2">
                                    <div>
                                        <p className="font-medium">{item.product}</p>
                                        <p className="text-sm text-muted-foreground">{Math.round(item.quantity)} units sold</p>
                                    </div>
                                    <p className="font-semibold text-lg">{formatCurrency(item.sales)}</p>
                                </div>
                                {index < salesByProductData.length - 1 && <Separator />}
                            </div>
                        ))
                    ) : (
                         <div className="py-10 text-center text-muted-foreground">No products sold yet.</div>
                    )}
                </CardContent>
            </Card>
        </div>
        
        <div className="flex flex-col gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">Net Profit</CardTitle>
                     <CardDescription>Total Revenue - (COGS + Expenses)</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading || !summaryData ? <Skeleton className="h-12 w-48" /> :
                        <p className="text-5xl font-bold font-headline text-success">
                            {formatCurrency(summaryData.netProfit)}
                        </p>
                    }
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Profit Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2 text-sm">
                   {isLoading || !summaryData ? <Skeleton className="h-24 w-full" /> : (
                       <>
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
                        </>
                   )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium text-muted-foreground">Number of Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading || !summaryData ? <Skeleton className="h-12 w-20" /> : 
                        <p className="text-5xl font-bold font-headline">
                            {summaryData.numberOfSales}
                        </p>
                    }
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sales by Payment Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                    {isLoading ? <Skeleton className="h-28 w-full" /> : paymentMethods.length > 0 ? (
                        paymentMethods.map((method, index) => (
                            <div key={method.type}>
                                <div className="flex justify-between items-center py-2">
                                <p className="font-medium capitalize">{method.type} <span className="text-sm text-muted-foreground">({method.count} sales)</span></p>
                                <p className="font-semibold text-lg">{formatCurrency(method.amount)}</p>
                                </div>
                                {index < paymentMethods.length - 1 && <Separator />}
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center text-muted-foreground">No sales recorded.</div>
                    )}
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
                    <span className="font-semibold">{Math.round(selectedProduct?.quantity || 0)} units</span>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
