const fs = require('fs');

const filePath = 'src/app/owner/dashboard/translations.ts';
const content = fs.readFileSync(filePath, 'utf8');

// Add common.category to the type definition
const fixed = content.replace(
  /'common\.selectCategory':string; 'common\.selectReason':string;/,
  "'common.selectCategory':string; 'common.category':string; 'common.selectReason':string;"
);

fs.writeFileSync(filePath, fixed, 'utf8');
console.log('Fixed translations.ts');
