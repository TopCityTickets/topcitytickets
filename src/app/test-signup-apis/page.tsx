"use client";

import { useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function TestSignupAPIs() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, result: any) => {
    setResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const testManualSignupAPI = async () => {
    setLoading(true);
    addResult('Testing Manual Signup API', 'Starting...');

    try {
      const response = await fetch('/api/manual-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'test-manual@example.com', 
          password: 'test123456',
          firstName: 'Test',
          lastName: 'Manual'
        }),
      });

      const data = await response.json();
      addResult('Manual Signup API Response', {
        status: response.status,
        statusText: response.statusText,
        data
      });

    } catch (error) {
      addResult('Manual Signup API Error', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const testDirectSupabaseSignup = async () => {
    addResult('Testing Direct Supabase Signup', 'Starting...');

    try {
      const { data, error } = await supabase().auth.signUp({
        email: 'test-direct@example.com',
        password: 'test123456',
      });

      addResult('Direct Supabase Signup Response', { data, error });

    } catch (error) {
      addResult('Direct Supabase Signup Error', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const testBothAPIs = async () => {
    setResults([]);
    setLoading(true);
    
    await testManualSignupAPI();
    await testDirectSupabaseSignup();
    
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Signup API Tester</h1>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <button 
              onClick={testBothAPIs} 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Both APIs'}
            </button>
            
            <button 
              onClick={testManualSignupAPI} 
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Test Manual API Only
            </button>
            
            <button 
              onClick={testDirectSupabaseSignup} 
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Test Direct Supabase (Broken)
            </button>
            
            <button 
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>

          <div className="bg-gray-900 p-4 rounded">
            <h2 className="text-lg font-semibold text-white mb-2">Test Results:</h2>
            {results.length === 0 ? (
              <p className="text-gray-400">No tests run yet</p>
            ) : (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded">
                    <div className="text-blue-400 font-medium">{result.test}</div>
                    <div className="text-xs text-gray-500">{result.timestamp}</div>
                    <pre className="text-sm text-white mt-1 overflow-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
