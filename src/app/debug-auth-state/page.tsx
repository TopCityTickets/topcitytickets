"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugAuthStatePage() {
  const auth = useAuth();
  const [rawSession, setRawSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const checkRawSession = async () => {
      try {
        const client = supabase();
        const { data: { session }, error } = await client.auth.getSession();
        setRawSession({ session, error });
      } catch (error) {
        setRawSession({ error });
      } finally {
        setSessionLoading(false);
      }
    };

    checkRawSession();
  }, []);

  const forceRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Debug Auth State</h1>
      
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">useAuth() Hook State:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(auth, null, 2)}
          </pre>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Raw Session Check:</h2>
          {sessionLoading ? (
            <p>Loading session...</p>
          ) : (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(rawSession, null, 2)}
            </pre>
          )}
        </Card>

        <Button onClick={forceRefresh}>Force Refresh Page</Button>
      </div>
    </div>
  );
}
