"use client";

import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleSignupTest() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('test123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing signup with:', { email, password });
      
      const { data, error } = await supabase().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      console.log('Signup result:', { data, error });
      
      setResult({
        success: !error,
        error: error?.message,
        user: data.user,
        session: data.session,
        needsConfirmation: !data.session && data.user && !data.user.email_confirmed_at
      });

      // If user was created, test if we can fetch from database
      if (data.user && !error) {
        console.log('User created, testing database fetch...');
        
        const { data: userData, error: userError } = await supabase()
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        console.log('Database fetch result:', { userData, userError });
        
        setResult(prev => ({
          ...prev,
          databaseUser: userData,
          databaseError: userError?.message
        }));
      }

    } catch (err) {
      console.error('Signup test error:', err);
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        caught: true
      });
    } finally {
      setLoading(false);
    }
  };

  const clearTestUser = async () => {
    if (!result?.user?.id) return;
    
    try {
      // Note: You can't delete auth.users from client side
      // This would need to be done via Supabase admin API or SQL
      const { error } = await supabase()
        .from('users')
        .delete()
        .eq('id', result.user.id);
      
      console.log('Cleared test user:', error);
    } catch (err) {
      console.error('Clear user error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Signup Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Email:</label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label>Password:</label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="test123"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={testSignup} disabled={loading}>
              {loading ? 'Testing...' : 'Test Signup'}
            </Button>
            {result?.user && (
              <Button onClick={clearTestUser} variant="outline">
                Clear Test User
              </Button>
            )}
          </div>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold mb-2">Test Result:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
