const fs = require('fs');
const f = 'src/app/welcome/page.tsx';
let c = fs.readFileSync(f, 'utf8');

// Add imports
c = c.replace(
  "import { BeforeAfterComparison } from './components/BeforeAfterComparison';\nimport { LangProvider }",
  "import { BeforeAfterComparison } from './components/BeforeAfterComparison';\nimport { ScrollReveal, StaggerContainer, StaggerItem } from './components/ScrollReveal';\nimport { LangProvider }"
);

// Fix duplicate comparison tag
c = c.replace(
  '<section className="comparison-section"><section className="comparison-section">',
  '<section className="comparison-section">'
);

// Fix double-wrapped CTA banner
c = c.replace(
  '<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <ScrollReveal direction="up" duration={0.7} delay={0.1} scale>',
  '<ScrollReveal direction="up" duration={0.7} delay={0.1} scale>'
);

// Close CTA ScrollReveal properly (remove extra one)
c = c.replace(
  '</div>\n      </ScrollReveal>\n\n      {/* FOOTER */}',
  '</div>\n      </ScrollReveal>\n\n      {/* FOOTER */}'
);

fs.writeFileSync(f, c);
console.log('fixed');
