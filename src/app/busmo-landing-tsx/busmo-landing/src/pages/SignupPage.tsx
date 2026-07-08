import React, { useState } from 'react';
import { Page } from '../types';
import { Footer } from '../components/Footer';

interface SignupPageProps {
  onNavigate: (page: Page) => void;
}

type Step = 1 | 2 | 3;

const STEPS = 3;

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
    bizName: '', bizType: '', bizCity: '', bizCountry: 'Nigeria',
    plan: 'starter',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const next = () => setStep(s => Math.min(s + 1, STEPS) as Step);
  const back = () => setStep(s => Math.max(s - 1, 1) as Step);

  const StepDots = () => (
    <div className="onboard-steps">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`step-dot ${step === i ? 'active' : step > i ? 'done' : ''}`}
        />
      ))}
    </div>
  );

  return (
    <div className="signup-page">
      {/* Left panel */}
      <div className="signup-left">
        <div className="signup-left-title">Start knowing your numbers today.</div>
        <div className="signup-left-sub">
          Join thousands of African business owners who run smarter with Busmo.
        </div>
        <ul className="signup-perks">
          <li><span className="perk-check">✓</span> See your real profit in seconds</li>
          <li><span className="perk-check">✓</span> Track inventory, expenses, and staff</li>
          <li><span className="perk-check">✓</span> Sell online with Busmo Market</li>
          <li><span className="perk-check">✓</span> AI insights that speak your language</li>
          <li><span className="perk-check">✓</span> 3-day free trial — no credit card needed</li>
        </ul>
      </div>

      {/* Right: form */}
      <div className="signup-right">
        <StepDots />

        {step === 1 && (
          <>
            <div className="signup-right-title">Create your account</div>
            <div className="signup-right-sub">Step 1 of 3 — Your personal details</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" placeholder="Femi" value={form.firstName} onChange={set('firstName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" placeholder="Adeyemi" value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} />
            </div>
            <button className="form-submit" onClick={next}>Continue →</button>
            <div className="form-footer-text">
              Already have an account? <a onClick={() => onNavigate('login')}>Sign in</a>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <button className="onboard-back" onClick={back}>← Back</button>
            <div className="signup-right-title">Your Business</div>
            <div className="signup-right-sub">Step 2 of 3 — Tell us about your business</div>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input className="form-input" placeholder="e.g. Femi's Suya Spot" value={form.bizName} onChange={set('bizName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Business Type</label>
              <select className="form-select" value={form.bizType} onChange={set('bizType')}>
                <option value="">Select a type…</option>
                <option>Food &amp; Beverages</option>
                <option>Fashion &amp; Accessories</option>
                <option>Electronics &amp; Tech</option>
                <option>Grocery / Supermarket</option>
                <option>Agriculture / Farm</option>
                <option>Beauty &amp; Personal Care</option>
                <option>Manufacturing</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" placeholder="Lagos" value={form.bizCity} onChange={set('bizCity')} />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <select className="form-select" value={form.bizCountry} onChange={set('bizCountry')}>
                  <option>Nigeria</option>
                  <option>Ghana</option>
                  <option>Kenya</option>
                  <option>South Africa</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <button className="form-submit" onClick={next}>Continue →</button>
          </>
        )}

        {step === 3 && (
          <>
            <button className="onboard-back" onClick={back}>← Back</button>
            <div className="signup-right-title">Choose Your Plan</div>
            <div className="signup-right-sub">Step 3 of 3 — Start with a 3-day free trial</div>
            {[
              { key: 'starter', name: 'Starter', price: '₦20,000/mo', desc: 'For small retailers & startups', popular: false },
              { key: 'standard', name: 'Standard', price: '₦50,000/mo', desc: 'For growing businesses', popular: true },
              { key: 'pro', name: 'Pro', price: '₦100,000/mo', desc: 'For established businesses & chains', popular: false },
            ].map(plan => (
              <div
                key={plan.key}
                onClick={() => setForm(f => ({ ...f, plan: plan.key }))}
                style={{
                  border: `1.5px solid ${form.plan === plan.key ? 'var(--purple)' : 'var(--grey-200)'}`,
                  borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                  marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12,
                  background: form.plan === plan.key ? 'var(--purple-light)' : 'white',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `2px solid ${form.plan === plan.key ? 'var(--purple)' : 'var(--grey-200)'}`,
                  background: form.plan === plan.key ? 'var(--purple)' : 'white', flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--black)' }}>{plan.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{plan.desc}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--purple)' }}>{plan.price}</div>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -8, right: 12, background: 'var(--purple)', color: 'white', fontSize: '0.62rem', fontWeight: 700, padding: '2px 10px', borderRadius: 100 }}>Most Popular</div>
                )}
              </div>
            ))}
            <button className="form-submit" style={{ marginTop: 16 }}>
              🎉 Start My Free Trial
            </button>
            <div className="form-terms">
              By signing up, you agree to our <a style={{ color: 'var(--purple)', cursor: 'pointer' }}>Terms of Service</a> and <a style={{ color: 'var(--purple)', cursor: 'pointer' }}>Privacy Policy</a>.
            </div>
          </>
        )}
      </div>
    </div>
  );
};
