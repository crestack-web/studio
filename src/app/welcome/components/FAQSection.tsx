import React, { useState } from 'react';

const FAQS = [
  {
    q: 'What is Busmo?',
    a: 'Busmo is a business control system for growing African businesses. It connects sales, stock, cash, staff and profit so you can see what is happening inside your business — even when you are not there.',
  },
  {
    q: 'Is Busmo another POS or accounting app?',
    a: 'No. A POS records transactions. Accounting software produces reports for accountants. Busmo is built for the owner: operational control over sales, inventory, money movement, staff activity and real profit — in plain language.',
  },
  {
    q: 'What is Money Control?',
    a: 'Money Control helps you connect sales activity with the money your business should have received. It improves visibility and accountability so you can identify discrepancies — not a guarantee of zero losses, but clearer control.',
  },
  {
    q: 'Can I use Busmo offline?',
    a: 'Yes. You can record sales and keep working without internet. Data syncs when you reconnect.',
  },
  {
    q: 'Who is Busmo for?',
    a: 'Growing businesses that have moved beyond notebooks, spreadsheets and memory — retail, wholesale, fashion, restaurants, supermarkets, multi-staff and multi-location operations.',
  },
  {
    q: 'How does the free trial work?',
    a: 'All plans include a 3-day free trial. No credit card required to start. Cancel anytime.',
  },
  {
    q: 'What is Mo-sell?',
    a: 'Mo-sell is the online storefront path in the Busmo ecosystem — for selling through social media, WhatsApp and your audience. Busmo is where you understand and control the business; Mo-sell is where you sell online.',
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
