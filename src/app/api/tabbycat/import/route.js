// src/app/api/tabbycat/import/route.js
import { judgeDb, debateDb, tournamentDb, openDb } from '@/lib/database';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Generates a unique and secure judge key with expiration
 * @param {string} judgeTabbycatId - The tabbycat ID of the judge
 * @param {string} tournamentId - The tournament ID
 * @returns {string} A secure judge key
 */
function generateJudgeKey(judgeTabbycatId, tournamentId) {
  // Create a timestamp that will be used for expiration (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const expirationTimestamp = Math.floor(expiresAt.getTime() / 1000);
  
  // Create a random nonce for additional security
  const nonce = crypto.randomBytes(8).toString('hex');
  
  // Combine all parts into a single string
  const baseString = `${judgeTabbycatId}:${tournamentId}:${expirationTimestamp}:${nonce}`;
  
  // Create a hash of this string to prevent tampering
  const hash = crypto.createHash('sha256').update(baseString).digest('hex').substring(0, 16);
  
  // Return the final judge key in a format that includes the expiration
  return `judge_${judgeTabbycatId}_${expirationTimestamp}_${hash}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, data, tournamentId } = body;
    
    if (!type || !data || !tournamentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (type === 'adjudicators') {
      const { judges, judgeKeys } = data;
      
      if (!judges || !judgeKeys) {
        return NextResponse.json(
          { error: 'Invalid adjudicator data format' },
          { status: 400 }
        );
      }
      
      // Create a map to store the new secure judge keys
      const secureJudgeKeys = {};
      
      // Save judges to database with secure keys
      for (const [judgeKey, judge] of Object.entries(judges)) {
        const tabbycatId = judgeKey.split('_')[1];
        const secureKey = generateJudgeKey(tabbycatId, tournamentId);
        
        await judgeDb.createJudge({
          judge_key: secureKey,
          tabbycat_id: tabbycatId,
          name: judge.name,
          email: null, // Could be added in future
          role: judge.role
        });
        
        // Store the mapping of original key to secure key
        secureJudgeKeys[judgeKey] = secureKey;
      }
      
      return NextResponse.json({
        success: true,
        message: `Imported ${Object.keys(judges).length} judges`,
        judgeKeys: secureJudgeKeys
      });
    }
    
    if (type === 'draw') {
      const { round, debates, judgeAssignments } = data;
      
      if (!round || !debates || !judgeAssignments) {
        return NextResponse.json(
          { error: 'Invalid draw data format' },
          { status: 400 }
        );
      }
      
      // Update current round
      await tournamentDb.setCurrentRound(tournamentId, round);
      
      // Save debates to database
      const db = await openDb();
      
      try {
        // Start a transaction to ensure all operations succeed or fail together
        await db.run('BEGIN TRANSACTION');
        
        for (const [debateId, debate] of Object.entries(debates)) {
          // Create the debate
          await db.run(
            `INSERT INTO debates (id, tournament_id, tabbycat_id, round, venue, aff_team, neg_team)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (id) DO UPDATE SET
             round = ?, venue = ?, aff_team = ?, neg_team = ?`,
            [
              debateId,
              tournamentId,
              debateId.split('_')[1],
              debate.round,
              debate.venue || 'TBA',
              debate.affTeam,
              debate.negTeam,
              debate.round,
              debate.venue || 'TBA',
              debate.affTeam,
              debate.negTeam
            ]
          );
          
          // Add speakers to the debate if they exist
          if (debate.speakers && debate.speakers.length > 0) {
            for (const speaker of debate.speakers) {
              // Check if speaker exists, if not create them
              const existingSpeaker = await db.get(
                'SELECT id FROM speakers WHERE id = ?',
                [speaker.id]
              );
              
              if (!existingSpeaker) {
                await db.run(
                  `INSERT INTO speakers (id, tabbycat_id, name, team, position, tournament_id)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [
                    speaker.id,
                    speaker.id.split('_')[1],
                    speaker.name,
                    speaker.team,
                    speaker.position,
                    tournamentId
                  ]
                );
              }
              
              // Link speaker to debate
              await db.run(
                `INSERT OR IGNORE INTO debate_speakers (debate_id, speaker_id)
                 VALUES (?, ?)`,
                [debateId, speaker.id]
              );
            }
          }
        }
        
        // Assign judges to debates
        for (const [judgeKey, assignment] of Object.entries(judgeAssignments)) {
          if (assignment.currentDebate) {
            await db.run(
              `INSERT INTO judge_assignments (judge_key, debate_id, status)
               VALUES (?, ?, 'pending')
               ON CONFLICT (judge_key, debate_id) DO UPDATE SET
               status = 'pending'`,
              [judgeKey, assignment.currentDebate]
            );
          }
        }
        
        await db.run('COMMIT');
      } catch (error) {
        await db.run('ROLLBACK');
        throw error;
      } finally {
        await db.close();
      }
      
      return NextResponse.json({
        success: true,
        message: `Imported round ${round} with ${Object.keys(debates).length} debates`
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid import type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}