import React from 'react';
import { Page } from '../types';

interface MarketSectionProps {
  onNavigate: (page: Page) => void;
}

// Professional store theme mocks using SVG-based visual mockups
const StoreThemeCard: React.FC<{
  storeName: string;
  category: string;
  themeColors: { primary: string; accent: string; bg: string };
  products: string[];
  isActive?: boolean;
}> = ({ storeName, category, themeColors, products, isActive }) => (
  <div className={`store-theme-card ${isActive ? 'active-store' : ''}`}>
    {/* Browser chrome */}
    <div className="store-mock-header">
      <div className="store-mock-dot" style={{ background: '#FF5F57' }} />
      <div className="store-mock-dot" style={{ background: '#FEBC2E' }} />
      <div className="store-mock-dot" style={{ background: '#28C840' }} />
      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginLeft: 6, overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
        busmo.market/{storeName.toLowerCase().replace(/\s/g, '')}
      </div>
    </div>
    {/* Store content mock */}
    <div className="store-mock-content">
      {/* Hero banner */}
      <div
        className="store-mock-banner"
        style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ fontSize: '0.6rem', color: 'white', fontWeight: 700, opacity: 0.9 }}>{storeName}</span>
      </div>
      {/* Products row */}
      <div className="store-mock-products">
        {products.map((color, i) => (
          <div key={i} className="store-mock-product" style={{ background: color }} />
        ))}
      </div>
    </div>
    {/* Store info */}
    <div className="store-info">
      <div className="store-name">{storeName}</div>
      <div className="store-meta">{category} · Busmo Seller</div>
    </div>
    <div className="store-badge">Live ✓</div>
  </div>
);

export const MarketSection: React.FC<MarketSectionProps> = ({ onNavigate }) => (
  <section className="market-section">
    <div className="max-w">
      <div className="market-grid">
        {/* Left: copy */}
        <div>
          <div className="section-label">Busmo Market</div>
          <h2 className="section-title">
            Launch Your Online Store.<br />
            <em>Professional-Grade, Built for Africa.</em>
          </h2>
          <p className="section-sub">
            Create a professional online storefront in minutes. Get industry-leading features with 
            BusmoPay integration, real-time analytics, and automatic inventory sync — all from your Busmo dashboard.
          </p>
          <ul className="market-bullets">
            <li>
              <span className="icon">🎨</span>
              <span><strong>Professional Storefronts</strong> — Beautiful, customizable themes. No coding needed.</span>
            </li>
            <li>
              <span className="icon">⚡</span>
              <span><strong>Instant Product Sync</strong> — List products from your Busmo inventory in seconds.</span>
            </li>
            <li>
              <span className="icon">📊</span>
              <span><strong>Advanced Analytics</strong> — Track sales, visitors, and conversion rates.</span>
            </li>
            <li>
              <span className="icon">🌍</span>
              <span><strong>Custom Domain Support</strong> — Use your own domain (Standard+ plans).</span>
            </li>
            <li>
              <span className="icon">💳</span>
              <span><strong>BusmoPay Integration</strong> — Secure payments, automatic payouts to your account.</span>
            </li>
            <li>
              <span className="icon">🚚</span>
              <span><strong>Integrated Delivery</strong> — Built-in shipping for every order.</span>
            </li>
          </ul>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => onNavigate('signup')}>
              Start Your Free Store →
            </button>
            <button className="btn-outline-large" style={{ fontSize: '0.875rem', padding: '9px 18px', borderRadius: 10 }} onClick={() => onNavigate('seller')}>
              See Pricing Plans
            </button>
          </div>
        </div>

        {/* Right: 4 store theme cards */}
        <div className="storefront-showcase">
          <StoreThemeCard
            storeName="Aisha's Crafts"
            category="Fashion & Accessories"
            themeColors={{ primary: '#6B3FE7', accent: '#8B62F0', bg: '#EDE8FC' }}
            products={['#C4B5FD', '#8B62F0', '#F3E8FF', '#DDD6FE']}
            isActive
          />
          <StoreThemeCard
            storeName="Femi's Organics"
            category="Food & Agriculture"
            themeColors={{ primary: '#16A34A', accent: '#22C55E', bg: '#DCFCE7' }}
            products={['#86EFAC', '#4ADE80', '#BBF7D0', '#DCFCE7']}
          />
          <StoreThemeCard
            storeName="City Electronics"
            category="Electronics & Tech"
            themeColors={{ primary: '#0F172A', accent: '#334155', bg: '#F1F5F9' }}
            products={['#CBD5E1', '#94A3B8', '#E2E8F0', '#64748B']}
          />
          <StoreThemeCard
            storeName="Tunde's Textiles"
            category="Fabrics & Clothing"
            themeColors={{ primary: '#D97706', accent: '#F59E0B', bg: '#FEF3C7' }}
            products={['#FDE68A', '#F59E0B', '#FEF3C7', '#D97706']}
          />
        </div>
      </div>
    </div>
  </section>
);
