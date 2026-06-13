"use client";

import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MarketSection } from './components/MarketSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { MoSection } from './components/MoSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { LangProvider } from '../owner/dashboard/LangContext';
import type { Page } from './types';

export default function WelcomePage() {
  // Navigation handler for buttons
  const handleNavigate = (page: Page | string) => {
    if (page === 'home') {
      window.location.href = '/';
    } else if (page === 'signup') {
      window.location.href = '/welcome/signup';
    } else if (page === 'login') {
      window.location.href = '/login';
    } else if (page === 'pricing') {
      window.location.href = '/pricing';
    } else if (page === 'seller') {
      window.location.href = '/seller';
    } else if (page === 'invest') {
      window.location.href = '/invest';
    } else if (page === 'download') {
      window.location.href = '/welcome/download';
    } else {
      window.location.href = '/';
    }
  };

  return (
    <LangProvider>
      {/* HEADER */}
      <Navbar currentPage="home" onNavigate={(page) => handleNavigate(page)} />

      {/* HERO */}
      <Hero onNavigate={handleNavigate} />

      {/* WHO IS BUSMO FOR */}
      <section>
        <div className="max-w">
          <div className="section-head">
            <div className="section-label">Who is Busmo for?</div>
            <h2 className="section-title">One platform.<br /><em>Every role.</em></h2>
            <p className="section-sub">Whether you own the business, sell on the market, or fund the next big thing — Busmo has a place for you.</p>
          </div>
          <div className="paths-grid">
            {/* Business Owner */}
            <div className="path-card featured">
              <div className="path-icon owner"><span>🏪</span></div>
              <div className="path-title">Business Owners</div>
              <div className="path-desc">Track your profit, inventory, staff, and expenses — all from one simple dashboard.</div>
              <ul className="path-list">
                <li>Real-time profit tracking</li>
                <li>AI-powered insights daily</li>
                <li>Inventory & expense tracking</li>
                <li>Smart forecasts & alerts</li>
                <li>Sell online with Busmo Market</li>
              </ul>
              <button className="path-cta" onClick={() => handleNavigate('signup')}>Start Free Trial →</button>
            </div>

            {/* Sellers */}
            <div className="path-card" onClick={() => handleNavigate('seller')}>
              <div className="path-icon seller"><span>🛍️</span></div>
              <div className="path-title">Online Store</div>
              <div className="path-desc">Launch your store with Busmo integration. Join the waitlist.</div>
              <ul className="path-list">
                <li>Professional themes</li>
                <li>Instant product sync</li>
                <li>BusmoPay checkout</li>
              </ul>
              <button className="path-cta" onClick={(e) => { e.stopPropagation(); handleNavigate('seller'); }}>Join Waitlist →</button>
            </div>

            {/* Investors */}
            <div className="path-card" onClick={() => handleNavigate('invest')}>
              <div className="path-icon investor"><span>📈</span></div>
              <div className="path-title">Investors</div>
              <div className="path-desc">Discover and fund verified African businesses — backed by real-time data you can trust.</div>
              <ul className="path-list">
                <li>Data-verified opportunities</li>
                <li>Transparent business signals</li>
                <li>Profit-sharing or equity deals</li>
                <li>Reduced risk via live data</li>
                <li>Invest in Africa's growth</li>
              </ul>
              <button className="path-cta" onClick={(e) => { e.stopPropagation(); handleNavigate('invest'); }}>Explore Investments →</button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-bg">
        <div className="max-w">
          <div className="section-head">
            <div className="section-label">Platform Features</div>
            <h2 className="section-title">Everything you need.<br /><em>Nothing you don't.</em></h2>
            <p className="section-sub">Busmo is built for the reality of your business — simple, fast, and offline-first.</p>
          </div>
          <div className="features-grid">
            <div className="feat-card wide">
              <div className="feat-icon">🛒</div>
              <div>
                <div className="feat-title">Record Sales the Right Way</div>
                <div className="feat-desc">See exactly what was sold, track quantity and profit per product, and understand which items actually make you money. Record a sale in seconds — even offline.</div>
                <span className="feat-tag">Offline-first</span>
              </div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📦</div>
              <div className="feat-title">Inventory Management</div>
              <div className="feat-desc">Add products with cost and quantity, track stock automatically, and get alerts before you run out of your best sellers.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">💸</div>
              <div className="feat-title">Expense Tracking</div>
              <div className="feat-desc">Log daily expenses and inventory costs. See how they affect your profit in real time — not at month end.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🤖</div>
              <div className="feat-title">Ask Busmo AI</div>
              <div className="feat-desc">Just ask: "Did I make profit today?" or "Which product should I restock?" Get straight answers instantly.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🔮</div>
              <div className="feat-title">Smart Forecasts</div>
              <div className="feat-desc">Busmo predicts your next week's profit, busiest day, cash runway, and stock outlook — based on your real activity.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">👥</div>
              <div className="feat-title">Staff Management</div>
              <div className="feat-desc">Invite staff members to record sales and manage inventory. Keep control while your team keeps things running.</div>
              <span className="feat-tag">Supermarket plan+</span>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🏬</div>
              <div className="feat-title">Multiple Branches</div>
              <div className="feat-desc">Manage a chain or franchise from one dashboard. See performance across all your locations in one view.</div>
              <span className="feat-tag">Branches plan+</span>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🏭</div>
              <div className="feat-title">Production Tracking</div>
              <div className="feat-desc">Track cost of goods manufactured and monitor production cycles for manufacturers and processors.</div>
              <span className="feat-tag">Company plan</span>
            </div>
          </div>
        </div>
      </section>

      {/* SELL ONLINE / STOREFRONT */}
      <MarketSection onNavigate={handleNavigate} />

      {/* COMPARISON */}
      <section className="comparison-section">
        <div className="max-w">
          <div className="section-head center">
            <div className="section-label">Why Busmo</div>
            <h2 className="section-title">Not another <em>accounting app.</em></h2>
            <p className="section-sub">Busmo is a decision-making tool built for the reality of your business — not for accountants.</p>
          </div>
          <div className="comparison-grid">
            <div className="cmp-card cmp-old">
              <div className="cmp-tag">The Old Way</div>
              <div className="cmp-title">Accounting Software</div>
              <ul className="cmp-list">
                <li><span className="cmp-icon">😵</span><span>Endless fields, confusing charts, features you'll never use</span></li>
                <li><span className="cmp-icon">👨‍💼</span><span>Built for accountants — speaks "debits" and "credits"</span></li>
                <li><span className="cmp-icon">📑</span><span>Gives you long reports to dig through, not answers</span></li>
                <li><span className="cmp-icon">📶</span><span>Requires constant internet connection</span></li>
                <li><span className="cmp-icon">📚</span><span>Takes weeks to learn before you can use it properly</span></li>
              </ul>
            </div>
            <div className="cmp-card cmp-new">
              <div className="cmp-tag">The Busmo Way</div>
              <div className="cmp-title">Clarity Tool</div>
              <ul className="cmp-list">
                <li><span className="cmp-icon">⚡</span><span>Record a sale in seconds. See your profit instantly</span></li>
                <li><span className="cmp-icon">🗣️</span><span>Built for owners — speaks your language, gives straight answers</span></li>
                <li><span className="cmp-icon">💡</span><span>Your most important insights are always one tap away</span></li>
                <li><span className="cmp-icon">📵</span><span>Works offline — because your business doesn't pause for WiFi</span></li>
                <li><span className="cmp-icon">🚀</span><span>Up and running in minutes, not weeks</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* MO AI MOCKUP */}
      <MoSection />

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      {/* INVESTORS PREVIEW */}
      <section className="investor-section">
        <div className="max-w">
          <div className="investor-grid">
            <div className="investor-sample">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Live Opportunities</div>
              {[
                { name: "Aisha's Crafts", meta: 'Fashion · Lagos, NG · Verified ✓', roi: '18% ROI' },
                { name: "Femi's Farm", meta: 'Agriculture · Oyo, NG · Verified ✓', roi: '22% ROI' },
                { name: 'City Electronics', meta: 'Retail · Abuja, NG · Verified ✓', roi: '15% ROI' },
              ].map((item, i) => (
                <div key={i} className="investor-card-item">
                  <div>
                    <div className="investor-biz">{item.name}</div>
                    <div className="investor-meta">{item.meta}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="investor-return">{item.roi}</div>
                    <div className="investor-tag">Open</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="section-label">For Investors</div>
              <h2 className="section-title">Invest in Africa's<br /><em>Growth Engine.</em></h2>
              <p className="section-sub">Discover and fund the next generation of small businesses, backed by real-time, trusted data from Busmo.</p>
              <ul className="investor-bullets">
                <li><span className="check">✦</span><span>Explore data-verified opportunities with transparent signals</span></li>
                <li><span className="check">✦</span><span>Reduce risk with real-time business health data</span></li>
                <li><span className="check">✦</span><span>Invest in profit-sharing or equity-based deals</span></li>
                <li><span className="check">✦</span><span>Track returns and portfolio performance in one place</span></li>
              </ul>
              <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => handleNavigate('invest')}>Explore Investments →</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />

      {/* DOWNLOAD BUSMO SECTION */}
      <section className="download-section">
        <div className="max-w">
          <div className="section-head center">
            <div className="section-label">Use Busmo Anywhere</div>
            <h2 className="section-title">Your Business,<br /><em>Every Device.</em></h2>
            <p className="section-sub">Whether you're at the office, in-store, on the road, or managing multiple branches, Busmo works wherever your business does.</p>
          </div>
          <div className="platform-cards">
            <div className="platform-card">
              <div className="platform-icon">💻</div>
              <div className="platform-name">Windows</div>
              <div className="platform-desc">Desktop app with offline support</div>
            </div>
            <div className="platform-card">
              <div className="platform-icon">🍎</div>
              <div className="platform-name">macOS</div>
              <div className="platform-desc">Native Mac experience</div>
            </div>
            <div className="platform-card">
              <div className="platform-icon">🤖</div>
              <div className="platform-name">Android</div>
              <div className="platform-desc">Mobile on-the-go management</div>
            </div>
            <div className="platform-card">
              <div className="platform-icon">🌐</div>
              <div className="platform-name">Web App</div>
              <div className="platform-desc">Works on any device</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button className="btn-primary" onClick={() => handleNavigate('download')}>Download Busmo</button>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="cta-banner">
        <h2>The Future of Your Business<br />Starts With Clarity.</h2>
        <p>Join smart business owners across Africa who are building their future with Busmo.</p>
        <button className="btn-white" onClick={() => handleNavigate('signup')}>Start Your Free Trial Today</button>
        <div className="cta-note">3-day free trial · No credit card · Works offline</div>
      </div>

      {/* FOOTER */}
      <Footer onNavigate={handleNavigate} />
    </LangProvider>
  );
}
