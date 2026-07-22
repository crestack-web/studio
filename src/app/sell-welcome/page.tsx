"use client";

import React, { useState } from 'react';

// ── Design tokens (MO Sell palette, self-contained) ──────────────────────────
const C = {
  primary:    '#0EA5E9',
  primaryDk:  '#0369A1',
  accent:     '#6366F1',
  bg:         '#F0F9FF',
  surface:    '#FFFFFF',
  border:     '#E0EFFA',
  text1:      '#0C1A2E',
  text2:      '#3D5A7A',
  text3:      '#8AAABF',
  green:      '#16A34A',
  greenBg:    '#DCFCE7',
  red:        '#DC2626',
  redBg:      '#FEE2E2',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY    = "'Plus Jakarta Sans',system-ui,sans-serif";

// ── Nav ───────────────────────────────────────────────────────────────────────
function TopNav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(240,249,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 5%', height: 64,
    }}>
      <a href="/welcome" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784635544/mo_sell_2_li0pby.png" alt="Mo-sell" style={{ height: 108, width: 'auto', objectFit: 'contain' }} />
      </a>
      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
        <a href="/welcome" style={{ color: C.text2, fontSize: 14, fontWeight: 500, textDecoration: 'none', fontFamily: FONT_BODY, padding: '8px 14px' }}>
          Back to Busmo
        </a>
        <a href="/sell-login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 20px', borderRadius: 10,
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
          color: 'white', fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14,
          textDecoration: 'none', boxShadow: '0 4px 12px rgba(14,165,233,0.28)',
        }}>
          Log in →
        </a>
      </div>
    </nav>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{
      background: C.surface, borderRadius: 16, padding: '24px 20px',
      border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: '0 2px 12px rgba(14,88,140,0.06)',
      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 28px rgba(14,165,233,0.14)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(14,88,140,0.06)';
      }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text1 }}>{title}</div>
      <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
}

// ── Step badge ────────────────────────────────────────────────────────────────
function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16,
        boxShadow: '0 4px 12px rgba(14,165,233,0.30)',
      }}>{n}</div>
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.text1, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.55 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────────────────────
function Field({ label, id, type = 'text', name, value, onChange, placeholder, required }: {
  label: string; id: string; type?: string; name: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label htmlFor={id} style={{ fontSize:13, fontWeight:600, color: C.text2, fontFamily: FONT_BODY }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      <input
        id={id} type={type} name={name} value={value}
        onChange={onChange} placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          padding: '11px 14px', borderRadius: 10, fontSize: 14, fontFamily: FONT_BODY,
          color: C.text1, background: '#F8FBFF', outline: 'none',
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          boxShadow: focused ? `0 0 0 3px rgba(14,165,233,0.12)` : 'none',
          transition: 'all 0.18s ease',
        }}
      />
    </div>
  );
}

// ── Select field ──────────────────────────────────────────────────────────────
function SelectField({ label, id, name, value, onChange, children, required }: {
  label: string; id: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label htmlFor={id} style={{ fontSize:13, fontWeight:600, color: C.text2, fontFamily: FONT_BODY }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      <select
        id={id} name={name} value={value} onChange={onChange} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          padding: '11px 14px', borderRadius: 10, fontSize: 14, fontFamily: FONT_BODY,
          color: C.text1, background: '#F8FBFF', outline: 'none',
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          boxShadow: focused ? `0 0 0 3px rgba(14,165,233,0.12)` : 'none',
          transition: 'all 0.18s ease', appearance: 'none',
        }}
      >{children}</select>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: '20px 28px', textAlign: 'center',
      border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(14,88,140,0.06)',
    }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, color: C.primary, letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 13, color: C.text2, marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SellWelcomePage() {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', businessName: '',
    businessType: '', productsCategory: '', monthlyRevenue: '',
    currentlySellingOnline: '', hearAboutUs: '', additionalInfo: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm]   = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Waitlist submission:', formData);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const GradBtn = ({ children, onClick, href, outline = false }: {
    children: React.ReactNode; onClick?: () => void; href?: string; outline?: boolean;
  }) => {
    const base: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '14px 32px', borderRadius: 12, fontFamily: FONT_DISPLAY,
      fontSize: 15, fontWeight: 700, cursor: 'pointer', textDecoration: 'none',
      transition: 'all 0.18s ease', letterSpacing: '-0.01em',
      ...(outline ? {
        background: 'white', color: C.primary,
        border: `1.5px solid ${C.primary}`,
      } : {
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
        color: 'white', border: 'none',
        boxShadow: '0 6px 20px rgba(14,165,233,0.30)',
      }),
    };
    if (href) return <a href={href} style={base}>{children}</a>;
    return <button type="button" onClick={onClick} style={base}>{children}</button>;
  };

  return (
    <>
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: ${FONT_BODY}; background: ${C.bg}; color: ${C.text1}; }
        @keyframes swFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        .sw-fade { animation: swFadeUp 0.5s ease both; }
        .sw-fade-1 { animation-delay: 0.1s; }
        .sw-fade-2 { animation-delay: 0.2s; }
        .sw-fade-3 { animation-delay: 0.3s; }

        /* ── Responsive hero grid ── */
        .sw-hero-grid {
          max-width: 1160px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .sw-hero-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .sw-hero-img { display: none; }
          .sw-hero-section { padding: 48px 5% 40px !important; }
        }

        /* ── Responsive stats grid ── */
        .sw-stats-grid {
          max-width: 1160px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 640px) {
          .sw-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Responsive CTA buttons ── */
        .sw-hero-btns {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        @media (max-width: 480px) {
          .sw-hero-btns { flex-direction: column; }
          .sw-hero-btns a, .sw-hero-btns button { width: 100%; justify-content: center; }
        }

        /* ── Responsive form grid ── */
        .sw-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 600px) {
          .sw-form-grid { grid-template-columns: 1fr; }
        }

        /* ── Responsive footer ── */
        .sw-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        @media (max-width: 600px) {
          .sw-footer { flex-direction: column; align-items: center; text-align: center; }
        }
      `}</style>

      <TopNav />

      <main style={{ background: C.bg }}>

        {/* ── HERO ── */}
        <section className="sw-hero-section" style={{
          padding: '80px 5% 64px',
          background: `radial-gradient(ellipse 70% 50% at 60% 0%, rgba(99,102,241,0.07) 0%, transparent 60%),
                       radial-gradient(ellipse 60% 40% at 10% 80%, rgba(14,165,233,0.06) 0%, transparent 60%),
                       ${C.bg}`,
        }}>
          <div className="sw-hero-grid">

            {/* Left */}
            <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="sw-fade sw-fade-1">
              <div style={{
                display:'inline-flex', alignItems:'center', gap:8, width:'fit-content',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.12))',
                border: `1px solid rgba(14,165,233,0.25)`,
                padding:'6px 14px', borderRadius:100,
                fontSize:12, fontWeight:700, color: C.primary, letterSpacing:'0.04em',
              }}>
                🛍️ MO SELL — YOUR ONLINE STORE
              </div>

              <h1 style={{
                fontFamily: FONT_DISPLAY, fontWeight:800,
                fontSize:'clamp(2.2rem,4.5vw,3.4rem)',
                color: C.text1, lineHeight:1.08, letterSpacing:'-0.03em',
              }}>
                Sell Online.<br />
                <span style={{ background:`linear-gradient(135deg,${C.primary},${C.accent})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Powered by MO.
                </span>
              </h1>

              <p style={{ fontSize:17, color: C.text2, lineHeight:1.65, maxWidth:480 }}>
                Launch a professional storefront, accept payments, manage orders and inventory — 
                all from your Busmo dashboard. Set up in minutes, not days.
              </p>

              <div className="sw-hero-btns">
                <GradBtn onClick={() => setShowForm(true)}>Get Early Access →</GradBtn>
                <GradBtn href="/sell-login" outline>Log in to MO Sell</GradBtn>
              </div>

              <p style={{ fontSize:12, color: C.text3 }}>Free to start · No credit card required</p>
            </div>

            {/* Right — hero image */}
            <div className="sw-fade sw-fade-2 sw-hero-img" style={{ display:'flex', justifyContent:'center' }}>
              <div style={{
                borderRadius: 24, overflow:'hidden',
                boxShadow:'0 24px 64px rgba(14,165,233,0.18)',
                border:`1px solid ${C.border}`,
                maxWidth: 500, width:'100%',
              }}>
                <img src="/sell-hero.png" alt="MO Sell dashboard preview"
                  style={{ width:'100%', height:'auto', display:'block' }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section style={{ padding:'48px 5%', borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, background: C.surface }}>
          <div className="sw-stats-grid">
            <StatPill value="5 min" label="Average setup time" />
            <StatPill value="₦0" label="Setup cost" />
            <StatPill value="100%" label="Mobile optimised" />
            <StatPill value="24/7" label="Order processing" />
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ padding:'80px 5%' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.4rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                Everything you need to sell online
              </div>
              <p style={{ color:C.text2, fontSize:16, marginTop:10, maxWidth:480, margin:'10px auto 0' }}>
                MO Sell is built into your Busmo dashboard — no separate account or integration needed.
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:18 }}>
              <FeatureCard icon="🎨" title="AI Store Setup" desc="MO sets up your entire store — name, theme, collections — in a 3-minute conversation." />
              <FeatureCard icon="💳" title="Paystack Built-in" desc="Accept card, bank transfer, and USSD payments. Funds settle directly to your bank." />
              <FeatureCard icon="📦" title="Inventory Sync" desc="Every online sale automatically updates your Busmo stock — no double-entry ever." />
              <FeatureCard icon="📊" title="Real-time Analytics" desc="See page views, conversion rate, top products, and revenue trends at a glance." />
              <FeatureCard icon="🚚" title="Shipping Zones" desc="Set flat-rate or free shipping per region. Add pickup locations for local customers." />
              <FeatureCard icon="🌐" title="Custom Domain" desc="Use your own domain name to give your store a fully branded web address." />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding:'64px 5%', background:C.surface, borderTop:`1px solid ${C.border}` }}>
          <div style={{ maxWidth:800, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.4rem,3vw,2rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                From zero to live in 3 steps
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
              <Step n={1} title="Chat with MO" desc="Tell MO what you sell. It generates your store name, colors, and collections automatically." />
              <Step n={2} title="Add your products" desc="Import from your existing Busmo inventory or add new products with images, prices and variants." />
              <Step n={3} title="Share your store link" desc="Your store goes live instantly at busmo.io/store/your-name. Share it anywhere." />
            </div>
          </div>
        </section>

        {/* ── CTA / WAITLIST ── */}
        <section style={{
          padding:'80px 5%',
          background:`linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(99,102,241,0.06) 100%)`,
          borderTop:`1px solid ${C.border}`,
        }}>
          <div style={{ maxWidth:640, margin:'0 auto', textAlign:'center' }}>
            {!submitted ? (
              <>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.2rem)', color:C.text1, letterSpacing:'-0.025em', marginBottom:12 }}>
                  Be among the first to go live
                </div>
                <p style={{ color:C.text2, fontSize:15, lineHeight:1.6, marginBottom:32 }}>
                  MO Sell is rolling out to Busmo merchants. Join the early access list — 
                  we'll notify you the moment your store is ready.
                </p>

                {!showForm ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
                    <GradBtn onClick={() => setShowForm(true)}>Get Early Access →</GradBtn>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:40, height:1, background:C.border }} />
                      <span style={{ fontSize:13, color:C.text3 }}>already have access?</span>
                      <div style={{ width:40, height:1, background:C.border }} />
                    </div>
                    <GradBtn href="/sell-login" outline>Log in to MO Sell</GradBtn>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{
                    background:C.surface, borderRadius:20, padding:'32px 28px',
                    border:`1px solid ${C.border}`, boxShadow:'0 8px 32px rgba(14,88,140,0.08)',
                    display:'flex', flexDirection:'column', gap:20, textAlign:'left',
                  }}>
                    <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:18, color:C.text1 }}>
                      Early Access Application
                    </div>

                    <div className="sw-form-grid">
                      <Field label="Full Name" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Your name" required />
                      <Field label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                      <Field label="Phone" id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+234 800 000 0000" required />
                      <Field label="Business Name" id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Your business" required />
                    </div>

                    <div className="sw-form-grid">
                      <SelectField label="Business Type" id="businessType" name="businessType" value={formData.businessType} onChange={handleChange} required>
                        <option value="">Select…</option>
                        <option value="retail">Retail</option>
                        <option value="wholesale">Wholesale</option>
                        <option value="food">Food & Beverage</option>
                        <option value="fashion">Fashion</option>
                        <option value="electronics">Electronics</option>
                        <option value="services">Services</option>
                        <option value="other">Other</option>
                      </SelectField>
                      <SelectField label="Monthly Revenue" id="monthlyRevenue" name="monthlyRevenue" value={formData.monthlyRevenue} onChange={handleChange} required>
                        <option value="">Select…</option>
                        <option value="below-100k">Below ₦100,000</option>
                        <option value="100k-500k">₦100k – ₦500k</option>
                        <option value="500k-1m">₦500k – ₦1M</option>
                        <option value="1m-5m">₦1M – ₦5M</option>
                        <option value="above-5m">Above ₦5M</option>
                      </SelectField>
                    </div>

                    <SelectField label="How did you hear about Busmo?" id="hearAboutUs" name="hearAboutUs" value={formData.hearAboutUs} onChange={handleChange} required>
                      <option value="">Select…</option>
                      <option value="social-media">Social Media</option>
                      <option value="friend-family">Friend / Family</option>
                      <option value="google-search">Google Search</option>
                      <option value="busmo-user">Already a Busmo user</option>
                      <option value="other">Other</option>
                    </SelectField>

                    <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                      <input type="checkbox" id="terms" required style={{ marginTop:2, accentColor:C.primary }} />
                      <label htmlFor="terms" style={{ fontSize:13, color:C.text2, lineHeight:1.5 }}>
                        I agree to receive updates about MO Sell and understand I'm joining an early access waitlist.
                      </label>
                    </div>

                    <button type="submit" style={{
                      padding:'14px', borderRadius:12, border:'none', cursor:'pointer',
                      background:`linear-gradient(135deg,${C.primary},${C.accent})`,
                      color:'white', fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:15,
                      boxShadow:'0 6px 20px rgba(14,165,233,0.28)',
                    }}>
                      Submit Application →
                    </button>
                  </form>
                )}
              </>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
                <div style={{ fontSize:48 }}>🎉</div>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:24, color:C.text1 }}>You're on the list!</div>
                <p style={{ color:C.text2, fontSize:15, maxWidth:400, lineHeight:1.6 }}>
                  We'll notify <strong>{formData.email}</strong> as soon as your MO Sell access is ready.
                </p>
                <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap', justifyContent:'center' }}>
                  <GradBtn href="/sell-login">Log in to MO Sell</GradBtn>
                  <GradBtn href="/welcome" outline>Back to Busmo</GradBtn>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          padding:'32px 5%', borderTop:`1px solid ${C.border}`,
          background: C.surface,
        }}>
          <div className="sw-footer">
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="url(#fg)"/>
                <defs><linearGradient id="fg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0EA5E9"/><stop offset="1" stopColor="#6366F1"/>
                </linearGradient></defs>
                <path d="M11 14h18l-2 14H13L11 14z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M16 14v-2a4 4 0 018 0v2" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, color:C.text2 }}>MO Sell by Busmo</span>
            </div>
            <p style={{ fontSize:12, color:C.text3 }}>© {new Date().getFullYear()} Busmo · Built for African commerce</p>
            <div style={{ display:'flex', gap:20 }}>
              <a href="/welcome" style={{ fontSize:13, color:C.text3, textDecoration:'none' }}>Home</a>
              <a href="/pricing" style={{ fontSize:13, color:C.text3, textDecoration:'none' }}>Pricing</a>
              <a href="/sell-login" style={{ fontSize:13, color:C.primary, fontWeight:600, textDecoration:'none' }}>Log in</a>
            </div>
          </div>
        </footer>

      </main>
    </>
  );
}
