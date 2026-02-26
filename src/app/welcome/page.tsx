"use client";

import React from "react";
import WhoIsBusmoFor from './components/WhoIsBusmoFor';
import { Features } from './components/Features';
import { Testimonials } from './components/Testimonials';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { Market } from "./components/Market";

export default function WelcomePage() {
  // Navigation handler for buttons
  const handleNavigate = (page: string) => {
    if (page === 'signup') {
      window.location.href = '/signup';
    } else if (page === 'login') {
      window.location.href = '/login';
    } else if (page === 'pricing') {
      window.location.href = '/pricing';
    } else if (page === 'seller') {
      window.location.href = '/seller';
    } else if (page === 'invest') {
      window.location.href = '/invest';
    } else {
      window.location.href = '/';
    }
  };

  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-br from-purple-50 to-white py-16 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-headline text-4xl sm:text-5xl font-extrabold mb-4">
            Know Your Numbers.<br />
            <em className="not-italic text-purple-700">Grow Your Business.</em>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-6">
            Stop guessing with notebooks and calculators. Busmo gives you instant clarity on your sales, profit, inventory, and cash — so every decision is backed by data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <button className="btn btn-primary btn-large" onClick={() => handleNavigate('signup')}>
              Start Free Trial — No Card Needed
            </button>
            <button className="btn btn-outline-large btn-large" onClick={() => handleNavigate('pricing')}>
              See Pricing
            </button>
          </div>
          <div className="text-gray-500 text-sm">14-day free trial · Cancel anytime · Works offline</div>
        </div>
      </section>

      {/* WHO IS BUSMO FOR */}
      <WhoIsBusmoFor />

      {/* FEATURES */}
      <Features />

      {/* SELL ONLINE / STOREFRONT */}
      <Market />

      {/* TESTIMONIALS */}
      <Testimonials />

      {/* FAQ */}
      <FAQ />

      {/* CTA BANNER */}
      <section className="bg-purple-700 py-20 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        <h2 className="font-headline text-3xl sm:text-4xl font-extrabold mb-3">
          The Future of Your Business<br />Starts With Clarity.
        </h2>
        <p className="text-white/80 text-lg mb-8">
          Join smart business owners across Africa who are building their future with Busmo.
        </p>
        <button
          className="btn btn-primary text-lg px-8 py-4 font-bold"
          onClick={() => handleNavigate('signup')}
        >
          Start Your Free Trial Today
        </button>
        <div className="text-white/60 text-xs mt-4">
          14-day free trial · No credit card · Works offline
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </>
  );
}