'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { CheckCircle, ArrowRight } from 'lucide-react';
import InvestorLayout from '@/components/app/investor-layout';

export default function BusmoPayPage() {
  const howItWorks = [
    {
      title: "Enable Payments",
      description: "Activate your payment gateway and mobile money options in your Busmo Market settings to start accepting online payments.",
    },
    {
      title: "Sell to Customers",
      description: "Customers purchase your products through a unified and secure checkout experience, no matter their preferred payment method.",
    },
    {
      title: "Get Paid & Share Profits",
      description: "Funds are settled to your account, and profit shares are automatically calculated and tracked for your investors.",
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
            Sell products & share profits with BusmoPay
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            The integrated payment solution for the Busmo marketplace. Accept payments via popular payment gateways and mobile money, and automatically distribute profits to your investors.
          </p>
          <div className="mt-10">
            <Link href="/signup">
              <Button size="lg" className="h-14 text-lg">Create a free BusmoPay account</Button>
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
                BusmoPay isn't just a payment gateway. It's a growth engine that connects your sales directly to your business's financial health and investment potential.
            </p>
             <ul className="mt-8 space-y-4 text-left inline-block">
                <li className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-busmopay-primary shrink-0 mt-1"/><span><strong>Unified Checkout:</strong> A seamless experience for your customers in Nigeria and beyond.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-busmopay-primary shrink-0 mt-1"/><span><strong>Automated Profit Sharing:</strong> Build investor confidence with transparent, automated profit distribution.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-busmopay-primary shrink-0 mt-1"/><span><strong>One Dashboard:</strong> Track your POS sales and online payments all in one place.</span></li>
            </ul>
        </section>
      </div>
    </InvestorLayout>
  );
}
