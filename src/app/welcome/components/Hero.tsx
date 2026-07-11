"use client";

import React from 'react';
import { Page } from '../types';
import { MoIcon } from '../../owner/dashboard/NavIcons';

interface HeroProps {
  onNavigate: (page: Page) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => (
  <div className="hero">
    <div className="hero-bg" />
    <div className="hero-inner">
      <div className="hero-content-wrapper">
        <div className="hero-text-content">
          <div className="hero-badge">
            <span />
            Built for African Business Owners
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
            <button className="btn-primary btn-large btn-dominant" onClick={() => onNavigate('signup')}>
              Start Free — No Credit Card
            </button>
            <div className="hero-secondary-cta">
              <a className="text-link" onClick={() => onNavigate('pricing')}>See Pricing</a>
            </div>
          </div>
          <div className="hero-note">3-day free trial · Works offline · Cancel anytime</div>
        </div>

        <div className="hero-image-container">
          <div className="image-wrapper">
            <img
              src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1778779581/latino-hair-salon-owner-taking-care-client_v6l5gm.jpg"
              alt="Business owner"
              className="hero-image"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);
