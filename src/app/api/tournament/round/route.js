// src/app/api/tournament/round/route.js
import { tournamentDb } from '@/lib/database';
import { NextResponse } from 'next/server';

// POST /api/tournament/round
// Updates the current round of a tournament
export async function POST(request) {
  try {
    const body = await request.json();
    const { tournamentId, round } = body;
    
    if (!tournamentId || round === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    await tournamentDb.setCurrentRound(tournamentId, round);
    
    return NextResponse.json({
      success: true,
      message: `Current round updated to ${round}`
    });
  } catch (error) {
    console.error('Error updating round:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
