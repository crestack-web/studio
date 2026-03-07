import React, { useState } from 'react';
import { Page } from '../types';
import { Footer } from '../components/Footer';

interface AuthPageProps {
  onNavigate: (page: Page) => void;
}

/* ── LOGIN HUB (choose role) ── */
export const LoginPage: React.FC<AuthPageProps> = ({ onNavigate }) => (
  <div>
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><span>Busmo</span></div>
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Choose how you'd like to sign in</div>
        <div className="auth-options">
          <div className="auth-option" onClick={() => onNavigate('login-form')}>
            <div className="auth-option-left">
              <div className="auth-option-icon">🏪</div>
              <div>
                <div className="auth-option-title">Business Owner</div>
                <div className="auth-option-desc">Manage your business, track performance &amp; sell online</div>
              </div>
            </div>
            <span className="auth-option-arrow">›</span>
          </div>
          <div className="auth-option" onClick={() => alert('Staff login — invite required from your employer.')}>
            <div className="auth-option-left">
              <div className="auth-option-icon" style={{ background: 'var(--green-light)' }}>👤</div>
              <div>
                <div className="auth-option-title">Staff Member</div>
                <div className="auth-option-desc">Record sales and manage inventory for your employer</div>
              </div>
            </div>
            <span className="auth-option-arrow">›</span>
          </div>
          <div className="auth-option" onClick={() => onNavigate('invest-login')}>
            <div className="auth-option-left">
              <div className="auth-option-icon" style={{ background: 'var(--amber-light)' }}>📈</div>
              <div>
                <div className="auth-option-title">Investor</div>
                <div className="auth-option-desc">Access your investment portfolio and opportunities</div>
              </div>
            </div>
            <span className="auth-option-arrow">›</span>
          </div>
        </div>
        <div className="auth-divider">
          Don't have an account?{' '}
          <a onClick={() => onNavigate('signup')} style={{ color: 'var(--purple)', cursor: 'pointer', fontWeight: 600 }}>Sign Up Free</a>
        </div>
      </div>
    </div>
    <Footer onNavigate={onNavigate} minimal />
  </div>
);

/* ── OWNER LOGIN FORM ── */
export const LoginFormPage: React.FC<AuthPageProps> = ({ onNavigate }) => (
  <div>
    <div className="auth-page">
      <div className="auth-card">
        <button className="onboard-back" onClick={() => onNavigate('login')}>← Back</button>
        <div className="auth-logo"><span>Busmo</span></div>
        <div className="auth-title">Owner Login</div>
        <div className="auth-sub">Sign in to your business dashboard</div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="you@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" />
        </div>
        <button className="form-submit" style={{ marginTop: 8 }}>Sign In</button>
        <div className="form-footer-text">
          Don't have an account? <a onClick={() => onNavigate('signup')}>Create one free</a>
        </div>
        <div className="form-footer-text"><a>Forgot password?</a></div>
      </div>
    </div>
    <Footer onNavigate={onNavigate} minimal />
  </div>
);
