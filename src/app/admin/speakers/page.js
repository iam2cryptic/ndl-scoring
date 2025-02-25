'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, PlusCircle, Trash2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SpeakersManagementPage() {
  const [speakers, setSpeakers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  
  // Form state for adding a new speaker
  const [newSpeaker, setNewSpeaker] = useState({
    name: '',
    team: '',
    position: 'First',
    tabbycat_id: ''
  });
  
  // Load tournaments on page load
  useEffect(() => {
    // In a real app, you would fetch this from the API
    // This is just a placeholder with mock data for now
    setTournaments([
      { id: 1, name: 'NDL Season 1', current_round: 2 }
    ]);
  }, []);
  
  // When a tournament is selected, load its speakers
  useEffect(() => {
    if (selectedTournament) {
      fetchSpeakers(selectedTournament.id);
    }
  }, [selectedTournament]);
  
  const fetchSpeakers = async (tournamentId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Here you would fetch speakers from your API
      // For now, we'll use mock data
      const response = await fetch(`/api/speakers?tournament=${tournamentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch speakers');
      }
      
      const data = await response.json();
      setSpeakers(data.speakers || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      setError('Failed to load speakers. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTournamentSelect = (tournamentId) => {
    const tournament = tournaments.find(t => t.id === Number(tournamentId));
    setSelectedTournament(tournament);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSpeaker(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddSpeaker = async (e) => {
    e.preventDefault();
    
    if (!newSpeaker.name || !newSpeaker.team || !newSpeaker.position) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Here you would send the new speaker to your API
      const response = await fetch('/api/speakers/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSpeaker,
          tournament_id: selectedTournament.id
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add speaker');
      }
      
      // Reset form
      setNewSpeaker({
        name: '',
        team: '',
        position: 'First',
        tabbycat_id: ''
      });
      
      // Refresh speaker list
      fetchSpeakers(selectedTournament.id);
      setSuccess('Speaker added successfully');
    } catch (error) {
      console.error('Error adding speaker:', error);
      setError(error.message || 'Failed to add speaker');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteSpeaker = async (speakerId) => {
    if (!confirm('Are you sure you want to delete this speaker?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Here you would delete the speaker via your API
      const response = await fetch(`/api/speakers/${speakerId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete speaker');
      }
      
      // Refresh speaker list
      fetchSpeakers(selectedTournament.id);
      setSuccess('Speaker deleted successfully');
    } catch (error) {
      console.error('Error deleting speaker:', error);
      setError(error.message || 'Failed to delete speaker');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tournamentId', selectedTournament.id);
      
      const response = await fetch('/api/speakers/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to import speakers');
      }
      
      const data = await response.json();
      fetchSpeakers(selectedTournament.id);
      setSuccess(`Imported ${data.count} speakers successfully`);
    } catch (error) {
      console.error('Error importing speakers:', error);
      setError(error.message || 'Failed to import speakers');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Speaker Management</h1>
      
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
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Add Speaker</h2>
            </div>
            
            <form onSubmit={handleAddSpeaker} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newSpeaker.name}
                    onChange={handleInputChange}
                    className="block w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="team"
                    value={newSpeaker.team}
                    onChange={handleInputChange}
                    className="block w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="position"
                    value={newSpeaker.position}
                    onChange={handleInputChange}
                    className="block w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="First">First Speaker</option>
                    <option value="Deputy">Deputy Speaker</option>
                    <option value="Whip">Whip Speaker</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tabbycat ID
                  </label>
                  <input
                    type="text"
                    name="tabbycat_id"
                    value={newSpeaker.tabbycat_id}
                    onChange={handleInputChange}
                    className="block w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Optional"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex items-center py-2 px-4 rounded ${
                    loading 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Speaker
                </button>
              </div>
            </form>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Bulk Import</h2>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Import multiple speakers at once from a CSV file. The file should have columns for: name, team, position, tabbycat_id (optional).
              </p>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkImport}
                className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Speakers</h2>
              
              <button
                onClick={() => fetchSpeakers(selectedTournament.id)}
                disabled={loading}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : speakers.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-4 border-b text-left">Name</th>
                      <th className="py-2 px-4 border-b text-left">Team</th>
                      <th className="py-2 px-4 border-b text-left">Position</th>
                      <th className="py-2 px-4 border-b text-left">Tabbycat ID</th>
                      <th className="py-2 px-4 border-b text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {speakers.map(speaker => (
                      <tr key={speaker.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">{speaker.name}</td>
                        <td className="py-2 px-4 border-b">{speaker.team}</td>
                        <td className="py-2 px-4 border-b">{speaker.position}</td>
                        <td className="py-2 px-4 border-b">{speaker.tabbycat_id || '-'}</td>
                        <td className="py-2 px-4 border-b text-right">
                          <button
                            onClick={() => handleDeleteSpeaker(speaker.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete speaker"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">No speakers found. Add your first speaker above.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}