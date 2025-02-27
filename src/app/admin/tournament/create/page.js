'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateTournamentPage() {
  const [tournamentName, setTournamentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tournamentName.trim()) {
      setError('Tournament name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tournamentName.trim()
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create tournament');
      }
      
      const data = await response.json();
      
      setSuccess('Tournament created successfully');
      
      // Redirect after a brief delay to show the success message
      setTimeout(() => {
        router.push('/admin/tournament');
      }, 1500);
    } catch (error) {
      console.error('Error creating tournament:', error);
      setError(error.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Tournament</h1>
      
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
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tournament Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g., NDL Season 2"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded ${
              loading 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Creating...' : 'Create Tournament'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/admin/tournament')}
            className="text-blue-600 hover:underline"
          >
            Back to Tournament Management
          </button>
        </div>
      </div>
    </div>
  );
}