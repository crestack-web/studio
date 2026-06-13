const fs = require('fs');
const path = require('path');

// Create a temporary next.config.js for static export
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  async redirects() {
    return [
      {
        source: '/sell',
        destination: '/seller',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
`;

console.log('Preparing to build Next.js app for Firebase Hosting...');

// Backup original config and create temporary one
const originalConfigPath = path.join(process.cwd(), 'next.config.ts');
const tempConfigPath = path.join(process.cwd(), 'next.config.js');
const backupConfigPath = path.join(process.cwd(), 'next.config.ts.backup');

try {
  // Check if the original file exists
  if (fs.existsSync(originalConfigPath)) {
    // Backup original config
    fs.copyFileSync(originalConfigPath, backupConfigPath);
    
    // Write temporary config for static export
    fs.writeFileSync(tempConfigPath, nextConfig);
    
    console.log('Temporary next.config.js created for static export.');
    
    // Execute next build
    const { spawn } = require('child_process');
    
    const buildProcess = spawn('npx', ['next', 'build'], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });
    
    buildProcess.on('close', (code) => {
      // Restore original config
      if (fs.existsSync(backupConfigPath)) {
        fs.copyFileSync(backupConfigPath, originalConfigPath);
        fs.unlinkSync(tempConfigPath);
        fs.unlinkSync(backupConfigPath);
      }
      
      if (code === 0) {
        console.log('\\nBuild completed successfully!');
        console.log('Your app is ready for Firebase Hosting in the "out" directory.');
        console.log('\\nTo deploy, run: firebase deploy --only hosting');
      } else {
        console.error('\\nBuild failed with code:', code);
        process.exit(code);
      }
    });
  } else {
    console.error('Original next.config.ts not found!');
    process.exit(1);
  }
} catch (error) {
  console.error('Error during build preparation:', error);
  process.exit(1);
}