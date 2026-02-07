'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { CheckCircle, ArrowRight } from 'lucide-react';
import InvestorLayout from '@/components/app/investor-layout';

export default function BusmoPayPage() {
  const howItWorks = [
    {
      title: "Turn on BusmoPay",
      description: "Connect your payout details in your Busmo Market settings so you can accept online payments and receive settlements.",
    },
    {
      title: "Collect customer payments",
      description: "Customers pay during checkout. BusmoPay records the transaction and confirms the order payment so you can fulfill confidently.",
    },
    {
      title: "Get paid out to your bank",
      description: "After fulfillment, BusmoPay settles your earnings to your verified bank account and keeps a clear payout trail for reconciliation.",
    },
  ];

  return (
    <InvestorLayout>
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <section className="text-center">
            <div className="inline-block">
                <Logo variant="busmopay" className="text-5xl" />
            </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl font-headline">
            Busmo’s payment gateway for your online sales
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            BusmoPay is the payment and payout layer that powers Busmo commerce. We collect payments from customers on your behalf, confirm transactions for orders, then pass your earnings to you through secure payouts.
          </p>
          <div className="mt-10">
            <Link href="/signup">
              <Button size="lg" className="h-14 text-lg">Start accepting payments</Button>
            </Link>
          </div>
        </section>

        <section className="mt-24">
          <h2 className="text-3xl font-bold text-center font-headline">How It Works</h2>
          <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative flex flex-col items-center text-center">
                 {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/3 left-full transform -translate-x-1/2 -translate-y-1/2">
                    <ArrowRight className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold font-headline">Built for Growth</h2>
             <p className="mt-4 text-lg text-muted-foreground">
                BusmoPay isn’t just checkout — it connects payments to fulfillment, reporting, and payouts so you can grow with less manual work.
            </p>
             <ul className="mt-8 space-y-4 text-left inline-block">
                <li className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-primary shrink-0 mt-1"/><span><strong>Secure collection:</strong> Customer payments are captured and tracked as transactions.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-primary shrink-0 mt-1"/><span><strong>Reliable payouts:</strong> Earnings are settled to your verified bank account with a clear payout history.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-primary shrink-0 mt-1"/><span><strong>Used across Busmo features:</strong> Online payments for Busmo Market / Storefront orders, with reporting that matches your sales and fulfillment.</span></li>
            </ul>
        </section>
      </div>
    </InvestorLayout>
  );
}
