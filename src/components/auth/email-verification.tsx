"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface EmailVerificationProps {
  userEmail?: string;
  isVerified?: boolean;
  onVerificationUpdate?: (verified: boolean) => void;
}

export default function EmailVerification({ 
  userEmail, 
  isVerified = false, 
  onVerificationUpdate 
}: EmailVerificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [verified, setVerified] = useState(isVerified);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Check verification status when component mounts
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const isEmailVerified = user.email_confirmed_at !== null;
        setVerified(isEmailVerified);
        onVerificationUpdate?.(isEmailVerified);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const sendVerificationEmail = async () => {
    if (!userEmail) {
      setMessage('Email address not available');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      });

      if (error) {
        setMessage('Error sending verification email: ' + error.message);
      } else {
        setMessage('Verification email sent! Please check your inbox and spam folder.');
      }
    } catch (error: any) {
      setMessage('Error sending verification email: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (verified) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Email Verified</strong> - Your email address has been confirmed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="p-4 border-amber-200 bg-amber-50">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800">Email Verification Required</h3>
          <p className="text-sm text-amber-700 mt-1">
            Please verify your email address to access all features and ensure account security.
          </p>
          
          {userEmail && (
            <p className="text-xs text-amber-600 mt-2">
              Verification email will be sent to: <strong>{userEmail}</strong>
            </p>
          )}

          <div className="mt-3 space-y-2">
            <Button 
              onClick={sendVerificationEmail}
              disabled={isLoading}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Verification Email'}
            </Button>

            <Button 
              onClick={checkVerificationStatus}
              variant="outline"
              size="sm"
              className="ml-2"
            >
              Check Status
            </Button>
          </div>

          {message && (
            <div className={`mt-3 p-2 text-xs rounded ${
              message.includes('sent') 
                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-3 text-xs text-amber-600">
            <p>💡 <strong>Note:</strong> Check your spam folder if you don't see the email within a few minutes.</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
