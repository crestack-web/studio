"use client";

import { useState, useEffect } from 'react';
import type { Page } from './types';
import { AskMOSupportAgent } from './components/AskMOSupportAgent';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DemoVideoSection } from './components/DemoVideoSection';
import { ScrollReveal } from './components/ScrollReveal';
import { TestimonialsSection } from './components/TestimonialsSection';
import { OfflineSaleSection } from './components/OfflineSaleSection';
import { ScrollReveal as StaggerItem } from './components/ScrollReveal';
import { HowBusmoWorks } from './components/HowBusmoWorks';
import { IndustryUseCases } from './components/IndustryUseCases';
import { BuiltWithBusmo } from './components/BuiltWithBusmo';
import { MoSection } from './components/MoSection';
import { PricingPreview } from './components/PricingPreview';
import { BeforeAfterComparison } from './components/BeforeAfterComparison';
import { FAQSection } from './components/FAQSection';
import { BusinessCategoriesSlider } from './components/BusinessCategoriesSlider';
import { Footer } from './components/Footer';
import { AnnouncementBar } from './components/AnnouncementBar';

export default function WelcomePage() {
  const [showDemoVideo, setShowDemoVideo] = useState(false);

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
      window.location.href = '/sell-welcome';
    } else if (page === 'invest') {
      window.location.href = '/invest';
    } else if (page === 'download') {
      window.location.href = '/welcome/download';
    } else if (page === 'help') {
      window.location.href = '/welcome/help';
    } else {
      window.location.href = '/';
    }
  };

  return (
    <main className="min-h-screen">
      <AnnouncementBar />
      {/* HEADER */}
      <Navbar currentPage="home" onNavigate={(page) => handleNavigate(page)} />

      {/* HERO */}
      <Hero onNavigate={handleNavigate} onWatchDemo={() => setShowDemoVideo(true)} />

      {/* DEMO VIDEO SECTION - shows when button is clicked */}
      <DemoVideoSection isVisible={showDemoVideo} onClose={() => setShowDemoVideo(false)} />

      {/* TESTIMONIALS - moved higher for social proof */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <TestimonialsSection />
      </ScrollReveal>

      {/* OFFLINE SALE RECORDING */}
      <OfflineSaleSection />

      {/* WHO IS BUSMO FOR */}
      <section>
        <div className="max-w">
          <div className="section-head">
            <div className="section-label">Who is Busmo for?</div>
            <h2 className="section-title">Your intelligent<br /><em>business operating system.</em></h2>
            <p className="section-sub">Record sales with natural language and get AI-powered insights — Busmo transforms how you run your business.</p>
          </div>
          <div className="paths-grid">
            {/* Business Owner */}
            <StaggerItem direction="up" duration={0.6}>
              <div className="path-card featured">
              <div className="path-icon owner"><span>🏪</span></div>
              <div className="path-badge">Most Popular</div>
              <h3>Business Owners</h3>
              <p>Control every naira. Know your stock. Manage your team. Busmo is the operating system for African businesses.</p>
              <ul>
                <li>Sales, stock & expense tracking</li>
                <li>Staff accountability</li>
                <li>AI insights that speak your language</li>
              </ul>
              <button className="path-cta" onClick={() => handleNavigate('signup')}>Start free →</button>
              </div>
            </StaggerItem>

            {/* Seller / Marketplace */}
            <StaggerItem direction="up" duration={0.6} delay={0.15}>
              <div className="path-card">
              <div className="path-icon seller"><span>🛒</span></div>
              <h3>Sellers & Traders</h3>
              <p>Sell more, track better. Record sales by text, manage inventory, and never lose a sale offline.</p>
              <ul>
                <li>Text-to-sale recording</li>
                <li>Works offline</li>
                <li>Simple inventory</li>
              </ul>
              <button className="path-cta" onClick={() => handleNavigate('signup')}>Get started →</button>
              </div>
            </StaggerItem>

            {/* Multi-branch */}
            <StaggerItem direction="up" duration={0.6} delay={0.3}>
              <div className="path-card">
              <div className="path-icon multi"><span>🏢</span></div>
              <h3>Multi-branch Owners</h3>
              <p>See every branch in one dashboard. Compare performance, control stock transfers, and stay on top of cash.</p>
              <ul>
                <li>Centralized reporting</li>
                <li>Branch-level permissions</li>
                <li>Stock transfers</li>
              </ul>
              <button className="path-cta" onClick={() => handleNavigate('signup')}>Scale with Busmo →</button>
              </div>
            </StaggerItem>
          </div>
        </div>
      </section>

      {/* HOW BUSMO WORKS */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <HowBusmoWorks />
      </ScrollReveal>

      {/* INDUSTRY USE CASES */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <IndustryUseCases />
      </ScrollReveal>

      {/* BUILT WITH BUSMO */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BuiltWithBusmo />
      </ScrollReveal>

      {/* MO SECTION */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <MoSection />
      </ScrollReveal>

      {/* PRICING PREVIEW */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <PricingPreview onNavigate={handleNavigate} />
      </ScrollReveal>

      {/* BEFORE VS AFTER */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BeforeAfterComparison />
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <FAQSection />
      </ScrollReveal>

      {/* BUSINESS CATEGORIES */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BusinessCategoriesSlider />
      </ScrollReveal>

      {/* CTA BANNER */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <div className="cta-banner">
          <h2>The Future of Your Business<br />Starts With Clarity.</h2>
          <p>Join smart business owners across Africa who are building their future with Busmo.</p>
          <button className="btn-white" onClick={() => handleNavigate('signup')}>Start Your Free Trial Today</button>
          <div className="cta-note">3-day free trial · No credit card · Works offline</div>
        </div>
      </ScrollReveal>

      {/* FOOTER */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <Footer onNavigate={handleNavigate} />
      </ScrollReveal>

      {/* Floating chat widget */}
      <AskMOSupportAgent />
    </main>
  );
}
