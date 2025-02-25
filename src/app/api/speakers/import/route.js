// src/app/api/speakers/import/route.js
import { NextResponse } from 'next/server';
import { tournamentDb } from '@/lib/database';

// POST /api/speakers/import
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const tournamentId = formData.get('tournamentId') || 1;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Read the file content
    const fileContent = await file.text();
    
    // Simple CSV parsing (for a production app, you'd use a library like papaparse)
    const rows = fileContent.split('\n');
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validate headers
    const requiredHeaders = ['name', 'team', 'position'];
    for (const required of requiredHeaders) {
      if (!headers.includes(required)) {
        return NextResponse.json(
          { error: `CSV file must include ${required} column` },
          { status: 400 }
        );
      }
    }
    
    // Open the database connection
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
      }
      
      // Commit the transaction
      await db.run('COMMIT');
    } catch (error) {
      // If there's an error, roll back
      await db.run('ROLLBACK');
      throw error;
    }
    
    await db.close();
    
    return NextResponse.json({
      success: true,
      message: `Imported ${addedSpeakers.length} speakers successfully`,
      count: addedSpeakers.length,
      speakers: addedSpeakers
    });
  } catch (error) {
    console.error('Error importing speakers:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}