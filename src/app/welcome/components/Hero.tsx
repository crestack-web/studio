import { Button } from "./Button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-white text-center px-4 pt-32 pb-20">
      {/* Radial gradient background to match HTML */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(107,63,231,0.08) 0%, transparent 70%)'
        }}
      />
      {/* Animated pulse effect */}
      <div
        className="absolute left-1/2 top-1/2 z-0 pointer-events-none"
        style={{
          width: 600,
          height: 600,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(107,63,231,0.06) 0%, transparent 70%)',
          animation: 'pulse 6s ease-in-out infinite'
        }}
      />
      {/* Add pulse keyframes */}
      <style>
        {`
          @keyframes pulse {
            0%,100%{transform:translate(-50%,-50%) scale(1);opacity:1}
            50%{transform:translate(-50%,-50%) scale(1.15);opacity:0.7}
          }
        `}
      </style>
      <div className="relative z-10 max-w-3xl mx-auto text-black">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold text-sm mb-7">
          <span className="w-2 h-2 rounded-full bg-purple-700 animate-pulse" />
          Built for Africa's Businesses
        </div>
        <h1 className="font-headline text-8xl sm:text-10xl md:text-12xl font-extrabold mb-5 leading-tight">
          Sell. Track. Grow.<br />
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-9">
          Busmo powers physical sellers and digital creators with storefronts, payments, and smart business tools — built for Africa.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <Button size="lg" className="text-lg px-8 py-4">
            Start Free Trial — No Card Needed
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2 border-purple-700 text-purple-700 hover:bg-purple-50">
            See Pricing
          </Button>
        </div>
        <div className="text-xs text-gray-400">
          14-day free trial · Cancel anytime · Works offline
        </div>
      </div>
    </section>
  );
}