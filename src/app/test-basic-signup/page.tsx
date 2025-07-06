"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SimpleSignupTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      const supabase = createClient();
      
      console.log('Testing signup with:', { email, firstName, lastName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      console.log('Signup result:', { data, error });

      if (error) {
        setResult(`ERROR: ${error.message}`);
      } else if (data.user) {
        setResult(`SUCCESS: User created with ID ${data.user.id}. Check your email for confirmation.`);
      } else {
        setResult('Unexpected result - no user or error');
      }

    } catch (error) {
      console.error('Signup error:', error);
      setResult(`CATCH ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Simple Signup Test</h1>
      
      <form onSubmit={testSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            minLength={6}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Testing...' : 'Test Signup'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-3 rounded ${result.startsWith('ERROR') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}
