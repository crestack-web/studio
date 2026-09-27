'use client';

import React, { useEffect } from 'react';
import { Navbar } from '@/app/welcome/components/Navbar';
import { Footer } from '@/app/welcome/components/Footer';
import type { Page } from '@/app/welcome/types';
import '@/app/welcome/styles/globals.css';

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy — Busmo';
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
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-muted, #8888A0)', fontSize: '0.95rem', marginBottom: 40 }}>
          Last updated: September 27, 2026
        </p>

        <div style={{ lineHeight: 1.75, fontSize: '1rem', color: 'var(--text-secondary, #555568)' }}>
          <p style={{ marginBottom: 16 }}>
            Busmo ("we," "us," or "our") respects your privacy. This Privacy Policy explains how we collect, use, store, and share information when you use our website, mobile apps, and related services (the "Service"). By using the Service, you agree to this Policy. For terms governing use of the Service, see our{' '}
            <a href="/terms" style={{ color: 'var(--purple, #6B3FE7)', textDecoration: 'underline' }}>Terms of Service</a>.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>1. Information We Collect</h2>
          <p style={{ marginBottom: 16 }}><strong>Account and profile information.</strong> When you register or manage an account, we may collect your name, email address, phone number, business name, and similar details.</p>
          <p style={{ marginBottom: 16 }}><strong>Business and operational data.</strong> To provide the Service, we process data you enter or generate, such as sales, inventory, staff activity, expenses, and related records ("Customer Data").</p>
          <p style={{ marginBottom: 16 }}><strong>Usage and device data.</strong> We may collect log data, device type, browser, IP address, approximate location, and how you interact with the Service (for example feature usage and diagnostics).</p>
          <p style={{ marginBottom: 16 }}><strong>Communications.</strong> If you contact support or use in-app messaging, we keep those communications as needed to help you.</p>
          <p style={{ marginBottom: 16 }}><strong>Payment information.</strong> Payments are typically processed by third-party providers. We receive limited billing metadata (for example plan, status, invoices) and do not store full card numbers on our servers when a processor handles checkout.</p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>2. How We Use Information</h2>
          <p style={{ marginBottom: 16 }}>We use information to:</p>
          <ul style={{ marginBottom: 16, paddingLeft: 24 }}>
            <li>Provide, operate, secure, and improve the Service</li>
            <li>Authenticate users and manage accounts and subscriptions</li>
            <li>Generate insights, reports, and AI-assisted features (for example MO) based on Customer Data you provide</li>
            <li>Send service notices, security alerts, and support responses</li>
            <li>Send product updates or marketing communications where permitted (you may opt out of marketing emails)</li>
            <li>Comply with law and enforce our Terms</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>3. Legal Bases (where applicable)</h2>
          <p style={{ marginBottom: 16 }}>
            Where required, we process personal data based on contract performance (to deliver the Service), legitimate interests (security, improvement, fraud prevention), consent (where we ask for it), and legal obligations.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>4. Sharing of Information</h2>
          <p style={{ marginBottom: 16 }}>We do not sell your personal information. We may share information with:</p>
          <ul style={{ marginBottom: 16, paddingLeft: 24 }}>
            <li><strong>Service providers</strong> who help us host, process payments, send messages, or analyze usage, under contractual obligations to protect data</li>
            <li><strong>Your organization</strong> if you use Busmo as part of a business account (admins or authorized users may access relevant data)</li>
            <li><strong>Legal and safety</strong> when required by law, or to protect rights, safety, and the integrity of the Service</li>
            <li><strong>Business transfers</strong> in connection with a merger, acquisition, or asset sale, subject to appropriate safeguards</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>5. Data Retention</h2>
          <p style={{ marginBottom: 16 }}>
            We retain information for as long as your account is active and as needed to provide the Service, comply with legal obligations, resolve disputes, and enforce agreements. You may request deletion of your account; some records may be retained where law requires or for legitimate backup and audit purposes.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>6. Security</h2>
          <p style={{ marginBottom: 16 }}>
            We implement technical and organizational measures designed to protect information against unauthorized access, loss, or alteration. No method of transmission or storage is completely secure; we encourage strong passwords and careful account practices.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>7. International Transfers</h2>
          <p style={{ marginBottom: 16 }}>
            We primarily operate in Nigeria. If data is processed in other countries, we take steps intended to ensure appropriate protection consistent with this Policy and applicable law.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>8. Your Rights and Choices</h2>
          <p style={{ marginBottom: 16 }}>
            Depending on applicable law, you may have the right to access, correct, update, or delete personal data we hold about you, or to object to or restrict certain processing. You can update many account details in the product or by contacting us. Marketing emails include an unsubscribe option.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>9. Children</h2>
          <p style={{ marginBottom: 16 }}>
            The Service is not directed to individuals under 18. We do not knowingly collect personal information from children. If you believe a child has provided us data, contact us and we will take appropriate steps.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>10. Cookies and Similar Technologies</h2>
          <p style={{ marginBottom: 16 }}>
            We use cookies and similar technologies for authentication, preferences, analytics, and security. You can control cookies through your browser settings; disabling some cookies may affect how the Service works.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>11. Changes to This Policy</h2>
          <p style={{ marginBottom: 16 }}>
            We may update this Privacy Policy from time to time. We will post the revised Policy on this page and update the "Last updated" date. Material changes may be communicated through the Service or by email where appropriate.
          </p>

          <h2 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary, #0A0A0F)', marginTop: 36, marginBottom: 12 }}>12. Contact Us</h2>
          <p style={{ marginBottom: 16 }}>
            For privacy questions or requests, contact us at{' '}
            <a href="mailto:support@busmo.io" style={{ color: 'var(--purple, #6B3FE7)', textDecoration: 'underline' }}>support@busmo.io</a>
            {' '}or through the Help Center on our website.
          </p>
        </div>
      </div>

      <Footer onNavigate={handleNavigate} />
    </main>
  );
}
