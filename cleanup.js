const fs = require('fs');
const path = require('path');

// List of files/directories to delete
const filesToDelete = [
  '$null',  // useless file with problematic name
];

console.log('Starting cleanup process...');
console.log('');

filesToDelete.forEach(item => {
  const fullPath = path.join(__dirname, item);
  
  if (fs.existsSync(fullPath)) {
    try {
      if (fs.lstatSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Deleted directory: ${item}`);
      } else {
        fs.unlinkSync(fullPath);
        console.log(`✅ Deleted file: ${item}`);
      }
    } catch (error) {
      console.error(`❌ Could not delete ${item}:`, error.message);
    }
  } else {
    console.log(`⚠️  File/directory does not exist, skipping: ${item}`);
  }
});

console.log('');
console.log('Cleanup process completed!');