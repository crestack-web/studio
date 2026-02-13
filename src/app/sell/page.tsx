import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/app/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Package, Send, Store } from 'lucide-react';

export default function SellLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/welcome" className="flex items-center gap-2">
            <Logo className="h-8" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/market">
              <Button variant="ghost">Marketplace</Button>
            </Link>
            <Link href="/seller/login">
              <Button>Seller Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 sm:py-28">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl font-headline">
                  Busmo Seller Central
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  Everything you need to sell on the Busmo marketplace: a storefront, product listings, integrated payments, order management, and BusmoGo delivery.
                </p>
                <p className="mt-4 text-base text-muted-foreground">
                  We build for the business owner, not the accountant. Busmo is designed to give you clarity and control — so you can make faster decisions, serve customers better, and grow sustainably.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <Link href="/signup">
                    <Button size="lg" className="h-12">Start Selling</Button>
                  </Link>
                  <Link href="/seller/login">
                    <Button size="lg" variant="secondary" className="h-12">Seller Login</Button>
                  </Link>
                </div>
              </div>

              <div className="w-full">
                <div className="relative w-full overflow-hidden rounded-lg border bg-muted/20 aspect-[3/2]">
                  <Image
                    src="/sell-hero.png"
                    alt="Business owners using Busmo Seller Central"
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-card border-y">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-2xl sm:text-3xl font-bold font-headline">Busmo clarity tools</h2>
              <p className="mt-4 text-muted-foreground">
                Seller Central is more than a dashboard — it’s a set of clarity tools that help you understand what’s working, what’s not, and what to do next.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: 'Profit clarity', desc: 'See performance clearly so you can price confidently and protect margin.' },
                  { title: 'Cash clarity', desc: 'Understand sales inflow and payouts so you can plan inventory and operations.' },
                  { title: 'Inventory clarity', desc: 'Track what’s in stock and what’s moving so you restock smarter.' },
                  { title: 'Order clarity', desc: 'Stay on top of orders, fulfillment, and delivery without the chaos.' },
                ].map((item) => (
                  <Card key={item.title}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{item.desc}</CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-2xl sm:text-3xl font-bold font-headline">How it works</h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: 'Create your business', desc: 'Sign up and set up your business profile.' },
                  { title: 'Add products', desc: 'List products and keep inventory up to date.' },
                  { title: 'Activate your storefront', desc: 'Turn on your store so customers can browse.' },
                  { title: 'Get orders & get paid', desc: 'Accept marketplace payments and fulfill orders.' },
                ].map((step) => (
                  <Card key={step.title}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{step.desc}</CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-2xl sm:text-3xl font-bold font-headline">Marketplace features for sellers</h2>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Storefront</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">A dedicated store page customers can browse, follow, and trust.</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Products & orders</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">List products, update pricing, and manage incoming marketplace orders.</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Integrated payments</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">BusmoPay marketplace checkout for smooth customer payments and payout tracking.</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> BusmoGo delivery</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">Offer delivery options using BusmoGo logistics.</CardContent>
                </Card>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/seller/login"><Button size="lg">Go to Seller Dashboard</Button></Link>
                <Link href="/market"><Button size="lg" variant="secondary">View Marketplace</Button></Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground">
          Busmo Seller Central helps you sell faster with simple tools.
        </div>
      </footer>
    </div>
  );
}
