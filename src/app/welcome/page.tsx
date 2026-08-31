"use client";

import { useState, useEffect } from 'react';
import type { Page } from './types';
import {
  Package,
  CircleDollarSign,
  TrendingDown,
  Building2,
  ShoppingBag,
  BarChart3,
  Target,
} from 'lucide-react';
import { AskMOSupportAgent } from './components/AskMOSupportAgent';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DemoVideoSection } from './components/DemoVideoSection';
import { ScrollReveal } from './components/ScrollReveal';
import { TestimonialsSection } from './components/TestimonialsSection';
import { OfflineSaleSection } from './components/OfflineSaleSection';
import { HowBusmoWorks } from './components/HowBusmoWorks';
import { IndustryUseCases } from './components/IndustryUseCases';
import { BuiltWithBusmo } from './components/BuiltWithBusmo';
import { MoSection } from './components/MoSection';
import { PricingPreview } from './components/PricingPreview';
import { BeforeAfterComparison } from './components/BeforeAfterComparison';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { AnnouncementBar } from './components/AnnouncementBar';

const iconProps = { size: 22, strokeWidth: 1.75, 'aria-hidden': true as const };

export default function WelcomePage() {
  const [showDemoVideo, setShowDemoVideo] = useState(false);

  useEffect(() => {
    document.title = 'Busmo — Business Control for Growing African Businesses';
    const desc = document.querySelector('meta[name="description"]');
    const content = 'Busmo helps growing businesses control sales, inventory, cash, staff and profit from one simple system.';
    if (desc) desc.setAttribute('content', content);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = content;
      document.head.appendChild(m);
    }
  }, []);

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
      <Navbar currentPage="home" onNavigate={(page) => handleNavigate(page)} />

      <Hero onNavigate={handleNavigate} onWatchDemo={() => setShowDemoVideo(true)} />
      <DemoVideoSection isVisible={showDemoVideo} onClose={() => setShowDemoVideo(false)} />

      {/* Problem recognition */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BeforeAfterComparison />
      </ScrollReveal>

      {/* Five control areas */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <HowBusmoWorks />
      </ScrollReveal>

      {/* Profit */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section>
          <div className="max-w">
            <div className="section-head center">
              <div className="section-label">Profit</div>
              <h2 className="section-title">
                Stop guessing whether you're <em>actually making money.</em>
              </h2>
              <p className="section-sub">
                Revenue is not the same as profit. Busmo connects sales, costs, inventory and expenses so you can see what the business is really making — in plain language.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Inventory */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section>
          <div className="max-w">
            <div className="section-head center">
              <div className="section-label">Inventory</div>
              <h2 className="section-title">
                Know what you have before your stock <em>tells you otherwise.</em>
              </h2>
              <p className="section-sub">
                Levels, movement, value and cost impact — so stock problems show up in the numbers, not only on the shelf.
              </p>
            </div>
            <div className="features-grid">
              <div className="feat-card">
                <div className="feat-icon"><Package {...iconProps} /></div>
                <div className="feat-title">Stock levels</div>
                <div className="feat-desc">See what you have and what is moving.</div>
              </div>
              <div className="feat-card">
                <div className="feat-icon"><CircleDollarSign {...iconProps} /></div>
                <div className="feat-title">Inventory value</div>
                <div className="feat-desc">Understand what stock is worth to the business.</div>
              </div>
              <div className="feat-card">
                <div className="feat-icon"><TrendingDown {...iconProps} /></div>
                <div className="feat-title">Cost & profit impact</div>
                <div className="feat-desc">Link product costs to what you actually earn.</div>
              </div>
              <div className="feat-card">
                <div className="feat-icon"><Building2 {...iconProps} /></div>
                <div className="feat-title">Locations</div>
                <div className="feat-desc">Warehouses and locations where your plan supports them.</div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* MO — intelligent layer, not primary product */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section className="features-bg">
          <div className="max-w">
            <div className="section-head center">
              <div className="section-label">MO</div>
              <h2 className="section-title">
                Your business data can finally <em>talk back.</em>
              </h2>
              <p className="section-sub">
                Busmo collects and organizes your business data. MO helps you understand it — what changed, what is selling, where expenses rose, and what deserves attention.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <MoSection />
      </ScrollReveal>

      {/* Offline */}
      <OfflineSaleSection />

      {/* Who it's for */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <IndustryUseCases />
      </ScrollReveal>

      {/* Real stories if present */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BuiltWithBusmo />
      </ScrollReveal>

      {/* Mo-sell ecosystem path */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section>
          <div className="max-w">
            <div className="section-head">
              <div className="section-label">Mo-sell</div>
              <h2 className="section-title">
                Need to sell online too? <em>Start with Mo-sell.</em>
              </h2>
              <p className="section-sub">
                Mo-sell gives your business a simple online storefront for selling through social media, WhatsApp and your existing audience.
              </p>
            </div>
            <div className="paths-grid">
              <div className="path-card">
                <div className="path-icon seller"><ShoppingBag {...iconProps} /></div>
                <div className="path-title">Mo-sell → Sell</div>
                <div className="path-desc">Online storefront for social and WhatsApp selling.</div>
              </div>
              <div className="path-card featured">
                <div className="path-icon owner"><BarChart3 {...iconProps} /></div>
                <div className="path-title">Busmo → Understand</div>
                <div className="path-desc">See sales, stock, cash and profit clearly.</div>
              </div>
              <div className="path-card">
                <div className="path-icon multi"><Target {...iconProps} /></div>
                <div className="path-title">Busmo Control → Scale</div>
                <div className="path-desc">Deeper control as the business grows.</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="btn-outline" onClick={() => handleNavigate('seller')}>
                Explore Mo-sell
              </button>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Owner themes */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <TestimonialsSection />
      </ScrollReveal>

      {/* Pricing */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <PricingPreview onNavigate={handleNavigate} />
      </ScrollReveal>

      {/* Onboarding help */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section className="features-bg">
          <div className="max-w">
            <div className="section-head center">
              <div className="section-label">Getting started</div>
              <h2 className="section-title">
                We'll help you get your business <em>under control.</em>
              </h2>
              <p className="section-sub">
                From setting up products and staff to configuring how you work day to day, Busmo can help you get started. Higher plans include assisted onboarding where available.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <FAQSection />
      </ScrollReveal>

      {/* Final CTA */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <div className="cta-banner">
          <h2>Know your numbers. Control your business.</h2>
          <p>Start with Busmo and see what is really happening inside your business.</p>
          <button className="btn-white" onClick={() => handleNavigate('signup')}>
            Start with Busmo
          </button>
          <div className="cta-note">3-day free trial · Works offline · Cancel anytime</div>
        </div>
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <Footer onNavigate={handleNavigate} />
      </ScrollReveal>

      <AskMOSupportAgent />
    </main>
  );
}
