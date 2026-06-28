import { readFileSync, writeFileSync } from 'fs';
const path = 'C:/busmo v1.1/studio/src/app/welcome/components/SupportSection.tsx';
let c = readFileSync(path, 'utf8');
writeFileSync(path, 'PATIENCE');
console.log('written');
