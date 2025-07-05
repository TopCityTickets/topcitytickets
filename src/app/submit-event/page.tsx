"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function SubmitEventPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [sellerStatus, setSellerStatus] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      if (role === 'admin' || role === 'seller') {
        router.replace('/seller/dashboard');
        return;
      }
      
      // Check seller application status
      checkSellerStatus();
    } else if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, role, loading, router]);

  const checkSellerStatus = async () => {
    try {
      const response = await fetch('/api/seller-status');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSellerStatus(data.data.seller_status || 'none');
        } else {
          setSellerStatus('none');
        }
      } else {
        setSellerStatus('none');
      }
    } catch (error) {
      console.error('Error checking seller status:', error);
      setSellerStatus('none');
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="ultra-dark-card max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-muted/30 rounded w-32 mx-auto mb-2"></div>
              <div className="h-3 bg-muted/20 rounded w-24 mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  // Show different content based on seller status
  if (sellerStatus === 'pending') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="ultra-dark-card">
          <CardHeader className="text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Seller Application Under Review</CardTitle>
            <CardDescription>
              Your application to become a seller is currently being reviewed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              We'll notify you once your application has been processed. This usually takes 1-2 business days.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button onClick={() => router.push('/events')}>
                Browse Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sellerStatus === 'denied') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="ultra-dark-card">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Seller Application Denied</CardTitle>
            <CardDescription>
              Unfortunately, your seller application was not approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              You can reapply after addressing the feedback or wait for the specified period.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/apply-seller')}>
                Reapply as Seller
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: User is not a seller and hasn't applied
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="ultra-dark-card">
        <CardHeader className="text-center">
          <ShoppingCart className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">Become a Seller</CardTitle>
          <CardDescription>
            You need to be an approved seller to create and manage events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-muted/20 border border-muted/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Seller Benefits
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create and manage unlimited events</li>
                <li>• Accept payments through Stripe</li>
                <li>• Access detailed analytics and reporting</li>
                <li>• Manage ticket sales and customer communications</li>
                <li>• Set your own pricing and event details</li>
              </ul>
            </div>

            <div className="bg-muted/20 border border-muted/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Application Process
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Fill out the seller application form</li>
                <li>• Provide business information and contact details</li>
                <li>• Wait 1-2 business days for review</li>
                <li>• Get notified via email once approved</li>
                <li>• Complete Stripe Connect setup to start selling</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/apply-seller')} size="lg">
                Apply to Become a Seller
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
