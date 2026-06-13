"use client";

import React, { useState } from 'react';
import { Navbar } from '../welcome/components/Navbar';
import { Footer } from '../welcome/components/Footer';
import { LangProvider } from '../owner/dashboard/LangContext';

type Page = 'home' | 'pricing' | 'login' | 'signup' | 'seller' | 'invest' | 'busmogo';

export default function SellerPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    productsCategory: '',
    monthlyRevenue: '',
    currentlySellingOnline: '',
    hearAboutUs: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to backend
    console.log('Seller waitlist submission:', formData);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNavigate = (page: Page) => {
    if (page === 'signup') window.location.href = '/welcome/signup';
    else if (page === 'login') window.location.href = '/login';
    else if (page === 'pricing') window.location.href = '/pricing';
    else if (page === 'seller') window.location.href = '/seller';
    else if (page === 'invest' || page === 'invest-signup' || page === 'invest-login' || page === 'investor')
      window.location.href = '/invest';
    else if (page === 'busmogo') window.location.href = '/owner';
    else window.location.href = '/welcome';
  };

  return (
    <div className="seller-page">
      <LangProvider>
        <Navbar currentPage="seller" onNavigate={handleNavigate} />
      </LangProvider>

      <main className="seller-main">
        <div className="max-w">
          {/* Header with Image */}
          <div className="seller-header-grid">
            <div className="seller-header-content">
              <div className="section-label">Busmo Market</div>
              <h1 className="section-title">Launch Your<br /><em>Online Store</em></h1>
              <p className="section-sub">
                Get a professional online storefront with powerful analytics, secure payments, 
                and automatic inventory sync. Perfect for African businesses ready to sell online.
              </p>
              <div className="feature-highlights">
                <div className="feature-item">
                  <span className="feature-icon">🎨</span>
                  <div>
                    <strong>Professional Themes</strong>
                    <p>Customizable storefronts that match your brand</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <div>
                    <strong>Advanced Analytics</strong>
                    <p>Track sales, visitors, and conversion rates</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌐</span>
                  <div>
                    <strong>Custom Domain</strong>
                    <p>Use your own domain (Standard+ plans)</p>
                  </div>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💳</span>
                  <div>
                    <strong>BusmoPay Built-in</strong>
                    <p>Secure payments with automatic payouts</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="seller-header-image">
              <img src="/sell-hero.png" alt="Seller managing their Busmo store" />
            </div>
          </div>

          {!showForm && !submitted && (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button
                className="btn-primary"
                style={{ padding: '14px 32px', fontSize: 16 }}
                onClick={() => setShowForm(true)}
              >
                Join Waitlist →
              </button>
            </div>
          )}

          {!submitted && showForm ? (
            <form className="waitlist-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3 className="form-section-title">Personal Information</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name *</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+234 XXX XXX XXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="businessName">Business Name *</label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                      placeholder="Your business name"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Business Details</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="businessType">Business Type *</label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select business type</option>
                      <option value="retail">Retail Store</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="services">Services</option>
                      <option value="agriculture">Agriculture</option>
                      <option value="food">Food & Beverage</option>
                      <option value="fashion">Fashion & Clothing</option>
                      <option value="electronics">Electronics</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="productsCategory">Main Product Category *</label>
                    <select
                      id="productsCategory"
                      name="productsCategory"
                      value={formData.productsCategory}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="food-beverage">Food & Beverage</option>
                      <option value="fashion">Fashion & Clothing</option>
                      <option value="electronics">Electronics & Gadgets</option>
                      <option value="home-living">Home & Living</option>
                      <option value="beauty">Beauty & Personal Care</option>
                      <option value="health">Health & Wellness</option>
                      <option value="baby-kids">Baby & Kids</option>
                      <option value="sports">Sports & Outdoors</option>
                      <option value="books">Books & Media</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="monthlyRevenue">Monthly Revenue Range *</label>
                    <select
                      id="monthlyRevenue"
                      name="monthlyRevenue"
                      value={formData.monthlyRevenue}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select range</option>
                      <option value="below-100k">Below ₦100,000</option>
                      <option value="100k-500k">₦100,000 - ₦500,000</option>
                      <option value="500k-1m">₦500,000 - ₦1,000,000</option>
                      <option value="1m-5m">₦1,000,000 - ₦5,000,000</option>
                      <option value="above-5m">Above ₦5,000,000</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="currentlySellingOnline">Currently Selling Online? *</label>
                    <select
                      id="currentlySellingOnline"
                      name="currentlySellingOnline"
                      value={formData.currentlySellingOnline}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select option</option>
                      <option value="yes-active">Yes, actively selling</option>
                      <option value="yes-limited">Yes, but limited</option>
                      <option value="no-never">No, never sold online</option>
                      <option value="no-interested">No, but interested</option>
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="hearAboutUs">How Did You Hear About Busmo? *</label>
                  <select
                    id="hearAboutUs"
                    name="hearAboutUs"
                    value={formData.hearAboutUs}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select option</option>
                    <option value="social-media">Social Media (Instagram, Twitter, etc.)</option>
                    <option value="friend-family">Friend/Family Recommendation</option>
                    <option value="google-search">Google Search</option>
                    <option value="busmo-user">Already a Busmo User</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="event">Event/Workshop</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="additionalInfo">Additional Information (Optional)</label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo || ''}
                    onChange={handleChange}
                    placeholder="Tell us about your products, goals, or any questions you have..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="form-checkbox-group">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  required
                />
                <label htmlFor="terms">
                  I agree to receive updates about Busmo Market and understand that I'm joining a waitlist. 
                  I'll be notified when my spot is ready. *
                </label>
              </div>

              <button type="submit" className="btn-primary btn-large btn-full">
                Join Waitlist →
              </button>
            </form>
          ) : (
            <div className="success-message">
              <div className="success-icon">🎉</div>
              <h2>You're on the list!</h2>
              <p>
                Thank you for joining the Busmo Market waitlist. 
                We'll notify you at <strong>{formData.email}</strong> when your spot is ready.
              </p>
              <p className="success-sub">
                In the meantime, you can explore Busmo's business management tools or check out our pricing plans.
              </p>
              <div className="success-actions">
                <button className="btn-primary" onClick={() => handleNavigate('pricing')}>
                  View Pricing
                </button>
                <button className="btn-outline" onClick={() => window.location.href = '/welcome'}>
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <LangProvider>
        <Footer onNavigate={handleNavigate} />
      </LangProvider>
    </div>
  );
}
