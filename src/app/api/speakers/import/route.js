// src/app/api/speakers/import/route.js
import { NextResponse } from 'next/server';
import { openDb } from '@/lib/database';
import { processSpeakerData } from '@/lib/tabbycat-integration';

// Helper function to convert numeric positions to strings
function normalizePosition(position) {
  // If already a string like "First", "Deputy", etc., just return it
  if (typeof position === 'string') {
    if (['First', 'Deputy', 'Whip'].includes(position)) {
      return position;
    }
    
    // Handle variations
    const lowerPosition = position.toLowerCase();
    if (lowerPosition.includes('first') || lowerPosition.includes('1')) {
      return 'First';
    } else if (lowerPosition.includes('deputy') || lowerPosition.includes('2')) {
      return 'Deputy';
    } else if (lowerPosition.includes('whip') || lowerPosition.includes('3')) {
      return 'Whip';
    }
  }
  
  // Handle numeric positions
  if (typeof position === 'number' || !isNaN(position)) {
    const posNum = Number(position);
    if (posNum === 1 || posNum === 1.0) return 'First';
    if (posNum === 2 || posNum === 2.0) return 'Deputy';
    if (posNum === 3 || posNum === 3.0) return 'Whip';
  }
  
  // Default
  return 'First';
}

// POST /api/speakers/import
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const tournamentId = formData.get('tournamentId') || 1;
    const importType = formData.get('importType') || 'csv'; // 'csv' or 'tabbycat'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Read the file content
    const fileContent = await file.text();
    
    // Open database connection
    const db = await openDb();
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    const addedSpeakers = [];
    
    try {
      // Process based on import type
      if (importType === 'tabbycat') {
        // Handle Tabbycat JSON import
        const tabbycatData = JSON.parse(fileContent);
        const speakers = processSpeakerData(tabbycatData);
        
        if (speakers.length === 0) {
          await db.run('ROLLBACK');
          return NextResponse.json(
            { error: 'No speakers found in the provided data' },
            { status: 400 }
          );
        }
        
        // Insert/update each speaker
        for (const speaker of speakers) {
          // Normalize the position
          speaker.position = normalizePosition(speaker.position);
          
          // Check if speaker already exists with this tabbycat_id
          const existingSpeaker = await db.get(
            'SELECT id FROM speakers WHERE tabbycat_id = ? AND tournament_id = ?',
            [speaker.tabbycat_id, tournamentId]
          );
          
          if (existingSpeaker) {
            // Update the existing speaker
            await db.run(
              `UPDATE speakers SET 
               name = ?, team = ?, position = ?
               WHERE id = ?`,
              [speaker.name, speaker.team, speaker.position, existingSpeaker.id]
            );
            
            addedSpeakers.push({
              id: existingSpeaker.id,
              name: speaker.name,
              team: speaker.team,
              position: speaker.position,
              updated: true
            });
          } else {
            // Insert a new speaker
            await db.run(
              `INSERT INTO speakers (id, tabbycat_id, name, team, position, tournament_id)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [speaker.id, speaker.tabbycat_id, speaker.name, speaker.team, speaker.position, tournamentId]
            );
            
            addedSpeakers.push({
              id: speaker.id,
              name: speaker.name,
              team: speaker.team,
              position: speaker.position,
              updated: false
            });
          }
        }
        
        // Count inserted and updated speakers
        const insertedCount = addedSpeakers.filter(s => !s.updated).length;
        const updatedCount = addedSpeakers.filter(s => s.updated).length;
        
        // Commit the transaction
        await db.run('COMMIT');
        
        return NextResponse.json({
          success: true,
          message: `Imported ${insertedCount} new speakers, updated ${updatedCount} existing speakers`,
          insertedCount,
          updatedCount,
          totalCount: addedSpeakers.length,
          speakers: addedSpeakers
        });
        
      } else {
        // Handle CSV import - original implementation with position normalization
        const rows = fileContent.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
        
        // Validate headers
        const requiredHeaders = ['name', 'team', 'position'];
        for (const required of requiredHeaders) {
          if (!headers.includes(required)) {
            await db.run('ROLLBACK');
            return NextResponse.json(
              { error: `CSV file must include ${required} column` },
              { status: 400 }
            );
          }
        }
        
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
            continue;
          }
          
          // Normalize the position
          speaker.position = normalizePosition(speaker.position);
          
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
        }
        
        // Commit the transaction
        await db.run('COMMIT');
        
        return NextResponse.json({
          success: true,
          message: `Imported ${addedSpeakers.length} speakers successfully`,
          count: addedSpeakers.length,
          speakers: addedSpeakers
        });
      }
    } catch (error) {
      // If there's an error, roll back
      await db.run('ROLLBACK');
      throw error;
    } finally {
      await db.close();
    }
  } catch (error) {
    console.error('Error importing speakers:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}