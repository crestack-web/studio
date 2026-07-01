const fs=require(" "\fs\');  
const f=\src/app/welcome/page.tsx\';  
let c=fs.readFileSync(f,\utf8\');  
c=c.replace(/import { BeforeAfterComparison } from \.\/components\/BeforeAfterComparison\';/,"import { BeforeAfterComparison } from \./components/BeforeAfterComparison\';\nimport { ScrollReveal, StaggerContainer, StaggerItem } from \./components/ScrollReveal\';");  
fs.writeFileSync(f,c); 
