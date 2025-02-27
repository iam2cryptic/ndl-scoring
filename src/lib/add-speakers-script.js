// src/lib/add-speakers-script.js
/**
 * This file creates a script that can be run to add speakers to debates
 * 
 * Usage: 
 * 1. Create a CSV file with headers: name,team,position,tabbycat_id (optional)
 * 2. Run: 
 *    node src/lib/add-speakers-script.js ./path/to/your/speakers.csv <tournament_id>
 */

const fs = require('fs');
const path = require('path');
const { tournamentDb } = require('./database');

async function importSpeakers(csvPath, tournamentId) {
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  // Read the CSV file
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const rows = fileContent.split('\n');
  const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
  
  // Validate headers
  const requiredHeaders = ['name', 'team', 'position'];
  for (const required of requiredHeaders) {
    if (!headers.includes(required)) {
      console.error(`CSV file must include ${required} column`);
      process.exit(1);
    }
  }

  // Open database connection
  const db = await tournamentDb.openDb();
  
  // Start a transaction
  await db.run('BEGIN TRANSACTION');
  
  const addedSpeakers = [];
  
  try {
    // Process each row (skip header)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
      if (!row) continue; // Skip empty rows
      
      const values = row.split(',').map(v => v.trim());
      
      // Create a speaker object from the row
      const speaker = {};
      headers.forEach((header, index) => {
        speaker[header] = values[index] || '';
      });
      
      // Skip rows with missing required fields
      if (!speaker.name || !speaker.team || !speaker.position) {
        console.warn(`Skipping row ${i + 1} due to missing required fields`);
        continue;
      }
      
      // Generate a unique ID for the speaker
      const id = `speaker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      
      // Insert the speaker
      await db.run(
        `INSERT INTO speakers (id, tabbycat_id, name, team, position, tournament_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, speaker.tabbycat_id || null, speaker.name, speaker.team, speaker.position, tournamentId]
      );
      
      addedSpeakers.push({
        id,
        name: speaker.name,
        team: speaker.team,
        position: speaker.position
      });
      
      console.log(`Added speaker: ${speaker.name} (${speaker.team}, ${speaker.position})`);
    }
    
    // Commit the transaction
    await db.run('COMMIT');
  } catch (error) {
    // If there's an error, roll back
    await db.run('ROLLBACK');
    console.error('Error importing speakers:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
  
  console.log(`\nSuccessfully imported ${addedSpeakers.length} speakers to tournament ID ${tournamentId}`);
}

// Check command line arguments
if (process.argv.length < 4) {
  console.log('Usage: node add-speakers-script.js path/to/speakers.csv tournament_id');
  process.exit(1);
}

const csvPath = process.argv[2];
const tournamentId = process.argv[3];

// Run the import function
importSpeakers(csvPath, tournamentId)
  .then(() => {
    console.log('Import completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during import:', error);
    process.exit(1);
  });