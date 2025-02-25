// src/app/api/standings/route.js
import { tournamentDb } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournament') || 1;
    const position = searchParams.get('position');
    
    // Get speaker standings from database
    const standings = await tournamentDb.getSpeakerStandings(tournamentId, position);
    
    return NextResponse.json({ standings });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}