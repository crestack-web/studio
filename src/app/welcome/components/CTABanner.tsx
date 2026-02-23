import "../../globals.css"; // Ensure global styles including .btn are loaded

export function CTABanner() {
  return (
    <div className="bg-purple-700 py-20 text-center text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <h2 className="font-headline text-3xl sm:text-4xl font-extrabold mb-3">
        The Future of Your Business<br />Starts With Clarity.
      </h2>
      <p className="text-white/80 text-lg mb-8">
        Join smart business owners across Africa who are building their future with Busmo.
      </p>
      <a
        href="#signup"
        className="btn btn-primary text-lg px-8 py-4 font-bold"
      >
        Start Your Free Trial Today
      </a>
      <div className="text-white/60 text-xs mt-4">
        14-day free trial · No credit card · Works offline
      </div>
    </div>
  );
}