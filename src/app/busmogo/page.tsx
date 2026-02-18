// BusmoGo public page - migrated to match new UI style, with app logo and SVG icons
import { Logo } from '@/components/app/logo';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function BusmoGoPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Logo className="h-8" />
            <span className="font-display font-extrabold text-xl text-primary">Busmo</span>
          </div>
        </div>
      </header>
      <section className="py-20 sm:py-32 bg-gradient-to-b from-black to-gray-900 text-white text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline mb-4">Your Business, Delivered. <span className="text-purple-400">Fast.</span></h1>
          <p className="max-w-xl mx-auto text-lg text-gray-300 mb-8">Get your products to your customers' doorsteps. BusmoGo is our integrated delivery network designed for speed and peace of mind.</p>
          <Button size="lg" className="bg-purple-600 text-white h-14 text-lg">Start Selling with BusmoGo</Button>
        </div>
      </section>
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-headline text-black">How It Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl shadow">
              <span className="mb-3"><svg className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M8 16c0-2.5 2-4.5 4-4.5s4 2 4 4.5" stroke="currentColor" strokeWidth="2"/><path d="M12 12V8m0 0l2 2m-2-2l-2 2" stroke="currentColor" strokeWidth="2"/></svg></span>
              <h3 className="font-bold text-lg mb-2">Order is Placed</h3>
              <p className="text-muted-foreground">A customer buys a product and selects BusmoGo delivery at checkout.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl shadow">
              <span className="mb-3"><svg className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="13" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M8 7V5a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="2"/></svg></span>
              <h3 className="font-bold text-lg mb-2">Rider Dispatched</h3>
              <p className="text-muted-foreground">Our system assigns the nearest available delivery agent to pick up from the merchant.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl shadow">
              <span className="mb-3"><svg className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="18" r="1" fill="currentColor"/></svg></span>
              <h3 className="font-bold text-lg mb-2">Secure Pickup & Transit</h3>
              <p className="text-muted-foreground">The agent securely packages the item and starts delivery with real-time status updates.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl shadow">
              <span className="mb-3"><svg className="h-10 w-10 text-purple-600" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M8 16c0-2.5 2-4.5 4-4.5s4 2 4 4.5" stroke="currentColor" strokeWidth="2"/><path d="M12 12V8m0 0l2 2m-2-2l-2 2" stroke="currentColor" strokeWidth="2"/></svg></span>
              <h3 className="font-bold text-lg mb-2">Order Delivered</h3>
              <p className="text-muted-foreground">Customer receives their order. Delivery marked complete in your dashboard.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold font-headline text-black">Simple Delivery Rates</h2>
          </div>
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8">
            <table className="w-full text-left">
              <thead>
                <tr><th className="py-2">Zone</th><th className="py-2">Average Rate</th></tr>
              </thead>
              <tbody>
                <tr><td>Intra-City (Lagos)</td><td className="font-bold">₦2,500 – ₦4,000</td></tr>
                <tr><td>Intra-City (Abuja)</td><td className="font-bold">₦3,000 – ₦4,500</td></tr>
                <tr><td>Intra-City (Accra)</td><td className="font-bold">GH₵35 – GH₵55</td></tr>
                <tr><td>Nationwide (Nigeria)</td><td className="font-bold">From ₦5,000</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-3">Final price based on exact distance. A small handling fee applies for quality and insurance.</p>
          </div>
        </div>
      </section>
      <footer className="bg-card border-t mt-16">
        <div className="container mx-auto flex flex-col gap-6 py-10 px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              BusmoGo helps you deliver faster with simple tools.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
