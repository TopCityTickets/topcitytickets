"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [lastResendTime, setLastResendTime] = useState<number>(0);
  
  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClientComponentClient();
      const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }
      
      // Check if we have a session
      if (session) {
        // Check if user needs to complete setup
        const { data: profile } = await supabase
          .from('profiles')
          .select('setup_completed, role')
          .eq('id', session.user.id)
          .single();

        if (!profile || !profile.setup_completed) {
          router.push('/welcome');
        } else {
          // Redirect based on role
          switch(profile.role) {
            case 'admin':
              router.push('/admin/dashboard');
              break;
            case 'seller':
              router.push('/seller/dashboard');
              break;
            default:
              router.push('/dashboard');
          }
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
      
      // Reset resend success if there's a new error
      setResendSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || resending) return;
    
    // Check rate limiting
    const now = Date.now();
    const timeSinceLastResend = now - lastResendTime;
    const minWaitTime = 60000; // 1 minute between resends
    
    if (timeSinceLastResend < minWaitTime) {
      const waitSeconds = Math.ceil((minWaitTime - timeSinceLastResend) / 1000);
      setError(`Please wait ${waitSeconds} seconds before requesting another verification email.`);
      return;
    }
    
    setResending(true);
    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          setError('Too many requests. Please wait a few minutes before trying again.');
        } else if (error.message.includes('Email rate limit exceeded')) {
          setError('Email limit reached. Please wait 60 seconds before trying again.');
        } else {
          setError('Error sending verification email: ' + error.message);
        }
      } else {
        setResendSuccess(true);
        setLastResendTime(now);
        setError(null);
      }
    } catch (error: any) {
      console.error('Error resending verification:', error);
      setError('Failed to send verification email. Please try again in a few minutes.');
    } finally {
      setResending(false);
    }
  };

  const handleRestartSignup = async () => {
    if (!email || restarting) return;
    
    setRestarting(true);
    try {
      const response = await fetch('/api/restart-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setResendSuccess(true);
        setError(null);
        alert(`${result.message}\n\nYou can now try signing up again with a new password.`);
      } else {
        setError(result.error);
      }
    } catch (error: any) {
      console.error('Error restarting signup:', error);
      setError('Failed to restart signup process. Please try again.');
    } finally {
      setRestarting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClientComponentClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-lg shadow-lg space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Welcome Back!
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to your Top City Tickets account.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
              {email && (error.includes('email') || error.includes('confirm') || error.includes('verify')) && !resendSuccess && (
                <div className="mt-2 space-x-2">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-sm underline text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending ? 'Sending...' : 'Resend verification email'}
                  </button>
                  <span className="text-gray-500">|</span>
                  <button
                    type="button"
                    onClick={handleRestartSignup}
                    disabled={restarting}
                    className="text-sm underline text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {restarting ? 'Restarting...' : 'Restart signup process'}
                  </button>
                </div>
              )}
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              ✓ Verification email sent! Please check your inbox and spam folder.
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-400 hover:underline">
            Sign up now
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
