"use client";

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DebugSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const supabase = createClientComponentClient();

  const testSignup = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      console.log('Testing signup with:', { email, password: '***', fullName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      console.log('Signup result:', { data, error });
      
      if (error) {
        setError(error);
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error('Caught error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      console.log('Connection test:', { data, error });
      alert(`Connection test: ${error ? 'FAILED - ' + error.message : 'SUCCESS'}`);
    } catch (err) {
      console.error('Connection error:', err);
      alert('Connection FAILED: ' + (err as any).message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Debug Signup</h1>
        
        <div className="mb-4">
          <button 
            onClick={testConnection}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Database Connection
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <button
            onClick={testSignup}
            disabled={loading || !email || !password}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Signup'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded">
            <h3 className="font-bold text-red-700">Error:</h3>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        {result && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded">
            <h3 className="font-bold text-green-700">Success:</h3>
            <pre className="text-sm text-green-600 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
