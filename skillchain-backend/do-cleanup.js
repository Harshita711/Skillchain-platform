const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\Asus\\Desktop\\files (7)\\skillchain-backend';
const itemsToDelete = ['tests', 'demo', 'migrations', 'package-lock.json.bak'];

console.log('Starting cleanup...\n');

itemsToDelete.forEach(item => {
  const fullPath = path.join(baseDir, item);
  try {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      console.log(`Removing directory: ${item}`);
      const removeDir = (dirPath) => {
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath).forEach(file => {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isDirectory()) {
              removeDir(filePath);
            } else {
              fs.unlinkSync(filePath);
            }
          });
          fs.rmdirSync(dirPath);
        }
      };
      removeDir(fullPath);
      console.log(`✓ Deleted directory: ${item}`);
    } else {
      console.log(`Removing file: ${item}`);
      fs.unlinkSync(fullPath);
      console.log(`✓ Deleted file: ${item}`);
    }
  } catch (err) {
    console.log(`✗ Error deleting ${item}: ${err.message}`);
  }
});

console.log('\nCleanup verification:');
itemsToDelete.forEach(item => {
  const fullPath = path.join(baseDir, item);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✗' : '✓'} ${item}: ${exists ? 'STILL EXISTS' : 'deleted'}`);
});

console.log('\nDone!');
