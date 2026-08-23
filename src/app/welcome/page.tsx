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
              <p>Run your entire business from one place. Track sales, manage inventory, control staff, and get AI insights that help you grow.</p>
              <ul className="path-features">
                <li>Record sales by text or voice</li>
                <li>Real-time inventory tracking</li>
                <li>Staff accountability tools</li>
                <li>Money control & reconciliation</li>
              </ul>
              <button className="btn-primary" onClick={() => handleNavigate('signup')}>Start free trial</button>
              </div>
            </StaggerItem>

            {/* Staff / Cashiers */}
            <StaggerItem direction="up" duration={0.6} delay={0.1}>
              <div className="path-card">
              <div className="path-icon staff"><span>👥</span></div>
              <h3>Staff & Cashiers</h3>
              <p>Simple tools for your team to record sales, check stock, and stay accountable — without complexity.</p>
              <ul className="path-features">
                <li>Quick sale recording</li>
                <li>Stock lookups</li>
                <li>Shift accountability</li>
              </ul>
              <button className="btn-ghost" onClick={() => handleNavigate('signup')}>Get started</button>
              </div>
            </StaggerItem>

            {/* Accountants */}
            <StaggerItem direction="up" duration={0.6} delay={0.2}>
              <div className="path-card">
              <div className="path-icon accountant"><span>📊</span></div>
              <h3>Accountants & Bookkeepers</h3>
              <p>Clean records, expense tracking, and reports that make reconciliation and tax prep faster.</p>
              <ul className="path-features">
                <li>Expense & sales history</li>
                <li>Exportable statements</li>
                <li>Bank reconciliation tools</li>
              </ul>
              <button className="btn-ghost" onClick={() => handleNavigate('signup')}>Get started</button>
              </div>
            </StaggerItem>
          </div>
        </div>
      </section>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <HowBusmoWorks />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <IndustryUseCases />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BeforeAfterComparison />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BuiltWithBusmo />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <MoSection />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BusinessCategoriesSlider />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <PricingPreview onNavigate={handleNavigate} />
      </ScrollReveal>

      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <FAQSection />
      </ScrollReveal>

      <Footer onNavigate={handleNavigate} />
      <AskMOSupportAgent />
    </main>
  );
}
