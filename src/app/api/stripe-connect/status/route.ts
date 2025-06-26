import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function GET(request: NextRequest) {
  try {
    // Get the user from the request
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Stripe Connect account
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_connect_account_id, stripe_connect_enabled, stripe_connect_details_submitted, stripe_connect_charges_enabled, stripe_connect_payouts_enabled')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_connect_account_id) {
      return NextResponse.json({ 
        connected: false,
        account: null 
      });
    }

    // Get account status from Stripe
    const account = await stripe.accounts.retrieve(userData.stripe_connect_account_id);

    // Update local database with current status
    await supabase
      .from('users')
      .update({
        stripe_connect_enabled: account.details_submitted && account.charges_enabled,
        stripe_connect_details_submitted: account.details_submitted,
        stripe_connect_charges_enabled: account.charges_enabled,
        stripe_connect_payouts_enabled: account.payouts_enabled,
      })
      .eq('id', user.id);

    return NextResponse.json({
      connected: true,
      account: {
        id: account.id,
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        email: account.email,
        requirements: account.requirements,
      }
    });

  } catch (error) {
    console.error('Stripe Connect status error:', error);
    return NextResponse.json(
      { error: 'Failed to check Stripe Connect status' },
      { status: 500 }
    );
  }
}
