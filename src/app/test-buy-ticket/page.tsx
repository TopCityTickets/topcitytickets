'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';

export default function TestBuyTicket() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testBuyTicket = async () => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const eventId = 'bbbf6e59-cd48-479f-a9f3-22e9871c65e9'; // Church Coin event
      
      const supabaseClient = supabase();
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        throw new Error('No session found');
      }

      console.log('Making request to create-checkout...');
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      const result = await response.json();
      console.log('Response:', result);

      setResult({
        status: response.status,
        ok: response.ok,
        result: result,
      });      if (response.ok && result.url) {
        console.log('Success! Checkout URL created:', result.url);
        // Now that we're live, let's actually redirect to Stripe
        window.location.href = result.url;
      }

    } catch (error: any) {
      console.error('Error:', error);
      setResult({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Buy Ticket</h1>
      
      <div className="mb-4">
        <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
        <p><strong>Event:</strong> Church Coin (ID: bbbf6e59-cd48-479f-a9f3-22e9871c65e9)</p>
      </div>

      <button 
        onClick={testBuyTicket}
        disabled={loading || !user}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Buy Ticket'}
      </button>

      {result && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-bold">Result:</h3>
          <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
