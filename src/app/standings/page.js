// src/app/standings/page.js
'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StandingsPage() {
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overall');
  const [tournamentId, setTournamentId] = useState(1); // Default to tournament ID 1
  
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        
        // Fetch standings based on active tab (position)
        const position = activeTab === 'overall' ? null : activeTab;
        const url = `/api/standings?tournament=${tournamentId}${position ? `&position=${position}` : ''}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to load speaker standings');
        }
        
        const data = await response.json();
        setStandings(data.standings);
        setError(null);
      } catch (error) {
        console.error('Error fetching standings:', error);
        setError(error.message || 'Failed to load speaker standings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStandings();
  }, [activeTab, tournamentId]);
  
  const tabs = [
    { id: 'overall', label: 'Overall' },
    { id: 'First', label: 'First Speaker' },
    { id: 'Deputy', label: 'Deputy Speaker' },
    { id: 'Whip', label: 'Whip Speaker' }
  ];
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Speaker Standings</h1>
      
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : standings && standings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border text-left">Rank</th>
                <th className="py-3 px-4 border text-left">Speaker</th>
                <th className="py-3 px-4 border text-left">Team</th>
                {activeTab === 'overall' && (
                  <th className="py-3 px-4 border text-left">Position</th>
                )}
                <th className="py-3 px-4 border text-right">Average</th>
                <th className="py-3 px-4 border text-right">Rounds</th>
                <th className="py-3 px-4 border text-right">Highest</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((speaker, index) => (
                <tr 
                  key={speaker.speaker_id} 
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="py-3 px-4 border font-medium">{index + 1}</td>
                  <td className="py-3 px-4 border">{speaker.name}</td>
                  <td className="py-3 px-4 border">{speaker.team}</td>
                  {activeTab === 'overall' && (
                    <td className="py-3 px-4 border">{speaker.position}</td>
                  )}
                  <td className="py-3 px-4 border text-right font-medium">
                    {speaker.average_score.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 border text-right">
                    {speaker.rounds_participated}
                  </td>
                  <td className="py-3 px-4 border text-right">
                    {speaker.highest_round_score.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">No speaker standings data available.</p>
        </div>
      )}
      
      <div className="mt-8 text-sm text-gray-600">
        <h2 className="font-medium mb-2">NDL Scoring System</h2>
        <p className="mb-2">
          Speakers are ranked 1-6 in each debate by judges. Rankings are converted to points:
          1st = 5pts, 2nd = 4pts, 3rd = 3pts, 4th = 2pts, 5th = 1pt, 6th = 0pts.
        </p>
        <p>
          A speaker's round score is the average of these points across all judges.
          The cumulative average determines final speaker rankings.
        </p>
      </div>
    </div>
  );
}