import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDb } from './lib/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Check if database exists and initialize it if needed
const dbPath = path.join(process.cwd(), 'ndl-scoring.db');
const initDb = async () => {
  try {
    const dbExists = fs.existsSync(dbPath);
    
    if (!dbExists) {
      console.log('Database file not found, initializing database...');
      await initializeDb();
      console.log('Database initialized successfully!');
    } else {
      console.log('Database file found, skipping initialization.');
    }
  } catch (error) {
    console.error('Error checking/initializing database:', error);
  }
};

// Add timestamps to log messages
const timestamp = () => {
  const now = new Date();
  return `[${now.toISOString()}]`;
};

app.prepare().then(() => {
  // Initialize database before starting the server
  initDb().then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(3000, (err) => {
      if (err) throw err;
      console.log(`${timestamp()} > Ready on http://localhost:3000`);
    });
  });
});