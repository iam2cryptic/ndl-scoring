// src/lib/database.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

/**
 * Initialize and open the database connection
 */
export async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'ndl-scoring.db'),
    driver: sqlite3.Database
  });
}

/**
 * Initialize database schema
 */
export async function initializeDb() {
  const db = await openDb();
  
  await db.exec(`
    -- Judges table: Stores information about adjudicators
    CREATE TABLE IF NOT EXISTS judges (
      judge_key TEXT PRIMARY KEY,
      tabbycat_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tournaments table: Tracks different tournaments
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      current_round INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Debates table: Stores information about debate rounds
    CREATE TABLE IF NOT EXISTS debates (
      id TEXT PRIMARY KEY,
      tournament_id INTEGER NOT NULL,
      tabbycat_id TEXT NOT NULL,
      round INTEGER NOT NULL,
      venue TEXT,
      aff_team TEXT NOT NULL,
      neg_team TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    );

    -- Speakers table: Stores speaker information
    CREATE TABLE IF NOT EXISTS speakers (
      id TEXT PRIMARY KEY,
      tabbycat_id TEXT NOT NULL,
      name TEXT NOT NULL,
      team TEXT NOT NULL,
      position TEXT NOT NULL,
      tournament_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    );

    -- Debate_speakers table: Links speakers to debates
    CREATE TABLE IF NOT EXISTS debate_speakers (
      debate_id TEXT NOT NULL,
      speaker_id TEXT NOT NULL,
      PRIMARY KEY (debate_id, speaker_id),
      FOREIGN KEY (debate_id) REFERENCES debates(id),
      FOREIGN KEY (speaker_id) REFERENCES speakers(id)
    );

    -- Judge_assignments table: Tracks which judge is assigned to which debate
    CREATE TABLE IF NOT EXISTS judge_assignments (
      judge_key TEXT NOT NULL,
      debate_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, completed
      PRIMARY KEY (judge_key, debate_id),
      FOREIGN KEY (judge_key) REFERENCES judges(judge_key),
      FOREIGN KEY (debate_id) REFERENCES debates(id)
    );

    -- Rankings table: Stores speaker rankings submitted by judges
    CREATE TABLE IF NOT EXISTS rankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      judge_key TEXT NOT NULL,
      debate_id TEXT NOT NULL,
      speaker_id TEXT NOT NULL,
      ranking INTEGER NOT NULL, -- 1-6 ranking
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (judge_key) REFERENCES judges(judge_key),
      FOREIGN KEY (debate_id) REFERENCES debates(id),
      FOREIGN KEY (speaker_id) REFERENCES speakers(id),
      UNIQUE(judge_key, debate_id, speaker_id)
    );

    -- Round_scores table: Calculated scores for each speaker in each round
    CREATE TABLE IF NOT EXISTS round_scores (
      speaker_id TEXT NOT NULL,
      debate_id TEXT NOT NULL,
      round INTEGER NOT NULL,
      score REAL NOT NULL, -- Average of judge rankings converted to points
      PRIMARY KEY (speaker_id, debate_id),
      FOREIGN KEY (speaker_id) REFERENCES speakers(id),
      FOREIGN KEY (debate_id) REFERENCES debates(id)
    );

    -- Speaker_standings table: Cumulative speaker standings
    CREATE TABLE IF NOT EXISTS speaker_standings (
      speaker_id TEXT NOT NULL,
      tournament_id INTEGER NOT NULL,
      total_score REAL NOT NULL,
      rounds_participated INTEGER NOT NULL,
      average_score REAL NOT NULL,
      highest_round_score REAL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (speaker_id, tournament_id),
      FOREIGN KEY (speaker_id) REFERENCES speakers(id),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
    );
  `);
  
  console.log('Database initialized successfully');
  await db.close();
}

// Database CRUD operations for judges
export const judgeDb = {
  async createJudge(judge) {
    const db = await openDb();
    await db.run(
      `INSERT INTO judges (judge_key, tabbycat_id, name, email, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [judge.judge_key, judge.tabbycat_id, judge.name, judge.email || null, judge.role]
    );
    await db.close();
  },
  
  async getJudge(judgeKey) {
    const db = await openDb();
    const judge = await db.get('SELECT * FROM judges WHERE judge_key = ?', [judgeKey]);
    await db.close();
    return judge;
  },
  
  async getJudgeAssignments(judgeKey) {
    const db = await openDb();
    const assignments = await db.all(`
      SELECT ja.*, d.round, d.venue, d.aff_team, d.neg_team
      FROM judge_assignments ja
      JOIN debates d ON ja.debate_id = d.id
      WHERE ja.judge_key = ?
      ORDER BY d.round DESC
    `, [judgeKey]);
    await db.close();
    return assignments;
  },
  
  async getCurrentDebate(judgeKey, tournamentId) {
    const db = await openDb();
    
    // Get the current round of the tournament
    const tournament = await db.get(
      'SELECT current_round FROM tournaments WHERE id = ?', 
      [tournamentId]
    );
    
    if (!tournament) {
      await db.close();
      return null;
    }
    
    // Get the judge's assignment for the current round
    const debate = await db.get(`
      SELECT d.*, ja.status
      FROM debates d
      JOIN judge_assignments ja ON d.id = ja.debate_id
      WHERE ja.judge_key = ? AND d.tournament_id = ? AND d.round = ? AND ja.status = 'pending'
      LIMIT 1
    `, [judgeKey, tournamentId, tournament.current_round]);
    
    if (!debate) {
      await db.close();
      return null;
    }
    
    // Get the speakers for this debate
    debate.speakers = await db.all(`
      SELECT s.*
      FROM speakers s
      JOIN debate_speakers ds ON s.id = ds.speaker_id
      WHERE ds.debate_id = ?
    `, [debate.id]);
    
    await db.close();
    return debate;
  }
};

// Database operations for debates and rankings
export const debateDb = {
  async createDebate(debate) {
    const db = await openDb();
    await db.run(
      `INSERT INTO debates (id, tournament_id, tabbycat_id, round, venue, aff_team, neg_team)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        debate.id, 
        debate.tournament_id, 
        debate.tabbycat_id, 
        debate.round, 
        debate.venue || 'TBA', 
        debate.aff_team, 
        debate.neg_team
      ]
    );
    await db.close();
  },
  
  async assignJudge(judgeKey, debateId) {
    const db = await openDb();
    await db.run(
      `INSERT INTO judge_assignments (judge_key, debate_id, status)
       VALUES (?, ?, 'pending')`,
      [judgeKey, debateId]
    );
    await db.close();
  },
  
  async getJudgeAssignment(judgeKey, debateId) {
    const db = await openDb();
    const assignment = await db.get(
      `SELECT * FROM judge_assignments 
       WHERE judge_key = ? AND debate_id = ?`,
      [judgeKey, debateId]
    );
    await db.close();
    return assignment;
  },
  
  async getDebateSpeakers(debateId) {
    const db = await openDb();
    const speakers = await db.all(`
      SELECT s.*
      FROM speakers s
      JOIN debate_speakers ds ON s.id = ds.speaker_id
      WHERE ds.debate_id = ?
    `, [debateId]);
    await db.close();
    return speakers;
  },
  
  async submitRankings(judgeKey, debateId, rankings) {
    const db = await openDb();
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Insert rankings for each speaker
      for (const [speakerId, rank] of Object.entries(rankings)) {
        await db.run(
          `INSERT INTO rankings (judge_key, debate_id, speaker_id, ranking)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(judge_key, debate_id, speaker_id) 
           DO UPDATE SET ranking = ?`,
          [judgeKey, debateId, speakerId, rank, rank]
        );
      }
      
      // Update the judge assignment status
      await db.run(
        `UPDATE judge_assignments 
         SET status = 'completed' 
         WHERE judge_key = ? AND debate_id = ?`,
        [judgeKey, debateId]
      );
      
      // Commit the transaction
      await db.run('COMMIT');
    } catch (error) {
      // If there's an error, roll back the transaction
      await db.run('ROLLBACK');
      throw error;
    }
    
    await db.close();
  },
  
  async calculateScores(debateId) {
    const db = await openDb();
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Get debate info
      const debate = await db.get('SELECT * FROM debates WHERE id = ?', [debateId]);
      
      // Get all rankings for this debate
      const rankings = await db.all(`
        SELECT speaker_id, judge_key, ranking
        FROM rankings
        WHERE debate_id = ?
      `, [debateId]);
      
      // Group rankings by speaker
      const speakerRankings = {};
      for (const r of rankings) {
        if (!speakerRankings[r.speaker_id]) {
          speakerRankings[r.speaker_id] = [];
        }
        // Convert ranking to points (1st place = 5 points, 2nd place = 4 points, etc.)
        const points = 6 - r.ranking;
        speakerRankings[r.speaker_id].push(points);
      }
      
      // Calculate average score for each speaker
      for (const [speakerId, points] of Object.entries(speakerRankings)) {
        const averageScore = points.reduce((sum, p) => sum + p, 0) / points.length;
        
        // Store the round score
        await db.run(
          `INSERT INTO round_scores (speaker_id, debate_id, round, score)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(speaker_id, debate_id) 
           DO UPDATE SET score = ?`,
          [speakerId, debateId, debate.round, averageScore, averageScore]
        );
        
        // Update speaker standings
        await updateSpeakerStanding(db, speakerId, debate.tournament_id);
      }
      
      await db.run('COMMIT');
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
    
    await db.close();
  }
};

// Helper function to update speaker standings
async function updateSpeakerStanding(db, speakerId, tournamentId) {
  // Get all round scores for this speaker
  const scores = await db.all(`
    SELECT rs.score
    FROM round_scores rs
    JOIN debates d ON rs.debate_id = d.id
    WHERE rs.speaker_id = ? AND d.tournament_id = ?
  `, [speakerId, tournamentId]);
  
  if (scores.length === 0) return;
  
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const roundsParticipated = scores.length;
  const averageScore = totalScore / roundsParticipated;
  const highestRoundScore = Math.max(...scores.map(s => s.score));
  
  // Update speaker standings
  await db.run(`
    INSERT INTO speaker_standings (
      speaker_id, tournament_id, total_score, rounds_participated, 
      average_score, highest_round_score, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(speaker_id, tournament_id) 
    DO UPDATE SET 
      total_score = ?, 
      rounds_participated = ?, 
      average_score = ?, 
      highest_round_score = ?,
      updated_at = CURRENT_TIMESTAMP
  `, [
    speakerId, tournamentId, totalScore, roundsParticipated, 
    averageScore, highestRoundScore,
    totalScore, roundsParticipated, averageScore, highestRoundScore
  ]);
}

// Database operations for tournaments
export const tournamentDb = {  
  async createTournament(name) {
    const db = await openDb();
    const result = await db.run(
      'INSERT INTO tournaments (name) VALUES (?)',
      [name]
    );
    const id = result.lastID;
    await db.close();
    return id;
  },
  
  async getTournament(tournamentId) {
    const db = await openDb();
    const tournament = await db.get('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
    await db.close();
    return tournament;
  },
  
  async setCurrentRound(tournamentId, round) {
    const db = await openDb();
    await db.run(
      'UPDATE tournaments SET current_round = ? WHERE id = ?',
      [round, tournamentId]
    );
    await db.close();
  },
  
  async getSpeakerStandings(tournamentId, position = null) {
    const db = await openDb();
    
    let query = `
      SELECT ss.*, s.name, s.team, s.position
      FROM speaker_standings ss
      JOIN speakers s ON ss.speaker_id = s.id
      WHERE ss.tournament_id = ?
    `;
    
    const params = [tournamentId];
    
    if (position) {
      query += ' AND s.position = ?';
      params.push(position);
    }
    
    query += ' ORDER BY ss.average_score DESC, ss.highest_round_score DESC, ss.rounds_participated DESC';
    
    const standings = await db.all(query, params);
    await db.close();
    return standings;
  }
};