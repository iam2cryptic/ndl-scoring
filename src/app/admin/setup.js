// src/app/admin/setup.js
'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { processAdjudicatorData, processDrawData, createJudgeEmailTemplates } from '@/lib/tabbycat-integration';

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [adjudicatorData, setAdjudicatorData] = useState(null);
  const [drawData, setDrawData] = useState(null);
  const [judgeKeys, setJudgeKeys] = useState(null);
  const [judges, setJudges] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAdjudicatorImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setAdjudicatorData(data);
        const { judgeKeys: keys, judges: judgeData } = processAdjudicatorData(data);
        setJudgeKeys(keys);
        setJudges(judgeData);
        setSuccess('Adjudicator data imported successfully');
        setError(null);
      } catch (err) {
        setError('Failed to parse adjudicator data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrawImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setDrawData(data);
        setSuccess('Draw data imported successfully');
        setError(null);
      } catch (err) {
        setError('Failed to parse draw data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleProcess = () => {
    try {
      if (!judgeKeys || !drawData) {
        setError('Please import both adjudicator and draw data first');
        return;
      }

      const processedData = processDrawData(drawData, judgeKeys);
      
      // In a real app, you would save this data to your database
      console.log('Processed data:', processedData);
      
      setSuccess('Data processed successfully');
      setError(null);
      setStep(3);
    } catch (err) {
      setError('Error processing data: ' + err.message);
    }
  };

  const handleGenerateEmails = () => {
    if (!judges || !baseUrl) {
      setError('Please enter a base URL for your application');
      return;
    }

    try {
      const emails = createJudgeEmailTemplates(baseUrl, judges);
      
      // In a real app, you would provide a way to send or download these emails
      console.log('Judge emails:', emails);
      
      setSuccess('Judge emails generated successfully');
      setError(null);
    } catch (err) {
      setError('Error generating emails: ' + err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">NDL Scoring System Setup</h1>
      
      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            1
          </div>
          <h2 className="text-lg font-medium">Import Adjudicator Data</h2>
        </div>
        
        <div className="ml-10 mb-6">
          <p className="text-gray-600 mb-4">
            Export adjudicator data from Tabbycat and import it here:
          </p>
          
          <ol className="list-decimal ml-5 mb-4 text-sm text-gray-700">
            <li>Go to Tabbycat admin interface</li>
            <li>Navigate to Participants → Adjudicators</li>
            <li>Click the "Edit Adjudicators" button</li>
            <li>At the bottom of the page, click "Export all adjudicators as JSON"</li>
          </ol>
          
          <input
            type="file"
            accept=".json"
            onChange={handleAdjudicatorImport}
            className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          />
          
          {judges && (
            <p className="mt-2 text-sm text-green-600">
              ✓ {Object.keys(judges).length} judges imported
            </p>
          )}
        </div>
        
        <div className="flex items-center mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}>
            2
          </div>
          <h2 className="text-lg font-medium">Import Round Draw</h2>
        </div>
        
        <div className="ml-10 mb-6">
          <p className="text-gray-600 mb-4">
            Export the current round draw from Tabbycat and import it here:
          </p>
          
          <ol className="list-decimal ml-5 mb-4 text-sm text-gray-700">
            <li>Go to Tabbycat admin interface</li>
            <li>Navigate to Results → Export Current Round</li>
            <li>Select "JSON" format and download</li>
          </ol>
          
          <input
            type="file"
            accept=".json"
            onChange={handleDrawImport}
            className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          />
          
          {drawData && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Round {drawData.round} draw imported
            </p>
          )}
          
          <button
            onClick={handleProcess}
            disabled={!judgeKeys || !drawData}
            className={`mt-4 py-2 px-4 rounded ${
              !judgeKeys || !drawData 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Process Data
          </button>
        </div>
        
        {step >= 3 && (
          <>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2">
                3
              </div>
              <h2 className="text-lg font-medium">Generate Judge URLs</h2>
            </div>
            
            <div className="ml-10 mb-6">
              <p className="text-gray-600 mb-4">
                Enter your application's base URL to generate judge access links:
              </p>
              
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://your-tournament-url.com"
                className="w-full p-2 border rounded mb-4"
              />
              
              <button
                onClick={handleGenerateEmails}
                disabled={!baseUrl}
                className={`py-2 px-4 rounded ${
                  !baseUrl 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Generate Judge Emails
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}