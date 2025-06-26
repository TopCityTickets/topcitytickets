"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Building,
  Loader2
} from 'lucide-react';

interface StripeConnectStatus {
  hasAccount: boolean;
  accountId?: string;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  requiresAction?: boolean;
  businessProfile?: any;
  country?: string;
  currentlyDue?: string[];
  eventuallyDue?: string[];
  needsOnboarding?: boolean;
}

export default function StripeConnectOnboarding() {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/connect/account-status');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check account status');
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error checking Stripe Connect status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check account status');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    try {
      setActionLoading(true);
      setError(null);

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
    } catch (err) {
      console.error('Error creating Stripe Connect account:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setActionLoading(false);
    }
  };

  const continueOnboarding = async () => {
    try {
      setActionLoading(true);
      setError(null);

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
    } catch (err) {
      console.error('Error creating onboarding link:', err);
      setError(err instanceof Error ? err.message : 'Failed to continue onboarding');
      setActionLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (loading) {
    return (
      <Card className="ultra-dark-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Checking Stripe Connect status...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive-foreground">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Account Status Card */}
      <Card className="ultra-dark-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Stripe Connect Account
              </CardTitle>
              <CardDescription>
                Connect your bank account to receive payments from ticket sales
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status?.hasAccount ? (
            // No account - show create button
            <div className="text-center py-8">
              <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payment Account Found</h3>
              <p className="text-muted-foreground mb-6">
                You need to create a Stripe Connect account to receive payments from your events.
              </p>
              <Button 
                onClick={createAccount}
                disabled={actionLoading}
                className="dark-button-glow"
              >
                {actionLoading ? (
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
            </div>
          ) : (
            // Has account - show status
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
                  <div className={`w-3 h-3 rounded-full ${status.detailsSubmitted ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="text-sm font-medium">Details</p>
                    <p className="text-xs text-muted-foreground">
                      {status.detailsSubmitted ? 'Submitted' : 'Pending'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
                  <div className={`w-3 h-3 rounded-full ${status.chargesEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium">Payments</p>
                    <p className="text-xs text-muted-foreground">
                      {status.chargesEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
                  <div className={`w-3 h-3 rounded-full ${status.payoutsEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium">Payouts</p>
                    <p className="text-xs text-muted-foreground">
                      {status.payoutsEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Overall Status */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  {status.onboardingComplete ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {status.onboardingComplete ? 'Account Active' : 'Setup Required'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {status.onboardingComplete 
                        ? 'Your account is ready to receive payments'
                        : 'Complete your account setup to start receiving payments'
                      }
                    </p>
                  </div>
                </div>
                
                {status.onboardingComplete ? (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>

              {/* Required Actions */}
              {status.requiresAction && status.currentlyDue && status.currentlyDue.length > 0 && (
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Action Required:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {status.currentlyDue.map((requirement, index) => (
                        <li key={index}>{requirement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Continue Setup Button */}
              {!status.onboardingComplete && (
                <Button 
                  onClick={continueOnboarding}
                  disabled={actionLoading}
                  className="w-full dark-button-glow"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Continue Setup with Stripe
                    </>
                  )}
                </Button>
              )}

              {/* Account Info */}
              {status.businessProfile && (
                <div className="p-4 rounded-lg bg-muted/5 border border-muted/20">
                  <h4 className="font-medium mb-2">Account Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Account ID</p>
                      <p className="font-mono">{status.accountId}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Country</p>
                      <p>{status.country?.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card className="ultra-dark-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Payment Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Fast Payouts</h4>
                <p className="text-sm text-muted-foreground">
                  Receive payments within 2 business days
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Secure Processing</h4>
                <p className="text-sm text-muted-foreground">
                  PCI-compliant payment processing by Stripe
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Global Support</h4>
                <p className="text-sm text-muted-foreground">
                  Accept payments from customers worldwide
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Transparent Fees</h4>
                <p className="text-sm text-muted-foreground">
                  Standard platform fee of {process.env.PLATFORM_FEE_PERCENTAGE || 5}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
