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
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const current = HEADLINES[index];

  return (
    <div className="hero">
      <div className="hero-bg" />
      <div className="hero-inner">
        <div className="hero-content-wrapper">
          <div className="hero-text-content">
            <div className="hero-badge">
              <span />
              Africa's SME Operating System
            </div>

            {/* Animated cycling headlines */}
            <div className="hero-headline-rotator" style={{ minHeight: '5.2rem', marginBottom: 14 }}>
              <AnimatePresence mode="wait">
                <motion.h1
                  key={index}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  style={{ margin: 0 }}
                >
                  {current.main}
                  <br />
                  <em>{current.emphasis}</em>
                </motion.h1>
              </AnimatePresence>
            </div>

            <p>
              Busmo is the data-first platform for African SMEs. Track revenue, costs and profit with
              verified records. Sell online, access microfinance and raise capital through
              profit-sharing or equity — all driven by live business performance, not promises.
              MO, your AI assistant, lets you record sales and get insights in plain language.
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
