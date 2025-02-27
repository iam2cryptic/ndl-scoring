// src/lib/tabbycat-integration.js

/**
 * This module handles integration between Tabbycat and our NDL scoring system
 */

/**
 * Processes a Tabbycat draw export and creates judge assignments
 * @param {Object} tabbycatDrawData - The JSON data exported from Tabbycat's API
 * @param {Object} judgeKeys - Map of Tabbycat judge IDs to our system's judge keys
 * @returns {Object} Processed data for our system
 */
export function processDrawData(tabbycatDrawData, judgeKeys) {
  const roundNumber = tabbycatDrawData.round;
  const debates = {};
  const judgeAssignments = {};
  
  // Initialize all judges to have no current debate
  Object.keys(judgeKeys).forEach(judgeId => {
    const judgeKey = judgeKeys[judgeId];
    if (!judgeAssignments[judgeKey]) {
      judgeAssignments[judgeKey] = {
        currentDebate: null
      };
    }
  });
  
  // Process each debate in the draw
  tabbycatDrawData.debates.forEach(debate => {
    const debateId = `debate_${debate.id}`;
    
    // Extract teams
    const affTeam = debate.teams.find(t => t.side === 'aff');
    const negTeam = debate.teams.find(t => t.side === 'neg');
    
    // Extract speakers
    const speakers = [];
    if (affTeam && affTeam.speakers) {
      affTeam.speakers.forEach(speaker => {
        speakers.push({
          id: `speaker_${speaker.id}`,
          name: speaker.name,
          team: affTeam.name,
          position: speaker.position
        });
      });
    }
    
    if (negTeam && negTeam.speakers) {
      negTeam.speakers.forEach(speaker => {
        speakers.push({
          id: `speaker_${speaker.id}`,
          name: speaker.name,
          team: negTeam.name,
          position: speaker.position
        });
      });
    }
    
    // Create debate object
    debates[debateId] = {
      id: debateId,
      round: roundNumber,
      venue: debate.venue ? debate.venue.name : 'TBA',
      affTeam: affTeam ? affTeam.name : 'BYE',
      negTeam: negTeam ? negTeam.name : 'BYE',
      speakers: speakers,
      submitted: false
    };
    
    // Assign judges to this debate
    debate.adjudicators.forEach(adj => {
      const judgeId = adj.id;
      const judgeKey = judgeKeys[judgeId];
      
      if (judgeKey) {
        judgeAssignments[judgeKey] = {
          currentDebate: debateId
        };
      }
    });
  });
  
  return {
    round: roundNumber,
    debates,
    judgeAssignments
  };
}

/**
 * Creates initial judge data from Tabbycat adjudicator export
 * @param {Object} tabbycatAdjudicatorData - The JSON data exported from Tabbycat's API
 * @returns {Object} Map of Tabbycat judge IDs to our system's judge keys and initial judge data
 */
export function processAdjudicatorData(tabbycatAdjudicatorData) {
  const judgeKeys = {};
  const judges = {};
  
  tabbycatAdjudicatorData.adjudicators.forEach(adj => {
    // Generate a unique key for this judge
    const judgeKey = `judge_${adj.id}_${Date.now().toString(36)}`;
    
    // Store the mapping
    judgeKeys[adj.id] = judgeKey;
    
    // Create initial judge data
    judges[judgeKey] = {
      name: adj.name,
      role: adj.chair ? 'chair' : 'panelist',
      currentDebate: null,
      completedDebates: []
    };
  });
  
  return { judgeKeys, judges };
}

/**
 * Processes speaker data from Tabbycat export
 * @param {Object} tabbycatSpeakerData - The JSON data exported from Tabbycat's API
 * @returns {Array} Array of formatted speaker objects ready for import
 */
export function processSpeakerData(tabbycatSpeakerData) {
  const speakers = [];
  
  // Process speakers from teams
  if (tabbycatSpeakerData.teams) {
    tabbycatSpeakerData.teams.forEach(team => {
      if (team.speakers) {
        team.speakers.forEach(speaker => {
          speakers.push({
            id: `speaker_${speaker.id}`,
            tabbycat_id: speaker.id.toString(),
            name: speaker.name,
            team: team.name,
            position: speaker.position || determinePosition(speakers.length, team.speakers.length)
          });
        });
      }
    });
  }
  
  // If there's a direct speakers array (some Tabbycat exports have this)
  if (tabbycatSpeakerData.speakers) {
    tabbycatSpeakerData.speakers.forEach(speaker => {
      // Check if this speaker is already in our list (to avoid duplicates)
      const existingSpeaker = speakers.find(s => s.tabbycat_id === speaker.id.toString());
      
      if (!existingSpeaker) {
        speakers.push({
          id: `speaker_${speaker.id}`,
          tabbycat_id: speaker.id.toString(),
          name: speaker.name,
          team: speaker.team ? speaker.team.name : 'Unknown Team',
          position: speaker.position || 'First' // Default to First if position is unknown
        });
      }
    });
  }
  
  return speakers;
}

/**
 * Helper function to determine speaker position if not explicitly specified
 * @param {number} speakerIndex - Current index in the list of speakers
 * @param {number} teamSize - Number of speakers in the team
 * @returns {string} Speaker position
 */
function determinePosition(speakerIndex, teamSize) {
  // For a standard 3-person team
  if (teamSize === 3) {
    // This is just a simple way to assign positions based on order
    // In a real scenario, you might want more sophisticated logic
    switch (speakerIndex % 3) {
      case 0: return 'First';
      case 1: return 'Deputy';
      case 2: return 'Whip';
      default: return 'First';
    }
  }
  
  // For other team sizes, just use First as default
  return 'First';
}

/**
 * Formats our system's NDL rankings into Tabbycat's expected format for importing results
 * @param {string} judgeKey - The judge key 
 * @param {Object} rankings - Speaker rankings from our system
 * @param {Object} debateData - Debate data from our system
 * @returns {Object} Data formatted for Tabbycat import
 */
export function formatRankingsForTabbycat(judgeKey, rankings, debateData) {
  // Map our speaker IDs back to Tabbycat IDs
  const speakerScores = {};
  
  Object.entries(rankings).forEach(([speakerId, rank]) => {
    // Extract the original Tabbycat ID from our system's ID
    const tabbycatId = speakerId.replace('speaker_', '');
    
    // In Tabbycat, rankings are typically converted to scores
    // For NDL scoring, a rank of 1 is 5 points, 2 is 4 points, etc.
    const points = 6 - rank; // 1st place gets 5 points, 2nd gets 4, etc.
    
    speakerScores[tabbycatId] = points;
  });
  
  // Format for Tabbycat import
  return {
    debate_id: debateData.id.replace('debate_', ''),
    judge_id: judgeKey.split('_')[1], // Extract original Tabbycat ID
    scores: speakerScores
  };
}

/**
 * Provides the correct URL for a judge based on their key
 * @param {string} baseUrl - Base URL of your application
 * @param {string} judgeKey - The judge's unique key
 * @returns {string} Full URL for the judge
 */
export function getJudgeUrl(baseUrl, judgeKey) {
  return `${baseUrl}/judge/${judgeKey}`;
}

/**
 * Creates a sample email template for judges with their URLs
 * @param {string} baseUrl - Base URL of your application 
 * @param {Object} judges - Judge data from our system
 * @returns {Object} Map of judge keys to email content
 */
export function createJudgeEmailTemplates(baseUrl, judges) {
  const emails = {};
  
  Object.entries(judges).forEach(([judgeKey, judge]) => {
    const judgeUrl = getJudgeUrl(baseUrl, judgeKey);
    
    emails[judgeKey] = {
      to: `${judge.name} <email-not-available>`,
      subject: 'Your NDL Judge URL',
      body: `
Dear ${judge.name},

Thank you for judging at our tournament. Please use the following private URL to access your assignments and submit speaker rankings:

${judgeUrl}

Please bookmark this URL as you will use it throughout the tournament.

Thank you,
Tournament Organizers
      `.trim()
    };
  });
  
  return emails;
}