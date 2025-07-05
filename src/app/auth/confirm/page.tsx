'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token) {
        setStatus('error');
        setMessage('Invalid confirmation link. Please check your email and try again.');
        return;
      }

      try {
        const response = await fetch('/api/auth/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, type }),
        });

        const result = await response.json();

        if (result.success) {
          setStatus('success');
          setMessage('Your email has been confirmed! You can now sign in to your account.');
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Email confirmation failed. Please try again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during confirmation. Please try again.');
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md mx-auto p-6 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
            Email Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {status === 'loading' && 'Confirming your email address...'}
            {status === 'success' && message}
            {status === 'error' && message}
          </p>
          
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Redirecting to login page in 3 seconds...
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Sign In Now</Link>
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Try Signing Up Again</Link>
              </Button>
              <Button asChild variant="link" className="w-full">
                <Link href="/login">Already have an account? Sign In</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
