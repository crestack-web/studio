'use client';

import React, { useEffect } from 'react';
import { Navbar } from '@/app/welcome/components/Navbar';
import { Footer } from '@/app/welcome/components/Footer';
import type { Page } from '@/app/welcome/types';
import '@/app/welcome/styles/globals.css';

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service — Busmo';
    // No announcement bar on legal pages: pin nav to top
    const style = document.createElement('style');
    style.id = 'legal-page-nav-fix';
    style.textContent = 'body { padding-top: 0 !important; } nav#main-nav { top: 0 !important; }';
    document.head.appendChild(style);
    return () => {
      document.getElementById('legal-page-nav-fix')?.remove();
    };
  }, []);

  const handleNavigate = (page: Page) => {
    if (page === 'home') window.location.href = '/welcome';
    else if (page === 'signup') window.location.href = '/welcome/signup';
    else if (page === 'login') window.location.href = '/login';
    else if (page === 'pricing') window.location.href = '/pricing';
    else if (page === 'seller') window.location.href = '/sell-welcome';
    else if (page === 'download') window.location.href = '/welcome/download';
    else if (page === 'help') window.location.href = '/welcome/help';
    else window.location.href = '/welcome';
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--white, #fff)', color: 'var(--text-primary, #0A0A0F)' }}>
      <Navbar currentPage="home" onNavigate={handleNavigate} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 700, marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p style={{ color: 'var(--text-muted, #8888A0)', fontSize: '0.95rem', marginBottom: 40 }}>
          Last updated: September 27, 2026
        </p>

        <div className="legal-content" style={{ lineHeight: 1.75, fontSize: '1rem', color: 'var(--text-secondary, #555568)' }}>
          <p style={{ marginBottom: 24 }}>
            Please read these Terms of Service ("Terms") carefully before using Busmo. By accessing or using our website, mobile applications, or any related services (collectively, the "Service"), you agree to be bound by these Terms. If you do not agree, do not use the Service.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>1. About Busmo</h2>
          <p style={{ marginBottom: 16 }}>
            Busmo is a business clarity and management platform operated in Nigeria. The Service helps business owners track sales, inventory, cash, staff activity, and related operational data, and may include AI-powered insights (including features referred to as "MO"). References to "Busmo," "we," "us," or "our" mean the entity providing the Service. "You" means the individual or legal entity using the Service.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>2. Eligibility and Accounts</h2>
          <p style={{ marginBottom: 16 }}>
            You must be at least 18 years old and capable of forming a binding contract to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate registration information and notify us promptly of any unauthorized use.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>3. Subscriptions, Trials, and Payment</h2>
          <p style={{ marginBottom: 16 }}>
            Some features require a paid subscription. Pricing, plan limits, and billing cycles are described on our pricing page or in your account. Free trials, if offered, convert to paid plans unless cancelled before the trial ends according to the process we provide. Fees are non-refundable except where required by applicable law or expressly stated by us. We may change prices with reasonable notice for renewals.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>4. Acceptable Use</h2>
          <p style={{ marginBottom: 16 }}>You agree not to:</p>
          <ul style={{ marginBottom: 16, paddingLeft: 24 }}>
            <li>Use the Service for any unlawful purpose or in violation of Nigerian or other applicable law</li>
            <li>Attempt to gain unauthorized access to systems, data, or other users' accounts</li>
            <li>Upload malware, scrape the Service in an abusive way, or interfere with its operation</li>
            <li>Misrepresent your identity or affiliation, or use the Service to harass others</li>
            <li>Resell or sublicense the Service except as expressly permitted in writing</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>5. Your Data</h2>
          <p style={{ marginBottom: 16 }}>
            You retain ownership of business data you submit to the Service ("Customer Data"). You grant us a limited license to host, process, and display Customer Data solely to provide and improve the Service. Our collection and use of personal data is described in our{' '}
            <a href="/privacy" style={{ color: 'var(--purple, #6B3FE7)', textDecoration: 'underline' }}>Privacy Policy</a>. You are responsible for the accuracy of Customer Data and for having the rights to submit it.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>6. Intellectual Property</h2>
          <p style={{ marginBottom: 16 }}>
            The Service, including software, design, trademarks, and content (excluding Customer Data), is owned by Busmo or its licensors. You may not copy, modify, reverse engineer, or create derivative works of the Service except as allowed by law or with our written consent.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>7. Third-Party Services</h2>
          <p style={{ marginBottom: 16 }}>
            The Service may integrate with third-party tools (for example payment processors, messaging, or analytics). Those services are governed by their own terms. We are not responsible for third-party services.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>8. Disclaimers</h2>
          <p style={{ marginBottom: 16 }}>
            The Service is provided "as is" and "as available." We do not warrant that the Service will be uninterrupted, error-free, or that insights (including AI-generated suggestions) will be complete or suitable for every decision. Busmo is a management and visibility tool; it does not replace professional accounting, legal, or tax advice.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>9. Limitation of Liability</h2>
          <p style={{ marginBottom: 16 }}>
            To the maximum extent permitted by applicable law, Busmo and its suppliers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or business opportunity, arising from your use of or inability to use the Service. Our total liability for any claim relating to the Service shall not exceed the amounts you paid us for the Service in the twelve (12) months preceding the claim.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>10. Termination</h2>
          <p style={{ marginBottom: 16 }}>
            You may stop using the Service at any time. We may suspend or terminate access if you breach these Terms, fail to pay fees when due, or if we discontinue the Service. Upon termination, your right to use the Service ends. Provisions that by their nature should survive (including ownership, disclaimers, and liability limits) will survive.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>11. Changes</h2>
          <p style={{ marginBottom: 16 }}>
            We may update these Terms from time to time. We will post the updated Terms on this page and update the "Last updated" date. Continued use after changes constitutes acceptance of the revised Terms where permitted by law.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>12. Governing Law</h2>
          <p style={{ marginBottom: 16 }}>
            These Terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be subject to the exclusive jurisdiction of the courts of Nigeria, without prejudice to mandatory consumer protections that may apply.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>13. Contact</h2>
          <p style={{ marginBottom: 16 }}>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:support@busmo.io" style={{ color: 'var(--purple, #6B3FE7)', textDecoration: 'underline' }}>support@busmo.io</a>
            {' '}or via the Help Center on our website.
          </p>
        </div>
      </div>

      <Footer onNavigate={handleNavigate} />
    </main>
  );
}
