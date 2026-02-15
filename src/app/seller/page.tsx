import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/app/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Package, Send, ShoppingCart, Store, Landmark, Menu, Instagram, Facebook } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function SellerLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/welcome" className="flex items-center gap-2">
            <Logo className="h-8" />
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/market">
              <Button variant="ghost" className="rounded-full">Marketplace</Button>
            </Link>
            <Link href="/seller/login">
              <Button className="rounded-full">Seller Login</Button>
            </Link>
          </div>

          <div className="sm:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs">
                <SheetHeader>
                  <SheetTitle>Seller menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-3">
                  <Link href="/market" className="w-full">
                    <Button variant="ghost" className="w-full justify-start">Marketplace</Button>
                  </Link>
                  <Link href="/seller/signup" className="w-full">
                    <Button className="w-full justify-start">Create Seller Account</Button>
                  </Link>
                  <Link href="/seller/login" className="w-full">
                    <Button variant="secondary" className="w-full justify-start">Seller Login</Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
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
                  <section className="py-16 bg-background border-b">
                    <div className="container mx-auto px-4">
                      <div className="mx-auto max-w-5xl">
                        <div className="text-center mb-8">
                          <h2 className="text-2xl sm:text-3xl font-bold font-headline">Seller Pricing</h2>
                          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Start with a 3-day free trial. Simple, transparent pricing for sellers.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="border rounded-lg p-4 bg-card">
                            <h3 className="font-semibold text-lg mb-2">Free Trial</h3>
                            <p className="text-muted-foreground mb-2">Try all features free for 3 days.</p>
                            <Link href="/seller/signup"><Button variant="secondary" className="w-full">Start Free Trial</Button></Link>
                          </div>
                          <div className="border rounded-lg p-4 bg-card">
                            <h3 className="font-semibold text-lg mb-2">Seller Plan</h3>
                            <p className="text-muted-foreground mb-2">₦1,500/month after trial. Cancel anytime.</p>
                            <Link href="/seller/signup"><Button className="w-full">Choose Plan</Button></Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
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
        <div className="container mx-auto flex flex-col gap-6 py-10 px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Busmo Seller Central helps you sell faster with simple tools.
            </div>

            <div className="flex items-center gap-4">
              <a href="https://x.com/busmohq" target="_blank" rel="noopener noreferrer" aria-label="X (formerly Twitter)">
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground hover:text-foreground fill-current"><title>X</title><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
              </a>
              <a href="https://instagram.com/busmo.io" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </a>
              <a href="https://facebook.com/busmo.io" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </a>
              <a
                href="https://www.tiktok.com/@busmo.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
                aria-label="TikTok @busmo.io"
              >
                TikTok @busmo.io
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
