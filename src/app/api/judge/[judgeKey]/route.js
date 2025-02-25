import { judgeDb } from '@/lib/database';
import { NextResponse } from 'next/server';

// GET /api/judge/[judgeKey]
// Returns judge data and their current assignments
export async function GET(request, { params }) {
  try {
    // In Next.js API routes, params is a Promise that must be awaited
    const judgeKey = await params.judgeKey;
    
    console.log('API: Looking up judge with key:', judgeKey);
    
    // Get judge information
    const judge = await judgeDb.getJudge(judgeKey);
    
    console.log('API: Judge found:', judge);
    
    if (!judge) {
      return NextResponse.json(
        { error: 'Judge not found' },
        { status: 404 }
      );
    }
    
    // For simplicity, using tournament ID 1
    const tournamentId = 1;
    
    // Get current debate assignment
    console.log('API: Looking up debate assignment for tournament:', tournamentId);
    const currentDebate = await judgeDb.getCurrentDebate(judgeKey, tournamentId);
    
    console.log('API: Current debate:', currentDebate);
    
    // Get past assignments
    const assignments = await judgeDb.getJudgeAssignments(judgeKey);
    const completedDebates = assignments.filter(a => a.status === 'completed');
    
    console.log('API: Completed debates:', completedDebates);
    
    return NextResponse.json({
      judge: {
        name: judge.name,
        role: judge.role
      },
      currentDebate,
      completedDebates
    });
  } catch (error) {
    console.error('Error fetching judge data:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}