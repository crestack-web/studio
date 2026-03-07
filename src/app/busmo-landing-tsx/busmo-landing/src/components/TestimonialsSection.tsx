import React, { useRef, useEffect } from 'react';

const TESTIMONIALS = [
  {
    quote: '"For the first time, I can see my daily profit in seconds. No more counting cash and guessing. Busmo is my new business partner."',
    name: 'Femi Adeyemi',
    biz: "Femi's Suya Spot, Lagos",
    avatar: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=80&q=80',
  },
  {
    quote: '"I used to run out of my best-selling fabrics. Now, Busmo tells me when to restock. My customers are happier, and my sales are up."',
    name: 'Aisha Bello',
    biz: "Aisha's Textiles, Abuja",
    avatar: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=80&q=80',
  },
  {
    quote: '"Managing expenses was a headache. With Busmo, I can see exactly where my money is going. It\'s simple, powerful, and built for people like me."',
    name: 'John Okafor',
    biz: 'Everyday Needs Grocers, PH',
    avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&q=80',
  },
  {
    quote: '"I opened my online store in one afternoon. BusmoPay sorted payments and BusmoGo delivers my products. The whole thing just works."',
    name: 'Ngozi Eze',
    biz: "Ngozi's Beauty Hub, Enugu",
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80',
  },
  {
    quote: '"As an investor, the live business data I get from Busmo is unmatched. I funded three businesses this quarter using verified profit signals."',
    name: 'Chidi Okonkwo',
    biz: 'Angel Investor, Lagos',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
  },
  {
    quote: '"We manage 4 branches from one dashboard now. No more WhatsApp reports, no more guessing games. Busmo changed how we operate."',
    name: 'Taiwo Adeleke',
    biz: 'Adeleke Supermarkets (4 Locations)',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80',
  },
];

export const TestimonialsSection: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging = true;
    startX = e.pageX - (trackRef.current?.offsetLeft || 0);
    scrollLeft = trackRef.current?.scrollLeft || 0;
    trackRef.current?.classList.add('grabbing');
  };

  const onMouseUp = () => {
    isDragging = false;
    trackRef.current?.classList.remove('grabbing');
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - (trackRef.current.offsetLeft || 0);
    const walk = (x - startX) * 1.5;
    trackRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className="testimonials-section">
      <div className="section-head center">
        <div className="section-label">Real Stories</div>
        <h2 className="section-title">
          Loved by business owners<br />across Africa.
        </h2>
      </div>

      {/* Horizontal scroll track */}
      <div
        className="testi-track"
        ref={trackRef}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="testi-card">
            <div className="testi-stars">★★★★★</div>
            <div className="testi-quote">{t.quote}</div>
            <div className="testi-author">
              <img className="testi-avatar" src={t.avatar} alt={t.name} />
              <div>
                <div className="testi-name">{t.name}</div>
                <div className="testi-biz">{t.biz}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="testi-scroll-hint">
        <span>←</span>
        <span>Scroll to read more stories</span>
        <span>→</span>
      </div>
    </section>
  );
};
