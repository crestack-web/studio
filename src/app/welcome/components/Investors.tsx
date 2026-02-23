import { Check } from 'lucide-react';
import { Button } from "./Button";

export function Investors() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="text-xs font-bold uppercase text-gray-400 mb-4">Live Opportunities</div>
            <div className="mb-4 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white rounded-lg p-4 border">
                <div>
                  <div className="font-semibold">Aisha's Crafts</div>
                  <div className="text-xs text-gray-400">Fashion · Lagos, NG · Verified <Check className="inline w-4 h-4 text-green-500" /></div>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-bold">18% ROI</div>
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Open</div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg p-4 border">
                <div>
                  <div className="font-semibold">Femi's Farm</div>
                  <div className="text-xs text-gray-400">Agriculture · Oyo, NG · Verified <Check className="inline w-4 h-4 text-green-500" /></div>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-bold">22% ROI</div>
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Open</div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg p-4 border">
                <div>
                  <div className="font-semibold">City Electronics</div>
                  <div className="text-xs text-gray-400">Retail · Abuja, NG · Verified <Check className="inline w-4 h-4 text-green-500" /></div>
                </div>
                <div className="text-right">
                  <div className="text-green-600 font-bold">15% ROI</div>
                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Open</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-purple-700 mb-2">For Investors</div>
            <h2 className="font-headline text-3xl sm:text-4xl font-extrabold mb-3">
              Invest in Africa's<br /><em className="not-italic text-purple-700">Growth Engine.</em>
            </h2>
            <p className="text-gray-600 mb-6">
              Discover and fund the next generation of small businesses, backed by real-time, trusted data from Busmo.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-purple-700" /> Explore data-verified opportunities with transparent signals</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-purple-700" /> Reduce risk with real-time business health data</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-purple-700" /> Invest in profit-sharing or equity-based deals</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-purple-700" /> Track returns and portfolio performance in one place</li>
            </ul>
            <Button as="a" href="#invest" variant="primary">
              Explore Investments &rarr;
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}