"use client";

import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DashboardMockup } from './components/DashboardMockup';
import { OfflineSaleSection } from './components/OfflineSaleSection';
import { MoSection } from './components/MoSection';
import { MarketSection } from './components/MarketSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FAQSection } from './components/FAQSection';
import { BusinessCategoriesSlider } from './components/BusinessCategoriesSlider';
import { Footer } from './components/Footer';
import { HowBusmoWorks } from './components/HowBusmoWorks';
import { IndustryUseCases } from './components/IndustryUseCases';
import { BeforeAfterComparison } from './components/BeforeAfterComparison';
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
    } else if (page === 'support') {
      window.location.href = '/welcome/support';
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

      {/* DASHBOARD MOCKUP */}
      <DashboardMockup />

      {/* OFFLINE SALE RECORDING */}
      <OfflineSaleSection />

      {/* WHO IS BUSMO FOR */}
      <section>
        <div className="max-w">
          <div className="section-head">
            <div className="section-label">Who is Busmo for?</div>
            <h2 className="section-title">Your intelligent<br /><em>business operating system.</em></h2>
            <p className="section-sub">From recording sales with natural language to AI-powered insights — Busmo transforms how you run your business.</p>
          </div>
          <div className="paths-grid">
            {/* Business Owner */}
            <div className="path-card featured">
              <div className="path-icon owner"><span>🏪</span></div>
              <div className="path-title">Business Owners</div>
              <div className="path-desc">Talk to your business. Record sales, add products, and get insights — all through natural conversation with MO, your AI assistant.</div>
              <ul className="path-list">
                <li>Record sales by just saying "sold 2 shirts"</li>
                <li>Add products with images and natural language</li>
                <li>AI-powered daily business insights</li>
                <li>Smart inventory & expense tracking</li>
                <li>Low stock alerts & restock recommendations</li>
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
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-bg">
        <div className="max-w">
          <div className="section-head">
            <div className="section-label">Platform Features</div>
            <h2 className="section-title">Talk to your business.<br /><em>It listens.</em></h2>
            <p className="section-sub">Busmo is the first business operating system that understands natural language — record sales, add products, and get insights just by talking.</p>
          </div>
          <div className="features-grid">
            <div className="feat-card wide">
              <div className="feat-icon">🤖</div>
              <div>
                <div className="feat-title">MO — Your AI Business Assistant</div>
                <div className="feat-desc">Record sales by saying "sold 3 shirts for ₦5,000", add products by describing them, and get instant answers to business questions. MO understands context and learns your business.</div>
                <span className="feat-tag">AI-Powered</span>
              </div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">�</div>
              <div className="feat-title">Natural Language Sales</div>
              <div className="feat-desc">No forms, no complexity. Just say what happened and MO handles the rest — validates inventory, calculates profit, and updates records instantly.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">�</div>
              <div className="feat-title">Add Products with Images</div>
              <div className="feat-desc">Snap a photo of a product and tell MO about it. It extracts details, sets pricing, and adds it to your inventory automatically.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📦</div>
              <div className="feat-title">Smart Inventory</div>
              <div className="feat-desc">Track stock automatically, get low stock alerts before you run out, and receive AI-powered restock recommendations.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">�</div>
              <div className="feat-title">Daily Business Insights</div>
              <div className="feat-desc">MO provides personalized insights every day — profit trends, best-selling products, cash flow health, and actionable recommendations.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">👥</div>
              <div className="feat-title">Staff Management</div>
              <div className="feat-desc">Invite staff to record sales and manage inventory. Keep control while your team keeps things running.</div>
              <span className="feat-tag">Supermarket plan+</span>
            </div>
            <div className="feat-card">
              <div className="feat-icon">🏬</div>
              <div className="feat-title">Multiple Branches</div>
              <div className="feat-desc">Manage a chain or franchise from one dashboard. See performance across all your locations in one view.</div>
              <span className="feat-tag">Branches plan+</span>
            </div>
            <div className="feat-card">
              <div className="feat-icon">📵</div>
              <div className="feat-title">Works Offline</div>
              <div className="feat-desc">Record sales and manage inventory even without internet. Syncs automatically when you're back online.</div>
              <span className="feat-tag">Offline-first</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW BUSMO WORKS */}
      <HowBusmoWorks />

      {/* INDUSTRY USE CASES */}
      <IndustryUseCases />

      {/* SELL ONLINE / STOREFRONT */}
      <MarketSection onNavigate={handleNavigate} />

      {/* ASK MO SECTION */}
      <MoSection />

      {/* COMPARISON */}
      <section className="comparison-section">
        <div className="max-w">
          <div className="section-head center">
            <div className="section-label">Why Busmo</div>
            <h2 className="section-title">Everything you need to track and grow your business <em>without complicated accounting.</em></h2>
            <p className="section-sub">Get the benefits of accounting software without the complexity. Built for business owners, not accountants.</p>
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

      {/* BEFORE VS AFTER COMPARISON */}
      <BeforeAfterComparison />

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      {/* FAQ */}
      <FAQSection />

      {/* BUSINESS CATEGORIES SLIDER */}
      <BusinessCategoriesSlider />

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
