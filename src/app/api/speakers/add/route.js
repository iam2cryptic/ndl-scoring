// src/app/api/speakers/add/route.js
import { NextResponse } from 'next/server';
import { tournamentDb } from '@/lib/database';

// POST /api/speakers/add
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, team, position, tabbycat_id, tournament_id } = body;
    
    if (!name || !team || !position || !tournament_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Open the database connection
    const db = await tournamentDb.openDb();
    
    // Generate a unique ID for the speaker
    const id = `speaker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Insert the speaker
    await db.run(
      `INSERT INTO speakers (id, tabbycat_id, name, team, position, tournament_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, tabbycat_id || null, name, team, position, tournament_id]
    );
    
    await db.close();
    
    return NextResponse.json({
      success: true,
      message: 'Speaker added successfully',
      speaker: { id, name, team, position, tabbycat_id, tournament_id }
    });
  } catch (error) {
    console.error('Error adding speaker:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}