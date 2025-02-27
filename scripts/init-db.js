// scripts/init-db.js
import { initializeDb } from '../src/lib/database.js';

console.log('Initializing database...');

initializeDb()
  .then(() => {
    console.log('Database initialized successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });