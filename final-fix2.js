const fs = require('fs');
const f = 'src/app/welcome/page.tsx';
const c = fs.readFileSync(f, 'utf8');

let updated = c;

// 1. Add import
if (!updated.includes('ScrollReveal')) {
  updated = updated.replace(
    "import { BeforeAfterComparison } from './components/BeforeAfterComparison';\nimport { LangProvider }",
    "import { BeforeAfterComparison } from './components/BeforeAfterComparison';\nimport { ScrollReveal, StaggerContainer, StaggerItem } from './components/ScrollReveal';\nimport { LangProvider }"
  );
}

// 2. Close CTA ScrollReveal (currently </div> followed by blank then FOOTER)
updated = updated.replace(
  '</div>\n\n      {/* FOOTER */}',
  '</div>\n      </ScrollReveal>\n\n      {/* FOOTER */}'
);

// 3. Wrap Who Is Busmo For with ScrollReveal + StaggerContainer
const whoText = '      {/* WHO IS BUSMO FOR */}\n      <section>';
const whoReplacement = '      {/* WHO IS BUSMO FOR */}\n      <ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <section>';
updated = updated.replace(whoText, whoReplacement);

// 4. Add StaggerContainer opening before paths-grid in who section
const pathsText = '          <div className="paths-grid">\n            {/* Business Owner */}\n            <StaggerItem';
const pathsReplacement = '          <StaggerContainer staggerDelay={0.15} className="paths-grid">\n            <StaggerItem';
updated = updated.replace(pathsText, pathsReplacement);

// 5. Close StaggerContainer and ScrollReveal after who section (before features)
const whoCloseOld = '          </div>\n        </div>\n      </section>\n\n      {/* FEATURES */}';
const whoCloseNew = '          </div>\n          </StaggerContainer>\n        </div>\n      </section>\n      </ScrollReveal>\n\n      {/* FEATURES */}';
updated = updated.replace(whoCloseOld, whoCloseNew);

// 6. Wrap remaining unwrapped sections
updated = updated.replace(
  '{/* HOW BUSMO WORKS */}\n      <HowBusmoWorks',
  '<ScrollReveal direction="up" duration={0.7} delay={0.1}><HowBusmoWorks /></ScrollReveal>'
);
updated = updated.replace(
  '{/* INDUSTRY USE CASES */}\n      <IndustryUseCases',
  '<ScrollReveal direction="up" duration={0.7} delay={0.1}><IndustryUseCases /></ScrollReveal>'
);
updated = updated.replace(
  '{/* SELL ONLINE / STOREFRONT */}\n      <MarketSection onNavigate={handleNavigate}',
  '<ScrollReveal direction="up" duration={0.7} delay={0.1}><MarketSection onNavigate={handleNavigate} /></ScrollReveal>'
);
updated = updated.replace(
  '{/* ASK MO SECTION */}\n      <MoSection',
  '<ScrollReveal direction="up" duration={0.7} delay={0.1}><MoSection /></ScrollReveal>'
);

fs.writeFileSync(f, updated);
console.log('final-fix2 done');
