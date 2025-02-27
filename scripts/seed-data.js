// scripts/seed-data.js
const { initializeDb, tournamentDb, judgeDb, debateDb } = require('../src/lib/database');

// Function to seed the database with initial data
async function seedDatabase() {
  console.log('Initializing database...');
  await initializeDb();
  
  console.log('Creating tournament...');
  const tournamentId = await tournamentDb.createTournament('NDL Season 1');
  console.log(`Created tournament with ID: ${tournamentId}`);
  
  // Set current round
  await tournamentDb.setCurrentRound(tournamentId, 1);
  
  // Create some judges
  console.log('Creating judges...');
  const judges = [
    { judge_key: 'judge_abc123', tabbycat_id: 'adj_1', name: 'John Smith', role: 'chair' },
    { judge_key: 'judge_def456', tabbycat_id: 'adj_2', name: 'Jane Doe', role: 'panelist' },
    { judge_key: 'judge_ghi789', tabbycat_id: 'adj_3', name: 'Bob Wilson', role: 'panelist' }
  ];
  
  for (const judge of judges) {
    await judgeDb.createJudge(judge);
  }
  
  // Create some debates
  console.log('Creating debates...');
  const debates = [
    {
      id: 'debate_123',
      tournament_id: tournamentId,
      tabbycat_id: '123',
      round: 1,
      venue: 'Room 101',
      aff_team: 'Team A',
      neg_team: 'Team B'
    },
    {
      id: 'debate_456',
      tournament_id: tournamentId,
      tabbycat_id: '456',
      round: 1,
      venue: 'Room 102',
      aff_team: 'Team C',
      neg_team: 'Team D'
    }
  ];
  
  for (const debate of debates) {
    await debateDb.createDebate(debate);
  }
  
  // Assign judges to debates
  console.log('Assigning judges to debates...');
  await debateDb.assignJudge('judge_abc123', 'debate_123');
  await debateDb.assignJudge('judge_def456', 'debate_123');
  await debateDb.assignJudge('judge_ghi789', 'debate_456');
  
  // Create some speakers
  console.log('Creating speakers...');
  // This would require extending the database module with functions to add speakers
  // For this minimal implementation, we're skipping this part
  
  console.log('Seed data created successfully!');
}

// Run the seeding function
seedDatabase()
  .then(() => {
    console.log('Database seeded successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });