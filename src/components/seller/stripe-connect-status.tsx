"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, CheckCircle, AlertCircle, ExternalLink, DollarSign } from 'lucide-react';
import { supabase } from '@/utils/supabase';

interface StripeConnectAccount {
  id: string;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  email: string;
  requirements?: {
    currently_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
}

interface StripeConnectStatusProps {
  onAccountSetup?: () => void;
}

export default function StripeConnectStatus({ onAccountSetup }: StripeConnectStatusProps) {
  const [account, setAccount] = useState<StripeConnectAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [earnings, setEarnings] = useState({
    pending: 0,
    paid: 0,
    total: 0
  });

  useEffect(() => {
    checkStripeStatus();
    fetchEarnings();
  }, []);

  const checkStripeStatus = async () => {
    try {
      const supabaseClient = supabase();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session?.access_token) return;

      const response = await fetch('/api/stripe-connect/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.connected) {
        setAccount(data.account);
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      const supabaseClient = supabase();
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) return;

      // Get transfers for this seller
      const { data: transfers } = await supabaseClient
        .from('stripe_transfers')
        .select('*')
        .eq('seller_user_id', user.id);

      if (transfers) {
        const pending = transfers
          .filter(t => t.status === 'pending')
          .reduce((sum, t) => sum + t.net_amount, 0);
        
        const paid = transfers
          .filter(t => t.status === 'paid')
          .reduce((sum, t) => sum + t.net_amount, 0);

        setEarnings({
          pending,
          paid,
          total: pending + paid
        });
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    
    try {
      const supabaseClient = supabase();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session?.access_token) {
        alert('Please log in again to connect Stripe.');
        return;
      }

      const response = await fetch('/api/stripe-connect/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/seller/dashboard?stripe=connected`,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.accountLink) {
        // Redirect to Stripe Connect onboarding
        window.location.href = data.accountLink;
      } else {
        console.error('Connect error:', data);
        alert(`Error: ${data.error || 'Failed to set up Stripe Connect'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error setting up Stripe Connect. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="ultra-dark-card">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted/30 rounded w-3/4 mb-4"></div>
            <div className="h-10 bg-muted/30 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (!account) {
      return <Badge variant="outline">Not Connected</Badge>;
    }
    
    if (account.charges_enabled && account.payouts_enabled) {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    }
    
    if (account.details_submitted) {
      return <Badge variant="secondary">Under Review</Badge>;
    }
    
    return <Badge variant="destructive">Incomplete</Badge>;
  };

  const getStatusIcon = () => {
    if (!account) {
      return <CreditCard className="w-6 h-6 text-muted-foreground" />;
    }
    
    if (account.charges_enabled && account.payouts_enabled) {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    
    return <AlertCircle className="w-6 h-6 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Stripe Connect Status */}
      <Card className="ultra-dark-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Payment Setup
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to receive payments from ticket sales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status: {getStatusBadge()}</p>
              {account && (
                <p className="text-sm text-muted-foreground">
                  Account ID: {account.id}
                </p>
              )}
            </div>
            
            {!account ? (
              <Button 
                onClick={handleConnect}
                disabled={connecting}
                className="dark-button-glow"
              >
                {connecting ? 'Connecting...' : 'Connect Stripe'}
              </Button>
            ) : !account.charges_enabled ? (
              <Button 
                onClick={handleConnect}
                variant="outline"
                disabled={connecting}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Complete Setup
              </Button>
            ) : (
              <Button 
                onClick={handleConnect}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Account
              </Button>
            )}
          </div>

          {account && account.requirements && (
            <div className="space-y-2">
              {account.requirements.currently_due.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Action required: {account.requirements.currently_due.length} items need attention
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {!account && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must connect a Stripe account before customers can purchase tickets for your events.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Earnings Overview */}
      {account && account.charges_enabled && (
        <Card className="ultra-dark-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Earnings Overview
            </CardTitle>
            <CardDescription>
              Your revenue from ticket sales (after fees)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  ${earnings.paid.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Paid Out</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  ${earnings.pending.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">In Escrow</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  ${earnings.total.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Total Earned</p>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>• Payments are held in escrow for 24 hours after purchase</p>
              <p>• Platform fee: 5% + Stripe processing fees (~3%)</p>
              <p>• Funds are automatically transferred to your account</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
