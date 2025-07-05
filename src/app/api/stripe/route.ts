import { NextRequest, NextResponse } from 'next/server';
import { createBrowserClient } from '@supabase/ssr';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client with the token
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({
        error: 'Invalid authentication token'
      }, { status: 401 });
    }

    // Get user data to check if they're a seller
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 });
    }

    if (action === 'create_connect_account') {
      // Create Stripe Connect account for sellers
      if (userData.role !== 'seller' && userData.role !== 'admin') {
        return NextResponse.json({
          error: 'Only sellers can create Connect accounts'
        }, { status: 403 });
      }

      let accountId = userData.stripe_connect_account_id;

      if (!accountId) {
        // Create new Connect account
        const account = await stripe.accounts.create({
          type: 'express',
          email: userData.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        accountId = account.id;

        // Update user with Connect account ID
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_connect_account_id: accountId })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user with Connect account:', updateError);
        }
      }

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/profile?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/profile?success=true`,
        type: 'account_onboarding',
      });

      return NextResponse.json({
        success: true,
        onboarding_url: accountLink.url
      });
    }

    if (action === 'create_customer') {
      // Create Stripe Customer for regular users
      let customerId = userData.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userData.email,
          name: userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}` 
            : undefined,
        });

        customerId = customer.id;

        // Update user with customer ID
        const { error: updateError } = await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user with customer ID:', updateError);
        }
      }

      return NextResponse.json({
        success: true,
        customer_id: customerId
      });
    }

    if (action === 'create_payment_method_setup') {
      // Create setup intent for saving payment methods
      let customerId = userData.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userData.email,
          name: userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}` 
            : undefined,
        });

        customerId = customer.id;

        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      });

      return NextResponse.json({
        success: true,
        client_secret: setupIntent.client_secret
      });
    }

    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Stripe integration error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
