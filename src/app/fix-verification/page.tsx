"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function FixVerificationPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFix = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fix-user-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDebugAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-verification');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Fix User Verification</h1>
      
      <div className="space-y-4 mb-6">
        <Button 
          onClick={handleFix} 
          disabled={loading}
          className="mr-4"
        >
          {loading ? 'Processing...' : 'Fix My Verification'}
        </Button>
        
        <Button 
          onClick={handleDebugAuth} 
          disabled={loading}
          variant="outline"
        >
          {loading ? 'Loading...' : 'Debug Auth State'}
        </Button>
      </div>

      {result && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
