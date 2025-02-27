'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const RankingInterface = dynamic(() => import('@/components/RankingInterface'), {
  ssr: false
});

// Custom hook for refreshing page data
function useRefreshableData(judgeKey) {
  const [data, setData] = useState({
    judge: null,
    currentDebate: null,
    completedDebates: [],
    loading: true,
    error: null,
    lastRefreshed: null
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchJudgeData = async (showRefreshing = true) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setData(prev => ({ ...prev, loading: true }));
      }
      
      const response = await fetch(`/api/judge/${judgeKey}`);
      
      if (!response.ok) {
        let errorMessage = 'Invalid judge URL';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use the default error
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      
      // Ensure each debate has an id property for use as a key
      let debatesWithIds = [];
      if (responseData.completedDebates && Array.isArray(responseData.completedDebates)) {
        debatesWithIds = responseData.completedDebates.map((debate, index) => {
          return debate.id ? debate : { ...debate, id: `debate_${index}` };
        });
      }
      
      setData({
        judge: responseData.judge || null,
        currentDebate: responseData.currentDebate || null,
        completedDebates: debatesWithIds,
        loading: false,
        error: null,
        lastRefreshed: new Date()
      });
    } catch (error) {
      console.error('Error fetching judge data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load judge data'
      }));
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const refresh = () => {
    fetchJudgeData(true);
  };
  
  useEffect(() => {
    fetchJudgeData(false);
    
    // Set up auto-refresh every 2 minutes
    const intervalId = setInterval(() => {
      fetchJudgeData(true);
    }, 120000);
    
    return () => clearInterval(intervalId);
  }, [judgeKey]);
  
  return {
    ...data,
    refresh,
    isRefreshing
  };
}

export default function JudgePage({ params }) {
  // Unwrap params properly using React.use()
  const unwrappedParams = use(params);
  const judgeKey = unwrappedParams.judgeKey;
  
  const [showingCompleted, setShowingCompleted] = useState(false);
  
  const {
    judge,
    currentDebate,
    completedDebates,
    loading,
    error,
    lastRefreshed,
    refresh,
    isRefreshing
  } = useRefreshableData(judgeKey);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-center text-gray-600">Loading judge information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
        <p className="mt-4 text-center text-gray-600">
          If you believe this is an error, please contact the tournament organizers.
        </p>
        <div className="mt-6 flex justify-center">
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (!judge) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Judge not found
          </AlertDescription>
        </Alert>
        <p className="mt-4 text-center text-gray-600">
          The judge key you provided is invalid or has expired. Please contact the tournament organizers for a new link.
        </p>
      </div>
    );
  }

  // If no current debate is assigned
  if (!currentDebate) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gray-100 border-b p-4 -mx-6 -mt-6 mb-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Logged in as: <span className="font-medium">{judge.name}</span> ({judge.role})
            </p>
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="flex items-center text-sm text-blue-500 hover:text-blue-700 disabled:text-gray-400"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        <Alert className="bg-blue-50 border-blue-200 mb-6">
          <AlertDescription className="text-blue-800">
            You have no debates assigned for the current round.
          </AlertDescription>
        </Alert>

        {completedDebates.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowingCompleted(!showingCompleted)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              {showingCompleted ? (
                <><ChevronUp className="h-4 w-4 mr-1" /> Hide completed debates</>
              ) : (
                <><ChevronDown className="h-4 w-4 mr-1" /> Show completed debates ({completedDebates.length})</>
              )}
            </button>
            
            {showingCompleted && (
              <div className="mt-4 space-y-4">
                {completedDebates.map((debate) => (
                  <div key={debate.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium">Round {debate.round}</p>
                    <p className="text-sm text-gray-600">
                      {debate.aff_team} vs {debate.neg_team}
                    </p>
                    <p className="text-sm text-green-600 mt-2 flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Rankings submitted
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="font-medium mb-2">Instructions</h2>
          <p className="text-sm text-gray-600">
            When a new round is released, refresh this page to see your assignment.
            Rankings should be submitted immediately after the debate ends.
          </p>
          {lastRefreshed && (
            <p className="text-xs text-gray-500 mt-2">
              Last refreshed: {lastRefreshed.toLocaleTimeString()}
              {' · '}<span className="text-blue-500 cursor-pointer hover:underline" onClick={refresh}>refresh now</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show current debate
  return (
    <div>
      <div className="bg-gray-100 border-b p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Logged in as: <span className="font-medium">{judge.name}</span> ({judge.role})
          </p>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center text-sm text-blue-500 hover:text-blue-700 disabled:text-gray-400"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <RankingInterface
        debate={currentDebate}
        judge={judge}
        judgeKey={judgeKey}
      />
    </div>
  );
}