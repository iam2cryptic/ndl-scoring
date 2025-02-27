// src/app/api/rankings/submit/route.js
import { debateDb, judgeDb } from '@/lib/database';
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
    
    // Validate that all ranking values are between 1 and 6
    const rankValues = Object.values(rankings);
    const validRankRange = rankValues.every(rank => rank >= 1 && rank <= 6);
    if (!validRankRange) {
      return NextResponse.json(
        { error: 'Rankings must be between 1 and 6' },
        { status: 400 }
      );
    }
    
    // Check for duplicate rankings
    const uniqueRanks = new Set(rankValues);
    if (uniqueRanks.size !== 6) {
      return NextResponse.json(
        { error: 'Each speaker must have a unique ranking (1-6)' },
        { status: 400 }
      );
    }

    // Verify that the judge is assigned to this debate
    const judge = await judgeDb.getJudge(judgeKey);
    if (!judge) {
      return NextResponse.json(
        { error: 'Invalid judge key' },
        { status: 401 }
      );
    }
    
    const assignment = await debateDb.getJudgeAssignment(judgeKey, debateId);
    if (!assignment) {
      return NextResponse.json(
        { error: 'Judge is not assigned to this debate' },
        { status: 403 }
      );
    }
    
    // Verify that all speaker IDs in rankings actually belong to this debate
    const debateSpeakers = await debateDb.getDebateSpeakers(debateId);
    const speakerIds = new Set(debateSpeakers.map(s => s.id));
    
    for (const speakerId of Object.keys(rankings)) {
      if (!speakerIds.has(speakerId)) {
        return NextResponse.json(
          { error: `Invalid speaker ID: ${speakerId}` },
          { status: 400 }
        );
      }
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