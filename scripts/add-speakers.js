// scripts/add-speakers.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'ndl-scoring.db'),
    driver: sqlite3.Database
  });
}

async function addSpeakers() {
  console.log('Adding speakers to the database...');
  const db = await openDb();
  
  // First, create speakers
  const speakers = [
    { id: "speaker_1", tabbycat_id: "1", name: "Alice Smith", team: "Team A", position: "First", tournament_id: 1 },
    { id: "speaker_2", tabbycat_id: "2", name: "Bob Jones", team: "Team A", position: "Deputy", tournament_id: 1 },
    { id: "speaker_3", tabbycat_id: "3", name: "Carol Davis", team: "Team A", position: "Whip", tournament_id: 1 },
    { id: "speaker_4", tabbycat_id: "4", name: "David Wilson", team: "Team B", position: "First", tournament_id: 1 },
    { id: "speaker_5", tabbycat_id: "5", name: "Eve Brown", team: "Team B", position: "Deputy", tournament_id: 1 },
    { id: "speaker_6", tabbycat_id: "6", name: "Frank Miller", team: "Team B", position: "Whip", tournament_id: 1 }
  ];
  
  // Insert speakers
  for (const speaker of speakers) {
    await db.run(
      `INSERT INTO speakers (id, tabbycat_id, name, team, position, tournament_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [speaker.id, speaker.tabbycat_id, speaker.name, speaker.team, speaker.position, speaker.tournament_id]
    );
  }
  
  // Link speakers to debates
  for (const speaker of speakers) {
    await db.run(
      `INSERT INTO debate_speakers (debate_id, speaker_id)
       VALUES (?, ?)`,
      ['debate_123', speaker.id]
    );
  }
  
  console.log('Speakers added successfully! Please restart your server.');
  await db.close();
}

addSpeakers()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running script:', error);
    process.exit(1);
  });