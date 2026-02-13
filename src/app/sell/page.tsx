import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/app/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Package, Send, ShoppingCart, Store, Landmark } from 'lucide-react';

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
              <Button variant="ghost" className="rounded-full">Marketplace</Button>
            </Link>
            <Link href="/seller/login">
              <Button className="rounded-full">Seller Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 sm:py-28 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-headline">
                  Get your Busmo Seller Account
                </h1>
                <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                  Storefront, products, orders, payments, and BusmoGo delivery — all in one place.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <Link href="/seller/signup">
                    <Button size="lg" className="h-12 rounded-full px-8">Create Seller Account</Button>
                  </Link>
                  <Link href="/seller/login">
                    <Button size="lg" variant="secondary" className="h-12 rounded-full px-8">Seller Login</Button>
                  </Link>
                </div>
              </div>

              <div className="w-full">
                <div className="relative w-full overflow-hidden rounded-2xl border bg-muted/20 aspect-[3/2] shadow-lg">
                  <Image
                    src="/sell-hero.png"
                    alt="Business owners using Busmo Seller Central"
                    fill
                    priority
                    unoptimized
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold font-headline">Built for selling</h2>
                <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                  Everything a modern seller needs — without complicated setup.
                </p>
              </div>

              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Store, title: 'Storefront', desc: 'A trusted store page customers can browse and buy from.' },
                  { icon: Package, title: 'Product listings', desc: 'List products, update pricing, and keep inventory fresh.' },
                  { icon: ShoppingCart, title: 'Orders', desc: 'Track incoming orders and manage fulfillment with clarity.' },
                  { icon: CreditCard, title: 'Payments', desc: 'Integrated marketplace checkout with BusmoPay.' },
                  { icon: Landmark, title: 'Payouts', desc: 'Understand payouts and cash flow so you can plan confidently.' },
                  { icon: Send, title: 'BusmoGo delivery', desc: 'Offer delivery options with BusmoGo logistics.' },
                ].map((feature) => (
                  <Card key={feature.title} className="h-full rounded-2xl shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <feature.icon className="h-5 w-5 text-primary" />
                        </span>
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-base text-muted-foreground">
                      {feature.desc}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-card border-y">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold font-headline">How it works</h2>
                <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Go live fast. Keep it simple. Sell more.</p>
              </div>

              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: 'Create your account', desc: 'Sign up and set up your seller profile.' },
                  { title: 'Add products', desc: 'Create listings and keep your catalog updated.' },
                  { title: 'Activate your storefront', desc: 'Turn your store on and start accepting orders.' },
                  { title: 'Deliver & get paid', desc: 'Fulfill orders, offer delivery, and track payouts.' },
                ].map((step, index) => (
                  <Card key={step.title} className="rounded-2xl shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-extrabold shrink-0">
                          {index + 1}
                        </span>
                        <span>{step.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-base text-muted-foreground">{step.desc}</CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-10 items-center">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-headline">Everything sellers need — together</h2>
                  <p className="mt-4 text-muted-foreground text-base">
                    Busmo blends your storefront, product management, orders, integrated payments, and delivery into one workflow.
                    That’s how we help business owners succeed: simple tools that create clarity (profit, cash, inventory, and orders) and keep you moving.
                  </p>
                </div>

                <Card className="rounded-2xl shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">Seller success, without the chaos</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 text-base">
                    {[
                      { title: 'Profit clarity', desc: 'Price confidently and protect your margin.' },
                      { title: 'Cash clarity', desc: 'Understand sales and payouts as they happen.' },
                      { title: 'Inventory clarity', desc: 'Restock smarter with visibility.' },
                      { title: 'Order clarity', desc: 'Fulfill consistently and build trust.' },
                    ].map((item) => (
                      <div key={item.title} className="rounded-xl border bg-background p-4 shadow-sm">
                        <div className="font-bold">{item.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">{item.desc}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-10 flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link href="/seller/login"><Button size="lg" className="rounded-full px-8">Go to Seller Dashboard</Button></Link>
                <Link href="/market"><Button size="lg" variant="secondary" className="rounded-full px-8">View Marketplace</Button></Link>
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
