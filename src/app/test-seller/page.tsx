"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TestSellerApplicationPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const testSellerApplication = async () => {
    setLoading(true);
    try {
      // Get session token first
      const response = await fetch('/api/debug-verification');
      const debugData = await response.json();
      
      if (!debugData.success || !debugData.session) {
        setResult({
          error: 'No valid session found',
          debugData
        });
        return;
      }

      // Try the seller application with auth
      const sellerResponse = await fetch('/api/apply-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${debugData.session.access_token}`,
        },
      });
      
      const data = await sellerResponse.json();
      setResult({
        status: sellerResponse.status,
        statusText: sellerResponse.statusText,
        data,
        sessionInfo: debugData.session
      });
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
      <h1 className="text-2xl font-bold mb-6">Test Seller Application</h1>
      
      <div className="space-y-4 mb-6">
        <Button 
          onClick={testSellerApplication} 
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Seller Application'}
        </Button>
      </div>

      {result && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">API Response:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
