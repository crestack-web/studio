import React from 'react';
import { Page } from '../types';
import { Footer } from '../components/Footer';

interface BusmoGoPageProps {
  onNavigate: (page: Page) => void;
}

export const BusmoGoPage: React.FC<BusmoGoPageProps> = ({ onNavigate }) => (
  <div className="busmogo-section">
    <section style={{ padding: 'calc(var(--nav-h) + 64px) 5% 64px', textAlign: 'center' }}>
      <div className="section-label" style={{ color: 'var(--purple-mid)' }}>BusmoGo</div>
      <h1 className="section-title" style={{ color: 'white', fontSize: 'clamp(2rem,4vw,3.2rem)' }}>
        Your Business,<br />Delivered. <em style={{ color: 'var(--purple-mid)' }}>Fast.</em>
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
        Get your products to your customers' doorsteps. BusmoGo is our integrated delivery network designed for speed and peace of mind.
      </p>
      <button className="btn-primary btn-large" onClick={() => onNavigate('signup')}>Start Selling with BusmoGo</button>
    </section>

    <section style={{ padding: '0 5% 64px' }}>
      <div className="max-w">
        <div className="section-head center" style={{ marginBottom: 32 }}>
          <div className="section-label" style={{ color: 'var(--purple-mid)' }}>How It Works</div>
          <h2 className="section-title" style={{ color: 'white' }}>4 Simple Steps</h2>
        </div>
        <div className="busmogo-grid">
          {[
            { icon: '🛒', title: '1. Order is Placed', desc: 'A customer buys a product and selects BusmoGo delivery at checkout.' },
            { icon: '🏍️', title: '2. Rider Dispatched', desc: 'Our system assigns the nearest available delivery agent to pick up from the merchant.' },
            { icon: '📦', title: '3. Secure Pickup & Transit', desc: 'The agent securely packages the item and starts delivery with real-time status updates.' },
            { icon: '✅', title: '4. Order Delivered', desc: 'Customer receives their order. Delivery marked complete in your dashboard.' },
          ].map((s, i) => (
            <div key={i} className="busmogo-card">
              <div className="busmogo-card-icon">{s.icon}</div>
              <div className="busmogo-card-title">{s.title}</div>
              <div className="busmogo-card-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section style={{ padding: '0 5% 80px' }}>
      <div className="max-w">
        <div className="section-head center" style={{ marginBottom: 32 }}>
          <div className="section-label" style={{ color: 'var(--purple-mid)' }}>Transparent Pricing</div>
          <h2 className="section-title" style={{ color: 'white' }}>Simple Delivery Rates</h2>
        </div>
        <div className="rates-table">
          <table>
            <thead>
              <tr><th>Zone</th><th>Average Rate</th></tr>
            </thead>
            <tbody>
              {[
                ['Intra-City (Lagos)', '₦2,500 – ₦4,000'],
                ['Intra-City (Abuja)', '₦3,000 – ₦4,500'],
                ['Intra-City (Accra)', 'GH₵35 – GH₵55'],
                ['Nationwide (Nigeria)', 'From ₦5,000'],
              ].map(([zone, rate]) => (
                <tr key={zone}><td>{zone}</td><td className="rate-value">{rate}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 12, textAlign: 'center' }}>
          Final price based on exact distance. A small handling fee applies for quality and insurance.
        </p>
      </div>
    </section>

    <section style={{ padding: '0 5% 80px' }}>
      <div className="max-w">
        <div className="section-head center" style={{ marginBottom: 32 }}>
          <div className="section-label" style={{ color: 'var(--purple-mid)' }}>Join the Network</div>
          <h2 className="section-title" style={{ color: 'white' }}>Earn with BusmoGo</h2>
          <p className="section-sub" style={{ color: 'rgba(255,255,255,0.55)' }}>We're empowering local entrepreneurs. Turn your resources into recurring income.</p>
        </div>
        <div className="busmogo-grid">
          {[
            { icon: '🏍️', title: 'Become a Rider', desc: 'Turn your bike into a business. Get a steady stream of delivery jobs, earn competitive fees, and get paid instantly. All you need: a bike, a smartphone, and a guarantor.' },
            { icon: '🤝', title: 'Become a Guarantor', desc: 'Vouch for a rider you trust and earn a commission on every successful delivery they make. A simple way to invest in your community.' },
            { icon: '🏪', title: 'Become a Dispatch Shop', desc: 'Earn by handling drop-offs, scanning, sorting, and handoff to drivers. Receive packages from nearby stores and coordinate deliveries.' },
            { icon: '🔐', title: 'Already a Delivery Agent?', desc: 'Sign in to your BusmoGo Delivery Agent dashboard to manage your deliveries and earnings.' },
          ].map((c, i) => (
            <div key={i} className="busmogo-card" style={i === 3 ? { borderColor: 'var(--purple)', cursor: 'pointer' } : {}}>
              <div className="busmogo-card-icon">{c.icon}</div>
              <div className="busmogo-card-title">{c.title}</div>
              <div className="busmogo-card-desc">{c.desc}</div>
              {i === 3 && <div style={{ marginTop: 12, color: 'var(--purple-mid)', fontWeight: 600, fontSize: '0.875rem' }}>Sign In →</div>}
            </div>
          ))}
        </div>
      </div>
    </section>

    <Footer onNavigate={onNavigate} minimal />
  </div>
);
