import React, { useRef, useEffect, useState } from 'react';

const TESTIMONIALS = [
  {
    quote: '"Reduced stock shortages by 40%. Busmo\'s alerts tell me exactly when to restock before I run out. My customers are never disappointed anymore."',
    biz: "Aisha's Textiles, Abuja",
    outcome: "40% fewer stock shortages",
  },
  {
    quote: '"Identified ₦50,000 in monthly losses I didn\'t know about. Busmo showed me exactly where my money was going. Now I\'m actually profitable."',
    biz: "Femi's Suya Spot, Lagos",
    outcome: "₦50,000 monthly savings",
  },
  {
    quote: '"Increased sales by 35% in 3 months. Ask MO told me which products to promote and when. My revenue has never been better."',
    biz: "Chidi's Electronics, Kano",
    outcome: "35% sales increase",
  },
  {
    quote: '"Cut accounting time from 4 hours to 15 minutes per week. I spend more time growing my business and less time on paperwork."',
    biz: "Mama Nkechi's Supermarket, Ibadan",
    outcome: "94% time saved",
  },
  {
    quote: '"Recovered ₦120,000 in unpaid customer credit. Busmo reminded me who owed money and when. My cash flow is finally stable."',
    biz: "Olu's Pharmacy, Lagos",
    outcome: "₦120,000 recovered",
  },
  {
    quote: '"Staff productivity increased by 50%. My team records sales instantly on their phones. No more lost receipts or missing data."',
    biz: "Everyday Needs Grocers, PH",
    outcome: "50% productivity boost",
  },
];

export const TestimonialsSection: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (trackRef.current) {
      const cardWidth = trackRef.current.firstChild as HTMLElement;
      const scrollAmount = cardWidth ? cardWidth.offsetWidth + 20 : 0;
      trackRef.current.scrollTo({
        left: currentIndex * scrollAmount,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  return (
    <section className="testimonials-section">
      <div className="section-head center">
        <div className="section-label">Real Stories</div>
        <h2 className="section-title">
          Loved by business owners<br />across Africa.
        </h2>
      </div>

      {/* Horizontal scroll track */}
      <div className="testi-track" ref={trackRef}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="testi-card">
            <div className="testi-stars">★★★★★</div>
            <div className="testi-quote">{t.quote}</div>
            {t.outcome && <div className="testi-outcome">{t.outcome}</div>}
            <div className="testi-biz">{t.biz}</div>
          </div>
        ))}
      </div>

      <div className="testi-dots">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            className={`testi-dot ${i === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(i)}
          />
        ))}
      </div>
    </section>
  );
};
