"use client";

import React, { useState } from 'react';
import { Page } from '../types';
import { MoIcon } from '../../owner/dashboard/NavIcons';

interface HeroProps {
  onNavigate: (page: Page) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalView, setModalView] = useState<'video' | 'form'>('video');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
    setModalView('video');
    setFormSubmitted(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalView('video');
    setFormSubmitted(false);
  };

  const handleRequestDemo = () => {
    setModalView('form');
  };

  const handleBackToVideo = () => {
    setModalView('video');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    // In production, this would submit to an API
    setTimeout(() => {
      handleCloseModal();
    }, 2000);
  };

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
            <button className="btn-outline" onClick={handleOpenModal}>
              Watch 2 minutes demo
            </button>
          </div>
          <div className="hero-note">3-day free trial · Works offline · Cancel anytime</div>
        </div>
      </div>
      </div>

      {/* Demo Modal */}
      {showModal && (
        <div className="demo-modal-overlay" onClick={handleCloseModal}>
          <div className="demo-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="demo-modal-header">
              <h3>{modalView === 'video' ? 'Watch Demo' : 'Request a Personalized Demo'}</h3>
              <button className="demo-modal-close" onClick={handleCloseModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="demo-modal-body">
              {modalView === 'video' ? (
                <>
                  <div className="demo-video-wrapper">
                    <video controls autoPlay className="demo-video">
                      <source src="https://res.cloudinary.com/dzjoqbg2u/video/upload/v1783273004/busmo_demo_gwytnk.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="demo-modal-footer">
                    <p className="demo-modal-text">Want to see how Busmo can help your specific business?</p>
                    <button className="btn-primary" onClick={handleRequestDemo}>
                      Request a Real Demo with Our Team
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {formSubmitted ? (
                    <div className="demo-success-message">
                      <div className="success-icon">✓</div>
                      <h3>Request Submitted!</h3>
                      <p>Our team will contact you within 24 hours to schedule your personalized demo.</p>
                    </div>
                  ) : (
                    <>
                      <div className="demo-form-wrapper">
                        <p className="demo-form-intro">Fill out the form below and our team will schedule a personalized demo for your business.</p>
                        <form onSubmit={handleFormSubmit} className="demo-request-form">
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="name">Full Name *</label>
                              <input type="text" id="name" placeholder="John Doe" required className="form-input" />
                            </div>
                            <div className="form-group">
                              <label htmlFor="email">Email Address *</label>
                              <input type="email" id="email" placeholder="john@example.com" required className="form-input" />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label htmlFor="phone">Phone Number *</label>
                              <input type="tel" id="phone" placeholder="+234 800 000 0000" required className="form-input" />
                            </div>
                            <div className="form-group">
                              <label htmlFor="business">Business Name *</label>
                              <input type="text" id="business" placeholder="Your Business Name" required className="form-input" />
                            </div>
                          </div>
                          <div className="form-group">
                            <label htmlFor="businessType">Business Type *</label>
                            <select id="businessType" required className="form-input">
                              <option value="">Select business type</option>
                              <option value="retail">Retail / Supermarket</option>
                              <option value="restaurant">Restaurant / Food Service</option>
                              <option value="wholesale">Wholesale / Distribution</option>
                              <option value="services">Professional Services</option>
                              <option value="manufacturing">Manufacturing</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label htmlFor="message">Tell us about your business needs</label>
                            <textarea id="message" placeholder="What challenges are you facing? What would you like to see in the demo?" rows={3} className="form-textarea"></textarea>
                          </div>
                          <div className="demo-form-actions">
                            <button type="button" className="btn-outline" onClick={handleBackToVideo}>
                              Back to Video
                            </button>
                            <button type="submit" className="btn-primary">
                              Submit Request
                            </button>
                          </div>
                        </form>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
