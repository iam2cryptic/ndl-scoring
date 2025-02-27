import { judgeDb } from '@/lib/database';
import { NextResponse } from 'next/server';

/**
 * Validate if a judge key is expired
 * @param {string} judgeKey - The judge key to validate
 * @returns {boolean} True if expired, false if still valid
 */
function isJudgeKeyExpired(judgeKey) {
  // Parse the parts of the key (format: judge_ID_TIMESTAMP_HASH)
  const parts = judgeKey.split('_');
  
  // If the key doesn't have the expected format with timestamp, it's using the old format
  // Return false to maintain backward compatibility
  if (parts.length < 3) {
    return false;
  }
  
  try {
    // Extract the expiration timestamp (Unix timestamp in seconds)
    const expirationTimestamp = parseInt(parts[2], 10);
    
    // Get current time in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if key is expired
    return currentTime > expirationTimestamp;
  } catch (error) {
    console.error('Error validating judge key:', error);
    return true; // If we can't validate, consider it expired for security
  }
}

// GET /api/judge/[judgeKey]
// Returns judge data and their current assignments
export async function GET(request, { params }) {
  try {
    const judgeKey = params.judgeKey;
    
    console.log('API: Looking up judge with key:', judgeKey);
    
    // Check if judge key is expired
    if (isJudgeKeyExpired(judgeKey)) {
      return NextResponse.json(
        { error: 'Judge key has expired. Please contact the tournament organizer for a new link.' },
        { status: 401 }
      );
    }
    
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