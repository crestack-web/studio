"use client";

import React from 'react';
import { Page } from '../types';
import { MoIcon } from '../../owner/dashboard/NavIcons';

interface HeroProps {
  onNavigate: (page: Page) => void;
  onWatchDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onWatchDemo }) => {

  return (
    <div className="hero">
      <div className="hero-bg" />
      <div className="hero-inner">
        <div className="hero-content-wrapper">
          <div className="hero-text-content">
            <div className="hero-badge">
              <span />
              Built for African Commerce
            </div>
            <h1>
              Know Your Profit Every Day.<br />
              <em>Simple business tracking for African entrepreneurs.</em>
            </h1>
            <p>
              Busmo gives you instant profit clarity, smart forecasts, and AI insights —
              so you can make confident business decisions every day.
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
