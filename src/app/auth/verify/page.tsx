"use client";

import { useState, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';

function CheckEmailContent() {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const supabase = createClientComponentClient();

  const handleResend = async () => {
    setResending(true);
    if (!email) return;

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
      <Card className="w-full max-w-md p-6 bg-slate-800 border-neon-cyan">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4">
              <svg 
                className="w-full h-full text-neon-cyan" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-neon-cyan">Check Your Email</h1>
            <p className="text-slate-400 mt-2">
              We&apos;ve sent a verification link to:
              <br />
              <span className="text-neon-pink font-medium">{email}</span>
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-slate-400 text-center text-sm">
              Click the link in your email to verify your account and continue.
              <br />
              Don&apos;t see the email? Check your spam folder.
            </p>

            {resendSuccess ? (
              <div className="text-center py-2">
                <p className="text-neon-cyan text-sm">✓ New verification email sent!</p>
              </div>
            ) : (
              <div className="text-center">
                <Button
                  onClick={handleResend}
                  disabled={resending}
                  variant="outline"
                  className="border-neon-pink text-neon-pink hover:bg-pink-950/50"
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 pt-6">
            <p className="text-center text-sm text-slate-400">
              Want to try a different email?{' '}
              <a 
                href="/signup" 
                className="text-neon-cyan hover:text-cyan-400 hover:underline"
              >
                Sign up again
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckEmailContent />
    </Suspense>
  );
}
