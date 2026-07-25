"use client";

import { useState, useEffect } from 'react';
import type { Page } from './welcome/types';
import { FloatingChatWidget } from './welcome/components/FloatingChatWidget';
import { Navbar } from './welcome/components/Navbar';
import { Hero } from './welcome/components/Hero';
import { DemoVideoSection } from './welcome/components/DemoVideoSection';
import { ScrollReveal } from './welcome/components/ScrollReveal';
import { TestimonialsSection } from './welcome/components/TestimonialsSection';
import { OfflineSaleSection } from './welcome/components/OfflineSaleSection';
import { ScrollReveal as StaggerItem } from './welcome/components/ScrollReveal';
import { HowBusmoWorks } from './welcome/components/HowBusmoWorks';
import { IndustryUseCases } from './welcome/components/IndustryUseCases';
import { BuiltWithBusmo } from './welcome/components/BuiltWithBusmo';
import { MoSection } from './welcome/components/MoSection';
import { PricingPreview } from './welcome/components/PricingPreview';
import { BeforeAfterComparison } from './welcome/components/BeforeAfterComparison';
import { FAQSection } from './welcome/components/FAQSection';
import { BusinessCategoriesSlider } from './welcome/components/BusinessCategoriesSlider';
import { Footer } from './welcome/components/Footer';
import { AnnouncementBar } from './welcome/components/AnnouncementBar';
import './welcome/styles/globals.css';

export default function Home() {
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
      <Navbar currentPage="home" onNavigate={(page) => handleNavigate(page)} />
      <Hero onNavigate={handleNavigate} onWatchDemo={() => setShowDemoVideo(true)} />
      <DemoVideoSection isVisible={showDemoVideo} onClose={() => setShowDemoVideo(false)} />
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <TestimonialsSection />
      </ScrollReveal>
      <OfflineSaleSection />
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
        <MoSection />
      </ScrollReveal>
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <PricingPreview onNavigate={handleNavigate} />
      </ScrollReveal>
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BuiltWithBusmo />
      </ScrollReveal>
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <FAQSection />
      </ScrollReveal>
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <BusinessCategoriesSlider />
      </ScrollReveal>
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <Footer onNavigate={handleNavigate} />
      </ScrollReveal>
      <FloatingChatWidget />
    </main>
  );
}
