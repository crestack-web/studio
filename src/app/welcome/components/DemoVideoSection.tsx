"use client";

import React, { useState } from 'react';
import styles from './DemoVideoSection.module.css';

interface DemoVideoSectionProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DemoVideoSection: React.FC<DemoVideoSectionProps> = ({ isVisible, onClose }) => {
  const [modalView, setModalView] = useState<'video' | 'form'>('video');
  const [formSubmitted, setFormSubmitted] = useState(false);

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
      onClose();
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <section className={styles.demoVideoSection}>
      <div className={styles.demoModalWrapper}>
        <div className={styles.demoModalContent}>
          <div className={styles.demoModalHeader}>
            <h3>{modalView === 'video' ? 'Watch Demo' : 'Request a Personalized Demo'}</h3>
            <button className={styles.demoModalClose} onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className={styles.demoModalBody}>
            {modalView === 'video' ? (
              <>
                <div className={styles.demoVideoWrapper}>
                  <video controls autoPlay className={styles.demoVideo}>
                    <source src="https://res.cloudinary.com/dzjoqbg2u/video/upload/v1783273004/busmo_demo_gwytnk.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className={styles.demoModalFooter}>
                  <p className={styles.demoModalText}>Want to see how Busmo can help your specific business?</p>
                  <button className="btn-primary" onClick={handleRequestDemo}>
                    Request a Real Demo with Our Team
                  </button>
                </div>
              </>
            ) : (
              <>
                {formSubmitted ? (
                  <div className={styles.demoSuccessMessage}>
                    <div className={styles.successIcon}>✓</div>
                    <h3>Request Submitted!</h3>
                    <p>Our team will contact you within 24 hours to schedule your personalized demo.</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.demoFormWrapper}>
                      <p className={styles.demoFormIntro}>Fill out the form below and our team will schedule a personalized demo for your business.</p>
                      <form onSubmit={handleFormSubmit} className={styles.demoRequestForm}>
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label htmlFor="name">Full Name *</label>
                            <input type="text" id="name" placeholder="John Doe" required className={styles.formInput} />
                          </div>
                          <div className={styles.formGroup}>
                            <label htmlFor="email">Email Address *</label>
                            <input type="email" id="email" placeholder="john@example.com" required className={styles.formInput} />
                          </div>
                        </div>
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label htmlFor="phone">Phone Number *</label>
                            <input type="tel" id="phone" placeholder="+234 800 000 0000" required className={styles.formInput} />
                          </div>
                          <div className={styles.formGroup}>
                            <label htmlFor="business">Business Name *</label>
                            <input type="text" id="business" placeholder="Your Business Name" required className={styles.formInput} />
                          </div>
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="businessType">Business Type *</label>
                          <select id="businessType" required className={styles.formInput}>
                            <option value="">Select business type</option>
                            <option value="retail">Retail / Supermarket</option>
                            <option value="restaurant">Restaurant / Food Service</option>
                            <option value="wholesale">Wholesale / Distribution</option>
                            <option value="services">Professional Services</option>
                            <option value="manufacturing">Manufacturing</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="message">Tell us about your business needs</label>
                          <textarea id="message" placeholder="What challenges are you facing? What would you like to see in the demo?" rows={3} className={styles.formTextarea}></textarea>
                        </div>
                        <div className={styles.demoFormActions}>
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
    </section>
  );
};
