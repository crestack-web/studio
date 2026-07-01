const fs = require('fs');
const f = 'src/app/welcome/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Replace the main sections with animated wrappers
c = c.replace(
  /<Hero onNavigate=\{handleNavigate\} \/>/,
  `<ScrollReveal direction="up" duration={0.7}>
        <Hero onNavigate={handleNavigate} />
      </ScrollReveal>`
);

c = c.replace(
  /<DashboardMockup \/>/,
  `<ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <DashboardMockup />
      </ScrollReveal>`
);

c = c.replace(
  /<OfflineSaleSection \/>/,
  `<ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <OfflineSaleSection />
      </ScrollReveal>`
);

c = c.replace(
  /\{\* WHO IS BUSMO FOR \*\}\n      <section>\n        <div className="max-w">\n          <div className="section-head">\n            <div className="section-label">Who is Busmo for\?<\/div>\n            <h2 className="section-title">Your intelligent<br \/><em>business operating system\.<\/em><\/h2>\n            <p className="section-sub">From recording sales with natural language to AI-powered insights — Busmo transforms how you run your business\.<\/p>\n          <\/div>\n          <div className="paths-grid">/,
  `{/* WHO IS BUSMO FOR */}
      <ScrollReveal direction="up" duration={0.7} delay={0.1}>
        <section>
          <div className="max-w">
            <div className="section-head">
              <div className="section-label">Who is Busmo for?</div>
              <h2 className="section-title">Your intelligent<br /><em>business operating system.</em></h2>
              <p className="section-sub">From recording sales with natural language to AI-powered insights — Busmo transforms how you run your business.</p>
            </div>
            <StaggerContainer staggerDelay={0.15} className="paths-grid">`
);

c = c.replace(
  /<\/div>\n          <\/div>\n        <\/div>\n      <\/section>/,
  `</div>
          </div>
        </div>
      </ScrollReveal>`
);

c = c.replace(
  /<div className="path-card featured">/,
  `<StaggerItem direction="up" duration={0.6}><div className="path-card featured">`
);

c = c.replace(
  /<div className="path-card" onClick=\{\(\) => handleNavigate\('seller'\)\}>/,
  `<StaggerItem direction="up" duration={0.6}><div className="path-card" onClick={() => handleNavigate('seller')}>`
);

c = c.replace(
  /<\/button>\n            <\/div>\n          <\/div>\n        <\/div>\n      <\/section>/,
  `</button>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
      </ScrollReveal>`
);

// Animate the rest of the sections by wrapping each one
const sectionsToWrap = [
  { search: /<section className="features-bg">/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <section className="features-bg">` },
  { search: /<\/section>\n\n      \{\/\/ HOW BUSMO WORKS \*\/\}/, replace: `</ScrollReveal>\n\n      {/* HOW BUSMO WORKS */}` },
  { search: /<HowBusmoWorks \/>/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <HowBusmoWorks />\n      </ScrollReveal>` },
  { search: /<IndustryUseCases \/>/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <IndustryUseCases />\n      </ScrollReveal>` },
  { search: /<MarketSection onNavigate=\{handleNavigate\} \/>/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <MarketSection onNavigate={handleNavigate} />\n      </ScrollReveal>` },
  { search: /<MoSection \/>/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <MoSection />\n      </ScrollReveal>` },
  { search: /<section className="comparison-section">/, after: `\n      <ScrollReveal direction="up" duration={0.7} delay={0.1}>\n      <section className="comparison-section">` },
  { search: /<BeforeAfterComparison \/>/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <BeforeAfterComparison />\n      </ScrollReveal>` },
  { search: /<TestimonialsSection \/>/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <TestimonialsSection />\n      </ScrollReveal>` },
  { search: /<FAQSection \/>/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <FAQSection />\n      </ScrollReveal>` },
  { search: /<BusinessCategoriesSlider \/>/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <BusinessCategoriesSlider />\n      </ScrollReveal>` },
  { search: /<div className="cta-banner">/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <div className="cta-banner">` },
  { search: /<\/div>\n\n      \{\/\/ FOOTER \*\/\}/, replace: `</ScrollReveal>\n\n      {/* FOOTER */}` },
  { search: /<Footer onNavigate=\{handleNavigate\} \/>/, wrap: `<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <Footer onNavigate={handleNavigate} />\n      </ScrollReveal>` },
];

for (const item of sectionsToWrap) {
  if (item.wrap && !c.includes(item.wrap)) {
    c = c.replace(item.search, item.wrap);
  } else if (item.replace) {
    c = c.replace(item.search, item.replace);
  } else if (item.after) {
    // For comparison-section which is tricky
    const idx = c.indexOf('<section className="comparison-section">');
    if (idx !== -1) {
      c = c.slice(0, idx) + item.after + c.slice(idx);
    }
  }
}

// Also wrap comparison section end
const compEnd = c.indexOf('</section>', c.indexOf('comparison-section'));
if (compEnd !== -1) {
  const before = c.slice(0, compEnd + 10);
  const after = c.slice(compEnd + 10);
  c = before + '\n      </ScrollReveal>' + after;
}

fs.writeFileSync(f, c);
console.log('done');
