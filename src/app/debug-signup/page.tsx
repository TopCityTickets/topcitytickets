"use client";

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SignupDebugger() {
  const [email, setEmail] = useState('debug@test.com');
  const [password, setPassword] = useState('test123456');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const addResult = (step: string, result: any) => {
    setResults(prev => [...prev, { step, result, timestamp: new Date().toISOString() }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testDirectSignup = async () => {
    setLoading(true);
    addResult('Starting Direct Supabase Signup (BROKEN - for testing)', { email });

    try {
      // Test the broken direct signup for comparison
      const { data, error } = await supabase().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { role: 'user' }
        }
      });

      addResult('Direct Signup Response (BROKEN)', { data, error });

      if (data.user && !error) {
        // Test if we can immediately query the user from the database
        try {
          const { data: userData, error: userError } = await supabase()
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          addResult('Database Query After Signup (BROKEN)', { userData, userError });
        } catch (dbErr) {
          addResult('Database Query Error (BROKEN)', { error: dbErr });
        }

        // Test auth.getUser()
        try {
          const { data: authUser, error: authError } = await supabase().auth.getUser();
          addResult('Auth GetUser (BROKEN)', { authUser, authError });
        } catch (authErr) {
          addResult('Auth GetUser Error (BROKEN)', { error: authErr });
        }
      }

    } catch (err) {
      addResult('Direct Signup Error (BROKEN)', { error: err });
    }
    
    // Now test the working manual signup API
    try {
      addResult('Testing Working Manual Signup API', { email });
      
      const response = await fetch('/api/manual-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email + '_manual', password })
      });

      const result = await response.json();
      addResult('Manual Signup API Response (WORKING)', { status: response.status, result });

    } catch (err) {
      addResult('Manual Signup API Error', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const testAPISignup = async () => {
    setLoading(true);
    addResult('Starting API Signup Test', { email });

    try {
      const response = await fetch('/api/test-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();
      addResult('API Signup Response', { status: response.status, result });

    } catch (err) {
      addResult('API Signup Error', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const testAuthCallback = async () => {
    setLoading(true);
    addResult('Testing Auth Callback Logic', {});

    try {
      // Simulate what happens in the auth callback
      const { data: { user }, error } = await supabase().auth.getUser();
      addResult('Auth Callback - Get User', { user, error });

      if (user) {
        // Test the database query that happens in callback
        try {
          const { data: userData, error: userError } = await supabase()
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          addResult('Auth Callback - Database Query', { userData, userError });
        } catch (dbErr) {
          addResult('Auth Callback - Database Error', { error: dbErr });
        }
      }

    } catch (err) {
      addResult('Auth Callback Test Error', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    addResult('Testing Database Connection', {});

    try {
      // Test basic database connectivity
      const { data, error } = await supabase()
        .from('users')
        .select('count')
        .limit(1);
      
      addResult('Database Connection Test', { data, error });

      // Test RLS policies
      const { data: rlsTest, error: rlsError } = await supabase()
        .from('users')
        .select('*')
        .limit(5);
      
      addResult('RLS Policy Test', { data: rlsTest, error: rlsError });

    } catch (err) {
      addResult('Database Connection Error', { error: err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Signup Flow Debugger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email:</label>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="debug@test.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password:</label>
                <Input 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="test123456"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={testDirectSignup} disabled={loading} size="sm">
                Test Direct Signup
              </Button>
              <Button onClick={testAPISignup} disabled={loading} size="sm" variant="outline">
                Test API Signup
              </Button>
              <Button onClick={testAuthCallback} disabled={loading} size="sm" variant="outline">
                Test Auth Callback
              </Button>
              <Button onClick={testDatabaseConnection} disabled={loading} size="sm" variant="outline">
                Test Database
              </Button>
              <Button onClick={clearResults} variant="destructive" size="sm">
                Clear Results
              </Button>
            </div>

            {loading && (
              <Alert>
                <AlertDescription>
                  Running test... Check console for additional details.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{result.step}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
