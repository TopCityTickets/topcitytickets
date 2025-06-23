"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';

export default function SubmitEventRedirect() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (role === 'admin' || role === 'seller') {
        router.replace('/seller/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, role, loading, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Card className="ultra-dark-card max-w-md w-full mx-4">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-muted/30 rounded w-32 mx-auto mb-2"></div>
            <div className="h-3 bg-muted/20 rounded w-24 mx-auto"></div>
            <p className="text-muted-foreground mt-4">Redirecting...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
