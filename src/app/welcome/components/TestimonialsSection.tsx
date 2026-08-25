import React, { useRef, useEffect, useState } from 'react';

/** Qualitative owner themes — uses existing testi-* CSS classes. */
const TESTIMONIALS = [
  {
    quote: '"I make sales every day, but I used to struggle to know whether cash and stock still matched what happened in the shop."',
    theme: "Visibility",
  },
  {
    quote: '"When staff handle money, I need a clear way to see activity — not just a receipt total at the end of the day."',
    theme: "Accountability",
  },
  {
    quote: '"Revenue looked fine on paper. What I needed was a clearer sense of whether I was actually making profit."',
    theme: "Profit clarity",
  },
  {
    quote: '"I cannot stand in the shop all day. I need to know what is happening when I am not there."',
    theme: "Remote control",
  },
  {
    quote: '"Stock, sales and expenses lived in different places. Putting them together is what finally made sense of the business."',
    theme: "Connected numbers",
  },
  {
    quote: '"Offline days used to mean lost records. Being able to keep recording without network changes the day."',
    theme: "Offline work",
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
        <div className="section-label">What owners care about</div>
        <h2 className="section-title">
          The same problems show up<br />in growing businesses.
        </h2>
        <p className="section-sub">
          Sales without clarity. Stock without certainty. Cash without a clear trail.
        </p>
      </div>

      <div className="testi-track" ref={trackRef}>
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="testi-card">
            <div className="testi-quote">{t.quote}</div>
            <div className="testi-biz">{t.theme}</div>
          </div>
        ))}
      </div>

      <div className="testi-dots">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`testi-dot ${i === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
