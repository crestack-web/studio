"use client";

import React, { useState } from 'react';
import { Page } from '../types';
import { MoIcon } from '../../owner/dashboard/NavIcons';

interface HeroProps {
  onNavigate: (page: Page) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [showVideo, setShowVideo] = useState(false);

  return (
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
            <button className="btn-primary btn-dominant" onClick={() => onNavigate('signup')}>
              Get Started
            </button>
            <button className="btn-outline" onClick={() => setShowVideo(true)}>
              Watch 2 minutes demo
            </button>
          </div>
          <div className="hero-note">3-day free trial · Works offline · Cancel anytime</div>
        </div>
      </div>
      </div>

      {showVideo && (
        <div className="video-modal" onClick={() => setShowVideo(false)}>
          <div className="video-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-close" onClick={() => setShowVideo(false)}>×</button>
            <video controls autoPlay className="demo-video">
              <source src="/videos/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  );
};
