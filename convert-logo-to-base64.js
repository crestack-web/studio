// Convert logo to base64 for email embedding
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'public', 'email-logo.png');

try {
  const imageBuffer = fs.readFileSync(logoPath);
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:image/png;base64,${base64Image}`;
  
  console.log('Logo converted to base64 successfully!');
  console.log('Data URL length:', dataUrl.length);
  console.log('\nFirst 200 characters:', dataUrl.substring(0, 200) + '...');
  
  // Save to file for reference
  fs.writeFileSync('logo-base64.txt', dataUrl);
  console.log('\nSaved to logo-base64.txt');
  
} catch (error) {
  console.error('Error converting logo:', error.message);
}
