import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { returnUrl } = body;

    // Get the user from the request
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data to check if they're a seller
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is a seller
    if (userData.role !== 'seller') {
      return NextResponse.json({ error: 'Only sellers can set up Stripe Connect' }, { status: 403 });
    }

    let accountId = userData.stripe_connect_account_id;

    if (!accountId) {
      // Create new Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          product_description: 'Event ticket sales',
          mcc: '7922', // Entertainment and recreation services
        },
        metadata: {
          user_id: user.id,
          platform: 'topcitytickets',
        },
      });

      accountId = account.id;

      // Save the account ID to the user
      await supabase
        .from('users')
        .update({ 
          stripe_connect_account_id: accountId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }

    const defaultReturnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/profile?stripe_setup=success`;
    const refreshUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/profile?stripe_setup=refresh`;

    // Check if account is already fully onboarded
    const account = await stripe.accounts.retrieve(accountId);
    
    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      // Account is fully set up, create login link for dashboard access
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return NextResponse.json({ 
        accountLink: loginLink.url,
        accountId,
        type: 'dashboard'
      });
    } else {
      // Account needs onboarding, create account link
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl || defaultReturnUrl,
        type: 'account_onboarding',
      });

      return NextResponse.json({ 
        accountLink: accountLink.url,
        accountId,
        type: 'onboarding'
      });
    }

  } catch (error) {
    console.error('Stripe Connect setup error:', error);
    return NextResponse.json(
      { error: 'Failed to set up Stripe Connect', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Use cookies for auth since this is called via window.location.href
    const cookieStore = request.cookies;
    const supabase = createClient();

    // Try to get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error in GET:', authError);
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login?message=Please sign in to connect Stripe', request.url));
    }

    // Get user data to check if they're a seller
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('User data error:', userError);
      return NextResponse.redirect(new URL('/dashboard?error=User not found', request.url));
    }

    // Check if user is a seller
    if (userData.role !== 'seller') {
      return NextResponse.redirect(new URL('/dashboard?error=Only sellers can set up Stripe Connect', request.url));
    }

    let accountId = userData.stripe_connect_account_id;

    if (!accountId) {
      // Create new Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          url: 'https://topcitytickets.com',
        },
      });

      accountId = account.id;

      // Save the account ID to the user record
      await supabase
        .from('users')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', user.id);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard?stripe_refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard?stripe_connected=true`,
      type: 'account_onboarding',
    });

    // Redirect to Stripe onboarding
    return NextResponse.redirect(accountLink.url);

  } catch (error) {
    console.error('Stripe Connect setup error:', error);
    return NextResponse.redirect(new URL('/seller/dashboard?error=Failed to set up Stripe Connect', request.url));
  }
}
