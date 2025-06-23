"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';

export default function AuthDebugPage() {
  const { user, role, loading, isAuthenticated } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [userQueryResult, setUserQueryResult] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      const client = supabase();
      const { data: { session }, error } = await client.auth.getSession();
      setSessionInfo({ session: session?.user, error });

      if (session?.user) {
        // Try to query the user directly
        const { data, error: userError } = await client
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUserQueryResult({ data, error: userError });
      }
    };

    checkSession();
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="grid gap-6">
        {/* useAuth Hook Results */}
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">useAuth Hook</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify({
              loading,
              isAuthenticated,
              user: user ? {
                id: user.id,
                email: user.email,
                email_confirmed_at: user.email_confirmed_at
              } : null,
              role
            }, null, 2)}
          </pre>
        </div>

        {/* Direct Session Check */}
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Direct Session Check</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        {/* User Query Result */}
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">User Table Query</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(userQueryResult, null, 2)}
          </pre>
        </div>

        {/* Manual Refresh Button */}
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Actions</h2>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Refresh Page
          </button>
          <button 
            onClick={() => {
              const client = supabase();
              client.auth.signOut().then(() => window.location.href = '/');
            }}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
