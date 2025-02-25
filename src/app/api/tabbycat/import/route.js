// src/app/api/tabbycat/import/route.js
import { processAdjudicatorData, processDrawData } from '@/lib/tabbycat-integration';
import { judgeDb, debateDb, tournamentDb } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type');
    const tournamentId = formData.get('tournamentId') || 1;
    
    if (!file || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Read the file content
    const fileContent = await file.text();
    const data = JSON.parse(fileContent);
    
    if (type === 'adjudicators') {
      const { judgeKeys, judges } = processAdjudicatorData(data);
      
      // Save judges to database
      for (const [judgeKey, judge] of Object.entries(judges)) {
        await judgeDb.createJudge({
          judge_key: judgeKey,
          tabbycat_id: judgeKey.split('_')[1],
          name: judge.name,
          role: judge.role
        });
      }
      
      return NextResponse.json({
        success: true,
        message: `Imported ${Object.keys(judges).length} judges`,
        judgeKeys
      });
    }
    
    if (type === 'draw') {
      // We need the judgeKeys mapping
      const judgeKeysJson = formData.get('judgeKeys');
      if (!judgeKeysJson) {
        return NextResponse.json(
          { error: 'Missing judgeKeys mapping' },
          { status: 400 }
        );
      }
      
      const judgeKeys = JSON.parse(judgeKeysJson);
      const result = processDrawData(data, judgeKeys);
      
      // Update current round
      await tournamentDb.setCurrentRound(tournamentId, result.round);
      
      // Save debates to database
      for (const [debateId, debate] of Object.entries(result.debates)) {
        await debateDb.createDebate({
          id: debateId,
          tournament_id: tournamentId,
          tabbycat_id: debateId.split('_')[1],
          round: debate.round,
          venue: debate.venue,
          aff_team: debate.affTeam,
          neg_team: debate.negTeam
        });
        
        // TODO: Add speakers to debates
        // This would require additional code to handle speakers
        
        // Assign judges to debates
        for (const [judgeKey, assignment] of Object.entries(result.judgeAssignments)) {
          if (assignment.currentDebate === debateId) {
            await debateDb.assignJudge(judgeKey, debateId);
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Imported ${Object.keys(result.debates).length} debates for round ${result.round}`
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid import type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}