import React, { useState } from 'react';
import { Page } from '../types';
import { Footer } from '../components/Footer';

interface InvestorPagesProps {
  onNavigate: (page: Page) => void;
}

/* ═══════════════════════════════════════════
   INVESTOR LANDING PAGE
═══════════════════════════════════════════ */
export const InvestPage: React.FC<InvestorPagesProps> = ({ onNavigate }) => (
  <div>
    <div className="invest-hero">
      <div className="invest-badge">📈 Accredited Investor Access</div>
      <h1>
        Invest in Africa's<br />
        <em style={{ color: 'var(--amber)' }}>Verified Businesses.</em>
      </h1>
      <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
        Discover and fund the next generation of African small businesses —
        backed by live, real-time data you can actually trust.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary btn-large" onClick={() => onNavigate('invest-signup')}>
          Apply as an Investor
        </button>
        <button className="btn-outline-large" onClick={() => onNavigate('invest-login')}>
          Investor Sign In
        </button>
      </div>
    </div>

    {/* How it works */}
    <section className="features-bg">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">How It Works</div>
          <h2 className="section-title">Data-backed investing, <em>done right.</em></h2>
        </div>
        <div className="features-grid">
          <div className="feat-card">
            <div className="feat-icon" style={{ background: 'var(--amber-light)' }}>🔍</div>
            <div className="feat-title">Browse Verified Opportunities</div>
            <div className="feat-desc">Explore business listings with real sales data, profit trends, and health scores — all pulled directly from their Busmo dashboards.</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon" style={{ background: 'var(--amber-light)' }}>📊</div>
            <div className="feat-title">See Real Business Data</div>
            <div className="feat-desc">No more fabricated pitch decks. View live revenue, inventory turnover, expense ratios, and 90-day profit trends before committing.</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon" style={{ background: 'var(--amber-light)' }}>🤝</div>
            <div className="feat-title">Invest on Your Terms</div>
            <div className="feat-desc">Choose between profit-sharing agreements or equity stakes. Define your return expectations and investment horizon.</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon" style={{ background: 'var(--amber-light)' }}>📈</div>
            <div className="feat-title">Track Your Portfolio</div>
            <div className="feat-desc">Your investor dashboard shows live performance for every business you've funded — returns, payout history, and business health alerts.</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon" style={{ background: 'var(--amber-light)' }}>🛡️</div>
            <div className="feat-title">Reduced Risk</div>
            <div className="feat-desc">Every business on Busmo is verified with at least 90 days of trading history. Red flags surface automatically before you invest.</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon" style={{ background: 'var(--amber-light)' }}>🌍</div>
            <div className="feat-title">Invest Across Africa</div>
            <div className="feat-desc">Fund businesses in Nigeria, Ghana, Kenya and beyond. Diversify your portfolio across sectors and geographies.</div>
          </div>
        </div>
      </div>
    </section>

    {/* Live opportunities preview */}
    <section style={{ background: 'var(--white)' }}>
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">Live Opportunities</div>
          <h2 className="section-title">Businesses seeking <em>funding now</em></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20, maxWidth: 960, margin: '0 auto' }}>
          {[
            { name: "Aisha's Crafts", sector: 'Fashion', location: 'Lagos, Nigeria', roi: '18% ROI', revenue: '₦840K/mo avg', verified: true, type: 'Profit Share' },
            { name: "Femi's Farm", sector: 'Agriculture', location: 'Oyo, Nigeria', roi: '22% ROI', revenue: '₦1.2M/mo avg', verified: true, type: 'Equity' },
            { name: 'City Electronics', sector: 'Retail', location: 'Abuja, Nigeria', roi: '15% ROI', revenue: '₦2.4M/mo avg', verified: true, type: 'Profit Share' },
          ].map((opp, i) => (
            <div key={i} style={{ border: '1px solid var(--grey-200)', borderRadius: 'var(--radius)', padding: 24, background: 'var(--grey-50)', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              onClick={() => onNavigate('invest-signup')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--black)' }}>{opp.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{opp.sector} · {opp.location}</div>
                </div>
                {opp.verified && <span style={{ background: 'var(--green-light)', color: 'var(--green)', fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>Verified ✓</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target ROI</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--green)', fontSize: '1.1rem' }}>{opp.roi}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Revenue</div>
                  <div style={{ fontWeight: 700, color: 'var(--black)', fontSize: '0.875rem' }}>{opp.revenue}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deal Type</div>
                  <div style={{ fontWeight: 700, color: 'var(--purple)', fontSize: '0.875rem' }}>{opp.type}</div>
                </div>
              </div>
              <button className="btn-primary" style={{ width: '100%', fontSize: '0.82rem', padding: '9px 12px' }} onClick={() => onNavigate('invest-signup')}>
                Apply to Invest →
              </button>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button className="btn-outline-large" style={{ fontSize: '0.875rem', padding: '11px 24px' }} onClick={() => onNavigate('invest-signup')}>
            See All Opportunities — Apply for Access
          </button>
        </div>
      </div>
    </section>

    <div className="cta-banner" style={{ background: 'linear-gradient(135deg, var(--grey-900), #1A1030)' }}>
      <h2>Ready to invest in<br />Africa's growth?</h2>
      <p style={{ color: 'rgba(255,255,255,0.65)' }}>Apply for investor access. Approval takes 24–48 hours.</p>
      <button className="btn-white" onClick={() => onNavigate('invest-signup')}>Apply as an Investor</button>
      <div className="cta-note">Accredited investors only · KYC required</div>
    </div>

    <Footer onNavigate={onNavigate} minimal />
  </div>
);

/* ═══════════════════════════════════════════
   INVESTOR ONBOARDING (multi-step, gated)
═══════════════════════════════════════════ */
export const InvestSignupPage: React.FC<InvestorPagesProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', country: 'Nigeria',
    investorType: '', netWorth: '', investAmount: '',
    idType: '', idNumber: '',
    linkedinUrl: '', heardFrom: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const StepDots = () => (
    <div className="onboard-steps">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className={`step-dot ${step === i ? 'active' : step > i ? 'done' : ''}`} />
      ))}
    </div>
  );

  return (
    <div className="invest-onboard">
      {/* Left panel */}
      <div className="invest-onboard-left">
        <div className="section-label">Investor Access</div>
        <h2>Fund Africa's Best Businesses.</h2>
        <p>Join a curated network of investors backing verified, data-driven African businesses on Busmo.</p>
        <ul className="invest-perks">
          <li><span className="invest-perk-icon">📊</span>Live business data — no fabricated pitch decks</li>
          <li><span className="invest-perk-icon">✅</span>All businesses verified with 90+ days trading history</li>
          <li><span className="invest-perk-icon">🤝</span>Equity or profit-share — you choose your terms</li>
          <li><span className="invest-perk-icon">📈</span>Real-time portfolio performance tracking</li>
          <li><span className="invest-perk-icon">🌍</span>Opportunities across Nigeria, Ghana, Kenya &amp; more</li>
        </ul>
      </div>

      {/* Right: form */}
      <div className="invest-onboard-right">
        <StepDots />

        {step === 1 && (
          <>
            <div className="signup-right-title">Create Investor Account</div>
            <div className="signup-right-sub">Step 1 of 4 — Your personal information</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" placeholder="Chidi" value={form.firstName} onChange={set('firstName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" placeholder="Okonkwo" value={form.lastName} onChange={set('lastName')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="chidi@example.com" value={form.email} onChange={set('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={set('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label">Country of Residence</label>
              <select className="form-select" value={form.country} onChange={set('country')}>
                <option>Nigeria</option><option>Ghana</option><option>Kenya</option>
                <option>South Africa</option><option>United Kingdom</option>
                <option>United States</option><option>Other</option>
              </select>
            </div>
            <button className="form-submit" onClick={next}>Continue →</button>
            <div className="form-footer-text">
              Already have an account? <a onClick={() => onNavigate('invest-login')}>Sign in</a>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <button className="onboard-back" onClick={back}>← Back</button>
            <div className="signup-right-title">Investor Profile</div>
            <div className="signup-right-sub">Step 2 of 4 — Your investment background</div>
            <div className="form-group">
              <label className="form-label">Investor Type</label>
              <select className="form-select" value={form.investorType} onChange={set('investorType')}>
                <option value="">Select type…</option>
                <option>Individual Angel Investor</option>
                <option>Venture Capital Firm</option>
                <option>Family Office</option>
                <option>Corporate Investor</option>
                <option>Diaspora Investor</option>
                <option>Impact Investor</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Annual Investment Budget</label>
              <select className="form-select" value={form.investAmount} onChange={set('investAmount')}>
                <option value="">Select range…</option>
                <option>Under ₦1,000,000</option>
                <option>₦1M – ₦5M</option>
                <option>₦5M – ₦20M</option>
                <option>₦20M – ₦100M</option>
                <option>Over ₦100M</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Net Worth Range</label>
              <select className="form-select" value={form.netWorth} onChange={set('netWorth')}>
                <option value="">Select range…</option>
                <option>₦10M – ₦50M</option>
                <option>₦50M – ₦200M</option>
                <option>₦200M – ₦1B</option>
                <option>Over ₦1B</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn Profile (optional)</label>
              <input className="form-input" placeholder="https://linkedin.com/in/..." value={form.linkedinUrl} onChange={set('linkedinUrl')} />
            </div>
            <button className="form-submit" onClick={next}>Continue →</button>
          </>
        )}

        {step === 3 && (
          <>
            <button className="onboard-back" onClick={back}>← Back</button>
            <div className="signup-right-title">Identity Verification</div>
            <div className="signup-right-sub">Step 3 of 4 — KYC required for investor access</div>
            <div style={{ background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.82rem', color: 'var(--amber)' }}>
              🔒 Your information is encrypted and used solely for regulatory compliance.
            </div>
            <div className="form-group">
              <label className="form-label">ID Type</label>
              <select className="form-select" value={form.idType} onChange={set('idType')}>
                <option value="">Select ID type…</option>
                <option>National Identity Card (NIN)</option>
                <option>International Passport</option>
                <option>Driver's Licence</option>
                <option>Voter's Card</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">ID Number</label>
              <input className="form-input" placeholder="Enter your ID number" value={form.idNumber} onChange={set('idNumber')} />
            </div>
            <div className="form-group">
              <label className="form-label">Upload ID Document</label>
              <div style={{ border: '2px dashed var(--grey-200)', borderRadius: 10, padding: '24px', textAlign: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                📎 Click to upload or drag &amp; drop<br />
                <span style={{ fontSize: '0.75rem' }}>JPG, PNG or PDF · Max 5MB</span>
              </div>
            </div>
            <button className="form-submit" onClick={next}>Continue →</button>
          </>
        )}

        {step === 4 && (
          <>
            <button className="onboard-back" onClick={back}>← Back</button>
            <div className="signup-right-title">Almost Done!</div>
            <div className="signup-right-sub">Step 4 of 4 — Review &amp; submit your application</div>
            <div style={{ background: 'var(--grey-50)', border: '1px solid var(--grey-200)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 12, color: 'var(--black)' }}>Application Summary</div>
              {[
                ['Name', `${form.firstName} ${form.lastName}` || '—'],
                ['Email', form.email || '—'],
                ['Type', form.investorType || '—'],
                ['Budget', form.investAmount || '—'],
                ['Country', form.country],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--grey-200)', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--black)', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--green-light)', border: '1px solid var(--green)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.82rem', color: 'var(--green)' }}>
              ✅ Applications are reviewed within <strong>24–48 hours</strong>. You'll receive an email once approved.
            </div>
            <button className="form-submit">
              🎉 Submit My Application
            </button>
            <div className="form-terms">
              By applying, you confirm you are an accredited investor and agree to our{' '}
              <a style={{ color: 'var(--purple)', cursor: 'pointer' }}>Investor Terms</a> and{' '}
              <a style={{ color: 'var(--purple)', cursor: 'pointer' }}>Privacy Policy</a>.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   INVESTOR LOGIN
═══════════════════════════════════════════ */
export const InvestLoginPage: React.FC<InvestorPagesProps> = ({ onNavigate }) => (
  <div>
    <div className="auth-page">
      <div className="auth-card">
        <button className="onboard-back" onClick={() => onNavigate('login')}>← Back</button>
        <div className="auth-logo"><span>Busmo</span></div>
        <div className="auth-title">Investor Login</div>
        <div className="auth-sub">Access your investor portfolio</div>
        <div style={{ background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: '0.8rem', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔒</span>
          <span>Investor access is restricted to approved accounts only.</span>
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="investor@example.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" placeholder="••••••••" />
        </div>
        <button className="form-submit" style={{ marginTop: 8 }}>Sign In to Portfolio</button>
        <div className="form-footer-text">
          Not an investor yet?{' '}
          <a onClick={() => onNavigate('invest-signup')} style={{ color: 'var(--purple)', cursor: 'pointer', fontWeight: 600 }}>Apply for Access</a>
        </div>
        <div className="form-footer-text"><a>Forgot password?</a></div>
      </div>
    </div>
    <Footer onNavigate={onNavigate} minimal />
  </div>
);
