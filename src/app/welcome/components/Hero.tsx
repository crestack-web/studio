"use client";

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Page } from '../types';
import { MoIcon } from '../../owner/dashboard/NavIcons';

interface HeroProps {
  onNavigate: (page: Page) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [showDemoForm, setShowDemoForm] = useState(false);

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
            <button className="btn-outline" onClick={() => setShowVideo(true)}>
              Watch 2 minutes demo
            </button>
          </div>
          <div className="hero-note">3-day free trial · Works offline · Cancel anytime</div>
        </div>
      </div>
      </div>

      {showVideo && typeof window !== 'undefined' && createPortal(
        <div className="video-modal" onClick={() => { setShowVideo(false); setShowDemoForm(false); }}>
          <div className="video-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-close" onClick={() => { setShowVideo(false); setShowDemoForm(false); }}>×</button>
            
            {!showDemoForm ? (
              <>
                <video controls autoPlay className="demo-video">
                  <source src="https://res.cloudinary.com/dzjoqbg2u/video/upload/v1783273004/busmo_demo_gwytnk.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="demo-request-cta">
                  <p>Want to see how Busmo can transform your specific business?</p>
                  <button className="btn-primary" onClick={() => setShowDemoForm(true)}>
                    Request a Full Demo
                  </button>
                </div>
              </>
            ) : (
              <div className="demo-form">
                <h3>Request a Full Demo</h3>
                <p>Fill out the form below and we'll schedule a personalized demo for your business.</p>
                <form onSubmit={(e) => { e.preventDefault(); alert('Demo request submitted! We will contact you soon.'); setShowDemoForm(false); }}>
                  <input type="text" placeholder="Your Name" required className="demo-input" />
                  <input type="email" placeholder="Email Address" required className="demo-input" />
                  <input type="tel" placeholder="Phone Number" required className="demo-input" />
                  <input type="text" placeholder="Business Name" required className="demo-input" />
                  <select required className="demo-input">
                    <option value="">Business Type</option>
                    <option value="retail">Retail</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="wholesale">Wholesale</option>
                    <option value="services">Services</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea placeholder="Tell us about your business needs" rows={4} className="demo-textarea"></textarea>
                  <div className="demo-form-buttons">
                    <button type="submit" className="btn-primary">Submit Request</button>
                    <button type="button" className="btn-outline" onClick={() => setShowDemoForm(false)}>Back to Video</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
