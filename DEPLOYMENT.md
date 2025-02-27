# NDL Scoring System Deployment Guide

This guide will help you deploy the NDL Scoring System for tournament use.

## 1. Prerequisites

- Node.js 18+ installed
- NPM or Yarn package manager
- Basic knowledge of command line operations

## 2. Set Up Environment

First, create an environment file for configuration:

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit the `.env.local` file to configure:
   - Authentication settings
   - Database path
   - Base URL for your deployment

## 3. Initialize the Database

```bash
# Initialize the database schema
npm run init-db

# (Optional) Seed the database with test data
npm run seed-db
```

## 4. Development Mode

For development and testing:

```bash
npm run dev
```

The application will be available at http://localhost:3000

## 5. Production Deployment

### Building for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

### Deployment Options

#### Option 1: Deploy to Vercel (Recommended)

1. Create an account on [Vercel](https://vercel.com)
2. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```
3. Deploy your project:
   ```bash
   vercel
   ```
4. Follow the prompts to complete deployment

#### Option 2: Deploy on a VPS or Dedicated Server

1. Set up a server with Node.js installed
2. Clone your repository:
   ```bash
   git clone https://github.com/your-username/ndl-scoring.git
   cd ndl-scoring
   ```
3. Install dependencies:
   ```bash
   npm install --production
   ```
4. Set up environment:
   ```bash
   cp .env.local.example .env.local
   nano .env.local  # Edit configuration
   ```
5. Initialize the database:
   ```bash
   npm run init-db
   ```
6. Build and start:
   ```bash
   npm run build
   npm start
   ```
7. Use a process manager like PM2 for reliability:
   ```bash
   npm install -g pm2
   pm2 start npm --name "ndl-scoring" -- start
   ```
8. Set up a reverse proxy with Nginx or Apache

## 6. Database Management

### Backups

The system includes a built-in backup solution:

```bash
# Create a backup of the database
npm run backup-db
```

This creates timestamped backups in the `/backups` directory and automatically manages retention.

### Restoring from Backup

To restore from a backup:

1. Stop the server
2. Copy the backup file to replace the main database:
   ```bash
   cp backups/ndl-scoring_YYYY-MM-DD_HH-MM-SS.db ndl-scoring.db
   ```
3. Restart the server

## 7. Security Considerations

- Change default admin credentials immediately after deployment
- For production, consider using a more robust database like PostgreSQL
- Set up HTTPS for all production deployments
- Judge links expire after 7 days by default for security
- Regularly backup your database

## 8. Default Credentials

**WARNING**: Change these after deployment!

- **Admin**: admin@example.com / password123
- **Tab Staff**: tabstaff@example.com / password123

## 9. Troubleshooting

- If you see database errors, check file permissions
- For API errors, check the server logs
- If you need to reset the database, delete the `ndl-scoring.db` file and run initialization again

For additional help, see the [project documentation](https://github.com/your-username/ndl-scoring).