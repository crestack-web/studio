import React, { useState } from 'react';

const FAQS = [
  {
    q: 'Is Busmo another accounting app?',
    a: 'No. Busmo is a clarity and decision-making tool. While accounting software generates reports for accountants, Busmo answers your real questions instantly — "Did I make profit today?", "Which product should I restock?" We speak your language, not accounting jargon.',
  },
  {
    q: 'Can I use Busmo if I work offline?',
    a: 'Yes! Busmo is offline-first. You can record sales, add products, log expenses, and manage inventory without an internet connection. Your data syncs automatically when you\'re back online.',
  },
  {
    q: 'Is my business data safe?',
    a: 'Absolutely. Your data is encrypted and stored securely. Only you and the staff members you invite have access to your business data. We never share your data with third parties without your consent.',
  },
  {
    q: 'What if I sell services, not products?',
    a: 'Busmo is currently optimised for product-based businesses — shops, grocers, food stalls, manufacturers, and market sellers. Service-based business support is on our roadmap.',
  },
  {
    q: 'How does the free trial work?',
    a: 'All plans come with a 3-day free trial. No credit card is required to start. You get full access to all features during the trial. At the end of your trial, choose the plan that fits your business — or cancel anytime.',
  },
  {
    q: 'Can I upgrade or downgrade my plan later?',
    a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="faq-section">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">FAQ</div>
          <h2 className="section-title">Common Questions</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className={`faq-item ${openIndex === i ? 'open' : ''}`}
              onClick={() => toggle(i)}
            >
              <div className="faq-q">
                {faq.q}
                <span className="faq-arrow">▾</span>
              </div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
