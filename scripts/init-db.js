// scripts/init-db.js
const { initializeDb } = require('../src/lib/database');

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