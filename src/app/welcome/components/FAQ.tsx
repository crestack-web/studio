"use client";
// filepath: src/app/welcome/components/FAQ.tsx
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: "Is Busmo another accounting app?",
    a: "No. Busmo is a clarity and decision-making tool. While accounting software generates reports for accountants, Busmo answers your real questions instantly — \"Did I make profit today?\", \"Which product should I restock?\" We speak your language, not accounting jargon."
  },
  {
    q: "Can I use Busmo if I work offline?",
    a: "Yes! Busmo is offline-first. You can record sales, add products, log expenses, and manage inventory without an internet connection. Your data syncs automatically when you're back online."
  },
  {
    q: "Is my business data safe?",
    a: "Absolutely. Your data is encrypted and stored securely. Only you and the staff members you invite have access to your business data. We never share your data with third parties without your consent."
  },
  {
    q: "What if I sell services, not products?",
    a: "Busmo is currently optimised for product-based businesses — shops, grocers, food stalls, manufacturers, and market sellers. Service-based business support is on our roadmap."
  },
  {
    q: "How does the free trial work?",
    a: "All plans come with a 14-day free trial. No credit card is required to start. You get full access to all features during the trial. At the end of your trial, choose the plan that fits your business — or cancel anytime."
  },
  {
    q: "Can I upgrade or downgrade my plan later?",
    a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."
  }
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white py-24">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="text-xs font-bold uppercase text-purple-700 mb-2">FAQ</div>
          <h2 className="font-headline text-3xl sm:text-4xl font-extrabold mb-3">Common Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border rounded-lg p-4 cursor-pointer transition ${open === i ? 'border-purple-700 bg-purple-50' : 'border-gray-200 bg-white'}`}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="flex items-center justify-between font-semibold text-lg">
                {faq.q}
                <ChevronDown className={`w-5 h-5 transition-transform ${open === i ? 'rotate-180 text-purple-700' : 'text-gray-400'}`} />
              </div>
              <div className={`overflow-hidden transition-all text-gray-600 text-base ${open === i ? 'max-h-40 mt-2' : 'max-h-0'}`}>
                {open === i && <div>{faq.a}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}