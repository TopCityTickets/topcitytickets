"use client";

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';
import { CreditCard, Plus, Trash2, Check } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  payment_method_type: string;
  last_four: string;
  brand: string;
  is_default: boolean;
  created_at: string;
}

function AddPaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    // Create payment method
    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (stripeError) {
      setError(stripeError.message || 'Failed to create payment method');
      setLoading(false);
      return;
    }

    // Save to our backend
    try {
      const { data: { session } } = await supabase().auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session');
      }

      const response = await fetch('/api/user/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          setAsDefault: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save payment method');
      }

      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
      <Button type="submit" disabled={!stripe || loading} className="w-full mt-4">
        {loading ? 'Adding...' : 'Add Payment Method'}
      </Button>
    </form>
  );
}

function PaymentMethodsList() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchPaymentMethods = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase().auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/user/payment-methods', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, [user]);

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchPaymentMethods();
  };

  if (loading) {
    return <div>Loading payment methods...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </div>

      {paymentMethods.length === 0 && !showAddForm && (
        <Card>
          <CardContent className="p-6 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No payment methods saved</p>
            <Button onClick={() => setShowAddForm(true)} className="mt-4">
              Add Your First Payment Method
            </Button>
          </CardContent>
        </Card>
      )}

      {paymentMethods.map((method) => (
        <Card key={method.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-8 h-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last_four}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {method.payment_method_type}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {method.is_default && (
                  <Badge variant="secondary">
                    <Check className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Payment Method</CardTitle>
            <CardDescription>
              Securely save a payment method for faster checkout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddPaymentMethodForm onSuccess={handleAddSuccess} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function UserPaymentMethods() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsList />
    </Elements>
  );
}
