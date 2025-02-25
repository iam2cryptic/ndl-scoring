// src/components/RankingInterface.jsx
'use client';

import { useState, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SpeakerItem = ({ id, name, team, position }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center p-4 mb-2 bg-white rounded-lg shadow cursor-move border border-gray-200 hover:border-blue-500"
      {...attributes}
      {...listeners}
    >
      <div className="flex-1">
        <h3 className="font-medium">{name}</h3>
        <p className="text-sm text-gray-600">{team} - {position} Speaker</p>
      </div>
    </div>
  );
};

const RankingInterface = ({ debate, judge, judgeKey }) => {
  // Add safety check for debate and debate.speakers
  const [speakers, setSpeakers] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(!debate || !debate.speakers);
  
  // Set speakers state after we confirm debate.speakers exists
  useEffect(() => {
    if (debate && debate.speakers) {
      setSpeakers(debate.speakers);
      setIsLoading(false);
    }
  }, [debate]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setSpeakers((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        
        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        
        return newItems;
      });
    }
  };

  const handleSubmit = async () => {
    if (speakers.length !== 6) {
      setError("All six speakers must be ranked");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert speakers array to rankings object
      const rankings = {};
      speakers.forEach((speaker, index) => {
        rankings[speaker.id] = index + 1;
      });

      // Submit rankings to API
      const response = await fetch('/api/rankings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          judgeKey,
          debateId: debate.id,
          rankings
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rankings');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting rankings:', error);
      setError(error.message || "Failed to submit rankings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <p className="text-center text-gray-600">Loading debate information...</p>
      </div>
    );
  }

  // Show error if debate or speakers data is missing
  if (!debate || !speakers.length) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Unable to load debate information. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Rankings submitted successfully! Thank you for your contribution.
          </AlertDescription>
        </Alert>
        <p className="mt-4 text-center text-gray-600">
          You may now close this window or wait for the next round to be announced.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Submit Speaker Rankings</h1>
        <p className="text-gray-600 mb-4">
          Round {debate.round}: {debate.affTeam} vs {debate.negTeam} - {debate.venue}
        </p>
        <p className="text-sm text-gray-600 mb-6">
          Drag and drop speakers to rank them from 1st (top) to 6th (bottom)
        </p>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={speakers.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="mb-6">
            {speakers.map((speaker, index) => (
              <div key={speaker.id} className="relative">
                <div className="absolute left-0 top-1/2 -translate-x-8 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-800">
                  {index + 1}
                </div>
                <SpeakerItem {...speaker} />
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isSubmitting 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Rankings'}
      </button>
    </div>
  );
};

export default RankingInterface;