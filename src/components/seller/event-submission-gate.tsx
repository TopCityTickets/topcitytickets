"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubmitEventForm from '@/components/events/submit-event-form';
import { 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Lock,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface StripeConnectStatus {
  hasAccount: boolean;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  requiresAction?: boolean;
}

export default function EventSubmissionGate() {
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const checkStripeStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch('/api/stripe/connect/account-status');
      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
      } else {
        // If there's an error, assume no account
        setStripeStatus({ hasAccount: false });
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      setStripeStatus({ hasAccount: false });
    } finally {
      setLoading(false);
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkStripeStatus();
  }, []);

  const createStripeAccount = async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      const data = await response.json();
      
      // Redirect to Stripe onboarding
      window.location.href = data.onboardingUrl;
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      setCheckingStatus(false);
    }
  };

  const continueOnboarding = async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch('/api/stripe/connect/onboarding-link', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create onboarding link');
      }

      const data = await response.json();
      
      // Redirect to Stripe onboarding
      window.location.href = data.onboardingUrl;
    } catch (error) {
      console.error('Error creating onboarding link:', error);
      setCheckingStatus(false);
    }
  };

  if (loading) {
    return (
      <Card className="ultra-dark-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Checking payment setup...
        </CardContent>
      </Card>
    );
  }

  // If Stripe Connect is complete, show the event submission form
  if (stripeStatus?.hasAccount && stripeStatus?.onboardingComplete) {
    return (
      <div className="space-y-6">
        {/* Success Status */}
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-200">
            <div className="flex items-center justify-between">
              <span>Payment setup complete! You can now submit events.</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={checkStripeStatus}
                disabled={checkingStatus}
              >
                {checkingStatus ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Refresh Status'
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Event Submission Form */}
        <Card className="ultra-dark-card">
          <CardHeader>
            <CardTitle className="text-white">Submit New Event</CardTitle>
            <CardDescription>
              Submit your event for admin approval. Once approved, it will be available for ticket sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmitEventForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no account or incomplete onboarding, show setup gate
  return (
    <div className="space-y-6">
      {/* Payment Setup Required Alert */}
      <Alert className="border-yellow-500/50 bg-yellow-500/10">
        <Lock className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-200">
          <div className="flex items-center justify-between">
            <span>Bank account setup required before submitting events</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={checkStripeStatus}
              disabled={checkingStatus}
            >
              {checkingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Check Status'
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Setup Instructions */}
      <Card className="ultra-dark-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Setup Required
          </CardTitle>
          <CardDescription>
            Before you can submit events, you need to connect your bank account to receive payments from ticket sales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="p-4 rounded-lg bg-muted/5 border border-muted/20">
            <h4 className="font-semibold mb-3">Current Status:</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Seller Account</span>
                <Badge className="bg-green-600 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approved
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bank Account</span>
                {stripeStatus?.hasAccount ? (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Setup Required
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-500 text-red-500">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Event Submission</span>
                <Badge variant="outline" className="border-red-500 text-red-500">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
            <h4 className="font-semibold mb-3 text-green-400">What You'll Get:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Instant payouts within 24 hours of ticket sales
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Professional payment processing by Stripe
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Automatic fee deduction (5% platform fee)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Detailed payment analytics and reporting
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="text-center">
            {!stripeStatus?.hasAccount ? (
              <Button 
                onClick={createStripeAccount}
                disabled={checkingStatus}
                className="dark-button-glow min-w-[200px]"
              >
                {checkingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Connect Bank Account
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={continueOnboarding}
                disabled={checkingStatus}
                className="dark-button-glow min-w-[200px]"
              >
                {checkingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Setup is secure and handled by Stripe Connect.</p>
            <p>You'll be redirected to Stripe to provide your banking information.</p>
          </div>
        </CardContent>
      </Card>

      {/* Preview: What Event Submission Will Look Like */}
      <Card className="ultra-dark-card opacity-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-muted-foreground" />
                Submit New Event
              </CardTitle>
              <CardDescription>
                Available after completing bank account setup
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-muted text-muted-foreground">
              Locked
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 filter blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted/30 rounded"></div>
                <div className="h-10 bg-muted/20 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted/30 rounded"></div>
                <div className="h-10 bg-muted/20 rounded"></div>
              </div>
            </div>
            <div className="h-20 bg-muted/20 rounded"></div>
            <div className="h-10 bg-primary/20 rounded"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Complete payment setup to unlock</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
