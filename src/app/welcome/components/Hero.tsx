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

    <div className="dashboard-preview" style={{ marginTop: 56 }}>
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: 'var(--purple-light)' }}>💰</div>
          <div className="dash-card-label">Today's Profit</div>
          <div className="dash-card-value">₦47,200</div>
          <span className="dash-card-badge badge-green">↑ 12% vs yesterday</span>
        </div>
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: 'var(--green-light)' }}>🛒</div>
          <div className="dash-card-label">Sales Today</div>
          <div className="dash-card-value">₦118,500</div>
          <span className="dash-card-badge badge-green">23 transactions</span>
        </div>
        <div className="dash-card ask-busmo-card">
          <div className="dash-card-icon" style={{ background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MoIcon size={24} />
          </div>
          <div className="dash-card-label">Ask MO</div>
          <div className="dash-card-value">
            <div className="ask-bubble">"Which product made me the most money today?"</div>
            <div className="ask-answer">📦 Indomie (50 packs) — ₦12,500 profit. Consider restocking now.</div>
          </div>
        </div>
        <div className="dash-card insight-card">
          <div className="dash-card-icon" style={{ background: 'var(--amber-light)' }}>🔮</div>
          <div className="dash-card-label">AI Forecast</div>
          <div className="dash-card-value">Friday is your best day. Stock up on Thursday.</div>
          <span className="dash-card-badge badge-amber">Predicted ₦180K</span>
        </div>
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: 'var(--red-light)' }}>📦</div>
          <div className="dash-card-label">Low Stock Alert</div>
          <div className="dash-card-value">3 items</div>
          <div className="dash-card-sub">Restock before weekend rush</div>
          <span className="dash-card-badge" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>Urgent</span>
        </div>
      </div>
    </div>
  </div>
);
