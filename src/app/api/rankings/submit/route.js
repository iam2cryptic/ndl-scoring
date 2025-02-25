// src/app/api/rankings/submit/route.js
import { debateDb } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { judgeKey, debateId, rankings } = body;
    
    if (!judgeKey || !debateId || !rankings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate rankings format
    if (Object.keys(rankings).length !== 6) {
      return NextResponse.json(
        { error: 'Must rank exactly 6 speakers' },
        { status: 400 }
      );
    }
    
    // Submit rankings to database
    await debateDb.submitRankings(judgeKey, debateId, rankings);
    
    // Calculate scores based on the submitted rankings
    await debateDb.calculateScores(debateId);
    
    return NextResponse.json({
      success: true,
      message: 'Rankings submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting rankings:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}