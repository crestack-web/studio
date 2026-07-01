const fs = require('fs');
const f = 'src/app/welcome/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: Add import if missing
if (!c.includes('ScrollReveal')) {
  c = c.replace(
    `import { BeforeAfterComparison } from './components/BeforeAfterComparison';\nimport { LangProvider } from '../owner/dashboard/LangContext';`,
    `import { BeforeAfterComparison } from './components/BeforeAfterComparison';\nimport { ScrollReveal, StaggerContainer, StaggerItem } from './components/ScrollReveal';\nimport { LangProvider } from '../owner/dashboard/LangContext';`
  );
}

// Fix 2: Clean duplicate comparison section tag
c = c.replace(
  `<section className="comparison-section"><section className="comparison-section">`,
  `<section className="comparison-section">`
);

// Fix 3: Fix double-wrapped CTA banner
c = c.replace(
  `<ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <ScrollReveal direction="up" duration={0.7} delay={0.1} scale>
        <div className="cta-banner">`,
  `<ScrollReveal direction="up" duration={0.7} delay={0.1} scale>
        <div className="cta-banner">`
);

c = c.replace(
  `</div>
      </ScrollReveal>

      {/* FOOTER */}`,
  `</div>
      </ScrollReveal>

      {/* FOOTER */}`
);

// Fix 4: Fix "Who is Busmo for" section - wrap with ScrollReveal + StaggerContainer
const whoIsForOriginal = `      {/* WHO IS BUSMO FOR */}
      <section>
        <div className="max-w">
          <div className="section-head">
            <div className="section-label">Who is Busmo for?</div>
            <h2 className="section-title">Your intelligent<br /><em>business operating system.</em></h2>
            <p className="section-sub">From recording sales with natural language to AI-powered insights — Busmo transforms how you run your business.</p>
          </div>
          <div className="paths-grid">`;

const whoIsForFixed = `      {/* WHO IS BUSMO FOR */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section>
          <div className="max-w">
            <div className="section-head">
              <div className="section-label">Who is Busmo for?</div>
              <h2 className="section-title">Your intelligent<br /><em>business operating system.</em></h2>
              <p className="section-sub">From recording sales with natural language to AI-powered insights — Busmo transforms how you run your business.</p>
            </div>
            <StaggerContainer staggerDelay={0.15} className="paths-grid">`;

c = c.replace(whoIsForOriginal, whoIsForFixed);

// Fix 5: Close StaggerContainer after path cards
const pathCardsEnd = `</button>
              </div>
            </div>
          </div>
        </div>
      </section>`;

const pathCardsEndFixed = `</button>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
      </ScrollReveal>`;

c = c.replace(pathCardsEnd, pathCardsEndFixed);

fs.writeFileSync(f, c);
console.log('cleaned');
