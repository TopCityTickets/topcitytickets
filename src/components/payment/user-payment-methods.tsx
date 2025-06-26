"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

function AddPaymentMethodForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setSaving(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      // Get setup intent client secret
      const supabaseClient = supabase();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session?.access_token) {
        alert('Please log in again to add payment method.');
        return;
      }

      const response = await fetch('/api/stripe-customer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup customer');
      }

      // Confirm setup intent with card
      const { error } = await stripe.confirmCardSetup(data.client_secret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        console.error('Setup error:', error);
        alert(error.message);
      } else {
        alert('Payment method added successfully!');
        onSuccess();
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add payment method. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-muted rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#a1a1aa',
                },
              },
            },
          }}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || saving}
        className="w-full"
      >
        {saving ? 'Adding...' : 'Add Payment Method'}
      </Button>
    </form>
  );
}

function PaymentMethodsManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const supabaseClient = supabase();
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session?.access_token) return;

      const response = await fetch('/api/stripe-customer', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPaymentMethods(data.payment_methods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchPaymentMethods();
  };

  const getCardBrandIcon = (brand: string) => {
    // You could add specific brand icons here
    return <CreditCard className="w-4 h-4" />;
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

  return (
    <Card className="ultra-dark-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Saved Payment Methods
        </CardTitle>
        <CardDescription>
          Save payment methods for faster checkout
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No payment methods saved</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between p-3 border border-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {getCardBrandIcon(pm.card.brand)}
                  <div>
                    <p className="font-medium">
                      **** **** **** {pm.card.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {pm.card.brand.toUpperCase()} • Expires {pm.card.exp_month}/{pm.card.exp_year}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Default</Badge>
              </div>
            ))}
          </div>
        )}

        {showAddForm ? (
          <div className="space-y-4">
            <AddPaymentMethodForm onSuccess={handleAddSuccess} />
            <Button 
              variant="outline" 
              onClick={() => setShowAddForm(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function UserPaymentMethods() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsManager />
    </Elements>
  );
}
