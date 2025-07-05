"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TreasuryStatus {
  hasConnectedAccount: boolean;
  hasFinancialAccount: boolean;
  treasuryEnabled: boolean;
  connectedAccountId?: string;
  financialAccountId?: string;
  treasuryAccount?: {
    financialAccountId: string;
    accountId: string;
    status: string;
    balance: {
      available: number;
      pending: number;
      currency: string;
    };
  };
  error?: string;
}

export default function TreasuryDashboard() {
  const [status, setStatus] = useState<TreasuryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTreasuryStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/stripe/treasury/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch treasury status');
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching treasury status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createFinancialAccount = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/stripe/treasury/create-financial-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: 'current' // API will use current user
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create financial account');
      }

      // Refresh status after creation
      await fetchTreasuryStatus();
    } catch (err) {
      console.error('Error creating financial account:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchTreasuryStatus();
  }, []);

  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Treasury Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error && !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Treasury Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={fetchTreasuryStatus} 
            className="mt-4"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Treasury Account Status
          </CardTitle>
          <CardDescription>
            Manage your financial account for secure escrow and instant payouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">Connected Account:</div>
              <Badge variant={status?.hasConnectedAccount ? "default" : "secondary"}>
                {status?.hasConnectedAccount ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Required</>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">Financial Account:</div>
              <Badge variant={status?.hasFinancialAccount ? "default" : "secondary"}>
                {status?.hasFinancialAccount ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Active</>
                ) : (
                  <><Clock className="h-3 w-3 mr-1" /> Pending</>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">Treasury:</div>
              <Badge variant={status?.treasuryEnabled ? "default" : "secondary"}>
                {status?.treasuryEnabled ? (
                  <><TrendingUp className="h-3 w-3 mr-1" /> Enabled</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Disabled</>
                )}
              </Badge>
            </div>
          </div>

          {status?.error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}

          {!status?.hasConnectedAccount && (
            <Alert>
              <AlertDescription>
                You need to complete Stripe Connect onboarding before Treasury can be enabled.
              </AlertDescription>
            </Alert>
          )}

          {status?.hasConnectedAccount && !status?.hasFinancialAccount && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Financial Account Required</div>
                <div className="text-sm text-gray-600">
                  Create a Treasury financial account for secure escrow and instant payouts
                </div>
              </div>
              <Button 
                onClick={createFinancialAccount}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {status?.treasuryAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Financial Account Balance
            </CardTitle>
            <CardDescription>
              Your escrow and payout account balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Available Balance</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(status.treasuryAccount.balance.available / 100)}
                </div>
                <div className="text-xs text-gray-500">
                  Ready for withdrawal
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Pending Balance</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(status.treasuryAccount.balance.pending / 100)}
                </div>
                <div className="text-xs text-gray-500">
                  Processing transactions
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Account Status</div>
                  <div className="text-xs text-gray-500">
                    Financial Account ID: {status.treasuryAccount.financialAccountId}
                  </div>
                </div>
                <Badge variant="default">
                  {status.treasuryAccount.status.charAt(0).toUpperCase() + 
                   status.treasuryAccount.status.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
