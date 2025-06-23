"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function ResendConfirmationPage() {
  const [email, setEmail] = useState('topcitytickets@gmail.com');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResend = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Confirmation email resent to ${email}! Check your inbox.`);
      } else {
        setError(data.error || 'Failed to resend confirmation');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAndSignup = () => {
    window.location.href = '/signup';
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md mx-auto p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-4">
          Resend Confirmation
        </h2>
        
        <p className="text-sm text-muted-foreground mb-4">
          If you signed up but didn't receive a confirmation email, or if the link points to the wrong URL, you can resend it here.
        </p>

        <div className="space-y-4">
          <div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <Button 
            onClick={handleResend} 
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? 'Sending...' : 'Resend Confirmation Email'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            variant="outline"
            onClick={handleClearAndSignup}
            className="w-full"
          >
            Start Fresh - Sign Up Again
          </Button>
        </div>

        {message && (
          <div className="mt-4 p-3 text-sm rounded bg-green-50 border-green-200 text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 text-sm rounded bg-red-50 border-red-200 text-red-800">
            {error}
          </div>
        )}

        <div className="mt-6 text-xs text-muted-foreground">
          <p className="font-semibold">Troubleshooting:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Check your spam/junk folder</li>
            <li>Make sure the email links to: topcitytickets.org</li>
            <li>Try signing up with a different email if issues persist</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
