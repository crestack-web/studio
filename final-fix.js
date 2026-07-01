const fs = require('fs');
const f = 'src/app/welcome/page.tsx';
const lines = fs.readFileSync(f, 'utf8').split('\n');

// 1. Add import after line 16 (BeforeAfterComparison)
lines.splice(17, 0, "import { ScrollReveal, StaggerContainer, StaggerItem } from './components/ScrollReveal';");

// Find "WHO IS BUSMO FOR" comment and wrap section
let whoIdx = lines.findIndex(l => l.includes('WHO IS BUSMO FOR'));
if (whoIdx !== -1) {
  lines[whoIdx] = '      <ScrollReveal direction="up" duration={0.7} delay={0.1}>\n' + lines[whoIdx];
  // Find the opening <section> after comment
  let sectionIdx = lines.findIndex((l, i) => i > whoIdx && l.includes('<section>'));
  // Insert StaggerContainer before paths-grid
  let pathsIdx = lines.findIndex((l, i) => i > whoIdx && l.includes('className="paths-grid"'));
  if (pathsIdx !== -1) {
    lines[pathsIdx] = '            <StaggerContainer staggerDelay={0.15} className="paths-grid">\n' + lines[pathsIdx];
  }
  // Find closing </section> tag after paths-grid
  let closeIdx = lines.findIndex((l, i) => i > pathsIdx && l.trim() === '</section>');
  if (closeIdx !== -1) {
    lines[closeIdx] = lines[closeIdx] + '\n      </StaggerContainer>\n      </ScrollReveal>';
  }
  // Wrap each path card with StaggerItem if not already
  for (let i = whoIdx; i < closeIdx && i < lines.length; i++) {
    if (lines[i].includes('className="path-card')) {
      if (!lines[i].includes('<StaggerItem')) {
        lines[i] = '              <StaggerItem direction="up" duration={0.6}>\n' + lines[i];
      }
    }
    if (lines[i].includes('</div>\n          </div>\n        </div>')) {
      // This is inside a path card closing - need to close StaggerItem
    }
  }
}

fs.writeFileSync(f, lines.join('\n'));
console.log('final-fix done');
