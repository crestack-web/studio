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
  amber:      '#D97706',
  amberBg:    '#FEF3C7',
  purple:     '#7C3AED',
  purpleBg:   '#EDE9FE',
  rose:       '#E11D48',
  roseBg:     '#FFF1F2',
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
        <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.06em', color: C.text1, fontFamily: FONT_DISPLAY }}>MO-SELL</span>
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

// ── Use-case card ─────────────────────────────────────────────────────────────
function UseCaseCard({ emoji, label, color, bg, items }: {
  emoji: string; label: string; color: string; bg: string; items: string[];
}) {
  return (
    <div style={{
      background: C.surface, borderRadius: 20, padding: '28px 24px',
      border: `1px solid ${C.border}`,
      boxShadow: '0 2px 12px rgba(14,88,140,0.06)',
      display: 'flex', flexDirection: 'column', gap: 16,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 36px rgba(14,165,233,0.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(14,88,140,0.06)';
      }}
    >
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem',
      }}>{emoji}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, color: C.text1 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text2 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MO chat bubble (for the AI section) ──────────────────────────────────────
function ChatBubble({ role, children }: { role: 'mo' | 'user'; children: React.ReactNode }) {
  const isMo = role === 'mo';
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      flexDirection: isMo ? 'row' : 'row-reverse',
    }}>
      {isMo && (
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(14,165,233,0.3)',
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: '75%', padding: '10px 14px', borderRadius: 14,
        fontSize: 13, lineHeight: 1.55,
        ...(isMo ? {
          background: C.surface, color: C.text1,
          border: `1px solid ${C.border}`,
          borderTopLeftRadius: 4,
        } : {
          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
          color: 'white',
          borderTopRightRadius: 4,
        }),
      }}>
        {children}
      </div>
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
        @keyframes swFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes swPulse { 0%,100%{ opacity:1; } 50%{ opacity:0.5; } }
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

        /* ── Responsive use-cases grid ── */
        .sw-usecases-grid {
          max-width: 1160px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }
        @media (max-width: 900px) {
          .sw-usecases-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .sw-usecases-grid { grid-template-columns: 1fr; }
        }

        /* ── Responsive features grid ── */
        .sw-features-grid {
          max-width: 1160px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }
        @media (max-width: 900px) {
          .sw-features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .sw-features-grid { grid-template-columns: 1fr; }
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

        /* ── MO chat mockup ── */
        .sw-chat-mockup {
          background: ${C.surface};
          border: 1px solid ${C.border};
          border-radius: 20px;
          padding: 24px;
          boxShadow: 0 12px 40px rgba(14,88,140,0.08);
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 480px;
        }
      `}</style>

      <TopNav />

      <main style={{ background: C.bg }}>

        {/* ════════════════════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════════════════════ */}
        <section className="sw-hero-section" style={{
          padding: '80px 5% 64px',
          background: `radial-gradient(ellipse 70% 50% at 60% 0%, rgba(99,102,241,0.07) 0%, transparent 60%),
                       radial-gradient(ellipse 60% 40% at 10% 80%, rgba(14,165,233,0.06) 0%, transparent 60%),
                       ${C.bg}`,
        }}>
          <div className="sw-hero-grid">

            {/* Left — copy */}
            <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="sw-fade sw-fade-1">

              {/* Use-case pills */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[
                  { emoji:'🛍️', label:'Physical', bg: C.greenBg, color: C.green },
                  { emoji:'📥', label:'Digital', bg: C.purpleBg, color: C.purple },
                  { emoji:'⚡', label:'Services', bg: C.amberBg, color: C.amber },
                  { emoji:'🎨', label:'Creators', bg: C.roseBg, color: C.rose },
                ].map(p => (
                  <span key={p.label} style={{
                    display:'inline-flex', alignItems:'center', gap:5,
                    padding:'5px 12px', borderRadius:100,
                    background: p.bg, color: p.color,
                    fontSize:12, fontWeight:700, letterSpacing:'0.02em',
                  }}>
                    {p.emoji} {p.label}
                  </span>
                ))}
              </div>

              <h1 style={{
                fontFamily: FONT_DISPLAY, fontWeight:800,
                fontSize:'clamp(2.2rem,4.5vw,3.4rem)',
                color: C.text1, lineHeight:1.08, letterSpacing:'-0.03em',
              }}>
                Sell anything.<br />
                <span style={{ background:`linear-gradient(135deg,${C.primary},${C.accent})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Launch faster with AI.
                </span>
              </h1>

              <p style={{ fontSize:17, color: C.text2, lineHeight:1.65, maxWidth:500 }}>
                Products, downloads, courses, coaching, templates — MO helps you build a
                professional online store in minutes. Your AI assistant handles setup, design,
                product pages, and payments so you can focus on what you sell.
              </p>

              <div className="sw-hero-btns">
                <GradBtn onClick={() => setShowForm(true)}>Start Selling Free →</GradBtn>
                <GradBtn href="/sell-login" outline>Log in to MO Sell</GradBtn>
              </div>

              <p style={{ fontSize:12, color: C.text3 }}>Free to start · No credit card required · Works offline</p>
            </div>

            {/* Right — AI chat mockup */}
            <div className="sw-fade sw-fade-2 sw-hero-img" style={{ display:'flex', justifyContent:'center' }}>
              <div className="sw-chat-mockup">
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div style={{
                    width:28, height:28, borderRadius:8,
                    background:`linear-gradient(135deg,${C.primary},${C.accent})`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.75rem',
                  }}>🤖</div>
                  <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, color:C.text1 }}>MO</span>
                  <span style={{ fontSize:11, color:C.green, fontWeight:600, marginLeft:'auto' }}>● Online</span>
                </div>
                <ChatBubble role="user">I sell handmade candles. Set up my store.</ChatBubble>
                <ChatBubble role="mo">
                  I&apos;ll set everything up for you. Here&apos;s what I&apos;m creating:
                  <br /><br />
                  <strong>Store:</strong> Glow & Wax Co.<br />
                  <strong>Theme:</strong> Warm neutrals, clean typography<br />
                  <strong>Collections:</strong> Signature Scents, Seasonal, Gift Sets<br />
                  <strong>Products:</strong> 8 items with AI-written descriptions
                  <br /><br />
                  <span style={{ color: C.primary, fontWeight:700 }}>Your store is live at busmo.io/store/glow-wax ✨</span>
                </ChatBubble>
                <div style={{ display:'flex', gap:8, marginTop:4 }}>
                  {['Preview store', 'Add products', 'Change colors'].map(a => (
                    <span key={a} style={{
                      padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600,
                      background:C.bg, color:C.primary, border:`1px solid ${C.border}`,
                    }}>{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            STATS BAR
        ════════════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:'48px 5%', borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, background: C.surface }}>
          <div className="sw-stats-grid">
            <StatPill value="5 min" label="Average setup time" />
            <StatPill value="₦0" label="Setup cost" />
            <StatPill value="100%" label="Mobile optimised" />
            <StatPill value="24/7" label="AI assistant active" />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            USE CASES — What you can sell
        ════════════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:'80px 5%' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.4rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                Sell products, knowledge, and skills
              </div>
              <p style={{ color:C.text2, fontSize:16, marginTop:10, maxWidth:560, margin:'10px auto 0' }}>
                One platform for every type of business. Whether you make things, teach things, or do things — MO helps you sell it online.
              </p>
            </div>
            <div className="sw-usecases-grid">
              <UseCaseCard
                emoji="🛍️" label="Physical Products" color={C.green} bg={C.greenBg}
                items={['Fashion & beauty', 'Electronics & gadgets', 'Food & beverages', 'Handmade & crafts', 'General ecommerce']}
              />
              <UseCaseCard
                emoji="📥" label="Digital Products" color={C.purple} bg={C.purpleBg}
                items={['Ebooks & guides', 'Online courses', 'Templates & presets', 'Software & apps', 'Downloads & files']}
              />
              <UseCaseCard
                emoji="⚡" label="Services" color={C.amber} bg={C.amberBg}
                items={['Coaching & consulting', 'Freelance work', 'Bookings & appointments', 'Memberships', 'Sessions & workshops']}
              />
              <UseCaseCard
                emoji="🎨" label="Creator Businesses" color={C.rose} bg={C.roseBg}
                items={['Personal brands', 'Content creators', 'Online educators', 'Influencers', 'Digital-first brands']}
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            MO — THE AI DIFFERENTIATOR
        ════════════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:'80px 5%', background:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ maxWidth:1160, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
            {/* Left — copy */}
            <div className="sw-fade sw-fade-1">
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:100,
                background:`linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.12))`,
                border:`1px solid rgba(14,165,233,0.2)`,
                fontSize:12, fontWeight:700, color:C.primary, letterSpacing:'0.04em', marginBottom:20,
              }}>
                🤖 POWERED BY MO
              </div>
              <h2 style={{
                fontFamily:FONT_DISPLAY, fontWeight:800,
                fontSize:'clamp(1.6rem,3vw,2.4rem)',
                color:C.text1, lineHeight:1.1, letterSpacing:'-0.025em', marginBottom:16,
              }}>
                Your AI business assistant<br />
                <span style={{ color:C.accent }}>builds your store for you.</span>
              </h2>
              <p style={{ fontSize:16, color:C.text2, lineHeight:1.65, marginBottom:24 }}>
                No templates to configure. No settings to figure out. Just tell MO what you sell and it creates your entire storefront — name, theme, product pages, descriptions, collections, and payment setup — all in one conversation.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  'Generates store name and brand identity from your business description',
                  'Writes compelling product descriptions and SEO tags',
                  'Creates collections, categories, and product groupings',
                  'Sets up Paystack payments and shipping rules automatically',
                  'Designs your storefront with a theme that matches your brand',
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:14, color:C.text2, lineHeight:1.5 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — chat mockup */}
            <div className="sw-fade sw-fade-2 sw-chat-mockup" style={{ margin:'0 auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <div style={{
                  width:28, height:28, borderRadius:8,
                  background:`linear-gradient(135deg,${C.primary},${C.accent})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'0.75rem',
                }}>🤖</div>
                <span style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, color:C.text1 }}>MO</span>
              </div>
              <ChatBubble role="user">I teach guitar lessons online. Help me sell courses and book sessions.</ChatBubble>
              <ChatBubble role="mo">
                Perfect! I&apos;ll set up everything:<br /><br />
                <strong>Store:</strong> Strings & Sound Studio<br />
                <strong>Products:</strong><br />
                • Beginner Guitar Course — ₦15,000 (video lessons)<br />
                • 1-on-1 Session (60 min) — ₦8,000 (booking)<br />
                • Chord Chart Pack — ₦2,500 (download)<br /><br />
                <span style={{ color: C.green, fontWeight:700 }}>✓ Store is live with payments enabled</span>
              </ChatBubble>
              <ChatBubble role="user">Add an intermediate course too</ChatBubble>
              <ChatBubble role="mo">
                Done! Added <strong>Intermediate Masterclass</strong> — ₦25,000 with 12 video lessons. Your store now has 4 products. 🎸
              </ChatBubble>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            FEATURES GRID
        ════════════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:'80px 5%' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.4rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                Everything you need to sell online
              </div>
              <p style={{ color:C.text2, fontSize:16, marginTop:10, maxWidth:520, margin:'10px auto 0' }}>
                MO Sell is built into your Busmo dashboard — no separate account, no plugins, no complexity.
              </p>
            </div>
            <div className="sw-features-grid">
              <FeatureCard icon="🤖" title="AI Store Setup" desc="MO builds your entire store — name, theme, products, and collections — from a single conversation." />
              <FeatureCard icon="💳" title="Paystack Built-in" desc="Accept cards, bank transfers, and USSD. Funds settle directly to your bank. No third-party setup." />
              <FeatureCard icon="📦" title="Inventory Sync" desc="Physical, digital, or service — every sale automatically updates your stock and fulfilment status." />
              <FeatureCard icon="📊" title="Real-time Analytics" desc="See visitors, conversions, top products, and revenue trends at a glance on your dashboard." />
              <FeatureCard icon="🚚" title="Shipping & Delivery" desc="Flat-rate, free, or pickup — set shipping rules per region. Digital products deliver instantly." />
              <FeatureCard icon="🌐" title="Custom Domain" desc="Use your own domain or get a free busmo.io/store/your-name link. Fully branded, always." />
              <FeatureCard icon="📥" title="Digital Products" desc="Sell ebooks, courses, templates, and downloads. Files deliver instantly after payment." />
              <FeatureCard icon="📅" title="Bookings & Services" desc="Offer appointments, coaching sessions, and consultations with built-in scheduling." />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            PRICING — Trial offer + competitor comparison
        ════════════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:'80px 5%', background:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>

            {/* Section header */}
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:100,
                background: C.greenBg, color: C.green,
                fontSize:12, fontWeight:700, letterSpacing:'0.04em', marginBottom:16,
              }}>
                🎯 LIMITED OFFER
              </div>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.4rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                Try MO Sell for $1
              </div>
              <p style={{ color:C.text2, fontSize:16, marginTop:10, maxWidth:520, margin:'10px auto 0' }}>
                Get full access for 3 months at just $1. Then $10/month. Cancel anytime. No hidden fees.
              </p>
            </div>

            {/* Trial offer card */}
            <div style={{
              background:`linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
              borderRadius:24, padding:'clamp(32px,5vw,56px)',
              display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
              gap:24, marginBottom:64,
              boxShadow:'0 12px 40px rgba(14,165,233,0.25)',
            }}>
              <div style={{
                background:'rgba(255,255,255,0.15)', borderRadius:16, padding:'20px 36px',
                backdropFilter:'blur(8px)',
              }}>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:14, color:'rgba(255,255,255,0.8)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>
                  First 3 months
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', gap:4 }}>
                  <span style={{ fontFamily:FONT_DISPLAY, fontWeight:400, fontSize:28, color:'rgba(255,255,255,0.7)', lineHeight:1.2, marginTop:4 }}>$</span>
                  <span style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:72, color:'white', lineHeight:1, letterSpacing:'-0.04em' }}>1</span>
                </div>
              </div>

              <div style={{ display:'flex', flexWrap:'wrap', gap:16, justifyContent:'center' }}>
                {[
                  '✅ Unlimited products',
                  '✅ AI store builder',
                  '✅ Paystack payments',
                  '✅ All 10 themes',
                  '✅ Custom domain',
                  '✅ Digital delivery',
                  '✅ Analytics dashboard',
                  '✅ Mobile optimised',
                ].map(f => (
                  <span key={f} style={{
                    padding:'8px 16px', borderRadius:100,
                    background:'rgba(255,255,255,0.15)', color:'white',
                    fontSize:13, fontWeight:600, backdropFilter:'blur(4px)',
                  }}>{f}</span>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, marginTop:8 }}>
                <a href="/sell-subscribe" style={{
                  display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'16px 40px', borderRadius:12, fontFamily:FONT_DISPLAY,
                  fontSize:17, fontWeight:800, cursor:'pointer', textDecoration:'none',
                  background:'white', color:C.primary, letterSpacing:'-0.01em',
                  boxShadow:'0 6px 24px rgba(0,0,0,0.15)',
                  transition:'transform 0.18s ease',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'none'; }}
                >
                  Start for $1 →
                </a>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                  Then $10/month · Cancel anytime · No lock-in
                </span>
              </div>
            </div>

            {/* Competitor comparison */}
            <div style={{ textAlign:'center', marginBottom:36 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.3rem,2.5vw,1.8rem)', color:C.text1, letterSpacing:'-0.02em' }}>
                Why sellers choose MO over the alternatives
              </div>
              <p style={{ color:C.text2, fontSize:15, marginTop:8, maxWidth:480, margin:'8px auto 0' }}>
                Same features, fraction of the price. Here&apos;s how we compare.
              </p>
            </div>

            {/* Comparison cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:18 }}>

              {/* MO Sell — highlighted */}
              <div style={{
                background:C.surface, borderRadius:20, padding:'28px 24px',
                border:`2px solid ${C.primary}`,
                boxShadow:'0 8px 32px rgba(14,165,233,0.12)',
                display:'flex', flexDirection:'column', gap:18, position:'relative',
              }}>
                <div style={{
                  position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                  background:`linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  color:'white', fontSize:11, fontWeight:800, padding:'5px 14px',
                  borderRadius:100, letterSpacing:'0.06em', textTransform:'uppercase',
                  boxShadow:'0 4px 12px rgba(14,165,233,0.3)',
                }}>Best Value</div>
                <div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:20, color:C.primary }}>MO Sell</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:6 }}>
                    <span style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:32, color:C.text1, letterSpacing:'-0.03em' }}>$10</span>
                    <span style={{ fontSize:14, color:C.text3 }}>/month</span>
                  </div>
                  <div style={{ fontSize:12, color:C.green, fontWeight:700, marginTop:4 }}>$1 for first 3 months</div>
                </div>
                <div style={{ height:1, background:C.border }} />
                {[
                  { text: 'AI store builder', included: true },
                  { text: 'Unlimited products', included: true },
                  { text: 'Digital + physical + services', included: true },
                  { text: 'Paystack payments (built-in)', included: true },
                  { text: '10 premium themes', included: true },
                  { text: 'Custom domain', included: true },
                  { text: 'Ebook/file preview', included: true },
                  { text: 'Real-time analytics', included: true },
                  { text: 'Mobile-first design', included: true },
                  { text: 'Transaction fees', included: true, note: '0% (Paystack only)' },
                ].map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color: C.text2 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{f.text}</span>
                    {f.note && <span style={{ fontSize:11, color:C.green, fontWeight:600, marginLeft:'auto' }}>{f.note}</span>}
                  </div>
                ))}
              </div>

              {/* Stan Store */}
              <div style={{
                background:C.surface, borderRadius:20, padding:'28px 24px',
                border:`1px solid ${C.border}`,
                boxShadow:'0 2px 12px rgba(14,88,140,0.06)',
                display:'flex', flexDirection:'column', gap:18,
              }}>
                <div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:20, color:C.text1 }}>Stan Store</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:6 }}>
                    <span style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:32, color:C.text1, letterSpacing:'-0.03em' }}>$29</span>
                    <span style={{ fontSize:14, color:C.text3 }}>/month</span>
                  </div>
                  <div style={{ fontSize:12, color:C.text3, marginTop:4 }}>Creator plan</div>
                </div>
                <div style={{ height:1, background:C.border }} />
                {[
                  { text: 'AI store builder', included: false },
                  { text: 'Unlimited products', included: true },
                  { text: 'Digital + physical + services', included: true },
                  { text: 'Stripe payments', included: true },
                  { text: 'Limited themes', included: true, note: '~5 themes' },
                  { text: 'Custom domain', included: true, note: 'Extra cost' },
                  { text: 'Ebook/file preview', included: false },
                  { text: 'Real-time analytics', included: true, note: 'Basic' },
                  { text: 'Mobile-first design', included: true },
                  { text: 'Transaction fees', included: true, note: '0% (Stripe)' },
                ].map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color: f.included ? C.text2 : C.text3 }}>
                    {f.included ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                    <span style={{ textDecoration: f.included ? 'none' : 'line-through', opacity: f.included ? 1 : 0.6 }}>{f.text}</span>
                    {f.note && <span style={{ fontSize:11, color:C.text3, marginLeft:'auto' }}>{f.note}</span>}
                  </div>
                ))}
              </div>

              {/* Linktree */}
              <div style={{
                background:C.surface, borderRadius:20, padding:'28px 24px',
                border:`1px solid ${C.border}`,
                boxShadow:'0 2px 12px rgba(14,88,140,0.06)',
                display:'flex', flexDirection:'column', gap:18,
              }}>
                <div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:20, color:C.text1 }}>Linktree</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:6 }}>
                    <span style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:32, color:C.text1, letterSpacing:'-0.03em' }}>$24</span>
                    <span style={{ fontSize:14, color:C.text3 }}>/month</span>
                  </div>
                  <div style={{ fontSize:12, color:C.text3, marginTop:4 }}>Premium plan</div>
                </div>
                <div style={{ height:1, background:C.border }} />
                {[
                  { text: 'AI store builder', included: false },
                  { text: 'Unlimited products', included: false, note: 'Link-in-bio only' },
                  { text: 'Digital + physical + services', included: false, note: 'Links only' },
                  { text: 'Payment integrations', included: true, note: 'Limited' },
                  { text: 'Themes', included: true, note: 'Customisation only' },
                  { text: 'Custom domain', included: true, note: 'Extra cost' },
                  { text: 'Ebook/file preview', included: false },
                  { text: 'Real-time analytics', included: true, note: 'Basic' },
                  { text: 'Mobile-first design', included: true },
                  { text: 'Transaction fees', included: true, note: 'Varies' },
                ].map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color: f.included ? C.text2 : C.text3 }}>
                    {f.included ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                    <span style={{ textDecoration: f.included ? 'none' : 'line-through', opacity: f.included ? 1 : 0.6 }}>{f.text}</span>
                    {f.note && <span style={{ fontSize:11, color:C.text3, marginLeft:'auto' }}>{f.note}</span>}
                  </div>
                ))}
              </div>

              {/* Shopify */}
              <div style={{
                background:C.surface, borderRadius:20, padding:'28px 24px',
                border:`1px solid ${C.border}`,
                boxShadow:'0 2px 12px rgba(14,88,140,0.06)',
                display:'flex', flexDirection:'column', gap:18,
              }}>
                <div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:20, color:C.text1 }}>Shopify</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:6 }}>
                    <span style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:32, color:C.text1, letterSpacing:'-0.03em' }}>$39</span>
                    <span style={{ fontSize:14, color:C.text3 }}>/month</span>
                  </div>
                  <div style={{ fontSize:12, color:C.text3, marginTop:4 }}>Basic plan</div>
                </div>
                <div style={{ height:1, background:C.border }} />
                {[
                  { text: 'AI store builder', included: true, note: 'Shopify Magic' },
                  { text: 'Unlimited products', included: true },
                  { text: 'Digital + physical + services', included: true },
                  { text: 'Shopify Payments', included: true, note: 'Regional' },
                  { text: 'Themes', included: true, note: 'Many paid' },
                  { text: 'Custom domain', included: true, note: 'Extra cost' },
                  { text: 'Ebook/file preview', included: false },
                  { text: 'Real-time analytics', included: true, note: 'Advanced' },
                  { text: 'Mobile-first design', included: true },
                  { text: 'Transaction fees', included: true, note: '2.9% + 30¢' },
                ].map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color: f.included ? C.text2 : C.text3 }}>
                    {f.included ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                    <span style={{ textDecoration: f.included ? 'none' : 'line-through', opacity: f.included ? 1 : 0.6 }}>{f.text}</span>
                    {f.note && <span style={{ fontSize:11, color:C.text3, marginLeft:'auto' }}>{f.note}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom note */}
            <div style={{
              marginTop:32, textAlign:'center', padding:'16px 24px', borderRadius:12,
              background:C.bg, border:`1px solid ${C.border}`,
            }}>
              <p style={{ fontSize:13, color:C.text2, lineHeight:1.6 }}>
                <strong>MO Sell:</strong> $10/month with 0% transaction fees on our end (Paystack charges their standard rate). 
                <strong> Shopify:</strong> $39/month + 2.9% + 30¢ per transaction. 
                <strong> Stan Store:</strong> $29/month. 
                <strong> Linktree:</strong> $24/month for link-in-bio only — no store.
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:'64px 5%', background:C.surface, borderTop:`1px solid ${C.border}` }}>
          <div style={{ maxWidth:800, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.4rem,3vw,2rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                From idea to live store in 3 steps
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
              <Step n={1} title="Tell MO what you sell" desc="Describe your business, products, or skills. MO understands fashion, food, digital products, courses, services — anything." />
              <Step n={2} title="MO builds your store" desc="Your storefront, product pages with descriptions, collections, pricing, and payments are all set up automatically." />
              <Step n={3} title="Share and start selling" desc="Your store goes live instantly. Share the link, accept payments, and manage orders from your Busmo dashboard." />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            USE CASE SHOWCASE — real examples
        ════════════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:'80px 5%', background:`linear-gradient(180deg, ${C.bg} 0%, ${C.surface} 100%)` }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.4rem,3vw,2rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                Built for every kind of seller
              </div>
              <p style={{ color:C.text2, fontSize:15, marginTop:10, maxWidth:480, margin:'10px auto 0' }}>
                From fashion brands to freelance consultants — see how MO Sell works for different businesses.
              </p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:20 }}>
              {/* Fashion brand */}
              <div style={{
                background:C.surface, borderRadius:16, overflow:'hidden',
                border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(14,88,140,0.06)',
              }}>
                <div style={{ height:140, background:'linear-gradient(135deg, #FDF2F8, #FCE7F3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>👗</div>
                <div style={{ padding:'20px 18px' }}>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:C.rose, marginBottom:6 }}>Fashion Brand</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:15, color:C.text1, marginBottom:6 }}>Lagos Lace Studio</div>
                  <div style={{ fontSize:13, color:C.text2, lineHeight:1.5 }}>42 products, 3 collections. AI descriptions, Paystack checkout, Instagram integration.</div>
                </div>
              </div>
              {/* Course creator */}
              <div style={{
                background:C.surface, borderRadius:16, overflow:'hidden',
                border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(14,88,140,0.06)',
              }}>
                <div style={{ height:140, background:'linear-gradient(135deg, #EDE9FE, #DDD6FE)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>🎓</div>
                <div style={{ padding:'20px 18px' }}>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:C.purple, marginBottom:6 }}>Course Creator</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:15, color:C.text1, marginBottom:6 }}>CodeWithNgozi</div>
                  <div style={{ fontSize:13, color:C.text2, lineHeight:1.5 }}>3 courses, 1 ebook. Video hosting, instant file delivery, ₦2.4M in first month.</div>
                </div>
              </div>
              {/* Consultant */}
              <div style={{
                background:C.surface, borderRadius:16, overflow:'hidden',
                border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(14,88,140,0.06)',
              }}>
                <div style={{ height:140, background:'linear-gradient(135deg, #FEF3C7, #FDE68A)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>💼</div>
                <div style={{ padding:'20px 18px' }}>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:C.amber, marginBottom:6 }}>Consultant</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:15, color:C.text1, marginBottom:6 }}>Adaeze Strategy Co.</div>
                  <div style={{ fontSize:13, color:C.text2, lineHeight:1.5 }}>3 service tiers, booking page, client intake forms. Fully automated scheduling.</div>
                </div>
              </div>
              {/* Digital creator */}
              <div style={{
                background:C.surface, borderRadius:16, overflow:'hidden',
                border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(14,88,140,0.06)',
              }}>
                <div style={{ height:140, background:'linear-gradient(135deg, #FFF1F2, #FECDD3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>✨</div>
                <div style={{ padding:'20px 18px' }}>
                  <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:C.rose, marginBottom:6 }}>Digital Creator</div>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:15, color:C.text1, marginBottom:6 }}>The Planner Studio</div>
                  <div style={{ fontSize:13, color:C.text2, lineHeight:1.5 }}>28 digital planners, templates, and presets. Instant downloads, global reach.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            CTA / WAITLIST
        ════════════════════════════════════════════════════════════════════════ */}
        <section style={{
          padding:'80px 5%',
          background:`linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(99,102,241,0.06) 100%)`,
          borderTop:`1px solid ${C.border}`,
        }}>
          <div style={{ maxWidth:640, margin:'0 auto', textAlign:'center' }}>
            {!submitted ? (
              <>
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.2rem)', color:C.text1, letterSpacing:'-0.025em', marginBottom:12 }}>
                  Start selling in minutes, not days
                </div>
                <p style={{ color:C.text2, fontSize:15, lineHeight:1.6, marginBottom:32 }}>
                  Join sellers across Africa who are launching their stores with MO. 
                  Products, digital goods, courses, services — all from one platform.
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
                      <SelectField label="What do you sell?" id="businessType" name="businessType" value={formData.businessType} onChange={handleChange} required>
                        <option value="">Select…</option>
                        <option value="physical-products">Physical Products</option>
                        <option value="digital-products">Digital Products (ebooks, templates)</option>
                        <option value="courses">Courses & Education</option>
                        <option value="services">Services & Consulting</option>
                        <option value="coaching">Coaching & Bookings</option>
                        <option value="fashion">Fashion & Beauty</option>
                        <option value="food">Food & Beverage</option>
                        <option value="creator">Creator / Personal Brand</option>
                        <option value="multiple">Multiple — I sell different things</option>
                        <option value="other">Other / Not sure yet</option>
                      </SelectField>
                      <SelectField label="Monthly Revenue" id="monthlyRevenue" name="monthlyRevenue" value={formData.monthlyRevenue} onChange={handleChange} required>
                        <option value="">Select…</option>
                        <option value="starting">Just starting out</option>
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
                        I agree to receive updates about MO Sell and understand I&apos;m joining an early access waitlist.
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
                <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:24, color:C.text1 }}>You&apos;re on the list!</div>
                <p style={{ color:C.text2, fontSize:15, maxWidth:400, lineHeight:1.6 }}>
                  We&apos;ll notify <strong>{formData.email}</strong> as soon as your MO Sell access is ready.
                </p>
                <div style={{ display:'flex', gap:12, marginTop:8, flexWrap:'wrap', justifyContent:'center' }}>
                  <GradBtn href="/sell-login">Log in to MO Sell</GradBtn>
                  <GradBtn href="/welcome" outline>Back to Busmo</GradBtn>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════════════════════════════ */}
        <footer style={{
          padding:'32px 5%', borderTop:`1px solid ${C.border}`,
          background: C.surface,
        }}>
          <div className="sw-footer">
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
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
