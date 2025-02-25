## NDL Scoring System Deployment Guide

This guide will help you quickly get the NDL Scoring System online.

### 1. Set Up the Database

First, initialize and seed the database with test data:

```bash
# Initialize the database schema
npm run init-db

# Seed the database with test data (optional)
npm run seed-db
```

### 2. Building for Production

Build the application for production:

```bash
# Build the application
npm run build
```

### 3. Starting the Server

Start the production server:

```bash
# Start the server
npm start
```

The application will be available at http://localhost:3000

### 4. Deployment Options

#### Option 1: Deploy to Vercel (Recommended for Next.js)

1. Create an account on [Vercel](https://vercel.com) if you don't have one
2. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```
3. Deploy your project:
   ```bash
   vercel
   ```
4. Follow the prompts to complete deployment

#### Option 2: Deploy to a VPS or Dedicated Server

1. Set up a server with Node.js installed
2. Clone your repository or upload the files
3. Install dependencies:
   ```bash
   npm install --production
   ```
4. Initialize the database:
   ```bash
   npm run init-db
   npm run seed-db
   ```
5. Build the application:
   ```bash
   npm run build
   ```
6. Start the server:
   ```bash
   npm start
   ```
7. Set up a process manager like PM2 to keep the application running:
   ```bash
   npm install -g pm2
   pm2 start npm --name "ndl-scoring" -- start
   ```

### 5. Important Notes

- The application uses SQLite which stores data in a file. Make sure the server has write permissions.
- For production, you may want to consider using a more robust database like PostgreSQL or MySQL.
- Default login credentials:
  - Email: admin@example.com
  - Password: password123

### 6. Testing After Deployment

1. Open the application URL
2. Log in using the admin credentials
3. Navigate to the Tournament Management page
4. Try importing test data
5. Access judge URLs to test the ranking interface

### 7. Troubleshooting

- If you see database errors, make sure the database file is writable
- For API errors, check the server logs
- If you need to reset the database, delete the `ndl-scoring.db` file and run the initialization scripts again

### Contact

For issues or support, contact the development team.