"use client";

import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const email = searchParams.get('email');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const supabase = createClientComponentClient();

  let message = 'An authentication error occurred.';
  let subMessage = '';
  let action = 'Back to Login';
  let showResend = false;

  switch (error) {
    case 'access_denied':
      message = 'Access Denied';
      subMessage = 'Your login link has expired or is invalid.';
      action = 'Request New Link';
      showResend = true;
      break;
    case 'session_error':
      message = 'Session Error';
      subMessage = 'There was a problem with your login session.';
      action = 'Try Again';
      break;
    case 'unknown':
      message = 'Unknown Error';
      subMessage = 'An unexpected error occurred.';
      break;
  }

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (!error) {
      setResendSuccess(true);
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-slate-900 p-4">
      <Card className="w-full max-w-md p-6 bg-slate-800 border-neon-pink">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4">
              <svg 
                className="w-full h-full text-neon-pink" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-neon-pink">{message}</h1>
            <p className="text-slate-400 mt-4">{subMessage}</p>
            {errorDescription && (
              <p className="text-sm text-slate-500 mt-2">
                {decodeURIComponent(errorDescription.replace(/\+/g, ' '))}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            {showResend && email && !resendSuccess ? (
              <Button 
                onClick={handleResend}
                disabled={resending}
                className="bg-slate-700 hover:bg-slate-600 text-neon-pink border border-neon-pink/50 hover:border-neon-pink"
                variant="outline"
              >
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            ) : resendSuccess ? (
              <p className="text-neon-cyan">✓ New verification email sent!</p>
            ) : null}

            <Link href="/login">
              <Button 
                className="bg-slate-700 hover:bg-slate-600 text-neon-cyan border border-neon-cyan/50 hover:border-neon-cyan"
                variant="outline"
              >
                {action}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
