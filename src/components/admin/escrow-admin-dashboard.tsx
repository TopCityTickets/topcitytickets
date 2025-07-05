"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Calendar, 
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface EscrowHold {
  id: string;
  total_amount: number;
  platform_fee: number;
  seller_amount: number;
  status: string;
  created_at: string;
  released_at?: string;
  financial_account_id?: string;
  inbound_transfer_id?: string;
  outbound_transfer_id?: string;
  event: {
    id: string;
    title: string;
    date: string;
    venue: string;
  };
  seller: {
    id: string;
    email: string;
    seller_business_name?: string;
  };
  buyer: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function EscrowAdminDashboard() {
  const { user } = useAuth();
  const [escrowHolds, setEscrowHolds] = useState<EscrowHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releaseLoading, setReleaseLoading] = useState<string | null>(null);

  const fetchEscrowHolds = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token || !user?.id) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`/api/escrow/release?adminId=${user.id}&status=held`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch escrow holds');
      }

      const data = await response.json();
      setEscrowHolds(data.escrowHolds || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching escrow holds:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const releaseEscrow = async (escrowHoldId: string) => {
    try {
      setReleaseLoading(escrowHoldId);
      const token = localStorage.getItem('access_token');
      
      if (!token || !user?.id) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/escrow/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          escrowHoldId,
          adminId: user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to release escrow');
      }

      const data = await response.json();
      console.log('Escrow released:', data);
      
      // Refresh the list
      await fetchEscrowHolds();
    } catch (err) {
      console.error('Error releasing escrow:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setReleaseLoading(null);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchEscrowHolds();
    }
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'held':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Held</Badge>;
      case 'released':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Released</Badge>;
      case 'pending':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Escrow Holds...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Escrow Management Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={fetchEscrowHolds} 
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
            Escrow Management
          </CardTitle>
          <CardDescription>
            Manage escrow holds and release payments to sellers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-4">
            Showing {escrowHolds.length} escrow holds pending release
          </div>
        </CardContent>
      </Card>

      {escrowHolds.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Pending Escrow Holds</h3>
            <p className="text-gray-600">
              All escrow holds have been processed or there are no pending payments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {escrowHolds.map((escrow) => (
            <Card key={escrow.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold text-lg">{escrow.event.title}</h3>
                      {getStatusBadge(escrow.status)}
                      {escrow.financial_account_id && (
                        <Badge variant="outline">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Treasury
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(escrow.event.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {escrow.event.venue}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          Seller: {escrow.seller.seller_business_name || escrow.seller.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          Buyer: {escrow.buyer.first_name 
                            ? `${escrow.buyer.first_name} ${escrow.buyer.last_name}` 
                            : escrow.buyer.email}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-medium ml-2">
                            {formatCurrency(escrow.total_amount / 100)}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Platform Fee:</span>
                          <span className="font-medium ml-2">
                            {formatCurrency(escrow.platform_fee / 100)}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Seller Amount:</span>
                          <span className="font-medium ml-2 text-green-600">
                            {formatCurrency(escrow.seller_amount / 100)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(escrow.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    {escrow.status === 'held' && (
                      <Button 
                        onClick={() => releaseEscrow(escrow.id)}
                        disabled={releaseLoading === escrow.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {releaseLoading === escrow.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Release Payment
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
