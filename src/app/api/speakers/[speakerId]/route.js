// src/app/api/speakers/[speakerId]/route.js
import { NextResponse } from 'next/server';
import { tournamentDb } from '@/lib/database';

// DELETE /api/speakers/[speakerId]
export async function DELETE(request, { params }) {
  try {
    const speakerId = params.speakerId;
    
    if (!speakerId) {
      return NextResponse.json(
        { error: 'Speaker ID is required' },
        { status: 400 }
      );
    }
    
    // Open the database connection
    const db = await tournamentDb.openDb();
    
    // Check if the speaker exists
    const speaker = await db.get('SELECT * FROM speakers WHERE id = ?', [speakerId]);
    
    if (!speaker) {
      await db.close();
      return NextResponse.json(
        { error: 'Speaker not found' },
        { status: 404 }
      );
    }
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Delete from debate_speakers first to maintain referential integrity
      await db.run('DELETE FROM debate_speakers WHERE speaker_id = ?', [speakerId]);
      
      // Delete from rankings
      await db.run('DELETE FROM rankings WHERE speaker_id = ?', [speakerId]);
      
      // Delete from round_scores
      await db.run('DELETE FROM round_scores WHERE speaker_id = ?', [speakerId]);
      
      // Delete from speaker_standings
      await db.run('DELETE FROM speaker_standings WHERE speaker_id = ?', [speakerId]);
      
      // Finally, delete the speaker
      await db.run('DELETE FROM speakers WHERE id = ?', [speakerId]);
      
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
      message: 'Speaker deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting speaker:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}