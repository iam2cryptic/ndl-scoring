const { initializeDb } = require('./database');

// Initialize database on startup
initializeDb()
  .then(() => console.log('Database initialized successfully'))
  .catch(error => console.error('Database initialization failed:', error));