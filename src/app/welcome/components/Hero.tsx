"use client";

import React from 'react';
import { Page } from '../types';

interface HeroProps {
  onNavigate: (page: Page) => void;
  onWatchDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onWatchDemo }) => {
  return (
    <div className="hero">
      <style>{`
        .hero-desc-desktop { display: block; }
        .hero-desc-mobile { display: none; }
        .hero-control-line {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--purple);
          margin-bottom: 12px;
          letter-spacing: 0.01em;
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
          .hero h1 {
            font-size: 1.35rem !important;
            line-height: 1.25 !important;
            margin-bottom: 10px !important;
          }
          .hero-control-line {
            font-size: 0.8rem;
            margin-bottom: 8px;
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
            <h1 style={{ margin: 0 }}>
              Control your business,
              <br />
              <em>even when you&apos;re not there.</em>
            </h1>

            <p className="hero-control-line">
              Sales, stock, cash, staff, and profit — one system.
            </p>

            <p className="hero-desc-desktop">
              Built for growing African businesses. See what sold, where the money
              went, and whether you&apos;re actually making a profit — without
              standing in the shop all day.
            </p>

            <p className="hero-desc-mobile">
              See what sold, where the money went, and if you&apos;re making
              profit — without being in the shop.
            </p>

            <div className="hero-cta">
              <button className="btn-primary btn-dominant" onClick={() => onNavigate('signup')}>
                Start with Busmo
              </button>
              <button className="btn-outline" onClick={onWatchDemo}>
                See how it works
              </button>
            </div>
            <div className="hero-note">3-day free trial · Works offline · Cancel anytime</div>
          </div>
        </div>
      </div>
    </div>
  );
};
