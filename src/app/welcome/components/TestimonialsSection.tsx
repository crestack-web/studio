import React, { useRef, useEffect, useState } from 'react';

const TESTIMONIALS = [
  {
    quote: '"For the first time, I can see my daily profit in seconds. No more counting cash and guessing. Busmo is my new business partner."',
    biz: "Femi's Suya Spot, Lagos",
  },
  {
    quote: '"I used to run out of my best-selling fabrics. Now, Busmo tells me when to restock. My customers are happier, and my sales are up."',
    biz: "Aisha's Textiles, Abuja",
  },
  {
    quote: '"Managing expenses was a headache. With Busmo, I can see exactly where my money is going. It\'s simple, powerful, and built for people like me."',
    biz: 'Everyday Needs Grocers, PH',
  },
  {
    quote: '"Ask Mo is like having a smart business advisor on my phone. I just ask "How is my business doing?" and get instant insights about my profit and inventory."',
    biz: "Chidi's Electronics, Kano",
  },
  {
    quote: '"I can finally track my cash flow in real-time. Busmo shows me when money comes in and goes out, so I never run into cash shortages anymore."',
    biz: "Mama Nkechi's Supermarket, Ibadan",
  },
  {
    quote: '"My staff can now record sales from their phones. I see everything in my dashboard instantly. It\'s made managing my business so much easier."',
    biz: "Olu's Pharmacy, Lagos",
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
