"use client";

import React, { useState } from 'react';
import { Navbar } from '../welcome/components/Navbar';
import { Footer } from '../welcome/components/Footer';
import { LangProvider } from '../owner/dashboard/LangContext';

type Page = 'home' | 'pricing' | 'login' | 'signup' | 'seller' | 'invest' | 'busmogo';

export default function InvestPage() {
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    occupation: '',
    organization: '',
    linkedinProfile: '',
    
    // Investor Profile
    investorType: '',
    investorLicense: '',
    yearsOfExperience: '',
    numberOfInvestments: '',
    totalInvestedAmount: '',
    
    // Investment Preferences
    investmentRange: '',
    checkSize: '',
    preferredSectors: '',
    preferredStages: '',
    preferredGeography: '',
    investmentStructure: '',
    expectedROI: '',
    investmentHorizon: '',
    
    // Due Diligence & Criteria
    investmentCriteria: '',
    redFlags: '',
    valueAddCapabilities: '',
    
    // Goals & Motivation
    investmentGoals: '',
    hearAboutUs: '',
    referralSource: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to backend
    console.log('Investor waitlist submission:', formData);
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
    <div className="invest-page">
      <LangProvider>
        <Navbar currentPage="invest" onNavigate={handleNavigate} />
      </LangProvider>

      <main className="invest-main">
        <div className="max-w">
          {/* Header */}
          <div className="section-head center">
            <div className="section-label">For Investors</div>
            <h1 className="section-title">Invest in Africa's<br /><em>Growth Engine</em></h1>
            <p className="section-sub">
              Join our investor network and discover data-verified African businesses. 
              Get access to transparent, real-time business signals and reduced-risk investment opportunities.
            </p>
          </div>

          {!submitted ? (
            <form className="waitlist-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3 className="form-section-title">1. Personal Information</h3>
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
                    <label htmlFor="country">Country of Residence *</label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select country</option>
                      <option value="nigeria">Nigeria</option>
                      <option value="ghana">Ghana</option>
                      <option value="kenya">Kenya</option>
                      <option value="south-africa">South Africa</option>
                      <option value="ethiopia">Ethiopia</option>
                      <option value="tanzania">Tanzania</option>
                      <option value="uganda">Uganda</option>
                      <option value="rwanda">Rwanda</option>
                      <option value="other-africa">Other African Country</option>
                      <option value="diaspora">African Diaspora</option>
                      <option value="international">International</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Lagos, Nairobi, Accra"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="occupation">Occupation/Title *</label>
                    <input
                      type="text"
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Angel Investor, Fund Manager, CEO"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="organization">Organization/Firm</label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="Your investment firm or company name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="linkedinProfile">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      id="linkedinProfile"
                      name="linkedinProfile"
                      value={formData.linkedinProfile}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">2. Investor Profile & Credentials</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="investorType">Investor Type *</label>
                    <select
                      id="investorType"
                      name="investorType"
                      value={formData.investorType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select investor type</option>
                      <option value="angel">Angel Investor</option>
                      <option value="vc">Venture Capital Firm</option>
                      <option value="private-equity">Private Equity</option>
                      <option value="family-office">Family Office</option>
                      <option value="institutional">Institutional Investor</option>
                      <option value="high-net-worth">High Net Worth Individual</option>
                      <option value="retail">Retail Investor</option>
                      <option value="corporate">Corporate Investor</option>
                      <option value="government">Government/Development Fund</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="investorLicense">Investment License/Registration *</label>
                    <select
                      id="investorLicense"
                      name="investorLicense"
                      value={formData.investorLicense}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select status</option>
                      <option value="licensed">Licensed/Accredited Investor</option>
                      <option value="registered">Registered Investment Advisor</option>
                      <option value="sec-registered">SEC Registered</option>
                      <option value="unlicensed">Unlicensed (Retail Investor)</option>
                      <option value="in-process">In Process of Licensing</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="yearsOfExperience">Years of Investment Experience *</label>
                    <select
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select experience</option>
                      <option value="0-1">Less than 1 year</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5-10">5-10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="numberOfInvestments">Total Number of Investments Made *</label>
                    <select
                      id="numberOfInvestments"
                      name="numberOfInvestments"
                      value={formData.numberOfInvestments}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select number</option>
                      <option value="0">First-time investor</option>
                      <option value="1-5">1-5 investments</option>
                      <option value="5-10">5-10 investments</option>
                      <option value="10-20">10-20 investments</option>
                      <option value="20-50">20-50 investments</option>
                      <option value="50+">50+ investments</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="totalInvestedAmount">Total Amount Invested (Lifetime) *</label>
                    <select
                      id="totalInvestedAmount"
                      name="totalInvestedAmount"
                      value={formData.totalInvestedAmount}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select range</option>
                      <option value="0">Haven't invested yet</option>
                      <option value="below-1m">Below ₦1,000,000</option>
                      <option value="1m-10m">₦1,000,000 - ₦10,000,000</option>
                      <option value="10m-50m">₦10,000,000 - ₦50,000,000</option>
                      <option value="50m-100m">₦50,000,000 - ₦100,000,000</option>
                      <option value="100m-500m">₦100,000,000 - ₦500,000,000</option>
                      <option value="500m-1b">₦500,000,000 - ₦1,000,000,000</option>
                      <option value="above-1b">Above ₦1,000,000,000</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">3. Investment Preferences</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="investmentRange">Typical Investment Range (Per Deal) *</label>
                    <select
                      id="investmentRange"
                      name="investmentRange"
                      value={formData.investmentRange}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select range</option>
                      <option value="below-500k">Below ₦500,000</option>
                      <option value="500k-1m">₦500,000 - ₦1,000,000</option>
                      <option value="1m-5m">₦1,000,000 - ₦5,000,000</option>
                      <option value="5m-10m">₦5,000,000 - ₦10,000,000</option>
                      <option value="10m-25m">₦10,000,000 - ₦25,000,000</option>
                      <option value="25m-50m">₦25,000,000 - ₦50,000,000</option>
                      <option value="50m-100m">₦50,000,000 - ₦100,000,000</option>
                      <option value="above-100m">Above ₦100,000,000</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="checkSize">Available Check Size (Total Capital to Deploy) *</label>
                    <select
                      id="checkSize"
                      name="checkSize"
                      value={formData.checkSize}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select range</option>
                      <option value="below-5m">Below ₦5,000,000</option>
                      <option value="5m-25m">₦5,000,000 - ₦25,000,000</option>
                      <option value="25m-100m">₦25,000,000 - ₦100,000,000</option>
                      <option value="100m-500m">₦100,000,000 - ₦500,000,000</option>
                      <option value="500m-1b">₦500,000,000 - ₦1,000,000,000</option>
                      <option value="above-1b">Above ₦1,000,000,000</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="preferredSectors">Preferred Sectors (Primary) *</label>
                    <select
                      id="preferredSectors"
                      name="preferredSectors"
                      value={formData.preferredSectors}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select primary sector</option>
                      <option value="agriculture">Agriculture & Agribusiness</option>
                      <option value="retail">Retail & E-commerce</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="technology">Technology & Software</option>
                      <option value="fintech">FinTech</option>
                      <option value="food-beverage">Food & Beverage</option>
                      <option value="fashion">Fashion & Textiles</option>
                      <option value="healthcare">Healthcare & Pharma</option>
                      <option value="education">Education & EdTech</option>
                      <option value="renewable-energy">Renewable Energy</option>
                      <option value="real-estate">Real Estate & PropTech</option>
                      <option value="logistics">Logistics & Transportation</option>
                      <option value="media-entertainment">Media & Entertainment</option>
                      <option value="diversified">Diversified (multiple sectors)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="preferredStages">Preferred Investment Stages *</label>
                    <select
                      id="preferredStages"
                      name="preferredStages"
                      value={formData.preferredStages}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select stage</option>
                      <option value="pre-seed">Pre-Seed (Idea/Prototype)</option>
                      <option value="seed">Seed (Early Traction)</option>
                      <option value="series-a">Series A (Growth)</option>
                      <option value="series-b">Series B+ (Expansion)</option>
                      <option value="revenue-generating">Revenue-Generating Businesses</option>
                      <option value="profitable">Profitable SMEs</option>
                      <option value="all-stages">All Stages</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="preferredGeography">Preferred Geography *</label>
                    <select
                      id="preferredGeography"
                      name="preferredGeography"
                      value={formData.preferredGeography}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select geography</option>
                      <option value="nigeria-only">Nigeria Only</option>
                      <option value="west-africa">West Africa</option>
                      <option value="east-africa">East Africa</option>
                      <option value="south-africa">Southern Africa</option>
                      <option value="pan-african">Pan-African</option>
                      <option value="africa-diaspora">Africa + Diaspora</option>
                      <option value="global">Global (No Restriction)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="investmentStructure">Preferred Investment Structure *</label>
                    <select
                      id="investmentStructure"
                      name="investmentStructure"
                      value={formData.investmentStructure}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select structure</option>
                      <option value="equity">Equity (Ownership)</option>
                      <option value="debt">Debt (Loan with Interest)</option>
                      <option value="profit-sharing">Profit-Sharing/Revenue-Based</option>
                      <option value="convertible-note">Convertible Note</option>
                      <option value="safe">SAFE (Simple Agreement)</option>
                      <option value="hybrid">Hybrid (Multiple Structures)</option>
                      <option value="open">Open to All Structures</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="expectedROI">Expected Annual ROI *</label>
                    <select
                      id="expectedROI"
                      name="expectedROI"
                      value={formData.expectedROI}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select ROI expectation</option>
                      <option value="10-20">10-20% (Conservative)</option>
                      <option value="20-30">20-30% (Moderate)</option>
                      <option value="30-50">30-50% (Aggressive)</option>
                      <option value="50-100">50-100% (High Growth)</option>
                      <option value="100+">100%+ (Venture Returns)</option>
                      <option value="flexible">Flexible (Deal Dependent)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="investmentHorizon">Investment Horizon *</label>
                    <select
                      id="investmentHorizon"
                      name="investmentHorizon"
                      value={formData.investmentHorizon}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select horizon</option>
                      <option value="short-term">Short-term (1-2 years)</option>
                      <option value="medium-term">Medium-term (3-5 years)</option>
                      <option value="long-term">Long-term (5-10 years)</option>
                      <option value="very-long-term">Very Long-term (10+ years)</option>
                      <option value="exit-dependent">Exit-Dependent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">4. Investment Criteria & Due Diligence</h3>
                <div className="form-grid-2">
                  <div className="form-group full-width">
                    <label htmlFor="investmentCriteria">What Are Your Key Investment Criteria? *</label>
                    <textarea
                      id="investmentCriteria"
                      name="investmentCriteria"
                      value={formData.investmentCriteria}
                      onChange={handleChange}
                      required
                      placeholder="Describe the specific criteria you look for: minimum revenue, growth rate, team experience, market size, traction metrics, etc..."
                      rows={4}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="redFlags">What Are Your Red Flags / Deal Breakers? *</label>
                    <textarea
                      id="redFlags"
                      name="redFlags"
                      value={formData.redFlags}
                      onChange={handleChange}
                      required
                      placeholder="What would make you immediately reject an investment opportunity? Poor governance, unclear financials, weak team, etc..."
                      rows={3}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="valueAddCapabilities">What Value Can You Add Beyond Capital? *</label>
                    <textarea
                      id="valueAddCapabilities"
                      name="valueAddCapabilities"
                      value={formData.valueAddCapabilities}
                      onChange={handleChange}
                      required
                      placeholder="Mentorship, industry connections, operational expertise, market access, strategic guidance, follow-on funding, etc..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">5. Investment Goals & Motivation</h3>
                <div className="form-grid-2">
                  <div className="form-group full-width">
                    <label htmlFor="investmentGoals">What Are Your Primary Investment Goals? *</label>
                    <textarea
                      id="investmentGoals"
                      name="investmentGoals"
                      value={formData.investmentGoals}
                      onChange={handleChange}
                      required
                      placeholder="Financial returns, social impact, portfolio diversification, supporting African entrepreneurs, building legacy, etc..."
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="hearAboutUs">How Did You Hear About Busmo? *</label>
                    <select
                      id="hearAboutUs"
                      name="hearAboutUs"
                      value={formData.hearAboutUs}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select option</option>
                      <option value="social-media">Social Media (LinkedIn, Twitter, etc.)</option>
                      <option value="professional-network">Professional Network</option>
                      <option value="conference-event">Conference/Event</option>
                      <option value="google-search">Google Search</option>
                      <option value="busmo-user">Already a Busmo User</option>
                      <option value="investor-referral">Referral from Another Investor</option>
                      <option value="portfolio-company">Referral from Portfolio Company</option>
                      <option value="advertisement">Advertisement</option>
                      <option value="media-coverage">Media Coverage/Article</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="referralSource">Referral Source (If Applicable)</label>
                    <input
                      type="text"
                      id="referralSource"
                      name="referralSource"
                      value={formData.referralSource}
                      onChange={handleChange}
                      placeholder="Who referred you? Name or organization"
                    />
                  </div>
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
                  I agree to receive investment opportunities from Busmo and understand that all investments carry risk. 
                  I confirm that the information provided is accurate and I meet the investor requirements for my jurisdiction. 
                  I will be notified when relevant opportunities match my profile. *
                </label>
              </div>

              <div className="form-checkbox-group">
                <input
                  type="checkbox"
                  id="accreditation"
                  name="accreditation"
                  required
                />
                <label htmlFor="accreditation">
                  I confirm that I am an accredited/sophisticated investor in my jurisdiction and have the financial capacity 
                  to bear the risks associated with private investments. *
                </label>
              </div>

              <button type="submit" className="btn-primary btn-large btn-full">
                Join Investor Network →
              </button>
            </form>
          ) : (
            <div className="success-message">
              <div className="success-icon">🎉</div>
              <h2>Welcome to the Network!</h2>
              <p>
                Thank you for joining the Busmo Investor Network. 
                We'll notify you at <strong>{formData.email}</strong> when investment opportunities matching your profile become available.
              </p>
              <p className="success-sub">
                Our team will review your profile and may reach out to discuss your investment strategy in more detail.
              </p>
              <div className="success-actions">
                <button className="btn-primary" onClick={() => handleNavigate('pricing')}>
                  Explore Busmo
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
