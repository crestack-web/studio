import React from 'react';
import { Page } from '../types';
import { Footer } from '../components/Footer';

interface SellerPageProps {
  onNavigate: (page: Page) => void;
}

export const SellerPage: React.FC<SellerPageProps> = ({ onNavigate }) => (
  <div>
    {/* Hero */}
    <div className="seller-hero">
      <div className="seller-badge">🛍️ Open for Everyone — Join Free</div>
      <h1>
        Sell Online.<br />
        <em style={{ color: 'var(--green)' }}>Look Professional Doing It.</em>
      </h1>
      <p>
        Get a stunning storefront, reach customers across Africa, and let Busmo
        handle payments, delivery, and business tracking — all in one place.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary btn-large" onClick={() => onNavigate('signup')}>
          Get Your Seller Account — Free
        </button>
        <button className="btn-outline-large" onClick={() => onNavigate('login')}>
          Already a seller? Sign In
        </button>
      </div>
    </div>

    {/* Features grid */}
    <div className="seller-features-grid">
      {[
        { icon: '🎨', title: 'Beautiful Storefront Themes', desc: 'Choose from professionally designed themes. Customise your colours, banner, and layout — no coding needed. Your store looks great on any device.' },
        { icon: '📦', title: 'Easy Product Listings', desc: 'Add products directly from your Busmo inventory, set prices and stock levels, and publish in seconds. Bulk upload also available.' },
        { icon: '💳', title: 'BusmoPay Checkout', desc: 'Customers pay securely via card, bank transfer, or USSD. Funds settle to your verified account with a clear payout history.' },
        { icon: '🚚', title: 'BusmoGo Delivery', desc: 'Every order comes with built-in delivery. Riders are dispatched from your location, with real-time tracking for you and your customer.' },
        { icon: '📊', title: 'Sales Sync to Dashboard', desc: 'Every order from your storefront automatically flows into your Busmo dashboard — updating profit, inventory, and forecasts instantly.' },
        { icon: '🌍', title: 'Busmo Market Reach', desc: 'Your products appear in the Busmo Market discovery feed, reaching buyers searching for items across Nigeria, Ghana, and beyond.' },
      ].map((f, i) => (
        <div key={i} className="seller-feat-card">
          <div className="seller-feat-icon">{f.icon}</div>
          <div className="seller-feat-title">{f.title}</div>
          <div className="seller-feat-desc">{f.desc}</div>
        </div>
      ))}
    </div>

    {/* How it works */}
    <div className="how-it-works-section">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">Getting Started</div>
          <h2 className="section-title">Up and selling in <em>4 steps</em></h2>
        </div>
        <div className="steps-row">
          {[
            { n: '1', title: 'Create Account', desc: 'Sign up free — no credit card needed.' },
            { n: '2', title: 'Pick a Theme', desc: 'Choose a professional storefront design.' },
            { n: '3', title: 'List Products', desc: 'Add items from inventory or create new ones.' },
            { n: '4', title: 'Start Selling', desc: 'Share your store link and take orders.' },
          ].map((s, i) => (
            <div key={i} className="step-item">
              <div className="step-num">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Payment features */}
    <section className="pay-section">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">BusmoPay</div>
          <h2 className="section-title">Payments that <em>just work.</em></h2>
        </div>
        <div className="pay-grid">
          <div className="pay-card">
            <div className="pay-icon">🔐</div>
            <div className="pay-title">Secure Collection</div>
            <div className="pay-desc">Customer payments are captured and tracked as transactions. Every naira accounted for.</div>
          </div>
          <div className="pay-card">
            <div className="pay-icon">🏦</div>
            <div className="pay-title">Reliable Payouts</div>
            <div className="pay-desc">Earnings settle to your verified bank account with a clear payout history for easy reconciliation.</div>
          </div>
          <div className="pay-card">
            <div className="pay-icon">📊</div>
            <div className="pay-title">Connected Reporting</div>
            <div className="pay-desc">Payments feed directly into your Busmo dashboard. Sales, fulfillment, and payouts — all in sync.</div>
          </div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <div className="cta-banner">
      <h2>Ready to sell online<br />the professional way?</h2>
      <p>Join thousands of sellers already on Busmo Market.</p>
      <button className="btn-white" onClick={() => onNavigate('signup')}>Get Your Seller Account — Free</button>
      <div className="cta-note">No setup fees · Cancel anytime</div>
    </div>

    <Footer onNavigate={onNavigate} minimal />
  </div>
);
