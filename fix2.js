const fs = require('fs');
const f = 'src/app/welcome/page.tsx';
const c = fs.readFileSync(f, 'utf8');

// Fix duplicate comparison section tag
let updated = c.replace(
  '<section className="comparison-section"><section className="comparison-section">',
  '<section className="comparison-section">'
);

// Fix double-wrapped CTA scale
updated = updated.replace(
  '<ScrollReveal direction="up" duration={0.7} delay={0.1}>\n        <ScrollReveal direction="up" duration={0.7} delay={0.1} scale>',
  '<ScrollReveal direction="up" duration={0.7} delay={0.1} scale>'
);

// Close CTA ScrollReveal properly
updated = updated.replace(
  '</div>\n\n      {/* FOOTER */}',
  '</div>\n      </ScrollReveal>\n\n      {/* FOOTER */}'
);

fs.writeFileSync(f, updated);
console.log('fix2 done');
