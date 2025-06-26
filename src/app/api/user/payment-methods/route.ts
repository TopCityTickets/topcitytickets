import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabaseClient = supabase();
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's payment methods from database
    const { data: paymentMethods, error } = await supabaseClient
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }

    return NextResponse.json({ paymentMethods: paymentMethods || [] });

  } catch (error) {
    console.error('Payment methods error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No auth token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabaseClient = supabase();
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { paymentMethodId, setAsDefault = false } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 });
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    const { data: existingCustomer } = await supabaseClient
      .from('user_payment_methods')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      stripeCustomerId = customer.id;
    }

    // Retrieve payment method from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // If setting as default, update previous default
    if (setAsDefault) {
      await supabaseClient
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set as default in Stripe
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Save to database
    const { data: savedPaymentMethod, error: saveError } = await supabaseClient
      .from('user_payment_methods')
      .insert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
        stripe_payment_method_id: paymentMethodId,
        payment_method_type: paymentMethod.type,
        last_four: paymentMethod.card?.last4 || paymentMethod.us_bank_account?.last4,
        brand: paymentMethod.card?.brand || paymentMethod.us_bank_account?.bank_name || paymentMethod.type,
        is_default: setAsDefault,
        metadata: paymentMethod,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving payment method:', saveError);
      return NextResponse.json({ error: 'Failed to save payment method' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      paymentMethod: savedPaymentMethod,
      message: 'Payment method added successfully' 
    });

  } catch (error) {
    console.error('Add payment method error:', error);
    return NextResponse.json({ 
      error: 'Failed to add payment method',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
