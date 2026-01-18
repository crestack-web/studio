import MainLayout from '@/components/app/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function SummaryPage() {
  const summaryData = {
    totalSales: 45000,
    costOfGoodsSold: 20000,
    totalExpenses: 12000,
    netProfit: 13000,
    numberOfSales: 18,
    currency: '₦',
    paymentMethods: [
      { type: 'Cash', amount: 25000, count: 10 },
      { type: 'Transfer', amount: 15000, count: 5 },
      { type: 'POS', amount: 5000, count: 3 },
    ],
  };

  return (
    <MainLayout title="Today's Summary" backHref="/owner/home">
      <div className="flex flex-col gap-6 w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold font-headline">
              {summaryData.currency}{summaryData.netProfit.toLocaleString()}
            </p>
             <p className="text-sm text-muted-foreground mt-1">
                vs. yesterday (coming soon)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Profit Breakdown</CardTitle>
            <CardDescription>An overview of today's profitability.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex justify-between items-center text-sm">
              <span>Total Revenue</span>
              <span className="font-semibold">{summaryData.currency}{summaryData.totalSales.toLocaleString()}</span>
            </div>
            <Separator/>
            <div className="flex justify-between items-center text-sm">
              <span>Cost of Goods Sold</span>
              <span className="font-semibold text-muted-foreground">-{summaryData.currency}{summaryData.costOfGoodsSold.toLocaleString()}</span>
            </div>
             <Separator/>
            <div className="flex justify-between items-center text-sm">
              <span>Expenses</span>
              <span className="font-semibold text-muted-foreground">-{summaryData.currency}{summaryData.totalExpenses.toLocaleString()}</span>
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
            <CardDescription>A breakdown of how customers paid today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {summaryData.paymentMethods.map((method, index) => (
              <div key={method.type}>
                <div className="flex justify-between items-center py-2">
                  <p className="font-medium">{method.type} <span className="text-sm text-muted-foreground">({method.count} sales)</span></p>
                  <p className="font-semibold text-lg">{summaryData.currency}{method.amount.toLocaleString()}</p>
                </div>
                {index < summaryData.paymentMethods.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
