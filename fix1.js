const fs = require('fs');
const f = 'src/app/welcome/page.tsx';
const c = fs.readFileSync(f, 'utf8');
const updated = c.replace(
  "import { BeforeAfterComparison } from './components/BeforeAfterComparison';\nimport { LangProvider }",
  "import { BeforeAfterComparison } from './components/BeforeAfterComparison';\nimport { ScrollReveal, StaggerContainer, StaggerItem } from './components/ScrollReveal';\nimport { LangProvider }"
);
fs.writeFileSync(f, updated);
console.log('fix1 done');
