const fs = require('fs');
const f = 'src/app/welcome/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Fix duplicate comparison section tag
c = c.replace(
  `<ScrollReveal direction="up" duration={0.7} delay={0.1}>
      <section className="comparison-section"><section className="comparison-section">`,
  `<ScrollReveal direction="up" duration={0.7} delay={0.1}>
      <section className="comparison-section">`
);

// 2. Fix "Who is Busmo for" section to have proper ScrollReveal + StaggerContainer
const whoIsBusmoFor = `      {/* WHO IS BUSMO FOR */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section>
          <div className="max-w">
            <div className="section-head">
              <div className="section-label">Who is Busmo for?</div>
              <h2 className="section-title">Your intelligent<br /><em>business operating system.</em></h2>
              <p className="section-sub">From recording sales with natural language to AI-powered insights — Busmo transforms how you run your business.</p>
            </div>
            <StaggerContainer staggerDelay={0.15} className="paths-grid">
              {/* Business Owner */}
              <StaggerItem direction="up" duration={0.6}><div className="path-card featured">`;

if (!c.includes('StaggerContainer')) {
  c = c.replace(
    `      {/* WHO IS BUSMO FOR */}
      <section>
        <div className="max-w">
          <div className="section-head">
            <div className="section-label">Who is Busmo for?</div>
            <h2 className="section-title">Your intelligent<br /><em>business operating system.</em></h2>
            <p className="section-sub">From recording sales with natural language to AI-powered insights — Busmo transforms how you run your business.</p>
          </div>
          <div className="paths-grid">
            {/* Business Owner */}
            <StaggerItem direction="up" duration={0.6}><div className="path-card featured">`,
    whoIsBusmoFor
  );
}

// Close the StaggerContainer properly after the last path card
c = c.replace(
  `</button>
            </div>
          </div>
        </div>
      </section>`,
  `</button>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
      </ScrollReveal>`
);

// 3. Wrap CTA banner with scale animation
const ctaBanner = `<ScrollReveal direction="up" duration={0.7} delay={0.1} scale>
        <div className="cta-banner">`;

if (!c.includes('scale>')) {
  c = c.replace(
    `<div className="cta-banner">`,
    ctaBanner
  );

  c = c.replace(
    `</div>\n\n      {/* FOOTER */}`,
    `</div>
      </ScrollReveal>\n\n      {/* FOOTER */}`
  );
}

// 4. Add ScrollReveal import if missing
if (!c.includes('ScrollReveal')) {
  c = c.replace(
    `import { BeforeAfterComparison } from './components/BeforeAfterComparison';
import { LangProvider } from '../owner/dashboard/LangContext';`,
    `import { BeforeAfterComparison } from './components/BeforeAfterComparison';
import { ScrollReveal, StaggerContainer, StaggerItem } from './components/ScrollReveal';
import { LangProvider } from '../owner/dashboard/LangContext';`
  );
}

fs.writeFileSync(f, c);
console.log('done');
