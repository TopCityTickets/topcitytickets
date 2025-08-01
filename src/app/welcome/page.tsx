"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { authActions } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function WelcomePage() {
  const router = useRouter();
  const { user, isAuthenticated, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [lastResendTime, setLastResendTime] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (profile?.setup_completed) {
      router.replace('/dashboard');
      return;
    }
  }, [isAuthenticated, profile, router]);

  const handleCompleteSetup = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Attempting to complete setup for user:', user.id);
      const result = await authActions.completeSetup(user.id);
      console.log('Setup completion result:', result);
      // Always redirect regular users to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing setup:', error);
      // Show more detailed error to help debug
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`There was an error completing your setup: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email || resending) return;
    
    // Check if we recently sent an email (rate limiting)
    const now = Date.now();
    const timeSinceLastResend = now - lastResendTime;
    const minWaitTime = 60000; // 1 minute between resends
    
    if (timeSinceLastResend < minWaitTime) {
      const waitSeconds = Math.ceil((minWaitTime - timeSinceLastResend) / 1000);
      alert(`Please wait ${waitSeconds} seconds before requesting another verification email.`);
      return;
    }
    
    setResending(true);
    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          alert('Too many requests. Please wait a few minutes before trying again.');
        } else if (error.message.includes('Email rate limit exceeded')) {
          alert('Email limit reached. Please wait 60 seconds before trying again.');
        } else {
          alert('Error sending verification email: ' + error.message);
        }
      } else {
        setResendSuccess(true);
        setLastResendTime(now);
        alert('Verification email sent! Please check your inbox and spam folder.');
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      alert('Failed to send verification email. Please try again in a few minutes.');
    } finally {
      setResending(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-cyan-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-slate-800 border-slate-700 text-center">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to TopCityTickets! 🎉
            </h1>
            <p className="text-slate-300">
              Your account has been created successfully. You're all set to start exploring events in Topeka!
            </p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-slate-300">
              <strong className="text-white">Email:</strong> {user.email}
            </p>
            {profile?.full_name && (
              <p className="text-sm text-slate-300">
                <strong className="text-white">Name:</strong> {profile.full_name}
              </p>
            )}
            <p className="text-sm text-slate-300">
              <strong className="text-white">Role:</strong> User
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCompleteSetup}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Continue to Dashboard'}
            </Button>
            
            <div className="text-center">
              <Button
                onClick={handleResendVerification}
                disabled={resending || resendSuccess}
                variant="outline"
                size="sm"
                className="text-xs border-slate-600 text-slate-400 hover:text-white hover:border-cyan-500 disabled:opacity-50"
              >
                {resending ? 'Sending...' : resendSuccess ? '✓ Email Sent!' : lastResendTime > 0 ? 'Resend Again?' : 'Resend Verification Email'}
              </Button>
              {lastResendTime > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Wait 60 seconds between resends
                </p>
              )}
            </div>
            
            <div className="text-xs text-slate-400 text-center">
              You can always apply to become a seller later from your dashboard.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
