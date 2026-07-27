"use client";

import React from 'react';

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
    <nav className="sw-nav" style={{
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
        <span className="sw-nav-brand" style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.06em', color: C.text1, fontFamily: FONT_DISPLAY }}>MO-SELL</span>
      </a>
      <div className="sw-nav-links" style={{ display:'flex', alignItems:'center', gap: 10 }}>
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
          gap: 40px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .sw-hero-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .sw-hero-img { display: none; }
          .sw-hero-section { padding: 24px 4% 20px !important; }
          .sw-hero-title { font-size: clamp(1.5rem, 7vw, 2rem) !important; }
          .sw-hero-subtitle { font-size: 13px !important; line-height: 1.5 !important; max-width: 100% !important; }
          .sw-hero-pills { gap: 4px !important; }
          .sw-hero-pills span { font-size: 10px !important; padding: 3px 8px !important; }
        }
        @media (max-width: 480px) {
          .sw-hero-section { padding: 18px 4% 14px !important; }
          .sw-hero-title { font-size: clamp(1.3rem, 6vw, 1.6rem) !important; }
          .sw-hero-subtitle { font-size: 13px !important; }
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
          .sw-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
        @media (max-width: 480px) {
          .sw-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
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
        @media (max-width: 768px) {
          .sw-chat-mockup { padding: 16px; gap: 10px; border-radius: 14px; }
        }

        /* ── Mobile nav compact ── */
        @media (max-width: 600px) {
          .sw-nav { padding: 0 3% !important; height: 52px !important; }
          .sw-nav-brand { font-size: 13px !important; }
          .sw-nav-links { gap: 4px !important; }
          .sw-nav-links a { font-size: 12px !important; padding: 6px 10px !important; }
        }

        /* ── Mobile section padding ── */
        @media (max-width: 768px) {
          .sw-section-lg { padding: 40px 4% !important; }
          .sw-section-md { padding: 32px 4% !important; }
        }
        @media (max-width: 480px) {
          .sw-section-lg { padding: 28px 4% !important; }
          .sw-section-md { padding: 24px 4% !important; }
        }

        /* ── Mobile MO AI section (2-col → 1-col) ── */
        @media (max-width: 768px) {
          .sw-ai-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .sw-ai-grid img { max-width: 320px !important; }
        }

        /* ── Mobile pricing trial card ── */
        @media (max-width: 480px) {
          .sw-trial-price { font-size: 52px !important; }
          .sw-trial-features { gap: 8px !important; }
          .sw-trial-features span { font-size: 11px !important; padding: 5px 10px !important; }
          .sw-compare-grid { grid-template-columns: 1fr !important; }
        }

        /* ── Mobile section headers ── */
        @media (max-width: 480px) {
          .sw-section-title { font-size: 1.3rem !important; }
          .sw-section-sub { font-size: 13px !important; }
        }
      `}</style>

      <TopNav />

      <main style={{ background: C.bg }}>

        {/* ════════════════════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════════════════════ */}
        <section className="sw-hero-section" style={{
          padding: '56px 5% 48px',
          background: `radial-gradient(ellipse 70% 50% at 60% 0%, rgba(99,102,241,0.07) 0%, transparent 60%),
                       radial-gradient(ellipse 60% 40% at 10% 80%, rgba(14,165,233,0.06) 0%, transparent 60%),
                       ${C.bg}`,
        }}>
          <div className="sw-hero-grid">

            {/* Left — copy */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="sw-fade sw-fade-1">

              {/* Use-case pills */}
              <div className="sw-hero-pills" style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[
                  { emoji:'🛍️', label:'Physical', bg: C.greenBg, color: C.green },
                  { emoji:'📥', label:'Digital', bg: C.purpleBg, color: C.purple },
                  { emoji:'⚡', label:'Services', bg: C.amberBg, color: C.amber },
                  { emoji:'🎨', label:'Creators', bg: C.roseBg, color: C.rose },
                ].map(p => (
                  <span key={p.label} style={{
                    display:'inline-flex', alignItems:'center', gap:4,
                    padding:'4px 10px', borderRadius:100,
                    background: p.bg, color: p.color,
                    fontSize:11, fontWeight:700, letterSpacing:'0.02em',
                  }}>
                    {p.emoji} {p.label}
                  </span>
                ))}
              </div>

              <h1 className="sw-hero-title" style={{
                fontFamily: FONT_DISPLAY, fontWeight:800,
                fontSize:'clamp(1.8rem,4vw,3rem)',
                color: C.text1, lineHeight:1.1, letterSpacing:'-0.03em',
              }}>
                Sell anything.<br />
                <span style={{ background:`linear-gradient(135deg,${C.primary},${C.accent})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Launch faster with AI.
                </span>
              </h1>

              <p className="sw-hero-subtitle" style={{ fontSize:15, color: C.text2, lineHeight:1.6, maxWidth:460 }}>
                Products, downloads, courses, coaching — MO builds your
                online store in minutes with AI. Setup, design, product pages,
                and payments handled for you.
              </p>

              <div className="sw-hero-btns">
                <GradBtn href="/sell-signup">Get Started Free →</GradBtn>
                <GradBtn href="/sell-login" outline>Log in to MO Sell</GradBtn>
              </div>

              <p style={{ fontSize:11, color: C.text3 }}>Free to start · No credit card required · Works offline</p>
            </div>

            {/* Right — hero image */}
            <div className="sw-fade sw-fade-2 sw-hero-img" style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785152790/Untitled_-_July_27_2026_at_08.12.54_womtaf.png"
                alt="MO Sell — AI-powered store builder"
                style={{
                  width: '100%',
                  maxWidth: 480,
                  borderRadius: 16,
                  boxShadow: '0 12px 40px rgba(14,88,140,0.12)',
                }}
              />
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
        <section className="sw-section-lg" style={{ padding:'80px 5%' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div className="sw-section-title" style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.4rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                Sell products, knowledge, and skills
              </div>
              <p className="sw-section-sub" style={{ color:C.text2, fontSize:16, marginTop:10, maxWidth:560, margin:'10px auto 0' }}>
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
        <section className="sw-section-lg" style={{ padding:'80px 5%', background:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
          <div className="sw-ai-grid" style={{ maxWidth:1160, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
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
              <p style={{ fontSize:15, color:C.text2, lineHeight:1.6, marginBottom:20 }}>
                Tell MO what you sell — it builds your entire storefront, product pages, and payments. No setup, no templates.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  'AI store name, brand & theme',
                  'Product pages with descriptions',
                  'Payments & shipping setup',
                ].map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.text2, lineHeight:1.5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — hero image */}
            <div className="sw-fade sw-fade-2" style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785152788/Untitled_-_July_27_2026_at_08.12.54-4_v2ly3f.png"
                alt="MO AI — builds your store for you"
                style={{
                  width: '100%',
                  maxWidth: 460,
                  borderRadius: 16,
                  boxShadow: '0 12px 40px rgba(14,88,140,0.12)',
                }}
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════════
            FEATURES GRID
        ════════════════════════════════════════════════════════════════════════ */}
        <section className="sw-section-lg" style={{ padding:'80px 5%' }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div className="sw-section-title" style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.4rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                Everything you need to sell online
              </div>
              <p className="sw-section-sub" style={{ color:C.text2, fontSize:16, marginTop:10, maxWidth:520, margin:'10px auto 0' }}>
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
        <section className="sw-section-lg" style={{ padding:'80px 5%', background:C.surface, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>

            {/* Section header */}
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'6px 14px', borderRadius:100,
                background: C.greenBg, color: C.green,
                fontSize:12, fontWeight:700, letterSpacing:'0.04em', marginBottom:16,
              }}>
                🎯 PRICING
              </div>
              <div className="sw-section-title" style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.4rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                Simple, transparent pricing
              </div>
              <p className="sw-section-sub" style={{ color:C.text2, fontSize:16, marginTop:10, maxWidth:520, margin:'10px auto 0' }}>
                Busmo users get 3 months free. Everyone else pays $1 for 3 months. Then $10/month for all.
              </p>
            </div>

            {/* Two pricing cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, marginBottom:64 }}>

              {/* Busmo users */}
              <div style={{
                background:C.surface, borderRadius:20, padding:'32px 28px',
                border:`2px solid ${C.primary}`,
                boxShadow:'0 8px 32px rgba(14,165,233,0.12)',
                display:'flex', flexDirection:'column', gap:16, position:'relative',
              }}>
                <div style={{
                  position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                  background:`linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                  color:'white', fontSize:11, fontWeight:800, padding:'5px 14px',
                  borderRadius:100, letterSpacing:'0.06em', textTransform:'uppercase',
                }}>Busmo Users</div>
                <div style={{ textAlign:'center', marginTop:8 }}>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:14, color:C.text3, letterSpacing:'0.04em' }}>FIRST 3 MONTHS</div>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', gap:4, marginTop:4 }}>
                    <span style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:56, color:C.primary, lineHeight:1, letterSpacing:'-0.04em' }}>Free</span>
                  </div>
                  <div style={{ fontSize:13, color:C.text3, marginTop:4 }}>Then $10/month</div>
                </div>
                <div style={{ height:1, background:C.border }} />
                {[
                  'AI store builder',
                  'Unlimited products',
                  'Paystack payments',
                  '10 premium themes',
                  'Custom domain',
                  'Analytics',
                ].map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.text2 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </div>
                ))}
                <a href="/sell-login" style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding:'12px 24px', borderRadius:10, textDecoration:'none',
                  background:C.surface, color:C.primary, border:`1.5px solid ${C.primary}`,
                  fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, marginTop:8,
                }}>Log in to MO Sell →</a>
              </div>

              {/* Everyone else */}
              <div style={{
                background:C.surface, borderRadius:20, padding:'32px 28px',
                border:`1px solid ${C.border}`,
                boxShadow:'0 2px 12px rgba(14,88,140,0.06)',
                display:'flex', flexDirection:'column', gap:16,
              }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:14, color:C.text3, letterSpacing:'0.04em' }}>FIRST 3 MONTHS</div>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'center', gap:4, marginTop:4 }}>
                    <span style={{ fontFamily:FONT_DISPLAY, fontWeight:400, fontSize:24, color:C.text3, lineHeight:1.2, marginTop:4 }}>$</span>
                    <span style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:56, color:C.text1, lineHeight:1, letterSpacing:'-0.04em' }}>1</span>
                  </div>
                  <div style={{ fontSize:13, color:C.text3, marginTop:4 }}>Then $10/month</div>
                </div>
                <div style={{ height:1, background:C.border }} />
                {[
                  'AI store builder',
                  'Unlimited products',
                  'Paystack payments',
                  '10 premium themes',
                  'Custom domain',
                  'Analytics',
                ].map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.text2 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </div>
                ))}
                <a href="/sell-signup" style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding:'12px 24px', borderRadius:10, textDecoration:'none',
                  background:`linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                  color:'white', fontFamily:FONT_DISPLAY, fontWeight:700, fontSize:14, marginTop:8,
                  boxShadow:'0 4px 16px rgba(14,165,233,0.25)',
                }}>Sign up for $1 →</a>
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
            <div className="sw-compare-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:18 }}>

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
                    <span style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:32, color:C.text1, letterSpacing:'-0.03em' }}>$0</span>
                    <span style={{ fontSize:14, color:C.text3 }}>/month</span>
                  </div>
                  <div style={{ fontSize:12, color:C.green, fontWeight:700, marginTop:4 }}>Free forever</div>
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
                <strong>MO Sell:</strong> Free — 0% transaction fees on our end (Paystack charges their standard rate). 
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
        <section className="sw-section-md" style={{ padding:'64px 5%', background:C.surface, borderTop:`1px solid ${C.border}` }}>
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
        <section className="sw-section-lg" style={{ padding:'80px 5%', background:`linear-gradient(180deg, ${C.bg} 0%, ${C.surface} 100%)` }}>
          <div style={{ maxWidth:1160, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div className="sw-section-title" style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.4rem,3vw,2rem)', color:C.text1, letterSpacing:'-0.025em' }}>
                Built for every kind of seller
              </div>
              <p className="sw-section-sub" style={{ color:C.text2, fontSize:15, marginTop:10, maxWidth:480, margin:'10px auto 0' }}>
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
        <section className="sw-section-lg" style={{
          padding:'80px 5%',
          background:`linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(99,102,241,0.06) 100%)`,
          borderTop:`1px solid ${C.border}`,
        }}>
          <div style={{ maxWidth:640, margin:'0 auto', textAlign:'center' }}>
            <div className="sw-section-title" style={{ fontFamily:FONT_DISPLAY, fontWeight:800, fontSize:'clamp(1.6rem,3vw,2.2rem)', color:C.text1, letterSpacing:'-0.025em', marginBottom:12 }}>
              Start selling in minutes, not days
            </div>
            <p style={{ color:C.text2, fontSize:15, lineHeight:1.6, marginBottom:32 }}>
              Join sellers across Africa who are launching their stores with MO.
              Products, digital goods, courses, services — all from one platform.
            </p>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
              <GradBtn href="/sell-signup">Get Started Free →</GradBtn>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:40, height:1, background:C.border }} />
                <span style={{ fontSize:13, color:C.text3 }}>already have an account?</span>
                <div style={{ width:40, height:1, background:C.border }} />
              </div>
              <GradBtn href="/sell-login" outline>Log in to MO Sell</GradBtn>
            </div>
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
