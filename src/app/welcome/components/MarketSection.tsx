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
          <div className="section-label">Online Store</div>
          <h2 className="section-title" style={{ fontSize: '1.5rem' }}>
            Launch Your Store.<br />
            <em>Sync with Busmo.</em>
          </h2>
          <p className="section-sub" style={{ fontSize: '0.85rem' }}>
            Beautiful storefronts that sync with your Busmo inventory. Join the waitlist.
          </p>
          <ul className="market-bullets" style={{ fontSize: '0.8rem' }}>
            <li>
              <span className="icon">🎨</span>
              <span>Professional themes</span>
            </li>
            <li>
              <span className="icon">⚡</span>
              <span>Instant product sync</span>
            </li>
            <li>
              <span className="icon"></span>
              <span>BusmoPay checkout</span>
            </li>
            <li>
              <span className="icon">📊</span>
              <span>Unified analytics</span>
            </li>
          </ul>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => onNavigate('seller')} style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
              Join Waitlist →
            </button>
          </div>
        </div>

        {/* Right: 2 store theme cards */}
        <div className="storefront-showcase" style={{ gap: 16 }}>
          <StoreThemeCard
            storeName="Aisha's Crafts"
            category="Fashion"
            themeColors={{ primary: '#6B3FE7', accent: '#8B62F0', bg: '#EDE8FC' }}
            products={['#C4B5FD', '#8B62F0', '#F3E8FF', '#DDD6FE']}
            isActive
          />
          <StoreThemeCard
            storeName="Femi's Organics"
            category="Food"
            themeColors={{ primary: '#16A34A', accent: '#22C55E', bg: '#DCFCE7' }}
            products={['#86EFAC', '#4ADE80', '#BBF7D0', '#DCFCE7']}
          />
        </div>
      </div>
    </div>
  </section>
);
