"use client";

import React from "react";
import { Page } from "../types";

interface HeroProps {
  onNavigate: (page: Page) => void;
  onWatchDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onWatchDemo }) => {
  return (
    <div className="hero">
      <style>{`
        .hero-desc {
          font-size: 1.05rem;
          line-height: 1.55;
          color: #555568;
          margin: 0 0 22px;
          max-width: 540px;
        }
        @media (max-width: 640px) {
          .hero h1 {
            font-size: 1.35rem !important;
            line-height: 1.25 !important;
            margin-bottom: 10px !important;
          }
          .hero-desc {
            font-size: 0.95rem;
            line-height: 1.5;
            margin-bottom: 18px;
            max-width: 340px;
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
              <em>even when you're not there.</em>
            </h1>

            <p className="hero-desc">
              Sales, stock, cash, staff, and profit in one system — built for growing African businesses. See what sold, where the money went, and whether you're actually making a profit.
            </p>

            <div className="hero-cta">
              <button className="btn-primary btn-dominant" onClick={() => onNavigate("signup")}>
                Start with Busmo
              </button>
              <button className="btn-outline" onClick={onWatchDemo}>
                See how it works
              </button>
            </div>
            <div className="hero-note">14-day free trial · Works offline · Cancel anytime</div>
          </div>
        </div>
      </div>
    </div>
  );
};
