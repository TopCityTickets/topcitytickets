const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Building TopCityTickets application');

// Temporary files to back up
const backupFiles = [
  'src/app/admin/dashboard/page.tsx',
  'src/app/Navbar.tsx',
  'src/types/database.types.ts',
];

// Create backup directory
const backupDir = path.join(__dirname, 'backup-ts');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Backup files
console.log('📑 Backing up TypeScript files');
backupFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const backupPath = path.join(backupDir, path.basename(file));
  
  if (fs.existsSync(fullPath)) {
    fs.copyFileSync(fullPath, backupPath);
    console.log(`  ✓ Backed up ${file}`);
  }
});

// Replace files with JS versions (only during build)
console.log('🔄 Temporarily converting TypeScript to JavaScript');

try {
  // Run the actual build
  console.log('🔨 Building application');
  execSync('next build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} finally {
  // Restore the original files
  console.log('🔄 Restoring original TypeScript files');
  backupFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const backupPath = path.join(backupDir, path.basename(file));
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, fullPath);
      console.log(`  ✓ Restored ${file}`);
    }
  });
}

console.log('🎉 Build process completed');