'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import dynamic from 'next/dynamic';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const RankingInterface = dynamic(() => import('@/components/RankingInterface'), {
  ssr: false
});

export default function JudgePage({ params }) {
  // Unwrap params properly using React.use()
  const unwrappedParams = use(params);
  const judgeKey = unwrappedParams.judgeKey;
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [judge, setJudge] = useState(null);
  const [currentDebate, setCurrentDebate] = useState(null);
  const [completedDebates, setCompletedDebates] = useState([]);
  const [showingCompleted, setShowingCompleted] = useState(false);

  useEffect(() => {
    const fetchJudgeData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/judge/${judgeKey}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Invalid judge URL');
        }
        
        const data = await response.json();
        
        setJudge(data.judge);
        setCurrentDebate(data.currentDebate);
        
        // Ensure each debate has an id property for use as a key
        if (data.completedDebates && Array.isArray(data.completedDebates)) {
          const debatesWithIds = data.completedDebates.map((debate, index) => {
            return debate.id ? debate : { ...debate, id: `debate_${index}` };
          });
          setCompletedDebates(debatesWithIds);
        } else {
          setCompletedDebates([]);
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching judge data:', error);
        setError(error.message || 'Failed to load judge data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJudgeData();
  }, [judgeKey]);

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
      </div>
    );
  }

  // If no current debate is assigned
  if (!currentDebate) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gray-100 border-b p-4 -mx-6 -mt-6 mb-6">
          <p className="text-sm text-gray-600">
            Logged in as: <span className="font-medium">{judge.name}</span> ({judge.role})
          </p>
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
                {completedDebates.map((debate, index) => (
                  <div key={`debate-${debate.id || index}`} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
        </div>
      </div>
    );
  }

  // Show current debate
  return (
    <div>
      <div className="bg-gray-100 border-b p-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm text-gray-600">
            Logged in as: <span className="font-medium">{judge.name}</span> ({judge.role})
          </p>
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