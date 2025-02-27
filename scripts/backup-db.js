// scripts/backup-db.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the root directory
const rootDir = path.resolve(__dirname, '..');

// Database source path
const dbSource = path.join(rootDir, 'ndl-scoring.db');

// Create backups directory if it doesn't exist
const backupsDir = path.join(rootDir, 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Generate timestamp for the backup filename
const timestamp = new Date().toISOString()
  .replace(/:/g, '-')
  .replace(/\..+/, '')
  .replace('T', '_');

// Backup destination path
const backupDest = path.join(backupsDir, `ndl-scoring_${timestamp}.db`);

try {
  // Check if the source database exists
  if (!fs.existsSync(dbSource)) {
    console.error('Database file not found at', dbSource);
    process.exit(1);
  }

  // Copy the database file
  fs.copyFileSync(dbSource, backupDest);
  console.log(`Backup created successfully: ${backupDest}`);

  // List all backups
  const backups = fs.readdirSync(backupsDir)
    .filter(file => file.endsWith('.db'))
    .sort((a, b) => fs.statSync(path.join(backupsDir, b)).mtime.getTime() - 
                     fs.statSync(path.join(backupsDir, a)).mtime.getTime());
  
  console.log('\nAvailable backups:');
  backups.forEach((backup, index) => {
    const stats = fs.statSync(path.join(backupsDir, backup));
    const date = new Date(stats.mtime).toLocaleString();
    const size = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
    console.log(`${index + 1}. ${backup} (${size}) - created on ${date}`);
  });

  // Clean old backups (keep last 5)
  const keepCount = 5;
  if (backups.length > keepCount) {
    console.log(`\nCleaning old backups (keeping the last ${keepCount})...`);
    backups.slice(keepCount).forEach(oldBackup => {
      fs.unlinkSync(path.join(backupsDir, oldBackup));
      console.log(`Deleted old backup: ${oldBackup}`);
    });
  }

  process.exit(0);
} catch (error) {
  console.error('Backup failed:', error);
  process.exit(1);
}