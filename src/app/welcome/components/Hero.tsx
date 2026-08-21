"use client";

import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
  onNavigate: (page: Page) => void;
  onWatchDemo: () => void;
}

const HEADLINES = [
  {
    main: "Know your real profit every day.",
    emphasis: "Verified data. No guesswork.",
  },
  {
    main: "Build investor-trustable records.",
    emphasis: "Performance you can prove.",
  },
  {
    main: "Raise capital from live results.",
    emphasis: "Profit-share or equity, data-first.",
  },
  {
    main: "Run your whole business with MO.",
    emphasis: "Talk. Track. Grow. Offline-ready.",
  },
];

export const Hero: React.FC<HeroProps> = ({ onNavigate, onWatchDemo }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HEADLINES.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const current = HEADLINES[index];

  return (
    <div className="hero">
      <style>{`
        .hero-desc-desktop { display: block; }
        .hero-desc-mobile { display: none; }
        .hero-headline-rotator {
          min-height: 5.2rem;
          margin-bottom: 16px;
        }
        @media (max-width: 640px) {
          .hero-desc-desktop { display: none; }
          .hero-desc-mobile {
            display: block;
            font-size: 0.95rem;
            line-height: 1.5;
            margin-bottom: 20px;
            max-width: 340px;
          }
          .hero-headline-rotator {
            min-height: 3.6rem;
            margin-bottom: 12px;
          }
          .hero h1 {
            font-size: 1.15rem !important;
            line-height: 1.3 !important;
            margin-bottom: 0 !important;
          }
          .hero-cta {
            margin-bottom: 16px !important;
          }
          .hero-note {
            font-size: 0.7rem !important;
          }
        }
      `}</style>

      <div className="hero-bg" />
      <div className="hero-inner">
        <div className="hero-content-wrapper">
          <div className="hero-text-content">
            <div className="hero-headline-rotator">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={index}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ margin: 0 }}
                >
                  {current.main}
                  <br />
                  <em>{current.emphasis}</em>
                </motion.h1>
              </AnimatePresence>
            </div>

            {/* Full description — desktop only */}
            <p className="hero-desc-desktop">
              Busmo is the data-first platform for African SMEs. Track revenue, costs and profit with
              verified records. Sell online, access microfinance and raise capital through
              profit-sharing or equity — all driven by live business performance, not promises.
              MO, your AI assistant, lets you record sales and get insights in plain language.
            </p>

            {/* Short description — mobile only */}
            <p className="hero-desc-mobile">
              Track real profit. Raise capital. Sell online. All driven by live business data.
            </p>

            <div className="hero-cta">
              <button className="btn-primary btn-dominant" onClick={() => onNavigate('signup')}>
                Get Started
              </button>
              <button className="btn-outline" onClick={onWatchDemo}>
                Watch 2 minutes demo
              </button>
            </div>
            <div className="hero-note">3-day free trial · Works offline · Cancel anytime</div>
          </div>
        </div>
      </div>
    </div>
  );
};
