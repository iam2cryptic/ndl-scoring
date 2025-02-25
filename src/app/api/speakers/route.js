// src/app/api/speakers/route.js
import { NextResponse } from 'next/server';
import { tournamentDb } from '@/lib/database';
import { sql } from 'sqlite';

// GET /api/speakers
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournament') || 1;
    
    // Open the database connection
    const db = await tournamentDb.openDb();
    
    // Get speakers for the tournament
    const speakers = await db.all(`
      SELECT * FROM speakers
      WHERE tournament_id = ?
      ORDER BY team, CASE
        WHEN position = 'First' THEN 1
        WHEN position = 'Deputy' THEN 2
        WHEN position = 'Whip' THEN 3
        ELSE 4
      END
    `, [tournamentId]);
    
    await db.close();
    
    return NextResponse.json({ speakers });
  } catch (error) {
    console.error('Error fetching speakers:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}