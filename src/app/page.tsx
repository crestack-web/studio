"use client";

import { useState, useEffect } from 'react';
import type { Page } from './welcome/types';
import {
  Gem,
  Banknote,
  Search,
  Users,
  ShieldCheck,
  Package,
  CircleDollarSign,
  TrendingDown,
  Building2,
  ShoppingBag,
  BarChart3,
  Target,
} from 'lucide-react';
import { AskMOSupportAgent } from './welcome/components/AskMOSupportAgent';
import { Navbar } from './welcome/components/Navbar';
import { Hero } from './welcome/components/Hero';
import { DemoVideoSection } from './welcome/components/DemoVideoSection';
import { ScrollReveal } from './welcome/components/ScrollReveal';
import { TestimonialsSection } from './welcome/components/TestimonialsSection';
import { OfflineSaleSection } from './welcome/components/OfflineSaleSection';
import { HowBusmoWorks } from './welcome/components/HowBusmoWorks';
import { IndustryUseCases } from './welcome/components/IndustryUseCases';
import { BuiltWithBusmo } from './welcome/components/BuiltWithBusmo';
import { MoSection } from './welcome/components/MoSection';
import { PricingPreview } from './welcome/components/PricingPreview';
import { BeforeAfterComparison } from './welcome/components/BeforeAfterComparison';
import { FAQSection } from './welcome/components/FAQSection';
import { Footer } from './welcome/components/Footer';
import { AnnouncementBar } from './welcome/components/AnnouncementBar';
import './welcome/styles/globals.css';

const iconProps = { size: 22, strokeWidth: 1.75, 'aria-hidden': true as const };

export default function Home() {
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

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BeforeAfterComparison />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <HowBusmoWorks />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section className="features-bg">
          <div className="max-w">
            <div className="section-head">
              <div className="section-label">Money Control</div>
              <h2 className="section-title">
                Your sales are recorded.<br /><em>But where is the money?</em>
              </h2>
              <p className="section-sub">
                A POS or accounting system can record a transaction. You still need to know whether the money handled by staff matches what should have happened.
              </p>
            </div>
            <div className="features-grid">
              <div className="feat-card wide">
                <div className="feat-icon"><Gem {...iconProps} /></div>
                <div>
                  <div className="feat-title">Connect sales to money movement</div>
                  <div className="feat-desc">
                    Busmo helps you connect sales activity with the money your business should have received — so you can spot discrepancies, improve accountability and stay in control.
                  </div>
                  <span className="feat-tag">Visibility · Accountability</span>
                </div>
              </div>
              <div className="feat-card">
                <div className="feat-icon"><Banknote {...iconProps} /></div>
                <div className="feat-title">Cash &amp; transfers</div>
                <div className="feat-desc">See expected collections against what was confirmed — cash, bank and POS in one view.</div>
              </div>
              <div className="feat-card">
                <div className="feat-icon"><Search {...iconProps} /></div>
                <div className="feat-title">Identify discrepancies</div>
                <div className="feat-desc">Surface mismatches between sales and money handled. Not a promise of zero loss — clearer control.</div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section>
          <div className="max-w">
            <div className="section-head center">
              <div className="section-label">Profit</div>
              <h2 className="section-title">
                Stop guessing whether you&apos;re <em>actually making money.</em>
              </h2>
              <p className="section-sub">
                Revenue is not the same as profit. Busmo connects sales, costs, inventory and expenses so you can see what the business is really making — in plain language.
              </p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section className="features-bg">
          <div className="max-w">
            <div className="section-head">
              <div className="section-label">For owners</div>
              <h2 className="section-title">
                Run your business without having to <em>be everywhere.</em>
              </h2>
              <p className="section-sub">
                You should not need to stand in the shop all day just to know what happened. Busmo gives visibility into activity while staff operate the business.
              </p>
            </div>
            <div className="features-grid">
              <div className="feat-card">
                <div className="feat-icon"><Users {...iconProps} /></div>
                <div className="feat-title">Staff activity</div>
                <div className="feat-desc">See who is handling sales, cash and day-to-day work.</div>
              </div>
              <div className="feat-card">
                <div className="feat-icon"><ShieldCheck {...iconProps} /></div>
                <div className="feat-title">Permissions</div>
                <div className="feat-desc">Control what staff can access while you keep overall control.</div>
              </div>
              <div className="feat-card">
                <div className="feat-icon"><Package {...iconProps} /></div>
                <div className="feat-title">Stock &amp; locations</div>
                <div className="feat-desc">Inventory and multi-location visibility where supported.</div>
              </div>
              <div className="feat-card">
                <div className="feat-icon"><Gem {...iconProps} /></div>
                <div className="feat-title">Money Control</div>
                <div className="feat-desc">Link sales to cash handling so accountability is clearer.</div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

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
                <div className="feat-title">Cost &amp; profit impact</div>
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

      <OfflineSaleSection />

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <IndustryUseCases />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BuiltWithBusmo />
      </ScrollReveal>

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

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <TestimonialsSection />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <PricingPreview onNavigate={handleNavigate} />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section className="features-bg">
          <div className="max-w">
            <div className="section-head center">
              <div className="section-label">Getting started</div>
              <h2 className="section-title">
                We&apos;ll help you get your business <em>under control.</em>
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
