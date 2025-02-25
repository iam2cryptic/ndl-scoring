// src/app/admin/tournament/page.js
'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TournamentManagementPage() {
  const [tournaments, setTournaments] = useState([
    // Mock data - in production this would come from the API
    { id: 1, name: 'NDL Season 1', current_round: 2 }
  ]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  
  // Stats for the current tournament
  const [stats, setStats] = useState({
    judgeCount: 0,
    debateCount: 0,
    submissionRate: 0,
    pendingDebates: 0
  });

  // Import state
  const [importType, setImportType] = useState('adjudicators');
  const [importFile, setImportFile] = useState(null);
  const [judgeKeys, setJudgeKeys] = useState(null);
  
  useEffect(() => {
    if (selectedTournament) {
      // In a real app, fetch tournament stats from API
      setCurrentRound(selectedTournament.current_round);
      
      // Mock stats - in production this would come from API
      setStats({
        judgeCount: 15,
        debateCount: 8,
        submissionRate: 75,
        pendingDebates: 2
      });
    }
  }, [selectedTournament]);
  
  const handleTournamentSelect = (tournamentId) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    setSelectedTournament(tournament);
  };
  
  const handleRoundUpdate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/tournament/round', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ tournamentId: selectedTournament.id, round: currentRound })
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to update round');
      // }
      
      // Simulate successful update
      setTimeout(() => {
        const updatedTournaments = tournaments.map(t => 
          t.id === selectedTournament.id 
            ? { ...t, current_round: currentRound } 
            : t
        );
        
        setTournaments(updatedTournaments);
        setSelectedTournament({ ...selectedTournament, current_round: currentRound });
        setSuccess('Round updated successfully');
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error updating round:', error);
      setError(error.message || 'Failed to update round');
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
  };
  
  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // In a real app, this would upload the file to the server
      // const formData = new FormData();
      // formData.append('file', importFile);
      // formData.append('type', importType);
      // formData.append('tournamentId', selectedTournament.id);
      
      // if (importType === 'draw' && judgeKeys) {
      //   formData.append('judgeKeys', JSON.stringify(judgeKeys));
      // }
      
      // const response = await fetch('/api/tabbycat/import', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // Simulate successful import
      setTimeout(() => {
        if (importType === 'adjudicators') {
          // Mock successful adjudicator import
          setJudgeKeys({
            'adj_1': 'judge_abc123',
            'adj_2': 'judge_def456',
            'adj_3': 'judge_ghi789'
          });
          setSuccess(`Imported ${importFile.name} successfully. 3 judges imported.`);
        } else if (importType === 'draw') {
          setSuccess(`Imported ${importFile.name} successfully. Round ${currentRound + 1} created with 4 debates.`);
          // Update current round
          setCurrentRound(currentRound + 1);
        }
        
        setLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error importing file:', error);
      setError(error.message || 'Failed to import file');
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tournament Management</h1>
      
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Tournament
        </label>
        <select
          className="block w-full p-2 border border-gray-300 rounded-md"
          value={selectedTournament?.id || ''}
          onChange={(e) => handleTournamentSelect(Number(e.target.value))}
        >
          <option value="">-- Select a tournament --</option>
          {tournaments.map(tournament => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </div>
      
      {selectedTournament && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-medium mb-4">Tournament Status</h2>
              <p className="mb-2">
                <span className="font-medium">Current Round:</span> {selectedTournament.current_round}
              </p>
              <p className="mb-2">
                <span className="font-medium">Judges:</span> {stats.judgeCount}
              </p>
              <p className="mb-2">
                <span className="font-medium">Debates this round:</span> {stats.debateCount}
              </p>
              <p className="mb-4">
                <span className="font-medium">Submission rate:</span> {stats.submissionRate}%
              </p>
              
              <div className="border-t pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set Current Round
                </label>
                <div className="flex">
                  <input
                    type="number"
                    min="0"
                    value={currentRound}
                    onChange={(e) => setCurrentRound(Number(e.target.value))}
                    className="block w-20 p-2 border border-gray-300 rounded-l-md"
                  />
                  <button
                    onClick={handleRoundUpdate}
                    disabled={loading || currentRound === selectedTournament.current_round}
                    className={`py-2 px-4 rounded-r-md ${
                      loading || currentRound === selectedTournament.current_round
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-medium mb-4">Tournament Actions</h2>
              
              <div className="mb-4">
                <a 
                  href={`/standings?tournament=${selectedTournament.id}`}
                  className="inline-block py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Speaker Standings
                </a>
              </div>
              
              {stats.pendingDebates > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Warning:</span> {stats.pendingDebates} debates have not 
                    been submitted for the current round.
                  </p>
                </div>
              )}
              
              <div className="flex space-x-4">
                <button
                  disabled={stats.pendingDebates > 0}
                  className={`py-2 px-4 rounded ${
                    stats.pendingDebates > 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  Generate Reports
                </button>
                
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Import Data
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
            <h2 className="text-lg font-medium mb-4">Import Data from Tabbycat</h2>
            
            <form onSubmit={handleImport}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Type
                </label>
                <select
                  className="block w-full p-2 border border-gray-300 rounded-md"
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                >
                  <option value="adjudicators">Adjudicators (Judges)</option>
                  <option value="draw">Round Draw</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSON File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                />
              </div>
              
              {importType === 'draw' && !judgeKeys && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
                  <p className="text-sm text-yellow-800">
                    Please import adjudicators first before importing a draw.
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={loading || (importType === 'draw' && !judgeKeys) || !importFile}
                className={`py-2 px-4 rounded ${
                  loading || (importType === 'draw' && !judgeKeys) || !importFile
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Importing...' : 'Import Data'}
              </button>
            </form>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-lg font-medium mb-4">Judge URLs</h2>
            
            {judgeKeys ? (
              <>
                <p className="mb-4 text-sm text-gray-600">
                  Judge URLs have been generated. Judges can access the system using these URLs:
                </p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border text-left">Judge</th>
                        <th className="py-2 px-4 border text-left">URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(judgeKeys).map(([tabbycatId, judgeKey]) => (
                        <tr key={judgeKey} className="bg-white">
                          <td className="py-2 px-4 border">Judge {tabbycatId}</td>
                          <td className="py-2 px-4 border">
                            <code className="bg-gray-100 p-1 rounded text-sm">
                              {window.location.origin}/judge/{judgeKey}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-gray-600">
                Import adjudicators to generate judge URLs.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}