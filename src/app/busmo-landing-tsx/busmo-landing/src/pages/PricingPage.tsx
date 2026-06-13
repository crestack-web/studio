import React, { useState } from 'react';
import { Page } from '../types';
import { Footer } from '../components/Footer';

interface PricingPageProps {
  onNavigate: (page: Page) => void;
}

const prices = {
  monthly: { shop: '₦1,000', super: '₦10,000', branch: '₦30,000', company: '₦50,000' },
  yearly: { shop: '₦830', super: '₦8,300', branch: '₦24,900', company: '₦41,500' },
};
const yearlyNotes = {
  shop: 'Billed ₦9,960/yr — save ₦2,040',
  super: 'Billed ₦99,600/yr — save ₦20,400',
  branch: 'Billed ₦298,800/yr — save ₦61,200',
  company: 'Billed ₦498,000/yr — save ₦102,000',
};

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const p = prices[billing];

  return (
    <div className="pricing-page">
      <div className="pricing-hero">
        <h1>Simple, Transparent Pricing</h1>
        <p>Start free. Scale as your business grows. No hidden fees.</p>
        <div className="pricing-toggle">
          <button className={billing === 'monthly' ? 'active' : ''} onClick={() => setBilling('monthly')}>Monthly</button>
          <button className={billing === 'yearly' ? 'active' : ''} onClick={() => setBilling('yearly')}>Yearly</button>
        </div>
        {billing === 'yearly' && <span className="save-badge">🎉 Save 17%</span>}
      </div>

      <div className="plans-grid">
        {/* SHOP */}
        <div className="plan-card">
          <div className="plan-name">Shop</div>
          <div className="plan-desc">For solo entrepreneurs &amp; small shops</div>
          <div className="plan-price">
            <span className="plan-amount">{p.shop}</span>
            <span className="plan-period"> / month</span>
          </div>
          <div className="plan-yearly-note">{billing === 'yearly' ? yearlyNotes.shop : ''}</div>
          <hr className="plan-divider" />
          <div className="plan-feature-label">Includes</div>
          <ul className="plan-features">
            <li><span className="check">✓</span> Unlimited Sales Records</li>
            <li><span className="check">✓</span> Inventory Management</li>
            <li><span className="check">✓</span> Expense Tracking</li>
            <li><span className="check">✓</span> Ask Busmo AI</li>
            <li><span className="check">✓</span> Busmo Market Storefront</li>
            <li className="inactive"><span className="cross">✗</span> Staff Members</li>
            <li className="inactive"><span className="cross">✗</span> Multiple Branches</li>
          </ul>
          <button className="plan-cta-btn" onClick={() => onNavigate('signup')}>Start Free Trial</button>
        </div>

        {/* SUPERMARKET */}
        <div className="plan-card popular">
          <div className="popular-tag">Most Popular</div>
          <div className="plan-name">Supermarket</div>
          <div className="plan-desc">For larger stores &amp; growing businesses</div>
          <div className="plan-price">
            <span className="plan-amount">{p.super}</span>
            <span className="plan-period"> / month</span>
          </div>
          <div className="plan-yearly-note">{billing === 'yearly' ? yearlyNotes.super : ''}</div>
          <hr className="plan-divider" />
          <div className="plan-feature-label">Everything in Shop, plus</div>
          <ul className="plan-features">
            <li><span className="check">✓</span> Up to 5 Staff Members</li>
            <li><span className="check">✓</span> Advanced Forecasting</li>
            <li><span className="check">✓</span> Multiple Branches</li>
            <li className="inactive"><span className="cross">✗</span> Production Tracking</li>
            <li className="inactive"><span className="cross">✗</span> Access to Equity Investment</li>
          </ul>
          <button className="plan-cta-btn" onClick={() => onNavigate('signup')}>Start Free Trial</button>
        </div>

        {/* BRANCHES */}
        <div className="plan-card">
          <div className="plan-name">Multiple Branches</div>
          <div className="plan-desc">For chains &amp; franchises</div>
          <div className="plan-price">
            <span className="plan-amount">{p.branch}</span>
            <span className="plan-period"> / month</span>
          </div>
          <div className="plan-yearly-note">{billing === 'yearly' ? yearlyNotes.branch : ''}</div>
          <hr className="plan-divider" />
          <div className="plan-feature-label">Everything in Supermarket, plus</div>
          <ul className="plan-features">
            <li><span className="check">✓</span> Unlimited Staff Members</li>
            <li><span className="check">✓</span> Manage Multiple Branches</li>
            <li className="inactive"><span className="cross">✗</span> Production Tracking</li>
            <li className="inactive"><span className="cross">✗</span> Access to Equity Investment</li>
          </ul>
          <button className="plan-cta-btn" onClick={() => onNavigate('signup')}>Start Free Trial</button>
        </div>

        {/* COMPANY */}
        <div className="plan-card">
          <div className="plan-name">Company</div>
          <div className="plan-desc">For manufacturers &amp; corporations</div>
          <div className="plan-price">
            <span className="plan-amount">{p.company}</span>
            <span className="plan-period"> / month</span>
          </div>
          <div className="plan-yearly-note">{billing === 'yearly' ? yearlyNotes.company : ''}</div>
          <hr className="plan-divider" />
          <div className="plan-feature-label">Everything in Branches, plus</div>
          <ul className="plan-features">
            <li><span className="check">✓</span> Production Tracking (Cost of Goods)</li>
            <li><span className="check">✓</span> Access to Equity Investment</li>
          </ul>
          <button className="plan-cta-btn" onClick={() => onNavigate('signup')}>Start Free Trial</button>
        </div>
      </div>

      <div className="enterprise-row" style={{ margin: '0 5% 80px' }}>
        <div className="enterprise-text">
          <h3>Custom Needs?</h3>
          <p>For custom integrations, dedicated support, or enterprise deployments — let's talk.</p>
        </div>
        <button className="btn-primary">Contact Sales</button>
      </div>

      <Footer onNavigate={onNavigate} minimal />
    </div>
  );
};
