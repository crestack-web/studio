'use client';

import InvestorLayout from '@/components/app/investor-layout';
// src/app/privacy/page.tsx
// Update imports to use SupportChatWidget instead of ChatwootWidget

import { useState, useEffect } from 'react';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <InvestorLayout>
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="prose dark:prose-invert max-w-4xl mx-auto">
            <h1>Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: July 24, 2024</p>
            
            <p>Your privacy is important to us. It is Busmo's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p>
            
            <h2>Information We Collect</h2>
            <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.</p>
            
            <h2>How We Use Your Information</h2>
            <p>We use the information we collect in various ways, including to:</p>
            <ul>
              <li>Provide, operate, and maintain our Service</li>
              <li>Improve, personalize, and expand our Service</li>
              <li>Understand and analyze how you use our Service</li>
              <li>Develop new products, services, features, and functionality</li>
              <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the Service, and for marketing and promotional purposes</li>
            </ul>

            <h2>Contact Us</h2>
            <p>If you have any questions about these Terms and Conditions or Our Privacy Policy, You can contact us by email.</p>
          </div>
        </div>
      </InvestorLayout>

    </main>
  );
}
